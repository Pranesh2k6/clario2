import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { Clock, CheckCircle, Loader, Zap, TrendingUp, X } from 'lucide-react';

// Mock question data
const questions = [
  {
    id: 1,
    question: 'A projectile is thrown horizontally with velocity 20 m/s from a height of 45 m. What is the time taken to reach the ground?',
    options: ['2 s', '3 s', '4 s', '5 s'],
    correctAnswer: 1,
    explanation: 'Using h = ½gt², we get t = √(2h/g) = √(2×45/10) = 3 s',
  },
  {
    id: 2,
    question: 'At what angle should a projectile be launched to achieve maximum range?',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
    explanation: 'Maximum range occurs at 45° launch angle for projectiles on level ground.',
  },
  {
    id: 3,
    question: 'A ball is projected at 45° with initial velocity 40 m/s. Calculate the maximum height. (g = 10 m/s²)',
    options: ['20 m', '40 m', '60 m', '80 m'],
    correctAnswer: 0,
    explanation: 'Max height H = (u²sin²θ)/(2g) = (40²×0.5)/(2×10) = 20 m',
  },
  {
    id: 4,
    question: 'In projectile motion, which component of velocity remains constant?',
    options: ['Vertical', 'Horizontal', 'Both', 'Neither'],
    correctAnswer: 1,
    explanation: 'Horizontal velocity remains constant as there is no horizontal acceleration.',
  },
  {
    id: 5,
    question: 'A projectile is launched at 60° with speed 50 m/s. What is the horizontal component of velocity?',
    options: ['25 m/s', '30 m/s', '43.3 m/s', '50 m/s'],
    correctAnswer: 0,
    explanation: 'Horizontal component = u×cos(60°) = 50×0.5 = 25 m/s',
  },
];

export default function DuelMatch() {
  const navigate = useNavigate();
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerState, setPlayerState] = useState('solving');
  const [opponentState, setOpponentState] = useState('solving');

  const currentQuestion = questions[currentRound - 1];
  const totalRounds = 5;

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  // Simulate opponent answering
  useEffect(() => {
    if (!submitted) {
      const opponentTimer = setTimeout(() => {
        setOpponentState('submitted');
      }, Math.random() * 5000 + 3000); // Random 3-8 seconds
      return () => clearTimeout(opponentTimer);
    }
  }, [currentRound, submitted]);

  const handleSubmit = () => {
    if (selectedAnswer === null && timeLeft > 0) return;
    
    setSubmitted(true);
    setPlayerState('submitted');
    setOpponentState('submitted');

    // Calculate points
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(isCorrect);
    if (isCorrect) {
      const points = Math.max(100, timeLeft * 10);
      setPlayerScore(playerScore + points);
    }

    // Simulate opponent score
    const opponentCorrect = Math.random() > 0.3;
    if (opponentCorrect) {
      const opponentPoints = Math.max(100, Math.floor(Math.random() * 300));
      setOpponentScore(opponentScore + opponentPoints);
    }

    // Show result overlay
    setTimeout(() => {
      setShowRoundResult(true);
    }, 1000);

    // Auto-advance to next round or results (different timing for correct vs wrong)
    const advanceDelay = isCorrect ? 2500 : 4500; // Correct: 2.5s, Wrong: 4.5s
    setTimeout(() => {
      if (currentRound < totalRounds) {
        setCurrentRound(currentRound + 1);
        setTimeLeft(30);
        setSelectedAnswer(null);
        setSubmitted(false);
        setShowRoundResult(false);
        setPlayerState('solving');
        setOpponentState('solving');
      } else {
        navigate('/duels/result', { 
          state: { 
            playerScore, 
            opponentScore: opponentScore + (opponentCorrect ? Math.floor(Math.random() * 300) : 0)
          } 
        });
      }
    }, advanceDelay);
  };

  const getStateLabel = (state) => {
    switch (state) {
      case 'solving': return 'Solving...';
      case 'submitted': return 'Submitted';
      case 'waiting': return 'Waiting';
      default: return '';
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'solving': return 'text-[#FBBF24]';
      case 'submitted': return 'text-[#10B981]';
      case 'waiting': return 'text-[#9CA3AF]';
      default: return 'text-[#9CA3AF]';
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Tensioned Background Glow */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#EC4899]/15 rounded-full blur-[120px]"
          animate={{
            x: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[120px]"
          animate={{
            x: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[20px] font-bold text-[#F3F4F6]">
                Physics Duel — Motion in 2D
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                  <span className="text-[13px] text-[#9CA3AF]">Round</span>
                  <span className="text-[13px] font-bold text-[#F3F4F6]">
                    {currentRound}/{totalRounds}
                  </span>
                </div>
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/20 border border-[#EF4444]/40 rounded-lg"
                  animate={{
                    scale: timeLeft <= 5 ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: timeLeft <= 5 ? Infinity : 0,
                  }}
                >
                  <Clock size={16} className="text-[#EF4444]" />
                  <span className={`text-[14px] font-bold ${timeLeft <= 5 ? 'text-[#EF4444]' : 'text-[#F3F4F6]'}`}>
                    {timeLeft}s
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]"
                initial={{ width: 0 }}
                animate={{ width: `${(currentRound / totalRounds) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </header>

        {/* Main Layout - 3 Zones */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {/* LEFT PANEL - Opponent */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-[#EC4899]/30 p-6 h-fit shadow-[0_4px_16px_rgba(236,72,153,0.2)]"
          >
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#EC4899] to-[#EF4444] border-4 border-white/20" />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-2 border-[rgba(12,8,36,0.7)] flex items-center justify-center"
                  animate={{
                    scale: opponentState === 'submitted' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {opponentState === 'submitted' ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : (
                    <Loader size={14} className="text-white animate-spin" />
                  )}
                </motion.div>
              </div>

              {/* Name & Level */}
              <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-1">Alex Kumar</h3>
              <div className="px-3 py-1 bg-[#EC4899]/20 border border-[#EC4899]/40 rounded-lg mb-4">
                <span className="text-[12px] font-semibold text-[#EC4899]">Level 14</span>
              </div>

              {/* Score */}
              <div className="w-full p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                <p className="text-[12px] text-[#9CA3AF] text-center mb-1">Score</p>
                <p className="text-[32px] font-bold text-[#EC4899] text-center">{opponentScore}</p>
              </div>

              {/* State */}
              <div className="flex items-center gap-2">
                {opponentState === 'solving' && (
                  <Loader size={16} className="text-[#FBBF24] animate-spin" />
                )}
                <span className={`text-[13px] font-medium ${getStateColor(opponentState)}`}>
                  {getStateLabel(opponentState)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* CENTER - Question Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(12,8,36,0.8)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {/* Question */}
            <div className="mb-8">
              <h2 className="text-[18px] font-bold text-[#F3F4F6] mb-4 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => !submitted && setSelectedAnswer(index)}
                  disabled={submitted}
                  whileHover={{ scale: submitted ? 1 : 1.01 }}
                  whileTap={{ scale: submitted ? 1 : 0.99 }}
                  className={`
                    w-full p-4 rounded-xl text-left transition-all duration-200
                    ${submitted 
                      ? index === currentQuestion.correctAnswer
                        ? 'bg-[#10B981]/20 border-2 border-[#10B981]'
                        : selectedAnswer === index
                          ? 'bg-[#EF4444]/20 border-2 border-[#EF4444]'
                          : 'bg-white/5 border-2 border-white/10 opacity-50'
                      : selectedAnswer === index
                        ? 'bg-[#6366F1]/20 border-2 border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                        : 'bg-white/5 border-2 border-white/10 hover:border-white/20 cursor-pointer'
                    }
                    ${submitted && 'cursor-not-allowed'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Option Letter */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px]
                      ${submitted
                        ? index === currentQuestion.correctAnswer
                          ? 'bg-[#10B981] text-white'
                          : selectedAnswer === index
                            ? 'bg-[#EF4444] text-white'
                            : 'bg-white/10 text-[#9CA3AF]'
                        : selectedAnswer === index
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-white/10 text-[#9CA3AF]'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    {/* Option Text */}
                    <span className={`
                      text-[14px]
                      ${submitted
                        ? index === currentQuestion.correctAnswer
                          ? 'text-[#10B981] font-semibold'
                          : selectedAnswer === index
                            ? 'text-[#EF4444] font-semibold'
                            : 'text-[#9CA3AF]'
                        : selectedAnswer === index
                          ? 'text-[#F3F4F6] font-medium'
                          : 'text-[#D1D5DB]'
                      }
                    `}>
                      {option}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            {!submitted ? (
              <motion.button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                whileHover={{ scale: selectedAnswer === null ? 1 : 1.02 }}
                whileTap={{ scale: selectedAnswer === null ? 1 : 0.98 }}
                className={`
                  w-full py-4 rounded-xl font-bold text-[16px]
                  transition-all duration-200
                  ${selectedAnswer === null
                    ? 'bg-white/5 border border-white/10 text-[#9CA3AF] cursor-not-allowed'
                    : 'bg-[#10B981] text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_28px_rgba(16,185,129,0.5)]'
                  }
                `}
              >
                Submit Answer
              </motion.button>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#10B981]/20 border border-[#10B981]/40 rounded-xl">
                  <CheckCircle size={20} className="text-[#10B981]" />
                  <span className="text-[14px] font-semibold text-[#10B981]">Answer Locked</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* RIGHT PANEL - Player */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-[#8B5CF6]/30 p-6 h-fit shadow-[0_4px_16px_rgba(139,92,246,0.2)]"
          >
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] border-4 border-white/20" />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full border-2 border-[rgba(12,8,36,0.7)] flex items-center justify-center"
                  animate={{
                    scale: playerState === 'submitted' ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {playerState === 'submitted' ? (
                    <CheckCircle size={14} className="text-white" />
                  ) : (
                    <Loader size={14} className="text-white animate-spin" />
                  )}
                </motion.div>
              </div>

              {/* Name & Level */}
              <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-1">You</h3>
              <div className="px-3 py-1 bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 rounded-lg mb-4">
                <span className="text-[12px] font-semibold text-[#8B5CF6]">Level 12</span>
              </div>

              {/* Score */}
              <div className="w-full p-4 bg-white/5 rounded-xl border border-white/10 mb-4">
                <p className="text-[12px] text-[#9CA3AF] text-center mb-1">Score</p>
                <p className="text-[32px] font-bold text-[#8B5CF6] text-center">{playerScore}</p>
              </div>

              {/* Streak (if applicable) */}
              {playerScore > 0 && selectedAnswer === currentQuestion.correctAnswer && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-[#FBBF24]/20 border border-[#FBBF24]/40 rounded-lg"
                >
                  <TrendingUp size={16} className="text-[#FBBF24]" />
                  <span className="text-[12px] font-semibold text-[#FBBF24]">Streak!</span>
                </motion.div>
              )}

              {/* State */}
              <div className="flex items-center gap-2 mt-4">
                {playerState === 'solving' && (
                  <Loader size={16} className="text-[#FBBF24] animate-spin" />
                )}
                <span className={`text-[13px] font-medium ${getStateColor(playerState)}`}>
                  {getStateLabel(playerState)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Round Result Overlay */}
      <AnimatePresence>
        {showRoundResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`
                bg-[rgba(12,8,36,0.95)] backdrop-blur-xl rounded-2xl p-8 max-w-xl mx-4
                ${isCorrect 
                  ? 'border-2 border-[#10B981]/40 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                  : 'border-2 border-[#EF4444]/40 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                }
              `}
            >
              {isCorrect ? (
                // CORRECT ANSWER POPUP
                <>
                  {/* Status */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981]/20 border border-[#10B981]/50 rounded-xl mb-3"
                    >
                      <CheckCircle size={24} className="text-[#10B981]" />
                      <span className="text-[18px] font-bold text-[#10B981]">Correct!</span>
                    </motion.div>
                  </div>

                  {/* Points Gained */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-center py-6 bg-[#FBBF24]/10 rounded-xl border border-[#FBBF24]/30 mb-6"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap size={28} className="text-[#FBBF24]" />
                      <span className="text-[36px] font-bold text-[#FBBF24]">
                        +{Math.max(100, timeLeft * 10)}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#9CA3AF]">Points earned</p>
                  </motion.div>

                  {/* Score Comparison */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl text-center">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">You</p>
                      <p className="text-[28px] font-bold text-[#8B5CF6]">{playerScore}</p>
                    </div>
                    <div className="p-4 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-xl text-center">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">Opponent</p>
                      <p className="text-[28px] font-bold text-[#EC4899]">{opponentScore}</p>
                    </div>
                  </motion.div>
                </>
              ) : (
                // WRONG ANSWER POPUP
                <>
                  {/* Status */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EF4444]/20 border border-[#EF4444]/50 rounded-xl mb-4"
                    >
                      <X size={24} className="text-[#EF4444]" />
                      <span className="text-[18px] font-bold text-[#EF4444]">Incorrect</span>
                    </motion.div>
                    
                    {/* Correct Answer */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#10B981]/15 border border-[#10B981]/30 rounded-lg mb-3"
                    >
                      <CheckCircle size={18} className="text-[#10B981]" />
                      <span className="text-[14px] font-semibold text-[#10B981]">
                        Correct: {currentQuestion.options[currentQuestion.correctAnswer]}
                      </span>
                    </motion.div>

                    {/* Concept Hint */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[13px] text-[#D1D5DB] leading-relaxed"
                    >
                      {currentQuestion.explanation}
                    </motion.p>
                  </div>

                  {/* Score Comparison */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl text-center">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">You</p>
                      <p className="text-[28px] font-bold text-[#8B5CF6]">{playerScore}</p>
                    </div>
                    <div className="p-4 bg-[#EC4899]/10 border border-[#EC4899]/30 rounded-xl text-center">
                      <p className="text-[12px] text-[#9CA3AF] mb-1">Opponent</p>
                      <p className="text-[28px] font-bold text-[#EC4899]">{opponentScore}</p>
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}