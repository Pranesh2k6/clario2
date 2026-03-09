import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
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
  ArrowLeft,
  Lock,
  Play
} from 'lucide-react';
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

// Mock data for chapters
const chapterData = {
  'motion-2d': { name: 'Motion in 2D', subject: 'Physics' },
  'kinematics': { name: 'Kinematics', subject: 'Physics' },
  'vectors': { name: 'Vectors', subject: 'Mathematics' },
};

export default function ChapterMockTest() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();

  const chapter = chapterData[chapterId || 'motion-2d'] || { name: 'Motion in 2D', subject: 'Physics' };

  // Test configuration state
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState('30 Minutes');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionType, setQuestionType] = useState('Mixed');

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(path);
    if (isImplemented) {
      navigate(path);
    }
  };

  const handleStartTest = () => {
    navigate(`/planet/${subjectId}/chapter/${chapterId}/mock-test-interface`);
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
              const isActive = false;
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
            <button
              onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}`)}
              className="flex items-center gap-2 text-[13px] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Chapter
            </button>
            <h2 className="text-[24px] font-bold text-[#F3F4F6] mb-2">
              Chapter Mock Test
            </h2>
            <p className="text-[13px] text-[#9CA3AF] mb-2">
              Test your understanding of this chapter.
            </p>
            <div className="inline-block px-3 py-1 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg">
              <span className="text-[13px] font-medium text-[#6366F1]">{chapter.name}</span>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[800px] mx-auto">
              {/* Quick Test Configuration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[18px] font-bold text-[#F3F4F6] mb-6">Quick Test Configuration</h3>

                <div className="space-y-6">
                  {/* Locked Settings */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock size={16} className="text-[#9CA3AF]" />
                      <span className="text-[12px] font-medium text-[#9CA3AF]">Pre-configured Settings</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Subject</label>
                        <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#6B7280] cursor-not-allowed">
                          {chapter.subject}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Chapter</label>
                        <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#6B7280] cursor-not-allowed">
                          {chapter.name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">
                      Number of Questions: <span className="text-[#6366F1]">{numQuestions}</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="5"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                      />
                      <input
                        type="number"
                        min="5"
                        max="40"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                        className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-2">Range: 5 - 40 questions</p>
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Time Limit</label>
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1] cursor-pointer"
                    >
                      <option value="No Timer">No Timer</option>
                      <option value="15 Minutes">15 Minutes</option>
                      <option value="30 Minutes">30 Minutes</option>
                      <option value="45 Minutes">45 Minutes</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Difficulty</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Mixed', 'Easy', 'Medium', 'Hard'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`
                            px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${difficulty === level
                              ? 'bg-[#6366F1] text-white'
                              : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Type */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#F3F4F6] mb-3">Question Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Concept Questions', 'Numerical Problems', 'Mixed'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setQuestionType(type)}
                          className={`
                            px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                            ${questionType === type
                              ? 'bg-[#6366F1] text-white'
                              : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                            }
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Start Test Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleStartTest}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#6366F1] to-[#7C3AED] rounded-lg text-[14px] font-medium text-white hover:opacity-90 transition-opacity shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                    >
                      <Play size={18} />
                      Start Chapter Mock Test
                    </button>
                    <p className="text-[11px] text-center text-[#6B7280] mt-3">
                      This test focuses only on the selected chapter.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/10"
              >
                <h4 className="text-[14px] font-bold text-[#F3F4F6] mb-3">About Chapter Mock Tests</h4>
                <ul className="space-y-2 text-[12px] text-[#9CA3AF]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366F1] mt-0.5">•</span>
                    <span>Questions are focused specifically on {chapter.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366F1] mt-0.5">•</span>
                    <span>Get instant feedback and detailed explanations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366F1] mt-0.5">•</span>
                    <span>Track your progress and identify weak areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#6366F1] mt-0.5">•</span>
                    <span>Perfect for quick knowledge checks before moving forward</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}