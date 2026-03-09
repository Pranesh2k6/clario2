import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import {
  LayoutDashboard,
  Map,
  FileText,
  Swords,
  Calendar,
  BarChart3,
  Settings,
  TrendingUp,
  Clock,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Home
} from 'lucide-react';
const clarioLogo = '/clario-logo.png';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// Mock data for subject performance
const subjectData = [
  { subject: 'Physics', accuracy: 72 },
  { subject: 'Math', accuracy: 85 },
  { subject: 'Chemistry', accuracy: 68 },
];

// Mock weak topics data
const weakTopics = [
  { topic: 'Vectors', accuracy: 45 },
  { topic: 'Rotational Motion', accuracy: 50 },
  { topic: 'Thermodynamics', accuracy: 55 },
];

// Mock review questions
const reviewQuestions = [
  {
    id: 1,
    question: 'A projectile is thrown with velocity u at an angle θ with horizontal. At maximum height, what is the velocity of the projectile?',
    correctAnswer: 'u cosθ',
    userAnswer: 'u',
    isCorrect: false,
    explanation: 'At maximum height, the vertical component of velocity becomes zero. Only the horizontal component (u cosθ) remains.',
  },
  {
    id: 2,
    question: 'For a projectile, the horizontal range is maximum when the angle of projection is:',
    correctAnswer: '45°',
    userAnswer: '45°',
    isCorrect: true,
    explanation: 'The range is given by R = (u²sin2θ)/g. Maximum value occurs when sin2θ = 1, i.e., when θ = 45°.',
  },
];

export default function MockTestResults() {
  const navigate = useNavigate();
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(path);
    if (isImplemented) {
      navigate(path);
    }
  };

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
              const isActive = item.path === '/tests';
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
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
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#7C3AED] rounded-r-full shadow-[0_0_12px_rgba(124,58,237,0.6)]" />
                  )}
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
          <header className="px-6 lg:px-8 py-6 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            <h2 className="text-[24px] font-bold text-[#F3F4F6] mb-2">
              Mock Test Analysis
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Evaluate your exam readiness.
            </p>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {/* Exam Readiness Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10 text-center"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-4">Exam Readiness Score</h3>
                <div className="relative inline-block mb-4">
                  <svg className="w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      strokeDasharray={`${74 * 4.4} ${100 * 4.4}`}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[40px] font-bold text-[#F3F4F6]">74%</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#9CA3AF] max-w-md mx-auto">
                  This score estimates your readiness for real exam conditions.
                </p>
              </motion.div>

              {/* Performance Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-6">Performance Breakdown</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Concept Accuracy */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-[#6366F1]" />
                        <span className="text-[13px] font-medium text-[#F3F4F6]">Concept Accuracy</span>
                      </div>
                      <span className="text-[16px] font-bold text-[#6366F1]">78%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  {/* Time Efficiency */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#10B981]" />
                        <span className="text-[13px] font-medium text-[#F3F4F6]">Time Efficiency</span>
                      </div>
                      <span className="text-[16px] font-bold text-[#10B981]">65%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>

                  {/* Hard Question Accuracy */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-[#F59E0B]" />
                        <span className="text-[13px] font-medium text-[#F3F4F6]">Difficulty Handling</span>
                      </div>
                      <span className="text-[16px] font-bold text-[#F59E0B]">59%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-full" style={{ width: '59%' }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Subject Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-2">Subject Performance</h3>
                <p className="text-[12px] text-[#10B981] mb-6">Physics shows strongest performance.</p>

                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={subjectData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="subject"
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      style={{ fontSize: '12px' }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(12,8,36,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar
                      dataKey="accuracy"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Time Management Analysis & Weak Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Time Management */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                >
                  <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-4">Time Management Analysis</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-[13px] text-[#9CA3AF]">Avg. Time per Question</span>
                      <span className="text-[13px] font-bold text-[#F3F4F6]">3m 24s</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-[13px] text-[#9CA3AF]">Questions Skipped</span>
                      <span className="text-[13px] font-bold text-[#F59E0B]">4</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-[13px] text-[#9CA3AF]">Questions Rushed</span>
                      <span className="text-[13px] font-bold text-[#EF4444]">6</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg">
                    <p className="text-[12px] text-[#F59E0B]">
                      You spent too long on medium difficulty questions.
                    </p>
                  </div>
                </motion.div>

                {/* Weak Topics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                >
                  <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-2">Topics Requiring Attention</h3>
                  <p className="text-[11px] text-[#EF4444] mb-4">Concept debt detected in these topics.</p>

                  <div className="space-y-3">
                    {weakTopics.map((topic, index) => (
                      <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] text-[#F3F4F6]">{topic.topic}</span>
                          <span className="text-[13px] font-bold text-[#EF4444]">{topic.accuracy}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] rounded-full"
                            style={{ width: `${topic.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Review Questions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-6">Review Questions</h3>

                <div className="space-y-4">
                  {reviewQuestions.map((q) => (
                    <div key={q.id} className="p-5 bg-white/5 rounded-xl border border-white/10">
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-[14px] text-[#F3F4F6] flex-1 pr-4">{q.question}</h4>
                        {q.isCorrect ? (
                          <CheckCircle size={20} className="text-[#10B981] flex-shrink-0" />
                        ) : (
                          <XCircle size={20} className="text-[#EF4444] flex-shrink-0" />
                        )}
                      </div>

                      {/* Answers */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
                          <p className="text-[11px] text-[#9CA3AF] mb-1">Correct Answer</p>
                          <p className="text-[13px] font-medium text-[#10B981]">{q.correctAnswer}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${q.isCorrect ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[#EF4444]/10 border-[#EF4444]/30'}`}>
                          <p className="text-[11px] text-[#9CA3AF] mb-1">Your Answer</p>
                          <p className={`text-[13px] font-medium ${q.isCorrect ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {q.userAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      <button
                        onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                        className="text-[12px] text-[#6366F1] hover:text-[#5558E3] transition-colors"
                      >
                        {expandedQuestion === q.id ? 'Hide' : 'Show'} Explanation
                      </button>

                      {expandedQuestion === q.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg"
                        >
                          <p className="text-[12px] text-[#D1D5DB]">{q.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <button
                  onClick={() => navigate('/tests')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#6366F1] rounded-lg text-[14px] font-medium text-white hover:bg-[#5558E3] transition-colors shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                >
                  <RotateCcw size={16} />
                  Retry Test
                </button>
                <button
                  onClick={() => navigate('/analytics')}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-[14px] font-medium text-[#9CA3AF] hover:border-white/20 transition-colors"
                >
                  <TrendingUp size={16} />
                  View Analytics
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-[14px] font-medium text-[#9CA3AF] hover:border-white/20 transition-colors"
                >
                  <Home size={16} />
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
