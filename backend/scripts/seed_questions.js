require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

// Path to the dataset metadata
const METADATA_PATH = path.join(__dirname, '../../dataset/jee-neet-benchmark/data/metadata.jsonl');

async function seed() {
    console.log('Starting question seed process...');

    if (!fs.existsSync(METADATA_PATH)) {
        console.error(`Metadata file not found at ${METADATA_PATH}`);
        process.exit(1);
    }

    const lines = fs.readFileSync(METADATA_PATH, 'utf-8').split('\n').filter(line => line.trim());

    try {
        // 1. First, let's create default subjects if they don't exist
        const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology'];
        const subjectMap = {};

        for (let i = 0; i < subjects.length; i++) {
            const title = subjects[i];
            const res = await pool.query(
                'INSERT INTO subjects (title, description, is_active, order_index) VALUES ($1, $2, true, $3) ON CONFLICT DO NOTHING RETURNING id',
                [title, `${title} for competitive exams`, i + 1]
            );

            // If it was already there, ON CONFLICT DO NOTHING returns no rows. 
            // We need to fetch the ID.
            if (res.rows.length > 0) {
                subjectMap[title] = res.rows[0].id;
            } else {
                const existing = await pool.query('SELECT id FROM subjects WHERE title = $1', [title]);
                subjectMap[title] = existing.rows[0].id;
            }
        }

        // 2. Create a default Chapter and Concept for each subject to satisfy foreign keys
        const conceptMap = {};
        for (const title of subjects) {
            const subjectId = subjectMap[title];

            // Create "General [Subject]" chapter
            let chapterRes = await pool.query(
                'INSERT INTO chapters (subject_id, title, description, order_index) VALUES ($1, $2, $3, 1) RETURNING id',
                [subjectId, `General ${title}`, `Mixed questions from ${title}`]
            ).catch(err => pool.query('SELECT id FROM chapters WHERE subject_id = $1 LIMIT 1', [subjectId]));

            const chapterId = chapterRes.rows[0].id;

            // Create "Mixed Concepts" concept
            let conceptRes = await pool.query(
                'INSERT INTO concepts (chapter_id, title, description) VALUES ($1, $2, $3) RETURNING id',
                [chapterId, `Mixed Concepts`, `Various concepts in ${title}`]
            ).catch(err => pool.query('SELECT id FROM concepts WHERE chapter_id = $1 LIMIT 1', [chapterId]));

            conceptMap[title] = conceptRes.rows[0].id;
        }

        // 3. Process the metadata
        let imported = 0;
        for (const line of lines) {
            const data = JSON.parse(line);
            // data format: {"image_path": "images/NEET_2024_T3/...", "question_id": "...", "exam_name": "NEET", "subject": "Physics", "question_type": "...", "correct_answer": ["1"]}

            // Ensure image URL resolves to our backend static route
            // Assuming we will serve the dataset folder at /dataset
            const imageUrl = `/dataset/jee-neet-benchmark/${data.image_path}`;

            // Parse correct answer
            let correctAnswerIndex = -1; // Default -1 for integers/unknown
            let options = ["Option 1", "Option 2", "Option 3", "Option 4"]; // Default dummy options

            if (data.question_type.includes('MCQ')) {
                const ans = data.correct_answer[0]; // Take first correct answer
                // Sometimes it's "1", "2", "3", "4", sometimes "A", "B", "C", "D"
                if (['1', '2', '3', '4'].includes(ans)) {
                    correctAnswerIndex = parseInt(ans) - 1;
                } else if (['A', 'B', 'C', 'D'].includes(ans)) {
                    correctAnswerIndex = ans.charCodeAt(0) - 65;
                }
            }

            const content = {
                text: `Question ID: ${data.question_id} (${data.exam_name} ${data.exam_year})`,
                image_url: imageUrl,
                options: data.question_type.includes('MCQ') ? options : [],
                question_type: data.question_type,
                raw_answer: data.correct_answer
            };

            // Insert Question
            const qRes = await pool.query(
                'INSERT INTO questions (content, correct_answer_index, difficulty_weight) VALUES ($1, $2, $3) RETURNING id',
                [content, correctAnswerIndex, 1.0]
            );
            const questionId = qRes.rows[0].id;

            // Tag the question to the subject's default concept
            const conceptId = conceptMap[data.subject];
            if (conceptId) {
                await pool.query(
                    'INSERT INTO question_concept_tags (question_id, concept_id, is_primary) VALUES ($1, $2, true)',
                    [questionId, conceptId]
                );
            }

            imported++;
            if (imported % 100 === 0) {
                console.log(`Imported ${imported} questions...`);
            }
        }

        console.log(`Successfully imported ${imported} questions!`);
    } catch (err) {
        console.error('Error seeding questions:', err);
    } finally {
        pool.end();
    }
}

seed();
