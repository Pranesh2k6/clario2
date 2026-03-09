import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { IllustratedPlanet } from '../components/IllustratedPlanet';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, Lock } from 'lucide-react';
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

// Mock data - would come from API
const subjectData = {
  physics: {
    name: 'Physics',
    emoji: '⚛️',
    color: '#3B82F6',
    completion: 68,
    chaptersCompleted: 7,
    totalChapters: 10,
    chapters: [
      { id: 1, name: 'Kinematics', completion: 100, casesSolved: 45, difficulty: 'Easy', status: 'completed' },
      { id: 2, name: 'Dynamics', completion: 100, casesSolved: 38, difficulty: 'Medium', status: 'completed' },
      { id: 3, name: 'Thermodynamics', completion: 68, casesSolved: 28, difficulty: 'Medium', status: 'recommended' },
      { id: 4, name: 'Electromagnetism', completion: 55, casesSolved: 22, difficulty: 'Hard', status: 'in-progress' },
      { id: 5, name: 'Optics', completion: 45, casesSolved: 18, difficulty: 'Medium', status: 'in-progress' },
      { id: 6, name: 'Modern Physics', completion: 0, casesSolved: 0, difficulty: 'Hard', status: 'locked' },
    ],
  },
  chemistry: {
    name: 'Chemistry',
    emoji: '🧪',
    color: '#10B981',
    completion: 45,
    chaptersCompleted: 4,
    totalChapters: 9,
    chapters: [
      { id: 1, name: 'Atomic Structure', completion: 100, casesSolved: 40, difficulty: 'Easy', status: 'completed' },
      { id: 2, name: 'Chemical Bonding', completion: 85, casesSolved: 34, difficulty: 'Medium', status: 'recommended' },
      { id: 3, name: 'Thermodynamics', completion: 60, casesSolved: 24, difficulty: 'Medium', status: 'in-progress' },
      { id: 4, name: 'Organic Chemistry', completion: 0, casesSolved: 0, difficulty: 'Hard', status: 'locked' },
    ],
  },
  math: {
    name: 'Math',
    emoji: '📐',
    color: '#8B5CF6',
    completion: 82,
    chaptersCompleted: 9,
    totalChapters: 11,
    chapters: [
      { id: 1, name: 'Algebra Basics', completion: 100, casesSolved: 50, difficulty: 'Easy', status: 'completed' },
      { id: 2, name: 'Calculus', completion: 90, casesSolved: 45, difficulty: 'Medium', status: 'recommended' },
      { id: 3, name: 'Trigonometry', completion: 75, casesSolved: 38, difficulty: 'Medium', status: 'in-progress' },
      { id: 4, name: 'Statistics', completion: 0, casesSolved: 0, difficulty: 'Medium', status: 'locked' },
    ],
  },
};

export default function Planet() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const subject = subjectData[subjectId || 'physics'] || subjectData['physics'];

  // Handle case where subject doesn't exist
  if (!subject) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        <SpaceBackground />
        <div className="relative z-10 text-center">
          <h1 className="text-[24px] font-bold text-[#F3F4F6] mb-4">Subject not found</h1>
          <button
            onClick={() => navigate('/galaxy')}
            className="px-6 py-3 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-colors"
          >
            Back to Galaxy Map
          </button>
        </div>
      </div>
    );
  }

  const chaptersLeft = subject.totalChapters - subject.chaptersCompleted;

  const handleChapterClick = (chapterId, status) => {
    if (status !== 'locked') {
      // Navigate to dedicated Chemical Bonding page
      if (subjectId === 'chemistry' && chapterId === 2) {
        navigate('/planet/chemistry/chapter/chemical-bonding');
      } else {
        navigate(`/planet/${subjectId}/chapter/${chapterId}`);
      }
    }
  };

  // Calculate orbital positions for chapters
  const getOrbitPosition = (index, total, radius) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
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
              onClick={() => navigate('/galaxy')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[14px] font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Galaxy</span>
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
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF] mb-8">
              <button
                onClick={() => navigate('/galaxy')}
                className="hover:text-[#F3F4F6] transition-colors"
              >
                Galaxy
              </button>
              <ChevronRight size={14} />
              <span className="text-[#F3F4F6]">{subject.name}</span>
            </div>

            {/* Subject Progress Panel - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)] mb-8"
            >
              <div className="flex items-center justify-between">
                {/* Left - Subject Info */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[24px]"
                    style={{
                      background: `linear-gradient(135deg, ${subject.color}40, ${subject.color}20)`,
                    }}
                  >
                    {subject.emoji}
                  </div>
                  <div>
                    <h1 className="text-[24px] font-bold text-[#F3F4F6]">
                      {subject.name}
                    </h1>
                    <p className="text-[13px] text-[#9CA3AF]">
                      {subject.chaptersCompleted} / {subject.totalChapters} chapters completed · {subject.completion}% complete
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Orbital System - Chapters as Planets */}
            <div className="relative flex items-center justify-center" style={{ minHeight: '600px' }}>
              {/* Center - Large Subject Planet */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { duration: 0.6 },
                  scale: { duration: 0.6 },
                  y: {
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="relative">
                  <IllustratedPlanet
                    size={180}
                    color={subject.color}
                    type={subjectId}
                    glowColor={`${subject.color}66`}
                    animate={true}
                  />
                  {/* Central label */}
                  <div className="absolute inset-0 flex items-center justify-center text-[48px] pointer-events-none">
                    {subject.emoji}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 whitespace-nowrap text-center">
                    <div className="text-[16px] font-bold text-[#F3F4F6]">
                      {subject.name}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Orbiting Chapter Planets */}
              {subject.chapters.map((chapter, index) => {
                const isLocked = chapter.status === 'locked';
                const isCompleted = chapter.status === 'completed';
                const isRecommended = chapter.status === 'recommended';

                // Two orbital rings: inner (first 3) and outer (rest)
                const isInnerOrbit = index < 3;
                const orbitRadius = isInnerOrbit ? 200 : 280;
                const adjustedIndex = isInnerOrbit ? index : index - 3;
                const totalInOrbit = isInnerOrbit ? 3 : subject.chapters.length - 3;

                const position = getOrbitPosition(adjustedIndex, totalInOrbit, orbitRadius);
                const chapterSize = 72;

                // Determine glow intensity
                const glowIntensity = isCompleted ? 0.6 : isRecommended ? 0.8 : 0.4;

                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: isLocked ? 0.4 : 1,
                      scale: 1,
                      y: [0, -10, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.5, delay: index * 0.1 },
                      scale: { duration: 0.5, delay: index * 0.1 },
                      y: {
                        duration: 3 + index * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    }}
                    className="absolute"
                    style={{
                      left: `calc(50% + ${position.x}px)`,
                      top: `calc(50% + ${position.y}px)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.button
                      onClick={() => handleChapterClick(chapter.id, chapter.status)}
                      disabled={isLocked}
                      whileHover={!isLocked ? { scale: 1.15 } : {}}
                      whileTap={!isLocked ? { scale: 0.95 } : {}}
                      className="relative group"
                    >
                      {/* Chapter Planet */}
                      <div className="relative">
                        <IllustratedPlanet
                          size={chapterSize}
                          color={isCompleted ? '#10B981' : isRecommended ? '#7C3AED' : subject.color}
                          type="chapter"
                          glowColor={isCompleted ? 'rgba(16, 185, 129, 0.6)' : isRecommended ? 'rgba(124, 58, 237, 0.8)' : `${subject.color}66`}
                          animate={!isLocked}
                        />

                        {/* Locked overlay */}
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm">
                            <Lock size={20} className="text-white/70" />
                          </div>
                        )}

                        {/* Completion ring */}
                        {!isLocked && (
                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                            <circle
                              cx="50%"
                              cy="50%"
                              r="48%"
                              fill="none"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="2"
                            />
                            <circle
                              cx="50%"
                              cy="50%"
                              r="48%"
                              fill="none"
                              stroke={isCompleted ? '#10B981' : 'rgba(255,255,255,0.7)'}
                              strokeWidth="2"
                              strokeDasharray={`${2 * Math.PI * (chapterSize * 0.48)} ${2 * Math.PI * (chapterSize * 0.48)}`}
                              strokeDashoffset={2 * Math.PI * (chapterSize * 0.48) * (1 - chapter.completion / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-500"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Chapter Label */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap text-center">
                        <div className={`text-[12px] font-semibold ${isLocked ? 'text-[#9CA3AF]' : 'text-[#F3F4F6]'}`}>
                          {chapter.name}
                        </div>
                        {!isLocked && (
                          <div className="text-[10px] text-[#9CA3AF]">
                            {chapter.completion}%
                          </div>
                        )}
                      </div>

                      {/* Recommended Badge */}
                      {isRecommended && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center text-[10px]">
                          ⭐
                        </div>
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}

              {/* Orbital ring guidelines (subtle) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Inner orbit ring */}
                  <div
                    className="absolute rounded-full border border-white/5"
                    style={{
                      width: '400px',
                      height: '400px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                  {/* Outer orbit ring */}
                  <div
                    className="absolute rounded-full border border-white/5"
                    style={{
                      width: '560px',
                      height: '560px',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}