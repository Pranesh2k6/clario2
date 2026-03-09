import { ProfileDropdown } from '../components/ProfileDropdown';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, Clock, BookmarkCheck, ChevronLeft, Flag, CheckCircle } from 'lucide-react';
const clarioLogo = '/clario-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Mock test questions with exam tags
const mockTestQuestions = [
  {
    id: 1,
    question: 'A projectile is thrown with velocity u at an angle θ with horizontal. At maximum height, what is the velocity of the projectile?',
    options: ['u', 'u cosθ', 'u sinθ', 'zero'],
    correctAnswer: 1,
    difficulty: 'Easy',
    exam: 'JEE Main',
    year: '2021'
  },
  {
    id: 2,
    question: 'A ball is projected at an angle of 45° with initial velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
    options: ['5 m', '10 m', '15 m', '20 m'],
    correctAnswer: 1,
    difficulty: 'Medium',
    exam: 'JEE Main',
    year: '2020'
  },
  {
    id: 3,
    question: 'For a projectile, the horizontal range is maximum when the angle of projection is:',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
    difficulty: 'Easy',
    exam: 'NEET',
    year: '2022'
  },
  {
    id: 4,
    question: 'Two projectiles are thrown with the same initial velocity at angles θ and (90° - θ). What can be said about their ranges?',
    options: ['Range at θ is greater', 'Range at (90° - θ) is greater', 'Ranges are equal', 'Cannot be determined'],
    correctAnswer: 2,
    difficulty: 'Medium',
    exam: 'JEE Advanced',
    year: '2019'
  },
  {
    id: 5,
    question: 'A projectile is launched with velocity 50 m/s at 30°. What is the time of flight? (g = 10 m/s²)',
    options: ['2.5 s', '5 s', '7.5 s', '10 s'],
    correctAnswer: 1,
    difficulty: 'Hard',
    exam: 'JEE Main',
    year: '2023'
  },
];

export default function MockTest() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(2700); // 45 minutes in seconds

  const question = mockTestQuestions[currentQuestion];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/30' };
      case 'Medium': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' };
      case 'Hard': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' };
      default: return { bg: 'bg-white/5', text: 'text-[#9CA3AF]', border: 'border-white/10' };
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockTestQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(null);
    }
  };

  const handleMarkForReview = () => {
    const newMarked = new Set(markedForReview);
    if (newMarked.has(currentQuestion)) {
      newMarked.delete(currentQuestion);
    } else {
      newMarked.add(currentQuestion);
    }
    setMarkedForReview(newMarked);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const difficultyColors = getDifficultyColor(question.difficulty);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Main Layout */}
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] bg-[rgba(8,5,24,0.85)] backdrop-blur-xl border-r border-white/8">
          {/* Logo */}
          <div className="w-[259px] h-[78.5px] border-b border-white/8 flex items-center justify-center">
            <img
              src={clarioLogo}
              alt="Clario"
              className="w-[160px] h-[57.6px] object-contain"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = false;
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => isImplemented && navigate(item.path)}
                  disabled={!isImplemented}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    text-[14px] font-medium transition-all duration-200
                    relative
                    ${isActive
                      ? 'bg-white/8 text-[#F3F4F6]'
                      : isImplemented
                        ? 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#D1D5DB] cursor-pointer'
                        : 'text-[#9CA3AF]/40 cursor-not-allowed'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="relative z-50 flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            {/* Left - Back Navigation */}
            <motion.button
              onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}`)}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[14px] font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Chapter</span>
            </motion.button>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                <Clock size={16} className="text-[#F59E0B]" />
                <span className="text-[13px] font-semibold text-[#F59E0B]">{formatTime(timeRemaining)}</span>
              </div>

              {/* Profile Avatar */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Header Section */}
            <div className="px-6 lg:px-8 pt-6 pb-4 border-b border-white/8 bg-[rgba(12,8,36,0.3)] backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF] mb-3">
                <button
                  onClick={() => navigate('/galaxy')}
                  className="hover:text-[#F3F4F6] transition-colors"
                >
                  Galaxy
                </button>
                <ChevronRight size={14} />
                <button
                  onClick={() => navigate(`/planet/${subjectId}`)}
                  className="hover:text-[#F3F4F6] transition-colors"
                >
                  Physics
                </button>
                <ChevronRight size={14} />
                <button
                  onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}`)}
                  className="hover:text-[#F3F4F6] transition-colors"
                >
                  Projectile Motion
                </button>
                <ChevronRight size={14} />
                <span className="text-[#F3F4F6]">Mock Test</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-[28px] font-bold text-[#F3F4F6] mb-1">
                    Mock Test: Projectile Motion
                  </h1>
                  <p className="text-[14px] text-[#9CA3AF]">
                    Real exam simulation with Previous Year Questions
                  </p>
                </div>

                {/* Question Counter */}
                <div className="text-right">
                  <div className="text-[24px] font-bold text-[#F3F4F6]">
                    {currentQuestion + 1}/{mockTestQuestions.length}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                    Questions
                  </div>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  {/* Question Header with Tags */}
                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    <div className={`px-3 py-1.5 ${difficultyColors.bg} border ${difficultyColors.border} rounded-lg`}>
                      <span className={`text-[12px] font-semibold ${difficultyColors.text}`}>
                        {question.difficulty}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg">
                      <span className="text-[12px] font-semibold text-[#6366F1]">
                        {question.exam}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                      <span className="text-[12px] font-semibold text-[#9CA3AF]">
                        {question.year}
                      </span>
                    </div>
                    {markedForReview.has(currentQuestion) && (
                      <div className="px-3 py-1.5 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-lg flex items-center gap-1">
                        <Flag size={12} className="text-[#FBBF24]" />
                        <span className="text-[12px] font-semibold text-[#FBBF24]">
                          Marked for Review
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="mb-6">
                    <h2 className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-2">
                      Question {currentQuestion + 1}
                    </h2>
                    <p className="text-[16px] text-[#F3F4F6] leading-relaxed">
                      {question.question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {question.options.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedAnswer(index)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`
                          w-full p-4 rounded-xl text-left transition-all duration-200
                          ${selectedAnswer === index
                            ? 'bg-[#7C3AED]/20 border-2 border-[#7C3AED]'
                            : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Option Letter */}
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px]
                            ${selectedAnswer === index
                              ? 'bg-[#7C3AED] text-white'
                              : 'bg-white/10 text-[#9CA3AF]'
                            }
                          `}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          {/* Option Text */}
                          <span className={`
                            text-[14px]
                            ${selectedAnswer === index ? 'text-[#F3F4F6] font-medium' : 'text-[#D1D5DB]'}
                          `}>
                            {option}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Previous Button */}
                    <motion.button
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                      whileHover={{ scale: currentQuestion === 0 ? 1 : 1.02 }}
                      whileTap={{ scale: currentQuestion === 0 ? 1 : 0.98 }}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl
                        text-[14px] font-semibold
                        transition-all duration-200
                        ${currentQuestion === 0
                          ? 'bg-white/5 border border-white/10 text-[#9CA3AF] cursor-not-allowed'
                          : 'bg-white/10 border border-white/20 text-[#F3F4F6] hover:bg-white/15'
                        }
                      `}
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </motion.button>

                    {/* Mark for Review Button */}
                    <motion.button
                      onClick={handleMarkForReview}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl
                        text-[14px] font-semibold
                        transition-all duration-200
                        ${markedForReview.has(currentQuestion)
                          ? 'bg-[#FBBF24]/20 border border-[#FBBF24]/40 text-[#FBBF24]'
                          : 'bg-white/10 border border-white/20 text-[#F3F4F6] hover:bg-white/15'
                        }
                      `}
                    >
                      <BookmarkCheck size={18} />
                      {markedForReview.has(currentQuestion) ? 'Marked' : 'Mark for Review'}
                    </motion.button>

                    {/* Next Button */}
                    <motion.button
                      onClick={handleNext}
                      disabled={currentQuestion === mockTestQuestions.length - 1}
                      whileHover={{ scale: currentQuestion === mockTestQuestions.length - 1 ? 1 : 1.02 }}
                      whileTap={{ scale: currentQuestion === mockTestQuestions.length - 1 ? 1 : 0.98 }}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl
                        text-[14px] font-semibold
                        shadow-[0_4px_16px_rgba(124,58,237,0.3)]
                        hover:shadow-[0_6px_24px_rgba(124,58,237,0.4)]
                        transition-all duration-200
                        ${currentQuestion === mockTestQuestions.length - 1
                          ? 'bg-white/5 border border-white/10 text-[#9CA3AF] cursor-not-allowed'
                          : 'bg-[#7C3AED] text-white'
                        }
                      `}
                    >
                      Next
                      <ChevronRight size={18} />
                    </motion.button>

                    {/* Submit Test (only on last question) */}
                    {currentQuestion === mockTestQuestions.length - 1 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="
                          ml-auto flex items-center gap-2 px-6 py-3 rounded-xl
                          bg-[#10B981] text-white
                          text-[14px] font-semibold
                          shadow-[0_4px_16px_rgba(16,185,129,0.3)]
                          hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)]
                          transition-all duration-200
                        "
                      >
                        <CheckCircle size={18} />
                        Submit Test
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}