import { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  X,
  Flame,
  Loader2
} from 'lucide-react';
import {
  getPlannerSummary, getTasksByDate, createTask,
  toggleTaskCompletion, getSuggestions, generateSmartPlan,
} from '../api/planner';
import { getDashboardAnalytics, getRecommendations, completeRecommendation } from '../api/analytics';

const clarioLogo = '/clario-logo.png';
const SUBJECT_ICONS = { Physics: '🌌', Chemistry: '⚗️', Math: '📐' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

// ── Date helpers (accept a reference date) ────────────────────────────────────
function getWeekDatesFor(ref) {
  const d = new Date(ref);
  const dayOfWeek = d.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(dd);
  }
  return dates;
}

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthRangeFor(ref) {
  const d = new Date(ref);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const firstDayOfWeek = start.getDay(); // 0=Sun
  return {
    start: fmt(start), end: fmt(end),
    daysInMonth: end.getDate(),
    monthName: MONTH_NAMES[start.getMonth()],
    year: start.getFullYear(),
    startOffset: firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1, // Mon-based offset
  };
}

export default function StudyPlanner() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('week');
  const [tasks, setTasks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartPlanModal, setShowSmartPlanModal] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Shared reference date — drives both week and month views
  const [refDate, setRefDate] = useState(new Date());

  // Data from backend
  const [summary, setSummary] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Week view (computed from refDate)
  const weekDates = getWeekDatesFor(refDate);
  const todayStr = fmt(new Date());
  const todayIdx = weekDates.findIndex(d => fmt(d) === todayStr);
  const [selectedDay, setSelectedDay] = useState(todayIdx >= 0 ? todayIdx : 0);

  // Smart Plan Modal State
  const [weekdayHours, setWeekdayHours] = useState(3);
  const [weekendHours, setWeekendHours] = useState(5);
  const [focusMode, setFocusMode] = useState('balanced');
  const [timeframe, setTimeframe] = useState('1week');
  const [excludeDays, setExcludeDays] = useState(false);

  // Month View State
  const [monthData, setMonthData] = useState([]);
  const [selectedMonthDay, setSelectedMonthDay] = useState(null);
  const [showDayPanel, setShowDayPanel] = useState(false);
  const [monthDayTasks, setMonthDayTasks] = useState([]);

  // Add Task modal state
  const [newSubject, setNewSubject] = useState('Physics');
  const [newChapter, setNewChapter] = useState('');
  const [newMode, setNewMode] = useState('Learn');
  const [newTime, setNewTime] = useState(45);
  const [newDate, setNewDate] = useState(fmt(new Date()));

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goToPrev = () => {
    const d = new Date(refDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setRefDate(d);
    setSelectedDay(0);
  };
  const goToNext = () => {
    const d = new Date(refDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setRefDate(d);
    setSelectedDay(0);
  };
  const goToToday = () => {
    setRefDate(new Date());
    const wk = getWeekDatesFor(new Date());
    const idx = wk.findIndex(d => fmt(d) === fmt(new Date()));
    setSelectedDay(idx >= 0 ? idx : 0);
  };

  // Week/month label for the navigation bar
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const monthRange = getMonthRangeFor(refDate);
  const monthLabel = `${monthRange.monthName} ${monthRange.year}`;

  // ── Fetch summary (re-run when refDate changes) ─────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const mr = getMonthRangeFor(refDate);
      // Fetch a wide range so week view also has data even if week spans 2 months
      const wk = getWeekDatesFor(refDate);
      const rangeStart = fmt(wk[0]) < mr.start ? fmt(wk[0]) : mr.start;
      const rangeEnd = fmt(wk[6]) > mr.end ? fmt(wk[6]) : mr.end;

      const res = await getPlannerSummary(rangeStart, rangeEnd);
      setSummary(res.data);

      // Build month grid from dailyAggregates
      const aggregateMap = {};
      (res.data.dailyAggregates || []).forEach(a => {
        const key = a.date; // YYYY-MM-DD
        aggregateMap[key] = a;
      });
      const grid = Array.from({ length: mr.daysInMonth }, (_, i) => {
        const dayNum = i + 1;
        const dateStr = fmt(new Date(new Date(mr.start).getFullYear(), new Date(mr.start).getMonth(), dayNum));
        const agg = aggregateMap[dateStr];
        return {
          day: dayNum,
          hours: agg ? agg.plannedHours : 0,
          completedHours: agg ? agg.completedHours : 0,
          subjects: agg ? agg.subjects : [],
          totalTasks: agg ? agg.totalTasks : 0,
        };
      });
      setMonthData(grid);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, [refDate]);

  // ── Fetch tasks for selected day ────────────────────────────────────────────
  const fetchTasks = useCallback(async (dateStr) => {
    try {
      const res = await getTasksByDate(dateStr);
      setTasks((res.data.tasks || []).map(t => ({
        ...t,
        icon: SUBJECT_ICONS[t.subject] || '📚',
        time: t.estimated_minutes,
        completed: t.is_completed,
      })));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setTasks([]);
    }
  }, []);

  // ── Fetch suggestions ───────────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await getSuggestions();
      setSuggestions(res.data.suggestions || []);
    } catch { setSuggestions([]); }
  }, []);

  // ── Fetch analytics data ──────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    try {
      const [dashRes, recsRes] = await Promise.allSettled([
        getDashboardAnalytics(),
        getRecommendations(),
      ]);
      if (dashRes.status === 'fulfilled') setAnalyticsData(dashRes.value.data || null);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  // ── Initial load + refetch on refDate change ────────────────────────────────
  useEffect(() => { fetchSummary(); fetchSuggestions(); fetchAnalytics(); }, [fetchSummary, fetchSuggestions, fetchAnalytics]);

  // ── Refetch tasks when selected day or weekDates change ─────────────────────
  useEffect(() => {
    if (weekDates[selectedDay]) {
      fetchTasks(fmt(weekDates[selectedDay]));
    }
  }, [selectedDay, refDate]);

  // ── Build weekDays from summary data ────────────────────────────────────────
  const weekDays = weekDates.map((d) => {
    const dateStr = fmt(d);
    const agg = (summary?.dailyAggregates || []).find(a => a.date === dateStr);
    return {
      day: DAY_NAMES[d.getDay()],
      date: d.getDate(),
      dateStr,
      hours: agg ? agg.plannedHours : 0,
      completed: agg ? agg.completedHours : 0,
      subjects: agg ? agg.subjects : [],
      isToday: dateStr === todayStr,
    };
  });

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(path);
    if (isImplemented) navigate(path);
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    try {
      await toggleTaskCompletion(taskId, !task.completed);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed, is_completed: !t.completed } : t));
      fetchSummary(); // refresh metrics
    } catch (err) { console.error('Toggle failed:', err); }
  };

  const handleGeneratePlan = async () => {
    setShowSmartPlanModal(false);
    setIsGeneratingPlan(true);
    try {
      await generateSmartPlan({ weekday_hours: weekdayHours, weekend_hours: weekendHours, focus_mode: focusMode, timeframe });
      await fetchSummary();
      await fetchTasks(fmt(weekDates[selectedDay]));
    } catch (err) { console.error('Generate plan failed:', err); }
    setIsGeneratingPlan(false);
  };

  const handleAddTask = async () => {
    if (!newChapter.trim()) return;
    try {
      await createTask({ subject: newSubject, chapter: newChapter, mode: newMode, estimated_minutes: newTime, scheduled_date: newDate });
      setShowAddModal(false);
      setNewChapter('');
      fetchSummary();
      fetchTasks(fmt(weekDates[selectedDay]));
    } catch (err) { console.error('Add task failed:', err); }
  };

  const handleMonthDayClick = async (day) => {
    setSelectedMonthDay(day);
    setShowDayPanel(true);
    try {
      const mr = getMonthRangeFor(refDate);
      const d = new Date(mr.start);
      d.setDate(day);
      const res = await getTasksByDate(fmt(d));
      setMonthDayTasks(res.data.tasks || []);
    } catch { setMonthDayTasks([]); }
  };

  const getHeatmapIntensity = (hours) => {
    if (hours === 0) return 'rgba(124, 58, 237, 0)';
    if (hours <= 2) return 'rgba(124, 58, 237, 0.2)';
    if (hours <= 3) return 'rgba(124, 58, 237, 0.4)';
    if (hours <= 4) return 'rgba(124, 58, 237, 0.6)';
    return 'rgba(124, 58, 237, 0.8)';
  };

  const completedHours = summary?.completedHours ?? 0;
  const plannedHours = summary?.plannedHours ?? 0;
  const weeklyCompletion = summary?.weeklyCompletion ?? 0;

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
          <div className="w-[259px] h-[78.5px] border-b border-white/8 flex items-center justify-center">
            <img
              src={clarioLogo}
              alt="Clario"
              className="w-[160px] h-[57.6px] object-cover"
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
                <span className="text-[13px] font-semibold text-[#F3F4F6]">{summary?.streak ?? 0} day streak</span>
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
                    <p className="text-[14px] text-[#F3F4F6]">Analyzing your intelligence profile…</p>
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
                    <p className="text-[24px] font-bold text-[#F3F4F6]">{summary?.daysUntilExam ?? '—'}</p>
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
                      <p className="text-[24px] font-bold text-[#F97316]">{summary?.streak ?? 0}</p>
                    </div>
                  </div>

                  {/* Chapters This Week */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-[#9CA3AF] mb-1">Chapters This Week</p>
                    <p className="text-[24px] font-bold text-[#6366F1]">{summary?.chaptersThisWeek ?? 0}</p>
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

              {/* View Toggle + Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between flex-wrap gap-3"
              >
                {/* Left: view mode toggle */}
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

                {/* Center: date navigation arrows + label */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={goToPrev}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft size={16} className="text-[#D1D5DB]" />
                  </button>
                  <span className="text-[13px] font-semibold text-[#F3F4F6] min-w-[180px] text-center">
                    {viewMode === 'week' ? weekLabel : monthLabel}
                  </span>
                  <button
                    onClick={goToNext}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight size={16} className="text-[#D1D5DB]" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[12px] font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
                  >
                    Today
                  </button>
                </div>

                {/* Right: action buttons */}
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
                              {weekDays[selectedDay].day}, {weekDates[selectedDay].toLocaleDateString('en-US', { month: 'short' })} {weekDays[selectedDay].date}
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
                        <h3 className="text-[15px] font-bold text-[#F3F4F6] mb-6">{monthRange.monthName} {monthRange.year}</h3>

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
                            const hasTask = dayData.totalTasks > 0;

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
                            {monthRange.monthName} {selectedMonthDay}
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
                              {monthData[selectedMonthDay - 1]?.hours ?? 0}h
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#9CA3AF]">Completed</span>
                            <span className="text-[13px] font-semibold text-[#10B981]">{monthData[selectedMonthDay - 1]?.completedHours ?? 0}h</span>
                          </div>
                        </div>

                        {/* Tasks List */}
                        <div className="mb-4">
                          <h4 className="text-[12px] font-semibold text-[#9CA3AF] mb-3">Tasks</h4>
                          <div className="space-y-2">
                            {monthDayTasks.length > 0 ? (
                              monthDayTasks.map((task, i) => (
                                <div
                                  key={task.id || i}
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
                  {/* Upcoming Targets — DYNAMIC from analytics */}
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
                      {analyticsData?.weak_topics?.length > 0 ? (
                        analyticsData.weak_topics.slice(0, 3).map((topic, i) => {
                          const mastery = Math.round((topic.mastery_probability || 0) * 100);
                          const color = mastery < 30 ? '#EF4444' : mastery < 60 ? '#F59E0B' : '#10B981';
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[12px] text-[#D1D5DB]">
                                  Improve {topic.topic}{topic.subtopic ? ` — ${topic.subtopic}` : ''}
                                </p>
                                <span className="text-[11px] font-semibold" style={{ color }}>{mastery}%</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${mastery}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[12px] text-[#D1D5DB]">Complete more duels to unlock targets</p>
                              <span className="text-[11px] text-[#9CA3AF] font-semibold">—</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-0 bg-[#6366F1] rounded-full" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Suggested For You — ML-driven MAB Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={18} className="text-[#FBBF24]" />
                      <h3 className="text-[14px] font-bold text-[#F3F4F6]">AI Suggestions</h3>
                      <span className="ml-auto text-[10px] text-[#9CA3AF] bg-white/5 px-2 py-0.5 rounded-full">MAB Engine</span>
                    </div>

                    <div className="space-y-2">
                      {recommendations.length > 0 ? (
                        recommendations.slice(0, 5).map((rec, i) => {
                          const priorityConfig = {
                            1: { label: 'Critical', bg: 'bg-[#EF4444]/20', text: 'text-[#F87171]', border: 'border-[#EF4444]/30' },
                            2: { label: 'Focus', bg: 'bg-[#F59E0B]/20', text: 'text-[#FBBF24]', border: 'border-[#F59E0B]/30' },
                            3: { label: 'Optional', bg: 'bg-[#10B981]/20', text: 'text-[#34D399]', border: 'border-[#10B981]/30' },
                          };
                          const pCfg = priorityConfig[rec.priority] || priorityConfig[3];
                          const typeIcons = { learn: '📖', practice: '✏️', quiz: '🎯', revision: '🔄' };
                          const typeIcon = typeIcons[(rec.recommendation_type || '').toLowerCase()] || '📚';

                          return (
                            <button
                              key={rec.id || i}
                              onClick={async () => {
                                if (rec.id) {
                                  try {
                                    await completeRecommendation(rec.id);
                                    setRecommendations(prev => prev.filter(r => r.id !== rec.id));
                                  } catch (err) { console.error('Complete rec failed:', err); }
                                }
                                // Navigate based on recommendation type
                                const type = (rec.recommendation_type || '').toLowerCase();
                                if (type === 'learn') navigate('/galaxy');
                                else if (type === 'practice' || type === 'quiz') navigate('/galaxy');
                                else navigate('/galaxy');
                              }}
                              className={`w-full p-3 bg-white/5 rounded-xl hover:bg-white/8 transition-all text-left group ${rec.priority === 1 ? 'border border-[#EF4444]/20' : 'border border-white/10 hover:border-white/20'}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-[16px] mt-0.5">{typeIcon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[12px] font-semibold text-[#D1D5DB] group-hover:text-[#F3F4F6] truncate">
                                      {rec.title}
                                    </p>
                                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${pCfg.bg} ${pCfg.text} border ${pCfg.border}`}>
                                      {pCfg.label}
                                    </span>
                                  </div>
                                  {rec.description && (
                                    <p className="text-[10px] text-[#9CA3AF] leading-relaxed line-clamp-2">{rec.description}</p>
                                  )}
                                  <span className="inline-block mt-1.5 text-[9px] text-[#7C3AED] font-medium uppercase tracking-wider">
                                    {rec.recommendation_type || 'learn'} →
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : suggestions.length > 0 ? (
                        suggestions.map((s, i) => (
                          <button key={i} className="w-full p-3 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors text-left group">
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-[#D1D5DB] group-hover:text-[#F3F4F6]">
                                {s.text}
                              </p>
                              <ChevronRight size={14} className="text-[#9CA3AF] group-hover:text-[#F3F4F6]" />
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-[#9CA3AF] text-center py-3">Play duels to unlock AI suggestions</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Study Stats — DYNAMIC from analytics */}
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

                      {analyticsData && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                              <span className="text-[12px] text-[#9CA3AF]">ELO Rating</span>
                            </div>
                            <span className="text-[13px] font-semibold text-[#6366F1]">
                              {analyticsData.overview?.elo_rating ?? 1200}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                              <span className="text-[12px] text-[#9CA3AF]">Overall Accuracy</span>
                            </div>
                            <span className="text-[13px] font-semibold text-[#FBBF24]">
                              {Math.round((analyticsData.overview?.overall_accuracy ?? 0) * 100)}%
                            </span>
                          </div>
                        </>
                      )}

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
                  <select value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]">
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Math">Math</option>
                  </select>
                </div>

                {/* Chapter Dropdown */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Chapter</label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={e => setNewChapter(e.target.value)}
                    placeholder="e.g. Motion in 2D"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                {/* Mode Selector */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Learn', 'Practice', 'Quiz'].map(m => (
                      <button key={m} onClick={() => setNewMode(m)} className={`px-3 py-2 rounded-lg text-[12px] font-medium ${newMode === m ? 'bg-[#6366F1]/20 border border-[#6366F1] text-[#6366F1]' : 'bg-white/5 border border-white/10 text-[#9CA3AF] hover:border-white/20'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Estimated Time (min)</label>
                  <input
                    type="number"
                    value={newTime}
                    onChange={e => setNewTime(parseInt(e.target.value) || 0)}
                    placeholder="45"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-[13px] text-[#F3F4F6] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-[12px] text-[#9CA3AF] mb-2">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
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
                    onClick={handleAddTask}
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
