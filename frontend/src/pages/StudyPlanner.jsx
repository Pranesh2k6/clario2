import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import {
  LayoutDashboard,
  Map,
  FileText,
  Swords,
  Calendar,
  BarChart3,
  Settings,
  Target,
  Clock,
  TrendingUp,
  CheckCircle,
  Plus,
  Sparkles,
  ChevronRight,
  X,
  Flame,
  Loader2
} from 'lucide-react';
const clarioLogo = '';

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
const weekDays = [
  { day: 'Mon', date: 23, hours: 3, subjects: ['Physics', 'Chemistry'], completed: 2.5, isToday: false },
  { day: 'Tue', date: 24, hours: 4, subjects: ['Physics', 'Math'], completed: 4, isToday: false },
  { day: 'Wed', date: 25, hours: 3.5, subjects: ['Chemistry', 'Math'], completed: 2, isToday: true },
  { day: 'Thu', date: 26, hours: 4, subjects: ['Physics', 'Chemistry'], completed: 0, isToday: false },
  { day: 'Fri', date: 27, hours: 3, subjects: ['Math', 'Physics'], completed: 0, isToday: false },
  { day: 'Sat', date: 28, hours: 5, subjects: ['Physics', 'Chemistry', 'Math'], completed: 0, isToday: false },
  { day: 'Sun', date: 29, hours: 4, subjects: ['Chemistry', 'Math'], completed: 0, isToday: false },
];

const todayTasks = [
  {
    id: 1,
    subject: 'Physics',
    chapter: 'Motion in 2D',
    mode: 'Learn',
    time: 45,
    completed: false,
    icon: '🌌'
  },
  {
    id: 2,
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    mode: 'Practice',
    time: 30,
    completed: false,
    icon: '⚗️'
  },
  {
    id: 3,
    subject: 'Math',
    chapter: 'Integration',
    mode: 'Personalised Quiz',
    time: 60,
    completed: true,
    icon: '📐'
  },
];

// Generate month data with realistic heatmap
const generateMonthData = () => {
  return Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1;
    const studyHours = Math.floor(Math.random() * 6); // 0-5 hours
    const hasTask = studyHours > 0;
    return {
      day: dayNum,
      hours: studyHours,
      tasks: hasTask ? [
        { subject: 'Physics', chapter: 'Motion in 2D', mode: 'Learn', time: 45, completed: false },
        { subject: 'Chemistry', chapter: 'Chemical Bonding', mode: 'Practice', time: 30, completed: dayNum < 25 },
      ] : [],
    };
  });
};

export default function StudyPlanner() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('week');
  const [selectedDay, setSelectedDay] = useState(2); // Wednesday selected
  const [tasks, setTasks] = useState(todayTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartPlanModal, setShowSmartPlanModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Smart Plan Modal State
  const [weekdayHours, setWeekdayHours] = useState(3);
  const [weekendHours, setWeekendHours] = useState(5);
  const [focusMode, setFocusMode] = useState('balanced');
  const [timeframe, setTimeframe] = useState('1week');
  const [excludeDays, setExcludeDays] = useState(false);

  // Month View State
  const [monthData] = useState(generateMonthData());
  const [selectedMonthDay, setSelectedMonthDay] = useState(null);
  const [showDayPanel, setShowDayPanel] = useState(false);

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(path);
    if (isImplemented) {
      navigate(path);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleGeneratePlan = () => {
    setShowSmartPlanModal(false);
    setIsGeneratingPlan(true);

    // Simulate AI planning
    setTimeout(() => {
      setIsGeneratingPlan(false);
    }, 2500);
  };

  const handleMonthDayClick = (day) => {
    setSelectedMonthDay(day);
    setShowDayPanel(true);
  };

  const getHeatmapIntensity = (hours) => {
    if (hours === 0) return 'rgba(124, 58, 237, 0)';
    if (hours <= 2) return 'rgba(124, 58, 237, 0.2)';
    if (hours <= 3) return 'rgba(124, 58, 237, 0.4)';
    if (hours <= 4) return 'rgba(124, 58, 237, 0.6)';
    return 'rgba(124, 58, 237, 0.8)';
  };

  const completedHours = weekDays.reduce((sum, day) => sum + day.completed, 0);
  const plannedHours = weekDays.reduce((sum, day) => sum + day.hours, 0);
  const weeklyCompletion = Math.round((completedHours / plannedHours) * 100);

  const focusModes = [
    { id: 'balanced', label: 'Balanced', desc: 'Learn + Practice + Quiz' },
    { id: 'revision', label: 'Revision Focused', desc: 'Review and reinforce' },
    { id: 'exam', label: 'Exam Intensive', desc: 'Mock tests and drills' },
    { id: 'weak', label: 'Weak Areas Priority', desc: 'Target problem areas' },
  ];

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
              className="h-[64px] w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/planner';
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(item.path);

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
                  {/* Active indicator line */}
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
          <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            <h2 className="text-[18px] font-semibold text-[#F3F4F6]">
              Study Planner
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <Flame size={16} className="text-[#F97316]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">7 day streak</span>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 relative">
            {/* Loading Overlay */}
            <AnimatePresence>
              {isGeneratingPlan && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-[#6366F1] animate-spin" />
                    <p className="text-[14px] text-[#F3F4F6]">Optimizing your schedule…</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="max-w-[1800px] mx-auto space-y-6">
              {/* Strategic Overview Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">Study Mission Overview</h3>
                  <div className="px-3 py-1.5 bg-[#6366F1]/20 border border-[#6366F1]/40 rounded-lg">
                    <span className="text-[12px] font-semibold text-[#6366F1]">JEE Preparation</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Days Until Exam */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-[#9CA3AF] mb-1">Days Until Exam</p>
                    <p className="text-[24px] font-bold text-[#F3F4F6]">142</p>
                  </div>

                  {/* Weekly Completion */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-[#9CA3AF] mb-1">Weekly Completion</p>
                    <p className="text-[24px] font-bold text-[#10B981]">{weeklyCompletion}%</p>
                  </div>

                  {/* Study Streak */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-[#9CA3AF] mb-1">Study Streak</p>
                    <div className="flex items-center gap-2">
                      <Flame size={20} className="text-[#F97316]" />
                      <p className="text-[24px] font-bold text-[#F97316]">7</p>
                    </div>
                  </div>

                  {/* Chapters This Week */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-[#9CA3AF] mb-1">Chapters This Week</p>
                    <p className="text-[24px] font-bold text-[#6366F1]">5</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] text-[#9CA3AF]">Study Hours Progress</p>
                    <p className="text-[12px] font-semibold text-[#F3F4F6]">
                      {completedHours}h / {plannedHours}h
                    </p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyCompletion}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] rounded-full"
                    />
                  </div>
                </div>
              </motion.div>

              {/* View Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-lg">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`
                      px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                      ${viewMode === 'week'
                        ? 'bg-[#6366F1] text-white'
                        : 'text-[#9CA3AF] hover:text-[#D1D5DB]'
                      }
                    `}
                  >
                    Week View
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`
                      px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200
                      ${viewMode === 'month'
                        ? 'bg-[#6366F1] text-white'
                        : 'text-[#9CA3AF] hover:text-[#D1D5DB]'
                      }
                    `}
                  >
                    Month View
                  </button>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSmartPlanModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#6366F1]/20 border border-[#6366F1]/40 rounded-lg text-[13px] font-medium text-[#6366F1] hover:bg-[#6366F1]/30 transition-colors"
                  >
                    <Sparkles size={16} />
                    Generate Smart Plan
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] border border-[#10B981] rounded-lg text-[13px] font-medium text-white hover:bg-[#059669] transition-colors shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                  >
                    <Plus size={16} />
                    Add Task
                  </motion.button>
                </div>
              </motion.div>

              {/* Main Split Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                {/* LEFT - Planning Area */}
                <div className="space-y-6 relative">
                  {/* Week View */}
                  <AnimatePresence mode="wait">
                    {viewMode === 'week' && (
                      <motion.div
                        key="week"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* Weekly Timeline Strip */}
                        <div className="grid grid-cols-7 gap-3">
                          {weekDays.map((day, index) => {
                            const completionPercent = day.hours > 0 ? (day.completed / day.hours) * 100 : 0;
                            const isSelected = index === selectedDay;

                            return (
                              <motion.button
                                key={day.day}
                                onClick={() => setSelectedDay(index)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                  p-4 rounded-xl transition-all duration-200
                                  ${day.isToday
                                    ? 'bg-[#6366F1]/20 border-2 border-[#6366F1]'
                                    : isSelected
                                      ? 'bg-white/10 border-2 border-white/20'
                                      : 'bg-[rgba(12,8,36,0.7)] border-2 border-white/10 hover:border-white/20'
                                  }
                                `}
                              >
                                <div className="text-center mb-3">
                                  <p className="text-[11px] text-[#9CA3AF] mb-1">{day.day}</p>
                                  <p className="text-[20px] font-bold text-[#F3F4F6]">{day.date}</p>
                                </div>

                                {/* Completion Ring */}
                                <div className="relative w-12 h-12 mx-auto mb-3">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      fill="none"
                                      stroke="rgba(255,255,255,0.1)"
                                      strokeWidth="3"
                                    />
                                    <circle
                                      cx="24"
                                      cy="24"
                                      r="20"
                                      fill="none"
                                      stroke="#10B981"
                                      strokeWidth="3"
                                      strokeDasharray={`${2 * Math.PI * 20}`}
                                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercent / 100)}`}
                                      className="transition-all duration-500"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[11px] font-bold text-[#F3F4F6]">
                                      {day.completed}/{day.hours}h
                                    </span>
                                  </div>
                                </div>

                                {/* Subject Icons */}
                                <div className="flex justify-center gap-1">
                                  {day.subjects.slice(0, 3).map((subject, i) => (
                                    <div
                                      key={i}
                                      className="w-2 h-2 rounded-full bg-[#6366F1]"
                                      title={subject}
                                    />
                                  ))}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>

                        {/* Daily Task Panel */}
                        <motion.div
                          key={selectedDay}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-[15px] font-bold text-[#F3F4F6]">
                              {weekDays[selectedDay].day}, Feb {weekDays[selectedDay].date}
                            </h3>
                            <div className="px-3 py-1 bg-white/5 rounded-lg">
                              <span className="text-[12px] text-[#9CA3AF]">
                                {tasks.filter(t => t.completed).length}/{tasks.length} completed
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {tasks.map((task) => (
                              <motion.div
                                key={task.id}
                                layout
                                className={`
                                  p-4 rounded-xl border transition-all duration-200
                                  ${task.completed
                                    ? 'bg-[#10B981]/10 border-[#10B981]/30 opacity-70'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                  }
                                `}
                              >
                                <div className="flex items-start gap-4">
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => toggleTask(task.id)}
                                    className={`
                                      mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                                      ${task.completed
                                        ? 'bg-[#10B981] border-[#10B981]'
                                        : 'border-white/30 hover:border-[#10B981]'
                                      }
                                    `}
                                  >
                                    {task.completed && (
                                      <CheckCircle size={12} className="text-white" />
                                    )}
                                  </button>

                                  {/* Content */}
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-[14px]">{task.icon}</span>
                                          <span className="text-[13px] font-semibold text-[#F3F4F6]">
                                            {task.chapter}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-[#9CA3AF]">{task.subject}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[11px] font-medium text-[#6366F1] mb-1">{task.mode}</p>
                                        <div className="flex items-center gap-1 text-[#9CA3AF]">
                                          <Clock size={10} />
                                          <span className="text-[10px]">{task.time} min</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Month View */}
                    {viewMode === 'month' && (
                      <motion.div
                        key="month"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                      >
                        <h3 className="text-[15px] font-bold text-[#F3F4F6] mb-6">February 2026</h3>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2">
                          {/* Day headers */}
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                            <div key={day} className="text-center p-2">
                              <span className="text-[11px] text-[#9CA3AF] font-medium">{day}</span>
                            </div>
                          ))}

                          {/* Calendar days */}
                          {monthData.map((dayData) => {
                            const heatmapColor = getHeatmapIntensity(dayData.hours);
                            const hasTask = dayData.tasks.length > 0;

                            return (
                              <motion.button
                                key={dayData.day}
                                onClick={() => handleMonthDayClick(dayData.day)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="aspect-square p-3 rounded-lg border border-white/10 hover:border-white/20 transition-all relative group"
                                style={{
                                  backgroundColor: heatmapColor,
                                }}
                              >
                                <span className="text-[12px] font-medium text-[#F3F4F6]">{dayData.day}</span>

                                {/* Completion dot */}
                                {hasTask && (
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                                    <div className="w-1 h-1 rounded-full bg-[#10B981]" />
                                  </div>
                                )}

                                {/* Hover tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[rgba(12,8,36,0.95)] border border-white/20 rounded text-[10px] text-[#F3F4F6] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  {dayData.hours}h planned
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Slide-out Day Detail Panel for Month View */}
                  <AnimatePresence>
                    {showDayPanel && selectedMonthDay !== null && (
                      <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-0 right-0 w-[350px] h-full bg-[rgba(12,8,36,0.95)] backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-2xl"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-[15px] font-bold text-[#F3F4F6]">
                            February {selectedMonthDay}
                          </h3>
                          <button
                            onClick={() => setShowDayPanel(false)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <X size={16} className="text-[#9CA3AF]" />
                          </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="mb-5 p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-[#9CA3AF]">Planned Hours</span>
                            <span className="text-[13px] font-semibold text-[#6366F1]">
                              {monthData[selectedMonthDay - 1].hours}h
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#9CA3AF]">Completed</span>
                            <span className="text-[13px] font-semibold text-[#10B981]">0h</span>
                          </div>
                        </div>

                        {/* Tasks List */}
                        <div className="mb-4">
                          <h4 className="text-[12px] font-semibold text-[#9CA3AF] mb-3">Tasks</h4>
                          <div className="space-y-2">
                            {monthData[selectedMonthDay - 1].tasks.length > 0 ? (
                              monthData[selectedMonthDay - 1].tasks.map((task, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white/5 border border-white/10 rounded-lg"
                                >
                                  <p className="text-[12px] font-medium text-[#F3F4F6] mb-1">{task.chapter}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-[#9CA3AF]">{task.subject}</span>
                                    <span className="text-[10px] text-[#6366F1]">{task.mode}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-[#9CA3AF] text-center py-4">No tasks scheduled</p>
                            )}
                          </div>
                        </div>

                        {/* Add Task Button */}
                        <button
                          onClick={() => {
                            setShowDayPanel(false);
                            setShowAddModal(true);
                          }}
                          className="w-full py-2.5 bg-[#6366F1]/20 border border-[#6366F1]/40 rounded-lg text-[12px] font-medium text-[#6366F1] hover:bg-[#6366F1]/30 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={14} />
                          Add Task
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* RIGHT - Side Panel */}
                <div className="space-y-6">
                  {/* Upcoming Targets */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Target size={18} className="text-[#6366F1]" />
                      <h3 className="text-[14px] font-bold text-[#F3F4F6]">Upcoming Targets</h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] text-[#D1D5DB]">Finish Motion in 2D by Friday</p>
                          <span className="text-[11px] text-[#10B981] font-semibold">80%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-[80%] bg-[#10B981] rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] text-[#D1D5DB]">Complete 5 practice cases</p>
                          <span className="text-[11px] text-[#F59E0B] font-semibold">60%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-[60%] bg-[#F59E0B] rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[12px] text-[#D1D5DB]">75% medium difficulty accuracy</p>
                          <span className="text-[11px] text-[#EF4444] font-semibold">45%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full w-[45%] bg-[#EF4444] rounded-full" />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Suggested For You */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={18} className="text-[#FBBF24]" />
                      <h3 className="text-[14px] font-bold text-[#F3F4F6]">Suggested For You</h3>
                    </div>

                    <div className="space-y-2">
                      <button className="w-full p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors text-left group">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] text-[#D1D5DB] group-hover:text-[#F3F4F6]">
                            Review vector decomposition
                          </p>
                          <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#F3F4F6]" />
                        </div>
                      </button>

                      <button className="w-full p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors text-left group">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] text-[#D1D5DB] group-hover:text-[#F3F4F6]">
                            Attempt 3 medium quiz questions
                          </p>
                          <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#F3F4F6]" />
                        </div>
                      </button>

                      <button className="w-full p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors text-left group">
                        <div className="flex items-center justify-between">
                          <p className="text-[12px] text-[#D1D5DB] group-hover:text-[#F3F4F6]">
                            Revisit incorrect duel question
                          </p>
                          <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#F3F4F6]" />
                        </div>
                      </button>
                    </div>
                  </motion.div>

                  {/* Study Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={18} className="text-[#6366F1]" />
                      <h3 className="text-[14px] font-bold text-[#F3F4F6]">Study Stats</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                          <span className="text-[12px] text-[#9CA3AF]">Completed</span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#10B981]">{completedHours}h</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                          <span className="text-[12px] text-[#9CA3AF]">Remaining</span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#9CA3AF]">
                          {plannedHours - completedHours}h
                        </span>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-[#9CA3AF]">Tasks Completion</span>
                          <span className="text-[13px] font-semibold text-[#6366F1]">
                            {tasks.filter(t => t.completed).length}/{tasks.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Smart Plan Modal */}
      <AnimatePresence>
        {showSmartPlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSmartPlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-8 bg-[rgba(12,8,36,0.98)] backdrop-blur-xl rounded-2xl border border-white/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-[20px] font-bold text-[#F3F4F6] mb-2">Build Your Study Strategy</h3>
                  <p className="text-[13px] text-[#9CA3AF]">Let us create a plan tailored to your goals and performance.</p>
                </div>
                <button
                  onClick={() => setShowSmartPlanModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-[#9CA3AF]" />
                </button>
              </div>

              {/* Section A - Time Availability */}
              <div className="mb-6">
                <h4 className="text-[14px] font-semibold text-[#F3F4F6] mb-4">Time Availability</h4>

                <div className="space-y-4">
                  {/* Weekday Hours Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[12px] text-[#9CA3AF]">Study hours per weekday</label>
                      <span className="text-[13px] font-semibold text-[#6366F1]">{weekdayHours}h</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={weekdayHours}
                      onChange={(e) => setWeekdayHours(Number(e.target.value))}
                      className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6366F1] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Weekend Hours Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[12px] text-[#9CA3AF]">Study hours per weekend</label>
                      <span className="text-[13px] font-semibold text-[#6366F1]">{weekendHours}h</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={weekendHours}
                      onChange={(e) => setWeekendHours(Number(e.target.value))}
                      className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#6366F1] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>

                  {/* Exclude Days Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setExcludeDays(!excludeDays)}
                      className={`
                        w-10 h-6 rounded-full transition-colors relative
                        ${excludeDays ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: excludeDays ? 18 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                    <span className="text-[12px] text-[#9CA3AF]">Exclude specific days</span>
                  </div>
                </div>
              </div>

              {/* Section B - Focus Mode */}
              <div className="mb-6">
                <h4 className="text-[14px] font-semibold text-[#F3F4F6] mb-4">Focus Mode</h4>

                <div className="grid grid-cols-2 gap-3">
                  {focusModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFocusMode(mode.id)}
                      className={`
                        p-4 rounded-xl border-2 text-left transition-all
                        ${focusMode === mode.id
                          ? 'bg-[#6366F1]/10 border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      <p className="text-[13px] font-semibold text-[#F3F4F6] mb-1">{mode.label}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section C - Timeframe */}
              <div className="mb-8">
                <h4 className="text-[14px] font-semibold text-[#F3F4F6] mb-4">Timeframe</h4>

                <div className="flex gap-3">
                  {['1week', '2weeks', 'exam'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`
                        flex-1 py-3 rounded-lg text-[13px] font-medium transition-all
                        ${timeframe === tf
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-white/5 text-[#9CA3AF] border border-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      {tf === '1week' ? '1 Week' : tf === '2weeks' ? '2 Weeks' : 'Until Exam'}
                    </button>
                  ))}
                </div>

                {timeframe === 'exam' && (
                  <div className="mt-3 px-3 py-2 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg">
                    <p className="text-[11px] text-[#6366F1]">JEE Mains: May 20, 2026 (142 days)</p>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSmartPlanModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-[#9CA3AF] hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGeneratePlan}
                  className="flex-1 px-4 py-3 bg-[#6366F1] rounded-lg text-[13px] font-medium text-white hover:bg-[#5558E3] transition-colors shadow-[0_4px_16px_rgba(99,102,241,0.4)]"
                >
                  Generate My Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 bg-[rgba(12,8,36,0.95)] backdrop-blur-xl rounded-2xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[16px] font-bold text-[#F3F4F6]">Add New Task</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-[#9CA3AF]" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Subject Dropdown */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Subject</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]">
                    <option>Physics</option>
                    <option>Chemistry</option>
                    <option>Math</option>
                  </select>
                </div>

                {/* Chapter Dropdown */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Chapter</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]">
                    <option>Motion in 2D</option>
                    <option>Circular Motion</option>
                    <option>Work & Energy</option>
                  </select>
                </div>

                {/* Mode Selector */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="px-3 py-2 bg-[#6366F1]/20 border border-[#6366F1] rounded-lg text-[12px] text-[#6366F1] font-medium">
                      Learn
                    </button>
                    <button className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] text-[#9CA3AF] hover:border-white/20">
                      Practice
                    </button>
                    <button className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] text-[#9CA3AF] hover:border-white/20">
                      Quiz
                    </button>
                  </div>
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Estimated Time (min)</label>
                  <input
                    type="number"
                    placeholder="45"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] font-medium text-[#9CA3AF] hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-[#10B981] rounded-lg text-[13px] font-medium text-white hover:bg-[#059669] transition-colors"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
