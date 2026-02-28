'use strict';

const { Router } = require('express');
const { query } = require('../config/db');
const firebaseAuth = require('../middleware/firebaseAuth');
const crypto = require('crypto');

const router = Router();

// ─── Helper: resolve Postgres user_id from Firebase email ─────────────────────
async function getUserId(email) {
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows[0]?.id;
}

// ─── GET /api/v1/planner/summary ──────────────────────────────────────────────
// Returns aggregated metrics for the overview panel + week/month calendar data.
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/summary', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        // 1. Fetch target exam date
        const examResult = await query(
            'SELECT target_exam_date FROM users WHERE id = $1',
            [userId]
        );
        const targetExamDate = examResult.rows[0]?.target_exam_date;
        let daysUntilExam = null;
        if (targetExamDate) {
            const diff = new Date(targetExamDate) - new Date();
            daysUntilExam = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

        // 2. Daily aggregates for the date range
        const dailyResult = await query(
            `SELECT
               TO_CHAR(scheduled_date, 'YYYY-MM-DD') AS date_str,
               COUNT(*) AS total_tasks,
               COUNT(*) FILTER (WHERE is_completed) AS completed_tasks,
               COALESCE(SUM(estimated_minutes), 0) AS planned_minutes,
               COALESCE(SUM(estimated_minutes) FILTER (WHERE is_completed), 0) AS completed_minutes,
               ARRAY_AGG(DISTINCT subject) AS subjects
             FROM study_tasks
             WHERE user_id = $1 AND scheduled_date BETWEEN $2 AND $3
             GROUP BY scheduled_date
             ORDER BY scheduled_date`,
            [userId, startDate, endDate]
        );

        const dailyAggregates = dailyResult.rows.map(row => ({
            date: row.date_str,
            totalTasks: parseInt(row.total_tasks),
            completedTasks: parseInt(row.completed_tasks),
            plannedHours: parseFloat((parseInt(row.planned_minutes) / 60).toFixed(1)),
            completedHours: parseFloat((parseInt(row.completed_minutes) / 60).toFixed(1)),
            subjects: row.subjects.filter(Boolean),
        }));

        // 3. Weekly totals (for overview bar)
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sun
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + mondayOffset);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const ws = weekStart.toISOString().split('T')[0];
        const we = weekEnd.toISOString().split('T')[0];

        const weekResult = await query(
            `SELECT
               COALESCE(SUM(estimated_minutes), 0) AS planned,
               COALESCE(SUM(estimated_minutes) FILTER (WHERE is_completed), 0) AS completed,
               COUNT(DISTINCT subject) FILTER (WHERE scheduled_date BETWEEN $2 AND $3) AS chapters_count
             FROM study_tasks
             WHERE user_id = $1 AND scheduled_date BETWEEN $2 AND $3`,
            [userId, ws, we]
        );
        const weekRow = weekResult.rows[0];
        const plannedHours = parseFloat((parseInt(weekRow.planned) / 60).toFixed(1));
        const completedHours = parseFloat((parseInt(weekRow.completed) / 60).toFixed(1));
        const weeklyCompletion = plannedHours > 0 ? Math.round((completedHours / plannedHours) * 100) : 0;

        // 4. Study streak (consecutive days with at least 1 completed task, going back from yesterday)
        const streakResult = await query(
            `SELECT DISTINCT scheduled_date
             FROM study_tasks
             WHERE user_id = $1 AND is_completed = true
               AND scheduled_date <= CURRENT_DATE
             ORDER BY scheduled_date DESC
             LIMIT 60`,
            [userId]
        );

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = streakResult.rows.map(r => {
            const d = new Date(r.scheduled_date);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        });

        // Check today first, then go backwards
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
            if (dates.includes(checkDate.getTime())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (i === 0) {
                // Today might not have completions yet – try yesterday
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            } else {
                break;
            }
        }

        return res.json({
            targetExamDate,
            daysUntilExam,
            streak,
            weeklyCompletion,
            plannedHours,
            completedHours,
            chaptersThisWeek: parseInt(weekRow.chapters_count) || 0,
            dailyAggregates,
        });
    } catch (err) {
        console.error('[Planner /summary] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── GET /api/v1/planner/tasks ────────────────────────────────────────────────
// Fetch tasks for a specific date.
// Query param: date (YYYY-MM-DD)
router.get('/tasks', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'date is required' });

        const result = await query(
            `SELECT id, subject, chapter, mode, estimated_minutes,
                    TO_CHAR(scheduled_date, 'YYYY-MM-DD') AS scheduled_date,
                    is_completed, completed_at, created_at
             FROM study_tasks
             WHERE user_id = $1 AND scheduled_date = $2
             ORDER BY created_at ASC`,
            [userId, date]
        );

        return res.json({ tasks: result.rows });
    } catch (err) {
        console.error('[Planner /tasks] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── POST /api/v1/planner/tasks ───────────────────────────────────────────────
// Create a new task manually (from the Add Task modal).
router.post('/tasks', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { subject, chapter, mode, estimated_minutes, scheduled_date } = req.body;

        if (!subject || !chapter || !mode || !estimated_minutes || !scheduled_date) {
            return res.status(400).json({ error: 'subject, chapter, mode, estimated_minutes, and scheduled_date are required' });
        }

        const validModes = ['Learn', 'Practice', 'Quiz', 'Revision'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({ error: `mode must be one of: ${validModes.join(', ')}` });
        }

        const result = await query(
            `INSERT INTO study_tasks (user_id, subject, chapter, mode, estimated_minutes, scheduled_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, subject, chapter, mode, parseInt(estimated_minutes), scheduled_date]
        );

        return res.status(201).json({ task: result.rows[0] });
    } catch (err) {
        console.error('[Planner POST /tasks] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── PATCH /api/v1/planner/tasks/:id ──────────────────────────────────────────
// Toggle task completion.
router.patch('/tasks/:id', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { id } = req.params;
        // UUID validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        const { is_completed } = req.body;
        if (typeof is_completed !== 'boolean') {
            return res.status(400).json({ error: 'is_completed (boolean) is required' });
        }

        const result = await query(
            `UPDATE study_tasks
             SET is_completed = $1,
                 completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
                 updated_at = NOW()
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [is_completed, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ task: result.rows[0] });
    } catch (err) {
        console.error('[Planner PATCH /tasks/:id] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── DELETE /api/v1/planner/tasks/:id ─────────────────────────────────────────
// Delete a task.
router.delete('/tasks/:id', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const { id } = req.params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        const result = await query(
            'DELETE FROM study_tasks WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        return res.json({ deleted: true });
    } catch (err) {
        console.error('[Planner DELETE /tasks/:id] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── GET /api/v1/planner/suggestions ──────────────────────────────────────────
// Returns 3 actionable suggestions based on incomplete/weak areas.
router.get('/suggestions', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        // Find chapters with incomplete tasks (most overdue first)
        const result = await query(
            `SELECT subject, chapter, COUNT(*) AS pending
             FROM study_tasks
             WHERE user_id = $1 AND is_completed = false AND scheduled_date <= CURRENT_DATE
             GROUP BY subject, chapter
             ORDER BY pending DESC, MIN(scheduled_date) ASC
             LIMIT 3`,
            [userId]
        );

        const suggestions = result.rows.map(row => ({
            subject: row.subject,
            chapter: row.chapter,
            text: `Review ${row.chapter} (${row.pending} pending)`,
        }));

        // If we have less than 3, pad with generic suggestions
        const generic = [
            { text: 'Practice weak areas with a quiz', subject: null, chapter: null },
            { text: 'Revisit recently incorrect questions', subject: null, chapter: null },
            { text: 'Attempt a timed mock test', subject: null, chapter: null },
        ];

        while (suggestions.length < 3) {
            suggestions.push(generic[suggestions.length]);
        }

        return res.json({ suggestions });
    } catch (err) {
        console.error('[Planner /suggestions] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ─── POST /api/v1/planner/generate ────────────────────────────────────────────
// AI Smart Plan Generator — creates a week of tasks based on user preferences.
// Body: { weekday_hours, weekend_hours, focus_mode, timeframe }
router.post('/generate', firebaseAuth, async (req, res) => {
    try {
        const userId = await getUserId(req.user.email);
        if (!userId) return res.status(404).json({ error: 'User not found' });

        const {
            weekday_hours = 3,
            weekend_hours = 5,
            focus_mode = 'balanced',
            timeframe = '1week',
        } = req.body;

        // Determine date range
        const today = new Date();
        let numDays;
        if (timeframe === '1week') numDays = 7;
        else if (timeframe === '2weeks') numDays = 14;
        else numDays = 30; // 'exam' fallback

        // Build schedule: assign tasks per day based on hours budget
        const subjects = ['Physics', 'Chemistry', 'Math'];
        const chapters = {
            Physics: ['Motion in 2D', 'Laws of Motion', 'Work & Energy', 'Circular Motion', 'Gravitation', 'Rotational Motion', 'Oscillations', 'Waves'],
            Chemistry: ['Chemical Bonding', 'Thermodynamics', 'Equilibrium', 'Electrochemistry', 'Solutions', 'Atomic Structure', 'Organic Chemistry', 'Polymers'],
            Math: ['Integration', 'Differentiation', 'Matrices', 'Vectors', 'Probability', 'Complex Numbers', 'Coordinate Geometry', 'Conic Sections'],
        };

        const modesByFocus = {
            balanced: ['Learn', 'Practice', 'Quiz'],
            revision: ['Revision', 'Practice'],
            exam: ['Quiz', 'Practice'],
            weak: ['Learn', 'Practice', 'Quiz'],
        };

        const modes = modesByFocus[focus_mode] || modesByFocus.balanced;
        const generatedTasks = [];
        let chapterIdx = { Physics: 0, Chemistry: 0, Math: 0 };

        for (let d = 0; d < numDays; d++) {
            const taskDate = new Date(today);
            taskDate.setDate(today.getDate() + d);
            const dayOfWeek = taskDate.getDay(); // 0=Sun, 6=Sat
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const budgetHours = isWeekend ? weekend_hours : weekday_hours;
            const dateStr = taskDate.toISOString().split('T')[0];

            // Split budget across subjects (~equal)
            let minutesLeft = budgetHours * 60;
            let subjectQueue = [...subjects];

            while (minutesLeft >= 30 && subjectQueue.length > 0) {
                const subj = subjectQueue.shift();
                const chapterList = chapters[subj];
                const chapter = chapterList[chapterIdx[subj] % chapterList.length];
                const mode = modes[Math.floor(Math.random() * modes.length)];
                const taskMinutes = Math.min(minutesLeft, 30 + Math.floor(Math.random() * 31)); // 30-60 min

                generatedTasks.push({
                    userId,
                    subject: subj,
                    chapter,
                    mode,
                    estimated_minutes: taskMinutes,
                    scheduled_date: dateStr,
                });

                minutesLeft -= taskMinutes;
                chapterIdx[subj]++;
            }
        }

        // Bulk insert
        if (generatedTasks.length > 0) {
            const values = generatedTasks.map((t, i) => {
                const offset = i * 6;
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
            }).join(', ');

            const params = generatedTasks.flatMap(t => [
                t.userId, t.subject, t.chapter, t.mode, t.estimated_minutes, t.scheduled_date,
            ]);

            await query(
                `INSERT INTO study_tasks (user_id, subject, chapter, mode, estimated_minutes, scheduled_date)
                 VALUES ${values}`,
                params
            );
        }

        return res.status(201).json({
            message: `Generated ${generatedTasks.length} tasks for ${numDays} days`,
            count: generatedTasks.length,
        });
    } catch (err) {
        console.error('[Planner POST /generate] error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
