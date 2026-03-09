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
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Edit,
  ChevronRight,
  LogOut
} from 'lucide-react';
const clarioLogo = '/clario-logo.png';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Map, label: 'Galaxy Map', path: '/galaxy' },
  { icon: FileText, label: 'Mock Tests', path: '/tests' },
  { icon: Swords, label: 'Duels', path: '/duels' },
  { icon: Calendar, label: 'Study Planner', path: '/planner' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

export default function Settings() {
  const navigate = useNavigate();
  const [dailyReminder, setDailyReminder] = useState(true);
  const [duelNotifications, setDuelNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);

  const handleNavigation = (path) => {
    const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(path);
    if (isImplemented) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    // Logout logic would go here
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
              const isActive = item.path === '/settings';
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
              Settings
            </h2>
            <p className="text-[13px] text-[#9CA3AF]">
              Manage your profile and learning preferences.
            </p>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-[800px] mx-auto space-y-6">
              {/* Profile Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-5">
                  <User size={18} className="text-[#6366F1]" />
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">Profile</h3>
                </div>

                <div className="flex items-start gap-6">
                  {/* Profile Picture */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6366F1] flex items-center justify-center flex-shrink-0">
                    <span className="text-[24px] font-bold text-white">AK</span>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">Name</p>
                        <p className="text-[14px] font-medium text-[#F3F4F6]">Arjun Kumar</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">Email</p>
                        <p className="text-[14px] font-medium text-[#F3F4F6]">arjun.kumar@email.com</p>
                      </div>

                      <div>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">Exam Preparation</p>
                        <p className="text-[14px] font-medium text-[#F3F4F6]">JEE Main 2026</p>
                      </div>
                    </div>

                    <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] font-medium text-[#9CA3AF] hover:border-white/20 transition-colors">
                      <Edit size={14} />
                      Edit Profile
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Study Preferences */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-5">
                  <SettingsIcon size={18} className="text-[#6366F1]" />
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">Study Preferences</h3>
                </div>

                <div className="space-y-4">
                  {/* Default Focus Mode */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Focus Mode Preference</p>
                        <p className="text-[11px] text-[#9CA3AF]">Balanced (Learn + Practice + Quiz)</p>
                      </div>
                      <ChevronRight size={16} className="text-[#9CA3AF]" />
                    </div>
                  </div>

                  {/* Preferred Study Hours */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Preferred Study Hours</p>
                        <p className="text-[11px] text-[#9CA3AF]">2 hours per day</p>
                      </div>
                      <ChevronRight size={16} className="text-[#9CA3AF]" />
                    </div>
                  </div>

                  {/* Daily Reminder */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Daily Study Reminder</p>
                      <p className="text-[11px] text-[#9CA3AF]">Get notified to maintain your streak</p>
                    </div>
                    <button
                      onClick={() => setDailyReminder(!dailyReminder)}
                      className={`
                        w-12 h-7 rounded-full transition-colors relative
                        ${dailyReminder ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: dailyReminder ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Bell size={18} className="text-[#6366F1]" />
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">Notifications</h3>
                </div>

                <div className="space-y-4">
                  {/* Study Reminders */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Study Reminders</p>
                      <p className="text-[11px] text-[#9CA3AF]">Get reminded to study daily</p>
                    </div>
                    <button
                      onClick={() => setStudyReminders(!studyReminders)}
                      className={`
                        w-12 h-7 rounded-full transition-colors relative
                        ${studyReminders ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: studyReminders ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* Duel Challenge Notifications */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Duel Challenge Notifications</p>
                      <p className="text-[11px] text-[#9CA3AF]">Get notified when challenged</p>
                    </div>
                    <button
                      onClick={() => setDuelNotifications(!duelNotifications)}
                      className={`
                        w-12 h-7 rounded-full transition-colors relative
                        ${duelNotifications ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: duelNotifications ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  {/* Weekly Performance Reports */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Weekly Performance Reports</p>
                      <p className="text-[11px] text-[#9CA3AF]">Receive weekly analytics summary</p>
                    </div>
                    <button
                      onClick={() => setWeeklyReports(!weeklyReports)}
                      className={`
                        w-12 h-7 rounded-full transition-colors relative
                        ${weeklyReports ? 'bg-[#6366F1]' : 'bg-white/10'}
                      `}
                    >
                      <motion.div
                        animate={{ x: weeklyReports ? 22 : 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Account Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="p-6 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Shield size={18} className="text-[#6366F1]" />
                  <h3 className="text-[16px] font-bold text-[#F3F4F6]">Account Settings</h3>
                </div>

                <div className="space-y-3">
                  <button className="w-full p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-[#F3F4F6] mb-1">Change Password</p>
                        <p className="text-[11px] text-[#9CA3AF]">Update your account password</p>
                      </div>
                      <ChevronRight size={16} className="text-[#9CA3AF]" />
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-[#F3F4F6] mb-1 flex items-center gap-2">
                          <LogOut size={14} />
                          Log Out
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">Sign out of your account</p>
                      </div>
                      <ChevronRight size={16} className="text-[#9CA3AF]" />
                    </div>
                  </button>

                  <button className="w-full p-4 bg-[#EF4444]/10 rounded-lg border border-[#EF4444]/30 hover:border-[#EF4444]/50 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-medium text-[#EF4444] mb-1">Delete Account</p>
                        <p className="text-[11px] text-[#9CA3AF]">Permanently delete your account</p>
                      </div>
                      <ChevronRight size={16} className="text-[#EF4444]" />
                    </div>
                  </button>
                </div>
              </motion.div>

              {/* Version Info */}
              <div className="text-center py-4">
                <p className="text-[11px] text-[#9CA3AF]">Clario v1.0.0</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
