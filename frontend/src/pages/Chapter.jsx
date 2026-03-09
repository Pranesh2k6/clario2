import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, BookOpen, Lightbulb, Target, Clock, TrendingUp } from 'lucide-react';
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
const chapterData = {
  'physics-1': {
    name: 'Kinematics',
    subject: 'Physics',
    subjectId: 'physics',
    progress: 100,
    accuracy: 92,
    weakTopics: ['Motion in 2D'],
    motivationalText: "You've mastered this chapter!",
  },
  'physics-2': {
    name: 'Dynamics',
    subject: 'Physics',
    subjectId: 'physics',
    progress: 100,
    accuracy: 88,
    weakTopics: ['Friction'],
    motivationalText: "Excellent progress!",
  },
  'physics-3': {
    name: 'Motion in 2D',
    subject: 'Physics',
    subjectId: 'physics',
    progress: 68,
    accuracy: 76,
    weakTopics: ['Range Calculation', 'Trajectory Analysis'],
    motivationalText: "You're halfway through this region",
  },
};

const modes = [
  {
    id: 'learn',
    title: 'Learn',
    description: 'Understand the concepts step by step',
    icon: BookOpen,
    color: '#8B5CF6',
    recommended: true,
    progress: 68,
  },
  {
    id: 'practice',
    title: 'Practice Cases',
    description: 'Solve investigation-style challenges',
    icon: Lightbulb,
    color: '#6366F1',
    recommended: false,
    xpReward: '+50 XP',
  },
  {
    id: 'quiz',
    title: 'Personalised Quiz',
    description: 'Adaptive questions tailored to your level',
    icon: Target,
    color: '#10B981',
    recommended: false,
    difficulty: 'Adaptive',
  },
  {
    id: 'mock',
    title: 'Mock Test',
    description: 'Test yourself under exam conditions',
    icon: Clock,
    color: '#F59E0B',
    recommended: false,
    timer: '45 min',
  },
];

export default function Chapter() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();

  const chapterKey = `${subjectId}-${chapterId}`;
  const chapter = chapterData[chapterKey] || chapterData['physics-3'];

  const handleModeClick = (modeId) => {
    if (modeId === 'learn') {
      navigate(`/planet/${subjectId}/chapter/${chapterId}/learn`);
    } else if (modeId === 'practice') {
      navigate(`/planet/${subjectId}/chapter/${chapterId}/practice`);
    } else if (modeId === 'quiz') {
      navigate(`/planet/${subjectId}/chapter/${chapterId}/quiz`);
    } else if (modeId === 'mock') {
      navigate(`/planet/${subjectId}/chapter/${chapterId}/mock-test`);
    } else {
      alert(`${modeId} mode coming soon! 🚀`);
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
              const isActive = false;
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner', '/tests', '/analytics', '/settings'].includes(item.path);

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
              onClick={() => navigate(`/planet/${chapter.subjectId}`)}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[14px] font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to {chapter.subject}</span>
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
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
              <button
                onClick={() => navigate('/galaxy')}
                className="hover:text-[#F3F4F6] transition-colors"
              >
                Galaxy
              </button>
              <ChevronRight size={14} />
              <button
                onClick={() => navigate(`/planet/${chapter.subjectId}`)}
                className="hover:text-[#F3F4F6] transition-colors"
              >
                {chapter.subject}
              </button>
              <ChevronRight size={14} />
              <span className="text-[#F3F4F6]">{chapter.name}</span>
            </div>

            {/* Chapter Status Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            >
              <div className="flex flex-wrap items-center gap-8">
                {/* Chapter Title */}
                <div className="flex-1 min-w-[200px]">
                  <h1 className="text-[24px] font-bold text-[#F3F4F6] mb-1">
                    {chapter.name}
                  </h1>
                  <p className="text-[13px] text-[#A78BFA] font-medium">
                    {chapter.motivationalText}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  {/* Progress */}
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-[#F3F4F6] mb-1">
                      {chapter.progress}%
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                      Progress
                    </div>
                  </div>

                  {/* Accuracy */}
                  <div className="text-center">
                    <div className="text-[24px] font-bold text-[#10B981] mb-1">
                      {chapter.accuracy}%
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                      Accuracy
                    </div>
                  </div>

                  {/* Weak Topics */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center mb-1">
                      <TrendingUp size={20} className="text-[#F59E0B]" />
                      <span className="text-[24px] font-bold text-[#F3F4F6]">
                        {chapter.weakTopics.length}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] uppercase tracking-wider">
                      Focus Areas
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mode Selection Heading */}
            <div>
              <h2 className="text-[20px] font-bold text-[#F3F4F6] mb-2">
                Choose Your Learning Mode
              </h2>
              <p className="text-[13px] text-[#9CA3AF]">
                Select how you want to explore this chapter
              </p>
            </div>

            {/* Mode Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modes.map((mode, index) => {
                const Icon = mode.icon;

                return (
                  <motion.button
                    key={mode.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => handleModeClick(mode.id)}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative group
                      bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border 
                      p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]
                      text-left transition-all duration-300
                      ${mode.recommended
                        ? 'border-[#7C3AED] shadow-[0_0_24px_rgba(124,58,237,0.3)]'
                        : 'border-white/12 hover:border-white/20'
                      }
                    `}
                  >
                    {/* Recommended Badge */}
                    {mode.recommended && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 bg-[#7C3AED] rounded-md text-[10px] font-semibold text-white uppercase tracking-wider">
                        Recommended
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="inline-flex p-4 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${mode.color}40, ${mode.color}20)`,
                      }}
                    >
                      <Icon
                        size={28}
                        style={{ color: mode.color }}
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-[20px] font-bold text-[#F3F4F6] mb-2">
                      {mode.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[13px] text-[#9CA3AF] mb-4 leading-relaxed">
                      {mode.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {mode.progress !== undefined && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[12px]">
                          <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                          <span className="text-[#D1D5DB] font-medium">{mode.progress}% complete</span>
                        </div>
                      )}
                      {mode.xpReward && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FBBF24]/10 rounded-lg text-[12px]">
                          <Zap size={12} className="text-[#FBBF24]" />
                          <span className="text-[#FBBF24] font-semibold">{mode.xpReward}</span>
                        </div>
                      )}
                      {mode.difficulty && (
                        <div className="px-3 py-1.5 bg-[#F59E0B]/10 rounded-lg text-[12px]">
                          <span className="text-[#F59E0B] font-medium">{mode.difficulty}</span>
                        </div>
                      )}
                      {mode.timer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[12px]">
                          <Clock size={12} className="text-[#9CA3AF]" />
                          <span className="text-[#D1D5DB] font-medium">{mode.timer}</span>
                        </div>
                      )}
                    </div>

                    {/* Hover Arrow */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <ChevronRight size={16} className="text-[#F3F4F6]" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}