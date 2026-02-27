import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowRight, Play, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    client.get('/users/me')
      .then(res => setProfile(res.data.user))
      .catch(() => { });
  }, []);

  const username = profile?.username || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Explorer';
  const xp = profile?.cached_total_xp ?? 0;

  const handleStartLearning = () => {
    navigate('/galaxy');
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
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
              const isActive = item.path === '/dashboard';
              const isImplemented = ['/dashboard', '/galaxy', '/duels'].includes(item.path);

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

          {/* Sign Out */}
          <div className="p-4 border-t border-white/8">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium text-[#9CA3AF] hover:bg-white/5 hover:text-[#F3F4F6] transition-all"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-white/8 bg-[rgba(12,8,36,0.5)] backdrop-blur-sm">
            {/* Greeting */}
            <h2 className="text-[18px] font-semibold text-[#F3F4F6]">
              Welcome back, {username}
            </h2>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* XP */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">{xp.toLocaleString()} XP</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Flame size={16} className="text-[#F97316]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">7 days</span>
              </div>

              {/* Profile Avatar */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] border-2 border-white/20 cursor-pointer hover:border-white/40 transition-all"
                />

                {/* Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-12 w-44 bg-[rgba(12,8,36,0.95)] backdrop-blur-xl border border-white/12 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-2 z-50">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#F87171] hover:bg-white/8 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            {/* Hero Launch Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative bg-gradient-to-br from-[rgba(124,58,237,0.15)] to-[rgba(99,102,241,0.1)] backdrop-blur-sm rounded-3xl border border-white/12 p-8 lg:p-12 overflow-hidden"
            >
              {/* Radial glow behind button area */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[120px] pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto text-center">
                <h1 className="text-[36px] lg:text-[42px] font-bold text-[#F3F4F6] tracking-[-0.02em] leading-[120%] mb-6">
                  Ready to Start Your Next Mission?
                </h1>

                <motion.button
                  onClick={handleStartLearning}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="
                    group relative inline-flex items-center justify-center gap-3
                    px-12 py-5 rounded-2xl
                    bg-[#7C3AED] text-white
                    text-[16px] font-semibold
                    shadow-[0_8px_32px_rgba(124,58,237,0.4)]
                    hover:shadow-[0_12px_48px_rgba(124,58,237,0.6)]
                    transition-all duration-300
                  "
                >
                  {/* Subtle inner highlight */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-2xl" />

                  <Play size={20} className="fill-white" />
                  <span>START LEARNING</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>

            {/* Dashboard Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Continue Last Case */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-1">
                      Continue
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Physics</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] flex items-center justify-center">
                    <span className="text-[18px]">⚛️</span>
                  </div>
                </div>
                <p className="text-[13px] text-[#D1D5DB] mb-4">Thermodynamics: Heat Transfer</p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[12px] text-[#9CA3AF] mb-2">
                    <span>Progress</span>
                    <span>68%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] w-[68%] rounded-full" />
                  </div>
                </div>

                <button className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[13px] font-semibold text-[#F3F4F6] transition-colors">
                  Resume
                </button>
              </motion.div>

              {/* Weakest Subject */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-1">
                      Needs Focus
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Chemistry</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                    <span className="text-[18px]">🧪</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-[24px] font-bold text-[#F3F4F6] mb-1">72%</div>
                  <p className="text-[13px] text-[#9CA3AF]">Current accuracy</p>
                </div>

                <p className="text-[12px] text-[#D1D5DB] mb-4">Practice more to improve your score</p>

                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] font-semibold text-[#F3F4F6] transition-colors">
                  Practice Now
                </button>
              </motion.div>

              {/* Next Study Plan */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium mb-1">
                      Up Next
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#F3F4F6]">Math</h3>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                    <span className="text-[18px]">📐</span>
                  </div>
                </div>

                <p className="text-[13px] text-[#D1D5DB] mb-4">Calculus: Derivatives</p>

                <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-4">
                  <Calendar size={14} />
                  <span>Scheduled for tomorrow</span>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF] mb-4">
                  <span>⏱️</span>
                  <span>Est. 25 min</span>
                </div>

                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[12px] font-semibold text-[#F3F4F6] transition-colors">
                  Quick Start
                </button>
              </motion.div>
            </div>

            {/* Dashboard Cards Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Graph */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <h3 className="text-[16px] font-semibold text-[#F3F4F6] mb-4">Weekly Progress</h3>

                {/* Simple bar chart visualization */}
                <div className="flex items-end justify-between gap-2 h-[120px]">
                  {[45, 62, 55, 78, 85, 72, 90].map((value, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-[#7C3AED] to-[#A78BFA] rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${value}%` }}
                      />
                      <span className="text-[10px] text-[#9CA3AF]">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Study Heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <h3 className="text-[16px] font-semibold text-[#F3F4F6] mb-4">Study Heatmap</h3>

                {/* Simple calendar heatmap */}
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(28)].map((_, i) => {
                    const intensity = Math.random();
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