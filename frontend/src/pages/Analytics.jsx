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
  TrendingDown,
  Target,
  Brain,
  Clock,
  Flame,
  Lightbulb
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

// Mock data
const subjectData = [
  { subject: 'Physics', accuracy: 72 },
  { subject: 'Chemistry', accuracy: 85 },
  { subject: 'Mathematics', accuracy: 68 },
];

const difficultyData = [
  { level: 'Easy', accuracy: 92 },
  { level: 'Medium', accuracy: 74 },
  { level: 'Hard', accuracy: 58 },
];

const modeData = [
  { mode: 'Learn', value: 85, label: 'Completion %' },
  { mode: 'Practice', value: 78, label: 'Accuracy' },
  { mode: 'Quiz', value: 72, label: 'Performance' },
  { mode: 'Duels', value: 65, label: 'Win Rate' },
  { mode: 'Mock Tests', value: 71, label: 'Avg Score' },
];

const weeklyTrend = [
  { week: 'Week 1', accuracy: 65 },
  { week: 'Week 2', accuracy: 68 },
  { week: 'Week 3', accuracy: 72 },
  { week: 'Week 4', accuracy: 75 },
  { week: 'Week 5', accuracy: 78 },
];

const insights = [
  "Accuracy improving in medium difficulty questions",
  "Vector-based questions remain weak",
  "Performance stronger in practice mode than mock tests",
  "Consistent improvement over last 3 weeks",
];

export default function Analytics() {
  const navigate = useNavigate();

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
              const isActive = item.path === '/analytics';
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
              Learning Analytics
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Understand your progress and identify areas for improvement.
            </p>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Performance Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-5">Performance Overview</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={16} className="text-[#10B981]" />
                      <p className="text-[11px] text-[#9CA3AF]">Overall Accuracy</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[28px] font-bold text-[#10B981]">75%</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#10B981]">
                        <TrendingUp size={12} />
                        <span>+3%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className="text-[#6366F1]" />
                      <p className="text-[11px] text-[#9CA3AF]">Questions Attempted</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[28px] font-bold text-[#F3F4F6]">2,847</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#10B981]">
                        <TrendingUp size={12} />
                        <span>+145</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-[#8B5CF6]" />
                      <p className="text-[11px] text-[#9CA3AF]">Study Hours Logged</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[28px] font-bold text-[#8B5CF6]">142h</p>
                      <div className="flex items-center gap-1 text-[11px] text-[#10B981]">
                        <TrendingUp size={12} />
                        <span>+8h</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame size={16} className="text-[#F97316]" />
                      <p className="text-[11px] text-[#9CA3AF]">Current Study Streak</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[28px] font-bold text-[#F97316]">7</p>
                      <span className="text-[11px] text-[#9CA3AF]">days</span>
                    </div>
                  </div>
                </div>

                {/* Accuracy Trend Graph */}
                <div>
                  <p className="text-[12px] text-[#9CA3AF] mb-3">Accuracy Over Time</p>
                  <div className="h-[200px] relative">
                    {/* Simple line graph visualization */}
                    <div className="absolute inset-0 flex items-end justify-between gap-4">
                      {weeklyTrend.map((data, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-white/5 rounded-t-lg relative" style={{ height: `${(data.accuracy / 100) * 180}px` }}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(data.accuracy / 100) * 180}px` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#6366F1] to-[#7C3AED] rounded-t-lg"
                            />
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-[#F3F4F6]">
                              {data.accuracy}%
                            </span>
                          </div>
                          <span className="text-[10px] text-[#9CA3AF]">{data.week}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Subject & Difficulty Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                >
                  <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-5">Subject Breakdown</h3>

                  <div className="space-y-4">
                    {subjectData.map((subject) => (
                      <div key={subject.subject}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] text-[#D1D5DB]">{subject.subject}</span>
                          <span className="text-[13px] font-semibold text-[#F3F4F6]">{subject.accuracy}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${subject.accuracy}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Difficulty Analysis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                >
                  <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-5">Difficulty Analysis</h3>

                  <div className="space-y-4">
                    {difficultyData.map((diff) => (
                      <div key={diff.level}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] text-[#D1D5DB]">{diff.level}</span>
                          <span className="text-[13px] font-semibold text-[#F3F4F6]">{diff.accuracy}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${diff.accuracy}%` }}
                            transition={{ duration: 0.8, delay: 0.25 }}
                            className={`h-full rounded-full ${diff.level === 'Easy' ? 'bg-[#10B981]' :
                              diff.level === 'Medium' ? 'bg-[#F59E0B]' :
                                'bg-[#EF4444]'
                              }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Mode Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-5">Mode Analysis</h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {modeData.map((mode) => (
                    <div key={mode.mode} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[11px] text-[#9CA3AF] mb-2">{mode.mode}</p>
                      <p className="text-[20px] font-bold text-[#6366F1] mb-1">{mode.value}%</p>
                      <p className="text-[10px] text-[#9CA3AF]">{mode.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Insights Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={18} className="text-[#FBBF24]" />
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">AI Insights</h3>
                </div>

                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mt-2 flex-shrink-0" />
                      <p className="text-[12px] text-[#D1D5DB]">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
}