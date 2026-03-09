import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  AlertCircle
} from 'lucide-react';

// Mock test questions
const mockTestQuestions = [
  {
    id: 1,
    question: 'A projectile is thrown with velocity u at an angle θ with horizontal. At maximum height, what is the velocity of the projectile?',
    options: ['u', 'u cosθ', 'u sinθ', 'zero'],
    correctAnswer: 1,
  },
  {
    id: 2,
    question: 'A ball is projected at an angle of 45° with initial velocity 20 m/s. What is the maximum height reached? (g = 10 m/s²)',
    options: ['5 m', '10 m', '15 m', '20 m'],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: 'For a projectile, the horizontal range is maximum when the angle of projection is:',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: 'Two projectiles are thrown with the same initial velocity at angles θ and (90° - θ). What can be said about their ranges?',
    options: ['Range at θ is greater', 'Range at (90° - θ) is greater', 'Ranges are equal', 'Cannot be determined'],
    correctAnswer: 2,
  },
  {
    id: 5,
    question: 'A projectile is launched with velocity 50 m/s at 30°. What is the time of flight? (g = 10 m/s²)',
    options: ['2.5 s', '5 s', '7.5 s', '10 s'],
    correctAnswer: 1,
  },
  {
    id: 6,
    question: 'The trajectory of a projectile is given by y = x - (x²/80). The range of the projectile is:',
    options: ['40 m', '60 m', '80 m', '100 m'],
    correctAnswer: 2,
  },
  {
    id: 7,
    question: 'A particle is projected with a velocity v such that its range on the horizontal plane is twice the greatest height attained. The range is:',
    options: ['4v²/5g', '4v²/3g', 'v²/g', '2v²/g'],
    correctAnswer: 0,
  },
  {
    id: 8,
    question: 'Two bodies are projected at angles θ and (90° - θ) to the horizontal with the same speed. The ratio of their maximum heights is:',
    options: ['1:1', 'tan²θ', 'sin²θ:cos²θ', 'cosθ:sinθ'],
    correctAnswer: 2,
  },
  {
    id: 9,
    question: 'A projectile has the same range for two angles of projection. The sum of these angles is:',
    options: ['45°', '60°', '90°', '180°'],
    correctAnswer: 2,
  },
  {
    id: 10,
    question: 'The speed of a projectile at its maximum height is half of its initial speed. The angle of projection is:',
    options: ['30°', '45°', '60°', '90°'],
    correctAnswer: 2,
  },
];

export default function MockTest() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(mockTestQuestions.length).fill(null));
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [showExitModal, setShowExitModal] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
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

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockTestQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmitTest = () => {
    navigate('/tests/results');
  };

  const getQuestionStatus = (index) => {
    if (answers[index] !== null) return 'attempted';
    if (markedForReview.has(index)) return 'marked';
    return 'unanswered';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'attempted':
        return 'bg-[#10B981] border-[#10B981]';
      case 'marked':
        return 'bg-[#F59E0B] border-[#F59E0B]';
      default:
        return 'bg-white/10 border-white/20';
    }
  };

  const question = mockTestQuestions[currentQuestion];
  const attemptedCount = answers.filter(a => a !== null).length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-[rgba(12,8,36,0.9)] backdrop-blur-xl border-b border-white/10">
          <div>
            <h2 className="text-[16px] font-bold text-[#F3F4F6]">Mock Test in Progress</h2>
            <p className="text-[11px] text-[#9CA3AF]">Simulated exam environment</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Clock size={18} className="text-[#6366F1]" />
              <span className="text-[16px] font-bold text-[#F3F4F6] tabular-nums">{formatTime(timeRemaining)}</span>
            </div>

            {/* Progress */}
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
              <span className="text-[13px] text-[#9CA3AF]">
                Question <span className="font-bold text-[#F3F4F6]">{currentQuestion + 1}</span> / {mockTestQuestions.length}
              </span>
            </div>

            {/* Exit Button */}
            <button
              onClick={() => setShowExitModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-[13px] font-medium text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
            >
              <X size={16} />
              Exit Test
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Question Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-[900px] mx-auto">
              {/* Test Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-[#F3F4F6]">Physics + Math Mock</p>
                    <p className="text-[11px] text-[#9CA3AF]">{mockTestQuestions.length} Questions · 1 Hour</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#9CA3AF]">Attempted</p>
                    <p className="text-[12px] font-bold text-[#10B981]">{attemptedCount} / {mockTestQuestions.length}</p>
                  </div>
                </div>
              </motion.div>

              {/* Question Card */}
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                {/* Question Number */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-medium text-[#9CA3AF]">Question {currentQuestion + 1}</span>
                  {markedForReview.has(currentQuestion) && (
                    <span className="px-2 py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded text-[10px] font-medium text-[#F59E0B]">
                      Marked for Review
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h3 className="text-[16px] text-[#F3F4F6] mb-8 leading-relaxed">
                  {question.question}
                </h3>

                {/* Answer Options */}
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`
                        w-full p-4 rounded-xl border-2 text-left transition-all
                        ${answers[currentQuestion] === index
                          ? 'bg-[#6366F1]/10 border-[#6366F1] text-[#F3F4F6]'
                          : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:border-white/20 hover:bg-white/10'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${answers[currentQuestion] === index
                            ? 'border-[#6366F1] bg-[#6366F1]'
                            : 'border-white/30'
                          }
                        `}>
                          {answers[currentQuestion] === index && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-[14px]">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Bottom Controls */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-[#9CA3AF] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  onClick={handleMarkForReview}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg text-[13px] font-medium text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors"
                >
                  <Flag size={16} />
                  {markedForReview.has(currentQuestion) ? 'Unmark' : 'Mark for Review'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentQuestion === mockTestQuestions.length - 1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#6366F1] border border-[#6366F1] rounded-lg text-[13px] font-medium text-white hover:bg-[#5558E3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Question Navigator */}
          <aside className="w-[320px] border-l border-white/10 bg-[rgba(8,5,24,0.85)] backdrop-blur-xl overflow-y-auto p-6">
            <h3 className="text-[14px] font-bold text-[#F3F4F6] mb-4">Question Navigator</h3>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 mb-6">
              {mockTestQuestions.map((_, index) => {
                const status = getQuestionStatus(index);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`
                      aspect-square rounded-lg border-2 text-[12px] font-medium transition-all
                      ${currentQuestion === index
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                        : `${getStatusColor(status)} text-white hover:opacity-80`
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-[11px] font-medium text-[#9CA3AF] mb-3">Status Legend</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#10B981]" />
                <span className="text-[11px] text-[#9CA3AF]">Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#F59E0B]" />
                <span className="text-[11px] text-[#9CA3AF]">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white/10 border border-white/20" />
                <span className="text-[11px] text-[#9CA3AF]">Unanswered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#7C3AED]" />
                <span className="text-[11px] text-[#9CA3AF]">Current</span>
              </div>
            </div>

            {/* Submit Test Button */}
            <button
              onClick={handleSubmitTest}
              className="w-full mt-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#7C3AED] rounded-lg text-[13px] font-medium text-white hover:opacity-90 transition-opacity shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
            >
              Submit Test
            </button>
          </aside>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md mx-4 p-6 bg-[rgba(12,8,36,0.98)] backdrop-blur-xl rounded-2xl border border-white/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-2">Exit Mock Test?</h3>
                <p className="text-[13px] text-[#9CA3AF]">
                  Your progress will be lost. Are you sure you want to exit?
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-[#9CA3AF] hover:border-white/20 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={() => navigate('/tests')}
                className="flex-1 py-2.5 bg-[#EF4444] rounded-lg text-[13px] font-medium text-white hover:bg-[#DC2626] transition-colors"
              >
                Exit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
