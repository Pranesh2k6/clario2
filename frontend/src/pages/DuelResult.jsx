import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { Trophy, TrendingUp, Target, Zap, RotateCcw, Home, CheckCircle, X, Clock, BarChart3, AlertCircle, Gauge, Award, Brain } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { FlippableQuestionCard } from '../components/FlippableQuestionCard';
import { PerformanceStatsGraph } from '../components/PerformanceStatsGraph';
import { getWeakTopics, getDashboardAnalytics } from '../api/analytics';
import client from '../api/client';

// Mock round data with full questions
const roundData = [
  {
    round: 1,
    correct: true,
    difficulty: 'Easy',
    timeTaken: 15,
    question: 'A projectile is thrown horizontally with velocity 20 m/s from a height of 45 m. What is the time taken to reach the ground?',
    options: ['2 s', '3 s', '4 s', '5 s'],
    correctAnswer: 1,
    userAnswer: 1,
    explanation: 'Using the equation h = ½gt², we can solve for time: t = √(2h/g) = √(2×45/10) = 3 s. The horizontal velocity doesn\'t affect vertical motion.'
  },
  {
    round: 2,
    correct: true,
    difficulty: 'Easy',
    timeTaken: 12,
    question: 'At what angle should a projectile be launched to achieve maximum range?',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
    userAnswer: 1,
    explanation: 'Maximum range occurs at 45° launch angle for projectiles on level ground. At this angle, the horizontal and vertical components are optimized for distance. 30° and 60° give equal ranges but less than 45°.'
  },
  {
    round: 3,
    correct: false,
    difficulty: 'Medium',
    timeTaken: 22,
    question: 'A ball is projected at 45° with initial velocity 40 m/s. Calculate the maximum height. (g = 10 m/s²)',
    options: ['20 m', '40 m', '60 m', '80 m'],
    correctAnswer: 0,
    userAnswer: 1,
    explanation: 'Maximum height H = (u²sin²θ)/(2g). At 45°, sin(45°) = 1/√2, so H = (40² × 0.5)/(2×10) = 800/40 = 20 m. Common error: forgetting to square the sine term or using total velocity instead of vertical component.'
  },
  {
    round: 4,
    correct: true,
    difficulty: 'Easy',
    timeTaken: 9,
    question: 'In projectile motion, which component of velocity remains constant?',
    options: ['Vertical', 'Horizontal', 'Both', 'Neither'],
    correctAnswer: 1,
    userAnswer: 1,
    explanation: 'Horizontal velocity remains constant because there is no horizontal acceleration (ignoring air resistance). Gravity only affects vertical motion, causing vertical velocity to change continuously.'
  },
  {
    round: 5,
    correct: false,
    difficulty: 'Hard',
    timeTaken: 28,
    question: 'A projectile is launched at 60° with speed 50 m/s. What is the horizontal component of velocity?',
    options: ['25 m/s', '30 m/s', '43.3 m/s', '50 m/s'],
    correctAnswer: 0,
    userAnswer: 2,
    explanation: 'Horizontal component = u × cos(θ) = 50 × cos(60°) = 50 × 0.5 = 25 m/s. Common error: using sin(60°) instead of cos(60°), which gives 43.3 m/s (the vertical component).'
  },
];

export default function DuelResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    duelId,
    playerScore = 0,
    opponentScore = 0,
    opponentForfeited = false,
    roundData: actualRoundData,
    winnerId,
    playerId,
    wonByTime = false,
    playerTimeMs,
    opponentTimeMs,
  } = location.state || {};

  // Use actual round data from the match, or fallback to mock
  const rounds = actualRoundData && actualRoundData.length > 0 ? actualRoundData : roundData;

  // Determine winner
  const playerWon = opponentForfeited || (winnerId ? winnerId === playerId : playerScore > opponentScore);
  const isDraw = !opponentForfeited && !winnerId && playerScore === opponentScore;

  // ── Dynamic analytics state ─────────────────────────────────────────────────
  const [weakTopicsData, setWeakTopicsData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [nlgInsights, setNlgInsights] = useState([]);
  const [skillRating, setSkillRating] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Build insights URL with duel_id if available
        const insightsUrl = duelId
          ? `/analytics/insights?context=duel_result&duel_id=${duelId}`
          : '/analytics/insights?context=duel_result';

        const [weakRes, dashRes, nlgRes, ratingRes] = await Promise.allSettled([
          getWeakTopics(),
          getDashboardAnalytics(),
          client.get(insightsUrl),
          client.get('/analytics/rating'),
        ]);
        if (weakRes.status === 'fulfilled') setWeakTopicsData(weakRes.value.data || []);
        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value.data || null);
        if (nlgRes.status === 'fulfilled') setNlgInsights(nlgRes.value.data?.insights || []);
        if (ratingRes.status === 'fulfilled') setSkillRating(ratingRes.value.data || null);
      } catch (err) {
        console.error('[DuelResult] Analytics fetch failed:', err);
      }
    };
    fetchAnalytics();
  }, [duelId]);

  // Format time for display
  const formatTime = (ms) => {
    if (!ms) return '—';
    const s = Math.round(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  // ── Stats computed from this duel's round data ──────────────────────────────
  const easyCorrect = rounds.filter(r => r.difficulty === 'Easy' && r.correct).length;
  const easyTotal = rounds.filter(r => r.difficulty === 'Easy').length;
  const mediumCorrect = rounds.filter(r => r.difficulty === 'Medium' && r.correct).length;
  const mediumTotal = rounds.filter(r => r.difficulty === 'Medium').length;
  const hardCorrect = rounds.filter(r => r.difficulty === 'Hard' && r.correct).length;
  const hardTotal = rounds.filter(r => r.difficulty === 'Hard').length;

  const easyAccuracy = easyTotal > 0 ? (easyCorrect / easyTotal) * 100 : 0;
  const mediumAccuracy = mediumTotal > 0 ? (mediumCorrect / mediumTotal) * 100 : 0;
  const hardAccuracy = hardTotal > 0 ? (hardCorrect / hardTotal) * 100 : 0;

  const totalCorrect = rounds.filter(r => r.correct).length;
  const overallAccuracy = rounds.length > 0 ? (totalCorrect / rounds.length) * 100 : 0;
  const avgResponseTime = rounds.length > 0 ? Math.round(rounds.reduce((sum, r) => sum + r.timeTaken, 0) / rounds.length) : 0;
  const correctRounds = rounds.filter(r => r.correct);
  const fastestCorrect = correctRounds.length > 0 ? Math.min(...correctRounds.map(r => r.timeTaken)) : 0;
  const hardestSolved = rounds.some(r => r.difficulty === 'Hard' && r.correct);


  // ── Dynamic Focus Areas (from intelligence system, fallback to duel data) ──
  const focusAreas = useMemo(() => {
    // Prefer analytics engine weak topics
    if (weakTopicsData.length > 0) {
      return weakTopicsData.slice(0, 3).map(t => ({
        title: `${t.topic}${t.subtopic ? ' — ' + t.subtopic : ''}`,
        detail: `Mastery: ${Math.round((t.mastery_probability || 0) * 100)}% across ${t.total_attempts} attempts`,
      }));
    }

    // Fallback: generate from this duel's incorrect answers
    const incorrectRounds = rounds.filter(r => !r.correct);
    if (incorrectRounds.length === 0) {
      return [{ title: 'No weak areas detected', detail: 'Perfect duel performance!' }];
    }

    return incorrectRounds.slice(0, 3).map(r => ({
      title: `Round ${r.round} — ${r.difficulty} difficulty`,
      detail: `Answered in ${r.timeTaken}s — review the explanation`,
    }));
  }, [weakTopicsData, rounds]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Celebratory Glow */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <motion.div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px] ${playerWon ? 'bg-[#10B981]/20' : isDraw ? 'bg-[#FBBF24]/20' : 'bg-[#EF4444]/20'
            }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content - Split Screen */}
      <div className="relative z-10 min-h-screen flex items-start justify-center p-6 pt-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[1400px] grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* LEFT SIDE - Result Card */}
          <div className="bg-[rgba(12,8,36,0.9)] backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center
                ${playerWon
                  ? 'bg-[#10B981]/20 border-4 border-[#10B981]/40'
                  : isDraw
                    ? 'bg-[#FBBF24]/20 border-4 border-[#FBBF24]/40'
                    : 'bg-[#EF4444]/20 border-4 border-[#EF4444]/40'
                }
              `}>
                <Trophy
                  size={40}
                  className={
                    playerWon
                      ? 'text-[#10B981]'
                      : isDraw
                        ? 'text-[#FBBF24]'
                        : 'text-[#EF4444]'
                  }
                />
              </div>
            </motion.div>

            {/* Result Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className={`
                text-[36px] font-bold mb-2
                ${playerWon
                  ? 'text-[#10B981]'
                  : isDraw
                    ? 'text-[#FBBF24]'
                    : 'text-[#EF4444]'
                }
              `}>
                {playerWon ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
              </h1>
              <p className="text-[14px] text-[#9CA3AF]">
                {opponentForfeited
                  ? 'Opponent forfeited — you win!'
                  : wonByTime && playerWon
                    ? `Won by speed! (${formatTime(playerTimeMs)} vs ${formatTime(opponentTimeMs)})`
                    : wonByTime && !playerWon && !isDraw
                      ? `Lost by speed. (${formatTime(playerTimeMs)} vs ${formatTime(opponentTimeMs)})`
                      : playerWon
                        ? 'You outperformed your opponent!'
                        : isDraw
                          ? 'Evenly matched battle!'
                          : 'Better luck next time!'}
              </p>
            </motion.div>

            {/* Score Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              {/* Player Score */}
              <div className="text-center p-5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-2xl">
                <p className="text-[12px] text-[#9CA3AF] mb-2">Your Score</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="text-[40px] font-bold text-[#8B5CF6]"
                >
                  {playerScore}
                </motion.p>
                {playerWon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/40 rounded-lg"
                  >
                    <TrendingUp size={12} className="text-[#10B981]" />
                    <span className="text-[11px] font-semibold text-[#10B981]">Winner</span>
                  </motion.div>
                )}
              </div>

              {/* Opponent Score */}
              <div className="text-center p-5 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-2xl">
                <p className="text-[12px] text-[#9CA3AF] mb-2">Opponent</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="text-[40px] font-bold text-[#EC4899]"
                >
                  {opponentScore}
                </motion.p>
                {!playerWon && !isDraw && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-[#10B981]/20 border border-[#10B981]/40 rounded-lg"
                  >
                    <TrendingUp size={12} className="text-[#10B981]" />
                    <span className="text-[11px] font-semibold text-[#10B981]">Winner</span>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* XP Earned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/40 flex items-center justify-center">
                    <Zap size={20} className="text-[#FBBF24]" />
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF] mb-1">XP Earned</p>
                    <p className="text-[20px] font-bold text-[#FBBF24]">
                      +{playerWon ? 150 : isDraw ? 75 : 50}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#9CA3AF] mb-1">Bonus</p>
                  <p className="text-[14px] font-semibold text-[#10B981]">
                    {playerWon ? '+50 Win' : isDraw ? '+25 Draw' : '—'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Teacher-Style Feedback + TrueSkill */}
            {(nlgInsights.length > 0 || skillRating) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.88 }}
                className="mb-6 p-5 bg-gradient-to-br from-[rgba(124,58,237,0.08)] to-[rgba(99,102,241,0.05)] border border-[#7C3AED]/20 rounded-2xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-semibold text-[#F3F4F6]">🧠 Teacher Feedback</h3>
                  {skillRating && (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                        ${skillRating.rating >= 1800 ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30'
                          : skillRating.rating >= 1500 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0] border border-[#C0C0C0]/30'
                            : skillRating.rating >= 1200 ? 'bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/30'
                              : 'bg-white/10 text-[#9CA3AF] border border-white/20'}`}
                      >
                        {skillRating.rating >= 1800 ? '🏆 Gold' : skillRating.rating >= 1500 ? '🥈 Silver' : skillRating.rating >= 1200 ? '🥉 Bronze' : '⚔️ Unranked'}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">{skillRating.rating} SR</span>
                    </div>
                  )}
                </div>
                {nlgInsights.length > 0 && (
                  <ul className="space-y-3">
                    {nlgInsights.slice(0, 4).map((insight, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[12px] leading-relaxed text-[#D1D5DB]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mt-2 flex-shrink-0 shadow-[0_0_4px_rgba(124,58,237,0.8)]" />
                        <span className="flex-1 break-words">{insight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-2 gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/duels/match')}
                className="flex items-center justify-center gap-2 py-3 bg-[#10B981] text-white rounded-xl font-semibold text-[13px] shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.5)] transition-all"
              >
                <RotateCcw size={16} />
                Rematch
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center gap-2 py-3 bg-white/10 border border-white/20 text-[#F3F4F6] rounded-xl font-semibold text-[13px] hover:bg-white/15 transition-all"
              >
                <Home size={16} />
                Dashboard
              </motion.button>
            </motion.div>
          </div>

          {/* RIGHT SIDE - Analysis Panel */}
          <div className="bg-[rgba(12,8,36,0.9)] backdrop-blur-xl rounded-3xl border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="p-8 pb-4 border-b border-white/10">
                <h2 className="text-[20px] font-bold text-[#F3F4F6]">Duel Analysis</h2>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6">
                {/* Performance Stats Graph - REPLACED */}
                <PerformanceStatsGraph
                  accuracy={Math.round(overallAccuracy)}
                  avgResponseTime={avgResponseTime}
                  fastestCorrect={fastestCorrect}
                  hardestSolved={hardestSolved}
                />

                {/* Focus Areas Card - DYNAMIC */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="p-5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={18} className="text-[#F59E0B]" />
                    <h3 className="text-[14px] font-semibold text-[#F3F4F6]">Focus Areas to Improve</h3>
                  </div>

                  <div className="space-y-3">
                    {focusAreas.map((area, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Target size={14} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[12px] font-medium text-[#F3F4F6] mb-1">{area.title}</p>
                          <p className="text-[11px] text-[#D1D5DB]">{area.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Question Review Section - NEW */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#D1D5DB] mb-3">Question Review</h3>
                  <div className="space-y-3">
                    {rounds.map((round, index) => (
                      <FlippableQuestionCard
                        key={round.round}
                        round={round.round}
                        correct={round.correct}
                        difficulty={round.difficulty}
                        timeTaken={round.timeTaken}
                        question={round.question}
                        options={round.options}
                        correctAnswer={round.correctAnswer}
                        userAnswer={round.userAnswer}
                        explanation={round.explanation}
                        delay={0.9 + index * 0.1}
                      />
                    ))}
                  </div>

                  {/* Instruction Text - NEW */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-center text-[11px] text-[#6366F1] opacity-60 mt-4"
                  >
                    Click any answer card to reveal its explanation
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}