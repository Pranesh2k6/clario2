import { ProfileDropdown } from '../components/ProfileDropdown';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, ChevronLeft, Flag, BookmarkCheck } from 'lucide-react';
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

// 30 adaptive quiz questions
const quizQuestions = [
  {
    id: 1,
    question: 'A projectile is thrown horizontally with velocity 20 m/s from a height of 45 m. What is the time taken to reach the ground?',
    options: ['2 s', '3 s', '4 s', '5 s'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Time of Flight'
  },
  {
    id: 2,
    question: 'At what angle should a projectile be launched to achieve maximum range?',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Range'
  },
  {
    id: 3,
    question: 'A ball is projected at 45° with initial velocity 40 m/s. Calculate the maximum height. (g = 10 m/s²)',
    options: ['20 m', '40 m', '60 m', '80 m'],
    correctAnswer: 0,
    difficulty: 'Medium',
    topic: 'Maximum Height'
  },
  {
    id: 4,
    question: 'In projectile motion, which component of velocity remains constant?',
    options: ['Vertical', 'Horizontal', 'Both', 'Neither'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Components'
  },
  {
    id: 5,
    question: 'A projectile is launched at 60° with speed 50 m/s. What is the horizontal component of velocity?',
    options: ['25 m/s', '30 m/s', '43.3 m/s', '50 m/s'],
    correctAnswer: 0,
    difficulty: 'Medium',
    topic: 'Components'
  },
  {
    id: 6,
    question: 'Two projectiles are thrown at angles θ and (90° - θ). Their ranges are:',
    options: ['Different', 'Equal', 'Cannot say', 'Depends on speed'],
    correctAnswer: 1,
    difficulty: 'Medium',
    topic: 'Range'
  },
  {
    id: 7,
    question: 'At maximum height, the vertical component of velocity is:',
    options: ['Maximum', 'Minimum', 'Zero', 'Equal to horizontal'],
    correctAnswer: 2,
    difficulty: 'Easy',
    topic: 'Maximum Height'
  },
  {
    id: 8,
    question: 'A projectile is fired at 30° with velocity 100 m/s. Calculate time of flight. (g = 10 m/s²)',
    options: ['5 s', '10 s', '15 s', '20 s'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Time of Flight'
  },
  {
    id: 9,
    question: 'The trajectory of a projectile is a:',
    options: ['Straight line', 'Circle', 'Parabola', 'Ellipse'],
    correctAnswer: 2,
    difficulty: 'Easy',
    topic: 'Trajectory'
  },
  {
    id: 10,
    question: 'A stone is thrown horizontally from a cliff. Its path is:',
    options: ['Straight', 'Circular', 'Parabolic', 'Vertical'],
    correctAnswer: 2,
    difficulty: 'Easy',
    topic: 'Trajectory'
  },
  {
    id: 11,
    question: 'For a projectile, the angle between velocity and acceleration at the highest point is:',
    options: ['0°', '45°', '90°', '180°'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Maximum Height'
  },
  {
    id: 12,
    question: 'A projectile has range R. Its maximum height is R/4. Find the angle of projection.',
    options: ['30°', '45°', '60°', '75°'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Range'
  },
  {
    id: 13,
    question: 'Which quantity remains constant in projectile motion?',
    options: ['Speed', 'Velocity', 'Horizontal velocity', 'Vertical velocity'],
    correctAnswer: 2,
    difficulty: 'Easy',
    topic: 'Components'
  },
  {
    id: 14,
    question: 'A ball is thrown at 60° with speed v. Another at 30° with same speed. Their ranges are:',
    options: ['First is more', 'Second is more', 'Equal', 'Cannot determine'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Range'
  },
  {
    id: 15,
    question: 'The acceleration of a projectile at the topmost point is:',
    options: ['Zero', 'g downward', 'g upward', 'Variable'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Maximum Height'
  },
  {
    id: 16,
    question: 'A projectile reaches maximum height H. Its time to reach H is T. Total time of flight is:',
    options: ['T', '2T', '3T', '4T'],
    correctAnswer: 1,
    difficulty: 'Medium',
    topic: 'Time of Flight'
  },
  {
    id: 17,
    question: 'For a given speed, the range is maximum when angle is:',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Range'
  },
  {
    id: 18,
    question: 'A projectile is fired with velocity 20 m/s at 30°. Calculate horizontal range. (g = 10 m/s²)',
    options: ['20 m', '34.6 m', '40 m', '50 m'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Range'
  },
  {
    id: 19,
    question: 'At what point is the speed of projectile minimum?',
    options: ['Start', 'Middle', 'Highest point', 'End'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Maximum Height'
  },
  {
    id: 20,
    question: 'The horizontal range and maximum height of a projectile are R and H. If R = 4H, angle is:',
    options: ['30°', '45°', '60°', '75°'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Range'
  },
  {
    id: 21,
    question: 'A projectile is launched. At the highest point, its velocity is v. Initial velocity was:',
    options: ['v', 'v cosθ', 'v/cosθ', '2v'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Components'
  },
  {
    id: 22,
    question: 'Two projectiles have same range R but different maximum heights. Their angles must be:',
    options: ['Same', 'Complementary', 'Supplementary', 'Equal to 45°'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Range'
  },
  {
    id: 23,
    question: 'A ball is dropped from height H. Another is projected horizontally from same height. Which reaches ground first?',
    options: ['Dropped', 'Projected', 'Same time', 'Depends on speed'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Time of Flight'
  },
  {
    id: 24,
    question: 'In projectile motion, the quantity that changes is:',
    options: ['Horizontal velocity', 'Vertical velocity', 'Acceleration', 'Mass'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Components'
  },
  {
    id: 25,
    question: 'A projectile is thrown at angle θ. To double the range, the angle should be changed to:',
    options: ['θ/2', '2θ', '90° - θ', 'Cannot be determined'],
    correctAnswer: 3,
    difficulty: 'Hard',
    topic: 'Range'
  },
  {
    id: 26,
    question: 'The time taken to reach maximum height is half of:',
    options: ['Range', 'Total time', 'Speed', 'Height'],
    correctAnswer: 1,
    difficulty: 'Easy',
    topic: 'Time of Flight'
  },
  {
    id: 27,
    question: 'A projectile motion can be considered as combination of:',
    options: ['Two uniform motions', 'Two accelerated motions', 'One uniform and one accelerated', 'Circular motions'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Components'
  },
  {
    id: 28,
    question: 'For a projectile fired at 45°, if speed is doubled, range becomes:',
    options: ['Same', 'Double', 'Four times', 'Half'],
    correctAnswer: 2,
    difficulty: 'Medium',
    topic: 'Range'
  },
  {
    id: 29,
    question: 'A projectile is fired from ground. Its velocity at half the maximum height is v. Initial vertical velocity was:',
    options: ['v', 'v√2', '2v', 'v/√2'],
    correctAnswer: 1,
    difficulty: 'Hard',
    topic: 'Maximum Height'
  },
  {
    id: 30,
    question: 'The shape of trajectory depends on:',
    options: ['Angle only', 'Speed only', 'Both angle and speed', 'Neither'],
    correctAnswer: 0,
    difficulty: 'Medium',
    topic: 'Trajectory'
  },
];

export default function PersonalisedQuiz() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const question = quizQuestions[currentQuestion];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/30' };
      case 'Medium': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' };
      case 'Hard': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' };
      default: return { bg: 'bg-white/5', text: 'text-[#9CA3AF]', border: 'border-white/10' };
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
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
          <div className="p-6 border-b border-white/8">
            <img
              src={clarioLogo}
              alt="Clario"
              className="h-[48px] w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = false;
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(item.path);

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
              {/* XP */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">1,250 XP</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Flame size={16} className="text-[#F97316]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">7 days</span>
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
                  Motion in 2D
                </button>
                <ChevronRight size={14} />
                <span className="text-[#F3F4F6]">Personalised Quiz</span>
              </div>

              <h1 className="text-[28px] font-bold text-[#F3F4F6] mb-2">
                Motion in 2D — Personalised Quiz
              </h1>
              <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-3xl">
                Questions adapt to your level.
              </p>
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
                        {question.topic}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                      <span className="text-[12px] font-semibold text-[#9CA3AF]">
                        Question {currentQuestion + 1} of {quizQuestions.length}
                      </span>
                    </div>
                    {markedForReview.has(currentQuestion) && (
                      <div className="px-3 py-1.5 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-lg flex items-center gap-1">
                        <Flag size={12} className="text-[#FBBF24]" />
                        <span className="text-[12px] font-semibold text-[#FBBF24]">
                          Marked
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="mb-6">
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
                            ? 'bg-[#10B981]/20 border-2 border-[#10B981]'
                            : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Option Letter */}
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[14px]
                            ${selectedAnswer === index
                              ? 'bg-[#10B981] text-white'
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
                      disabled={currentQuestion === quizQuestions.length - 1}
                      whileHover={{ scale: currentQuestion === quizQuestions.length - 1 ? 1 : 1.02 }}
                      whileTap={{ scale: currentQuestion === quizQuestions.length - 1 ? 1 : 0.98 }}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl
                        text-[14px] font-semibold
                        shadow-[0_4px_16px_rgba(16,185,129,0.3)]
                        hover:shadow-[0_6px_24px_rgba(16,185,129,0.4)]
                        transition-all duration-200
                        ${currentQuestion === quizQuestions.length - 1
                          ? 'bg-white/5 border border-white/10 text-[#9CA3AF] cursor-not-allowed'
                          : 'bg-[#10B981] text-white'
                        }
                      `}
                    >
                      Next
                      <ChevronRight size={18} />
                    </motion.button>
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
