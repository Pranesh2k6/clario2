import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowRight, Play, LogOut, Brain, TrendingUp, TrendingDown, Minus, Sparkles, Target, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { ProfileDropdown } from '../components/ProfileDropdown';
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

const SUBJECT_ICONS = {
  physics: '⚛️', chemistry: '🧪', math: '📐', mathematics: '📐',
  biology: '🧬', english: '📖', computer: '💻', default: '📚',
};

const SUBJECT_COLORS = {
  physics: ['#3B82F6', '#1E40AF'],
  chemistry: ['#10B981', '#059669'],
  math: ['#8B5CF6', '#6366F1'],
  mathematics: ['#8B5CF6', '#6366F1'],
  biology: ['#F59E0B', '#D97706'],
  default: ['#6366F1', '#4F46E5'],
};

function getSubjectIcon(name) {
  return SUBJECT_ICONS[(name || '').toLowerCase()] || SUBJECT_ICONS.default;
}

function getSubjectColors(name) {
  return SUBJECT_COLORS[(name || '').toLowerCase()] || SUBJECT_COLORS.default;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch profile
  useEffect(() => {
    client.get('/users/me')
      .then(res => setProfile(res.data.user))
      .catch(() => { });
  }, []);

  // Fetch ML analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [dashRes, insightsRes] = await Promise.all([
          client.get('/analytics/dashboard').catch(() => null),
          client.get('/analytics/insights?context=study_planner').catch(() => null),
        ]);

        if (dashRes?.data) setAnalytics(dashRes.data);
        if (insightsRes?.data?.insights) setInsights(insightsRes.data.insights);
      } catch (err) {
        console.warn('[Dashboard] Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const username = profile?.username || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Explorer';
  const xp = profile?.cached_total_xp ?? 0;

  // Derived ML data
  const overview = analytics?.overview || {};
  const weakTopics = analytics?.weak_topics || [];
  const strongTopics = analytics?.strong_topics || [];
  const recommendations = analytics?.recommendations || [];
  const dailyMetrics = analytics?.daily_metrics || [];

  // Learning velocity indicator
  const velocity = overview?.learning_velocity ?? 0;
  const VelocityIcon = velocity > 0 ? TrendingUp : velocity < 0 ? TrendingDown : Minus;
  const velocityColor = velocity > 0 ? '#10B981' : velocity < 0 ? '#EF4444' : '#9CA3AF';
  const velocityLabel = velocity > 0 ? 'Accelerating' : velocity < 0 ? 'Slowing' : 'Steady';

  const handleStartLearning = () => navigate('/galaxy');
  const handleSignOut = async () => { await logout(); navigate('/'); };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <SpaceBackground />
      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-[260px] bg-[rgba(8,5,24,0.85)] backdrop-blur-xl border-r border-white/8">
          <div className="py-3 px-6 border-b border-white/8">
            <img src={clarioLogo} alt="Clario" className="w-[160px] h-auto object-contain" />
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/dashboard';
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => isImplemented && navigate(item.path)}
                  disabled={!isImplemented}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 relative
                    ${isActive ? 'bg-white/8 text-[#F3F4F6]' : isImplemented ? 'text-[#9CA3AF] hover:bg-white/5 hover:text-[#D1D5DB] cursor-pointer' : 'text-[#9CA3AF]/40 cursor-not-allowed'}`}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#7C3AED] rounded-r-full shadow-[0_0_12px_rgba(124,58,237,0.6)]" />}
                  <Icon size={20} /><span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/8">
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-[#9CA3AF] hover:bg-white/5 hover:text-[#F3F4F6] transition-all">
              <LogOut size={20} /><span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="relative z-50 flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            <h2 className="text-[18px] font-semibold text-[#F3F4F6]">Welcome back, {username}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">{xp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Flame size={16} className="text-[#F97316]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">7 days</span>
              </div>
              <ProfileDropdown />
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="relative bg-gradient-to-br from-[rgba(124,58,237,0.15)] to-[rgba(99,102,241,0.1)] backdrop-blur-sm rounded-3xl border border-white/12 p-8 lg:p-12 overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[120px] pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto text-center">
                <h1 className="text-[36px] lg:text-[42px] font-bold text-[#F3F4F6] tracking-[-0.02em] leading-[120%] mb-6">
                  Ready to Start Your Next Mission?
                </h1>
                <motion.button
                  onClick={handleStartLearning}
                  whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center justify-center gap-3 px-12 py-5 rounded-2xl bg-[#7C3AED] text-white text-[16px] font-semibold shadow-[0_8px_32px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_48px_rgba(124,58,237,0.6)] transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-2xl" />
                  <Play size={20} className="fill-white" /><span>START LEARNING</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* ─── NLG Insights Card ─────────────────────────────────── */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                className="bg-gradient-to-br from-[rgba(124,58,237,0.12)] to-[rgba(16,185,129,0.08)] backdrop-blur-xl rounded-2xl border border-[#7C3AED]/30 p-6 shadow-[0_4px_24px_rgba(124,58,237,0.15)]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Intelligence Brief</h3>
                    <p className="text-[12px] text-[#9CA3AF]">Powered by ML Analysis</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8"
                    >
                      <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[#7C3AED] shadow-[0_0_6px_rgba(124,58,237,0.8)] flex-shrink-0" />
                      <p className="text-[13px] text-[#D1D5DB] leading-relaxed">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── Overview Stats ─────────────────────────────────── */}
            {!loading && overview.total_attempts > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Accuracy', value: `${Math.round((overview.overall_accuracy || 0) * 100)}%`, icon: Target, color: '#7C3AED' },
                  { label: 'Total Attempts', value: (overview.total_attempts || 0).toLocaleString(), icon: BookOpen, color: '#3B82F6' },
                  { label: 'Avg Response', value: `${Math.round((overview.average_response_time_ms || 0) / 1000)}s`, icon: Zap, color: '#FBBF24' },
                  { label: 'Learning Velocity', value: velocityLabel, icon: VelocityIcon, color: velocityColor },
                ].map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                      className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <StatIcon size={16} style={{ color: stat.color }} />
                        <span className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF]">{stat.label}</span>
                      </div>
                      <div className="text-[22px] font-bold text-[#F3F4F6]">{stat.value}</div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ─── Smart Cards Row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Top Weak Topic (BKT-driven) */}
              {weakTopics.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.06em] text-[#F87171] font-medium mb-1">Needs Focus</div>
                      <h3 className="text-[16px] font-semibold text-[#F3F4F6]">{weakTopics[0].subject || 'Topic'}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${getSubjectColors(weakTopics[0].subject)[0]}, ${getSubjectColors(weakTopics[0].subject)[1]})` }}>
                      <span className="text-[18px]">{getSubjectIcon(weakTopics[0].subject)}</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#D1D5DB] mb-3">{weakTopics[0].topic}</p>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[12px] text-[#9CA3AF] mb-2">
                      <span>BKT Mastery</span>
                      <span>{Math.round((weakTopics[0].mastery_probability || 0) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#EF4444] to-[#F87171] rounded-full transition-all"
                        style={{ width: `${Math.round((weakTopics[0].mastery_probability || 0) * 100)}%` }} />
                    </div>
                  </div>
                  <button onClick={() => navigate('/galaxy')} className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[13px] font-semibold text-[#F3F4F6] transition-colors">
                    Practice Now
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-1">Needs Focus</div>
                      <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Chemistry</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                      <span className="text-[18px]">🧪</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[24px] font-bold text-[#F3F4F6] mb-1">—</div>
                    <p className="text-[13px] text-[#9CA3AF]">Start practicing to see your mastery</p>
                  </div>
                  <button onClick={() => navigate('/galaxy')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] font-semibold text-[#F3F4F6] transition-colors">
                    Practice Now
                  </button>
                </motion.div>
              )}

              {/* Top Strong Topic (BKT-driven) */}
              {strongTopics.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.06em] text-[#10B981] font-medium mb-1">Strongest</div>
                      <h3 className="text-[16px] font-semibold text-[#F3F4F6]">{strongTopics[0].subject || 'Topic'}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${getSubjectColors(strongTopics[0].subject)[0]}, ${getSubjectColors(strongTopics[0].subject)[1]})` }}>
                      <span className="text-[18px]">{getSubjectIcon(strongTopics[0].subject)}</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#D1D5DB] mb-3">{strongTopics[0].topic}</p>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[12px] text-[#9CA3AF] mb-2">
                      <span>BKT Mastery</span>
                      <span>{Math.round((strongTopics[0].mastery_probability || 0) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] rounded-full transition-all"
                        style={{ width: `${Math.round((strongTopics[0].mastery_probability || 0) * 100)}%` }} />
                    </div>
                  </div>
                  <button onClick={() => navigate('/galaxy')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] font-semibold text-[#F3F4F6] transition-colors">
                    Keep Going
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-1">Continue</div>
                      <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Physics</h3>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center">
                      <span className="text-[18px]">⚛️</span>
                    </div>
                  </div>
                  <p className="text-[13px] text-[#D1D5DB] mb-4">Start learning to track your progress</p>
                  <button onClick={() => navigate('/galaxy')} className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[13px] font-semibold text-[#F3F4F6] transition-colors">
                    Resume
                  </button>
                </motion.div>
              )}

              {/* Next Recommendation (MAB-driven) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#A78BFA] font-medium mb-1">
                      {recommendations.length > 0 ? 'AI Suggests' : 'Up Next'}
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#F3F4F6]">
                      {recommendations.length > 0 ? recommendations[0].title : 'Math'}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-[13px] text-[#D1D5DB] mb-4">
                  {recommendations.length > 0
                    ? recommendations[0].description
                    : 'Calculus: Derivatives'}
                </p>
                {recommendations.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider
                      ${recommendations[0].priority === 1 ? 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30'
                        : recommendations[0].priority === 2 ? 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30'
                          : 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30'}`}>
                      {recommendations[0].priority === 1 ? 'High Priority' : recommendations[0].priority === 2 ? 'Medium' : 'Optional'}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] capitalize">{recommendations[0].recommendation_type || 'learn'}</span>
                  </div>
                )}
                <button
                  onClick={() => navigate('/planner')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] font-semibold text-[#F3F4F6] transition-colors"
                >
                  View Plan
                </button>
              </motion.div>
            </div>

            {/* ─── Charts Row ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Progress (from dailyMetrics if available) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <h3 className="text-[16px] font-semibold text-[#F3F4F6] mb-4">Weekly Progress</h3>
                <div className="flex items-end justify-between gap-2 h-[120px]">
                  {(dailyMetrics.length >= 7 ? dailyMetrics.slice(-7) : [
                    { accuracy: 0.45 }, { accuracy: 0.62 }, { accuracy: 0.55 },
                    { accuracy: 0.78 }, { accuracy: 0.85 }, { accuracy: 0.72 }, { accuracy: 0.9 },
                  ]).map((day, i) => {
                    const val = Math.round((day.accuracy || day.avg_accuracy || 0) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-[#7C3AED] to-[#A78BFA] rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${Math.max(val, 5)}%` }}
                        />
                        <span className="text-[10px] text-[#9CA3AF]">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Study Heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <h3 className="text-[16px] font-semibold text-[#F3F4F6] mb-4">Study Heatmap</h3>
                <div className="grid grid-cols-7 gap-2">
                  {(dailyMetrics.length >= 28 ? dailyMetrics.slice(-28) : [...Array(28)].map(() => ({
                    total_attempts: Math.floor(Math.random() * 30),
                  }))).map((day, i) => {
                    const attempts = day.total_attempts || 0;
                    const intensity = Math.min(attempts / 20, 1);
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-md transition-all hover:scale-110"
                        style={{
                          backgroundColor: intensity > 0.7
                            ? 'rgba(124,58,237,0.6)'
                            : intensity > 0.4
                              ? 'rgba(124,58,237,0.3)'
                              : 'rgba(255,255,255,0.05)'
                        }}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}