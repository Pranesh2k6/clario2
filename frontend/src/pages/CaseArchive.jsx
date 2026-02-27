import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, FolderOpen, Info } from 'lucide-react';
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

// Generate 10 case file placeholders
const caseFiles = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  title: [
    'The Projectile Trajectory Mystery',
    'Maximum Height Investigation',
    'Range Calculation Challenge',
    'Optimal Launch Angle Case',
    'Time of Flight Analysis',
    'Velocity Components Study',
    'Angle of Projection Puzzle',
    'Horizontal Distance Case',
    'Vertical Motion Inquiry',
    'Parabolic Path Investigation'
  ][i],
  difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
  xpReward: [30, 50, 75][Math.floor(Math.random() * 3)],
  description: 'A projectile is launched at an angle. Analyze the motion and solve for the unknowns.',
  status: i < 3 ? 'completed' : i < 6 ? 'in-progress' : 'new'
}));

export default function CaseArchive() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();

  const handleCaseClick = (caseId) => {
    navigate(`/planet/${subjectId}/chapter/${chapterId}/practice/case/${caseId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return { bg: 'bg-[#10B981]/10', text: 'text-[#10B981]', border: 'border-[#10B981]/30' };
      case 'Medium': return { bg: 'bg-[#F59E0B]/10', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]/30' };
      case 'Hard': return { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]', border: 'border-[#EF4444]/30' };
      default: return { bg: 'bg-white/5', text: 'text-[#9CA3AF]', border: 'border-white/10' };
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
              const isActive = false;
              const isImplemented = ['/dashboard', '/galaxy'].includes(item.path);

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
                <span className="text-[#F3F4F6]">Case Archive</span>
              </div>

              <h1 className="text-[28px] font-bold text-[#F3F4F6] mb-2">
                Case Investigation Database
              </h1>
              <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-3xl mb-4">
                Each case explores a real scenario from Motion in 2D.
              </p>

              {/* Adaptive Practice Note */}
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg">
                <Info size={14} className="text-[#6366F1]" />
                <span className="text-[13px] text-[#6366F1] font-medium">
                  Cases adapt to your level automatically
                </span>
              </div>
            </div>

            {/* Case Files Grid */}
            <div className="p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseFiles.map((caseFile, index) => {
                  const difficultyColors = getDifficultyColor(caseFile.difficulty);
                  
                  return (
                    <motion.button
                      key={caseFile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.02 }}
                      onClick={() => handleCaseClick(caseFile.id)}
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:border-[#6366F1]/40 transition-all duration-300 text-left"
                    >
                      {/* File Icon */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-[#6366F1]/20 rounded-lg group-hover:bg-[#6366F1]/30 transition-colors">
                          <FolderOpen size={20} className="text-[#6366F1]" />
                        </div>
                        {caseFile.status === 'completed' && (
                          <div className="px-2 py-1 bg-[#10B981]/20 rounded text-[10px] font-semibold text-[#10B981]">
                            SOLVED
                          </div>
                        )}
                      </div>

                      {/* Case Title */}
                      <h3 className="text-[15px] font-bold text-[#F3F4F6] mb-2 line-clamp-2 group-hover:text-[#A78BFA] transition-colors">
                        Case #{caseFile.id}: {caseFile.title}
                      </h3>

                      {/* Description */}
                      <p className="text-[12px] text-[#9CA3AF] mb-4 line-clamp-2">
                        {caseFile.description}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Difficulty */}
                        <div className={`px-2 py-1 ${difficultyColors.bg} border ${difficultyColors.border} rounded text-[11px] font-semibold ${difficultyColors.text}`}>
                          {caseFile.difficulty}
                        </div>

                        {/* XP Reward */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded">
                          <Zap size={10} className="text-[#FBBF24]" />
                          <span className="text-[11px] font-semibold text-[#FBBF24]">+{caseFile.xpReward} XP</span>
                        </div>
                      </div>

                      {/* Open Button (appears on hover) */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="px-3 py-1.5 bg-[#6366F1] rounded-lg text-[11px] font-semibold text-white">
                          Open Case
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}