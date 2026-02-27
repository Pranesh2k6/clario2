import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Zap } from 'lucide-react';
const clarioLogo = '';
import { SpiralGalaxy } from '../components/SpiralGalaxy';

// Subject galaxies with their properties
const galaxies = [
  {
    id: 'physics',
    name: 'Physics',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    emoji: '⚛️',
    completion: 68,
    position: { x: '25%', y: '35%' },
    size: 'large',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    emoji: '🧪',
    completion: 45,
    position: { x: '55%', y: '25%' },
    size: 'medium',
  },
  {
    id: 'math',
    name: 'Math',
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    emoji: '📐',
    completion: 82,
    position: { x: '75%', y: '55%' },
    size: 'medium',
  },
  {
    id: 'biology',
    name: 'Biology',
    color: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    emoji: '🧬',
    completion: 34,
    position: { x: '35%', y: '70%' },
    size: 'small',
  },
  {
    id: 'cs',
    name: 'Computer Science',
    color: '#F97316',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    emoji: '💻',
    completion: 56,
    position: { x: '65%', y: '45%' },
    size: 'small',
  },
];

export default function GalaxyMap() {
  const navigate = useNavigate();

  const handleGalaxyClick = (galaxyId) => {
    // Navigate to planet/subject page
    navigate(`/planet/${galaxyId}`);
  };

  const getSizeValue = (size) => {
    switch (size) {
      case 'large':
        return 160;
      case 'medium':
        return 128;
      case 'small':
        return 96;
      default:
        return 128;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Enhanced Space Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d3e] via-[#0D0A2E] to-[#020114]">
        {/* Denser star field */}
        <div className="absolute inset-0">
          {[...Array(300)].map((_, i) => {
            const isBright = i % 5 === 0;
            const size = isBright ? Math.random() * 2.5 + 1 : Math.random() * 1.5 + 0.5;
            
            return (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  opacity: isBright ? Math.random() * 0.4 + 0.6 : Math.random() * 0.3 + 0.2,
                }}
              />
            );
          })}
        </div>
        
        {/* Richer nebula effect with depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(124,58,237,0.12)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        
        {/* Darker edges for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(2,1,20,0.8)_100%)]" />
      </div>

      {/* Top Overlay Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 lg:px-8 py-5">
        {/* Left - Back Button */}
        <motion.button
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl border border-white/12 rounded-xl text-[14px] font-medium text-[#F3F4F6] hover:bg-[rgba(12,8,36,0.85)] transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </motion.button>

        {/* Right - XP and Profile */}
        <div className="flex items-center gap-4">
          {/* XP */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(12,8,36,0.7)] backdrop-blur-xl border border-white/12">
            <Zap size={16} className="text-[#FBBF24]" />
            <span className="text-[13px] font-semibold text-[#F3F4F6]">1,250 XP</span>
          </div>

          {/* Profile Avatar */}
          <ProfileDropdown />
        </div>
      </div>

      {/* Galaxy Display Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 h-[calc(100vh-80px)] w-full"
      >
        {/* Title overlay at top center */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-[32px] lg:text-[38px] font-bold text-[#F3F4F6] tracking-[-0.02em] mb-2">
            Choose Your Galaxy
          </h1>
          <p className="text-[14px] text-[#9CA3AF]">
            Select a subject to begin your exploration
          </p>
        </div>

        {/* Floating Galaxy Planets - Loose orbit cluster */}
        <div className="relative w-full h-full">
          {galaxies.map((galaxy, index) => {
            const sizeValue = getSizeValue(galaxy.size);
            
            return (
              <motion.div
                key={galaxy.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -15, 0],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: index * 0.1 },
                  scale: { duration: 0.6, delay: index * 0.1 },
                  y: {
                    duration: 4 + index * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                }}
                className="absolute"
                style={{
                  left: galaxy.position.x,
                  top: galaxy.position.y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <motion.button
                  onClick={() => handleGalaxyClick(galaxy.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  {/* Illustrated Planet */}
                  <SpiralGalaxy
                    size={sizeValue}
                    color={galaxy.color}
                    name={galaxy.name}
                    glowColor={galaxy.glowColor}
                    animate={true}
                  />

                  {/* Emoji overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ fontSize: galaxy.size === 'large' ? '40px' : galaxy.size === 'medium' ? '32px' : '24px' }}
                  >
                    {galaxy.emoji}
                  </div>

                  {/* Completion ring overlay */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="48%"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="48%"
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * (sizeValue * 0.48)} ${2 * Math.PI * (sizeValue * 0.48)}`}
                      strokeDashoffset={2 * Math.PI * (sizeValue * 0.48) * (1 - galaxy.completion / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>

                  {/* Label below planet */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-6 whitespace-nowrap">
                    <div className="text-[14px] font-semibold text-[#F3F4F6] mb-1">
                      {galaxy.name}
                    </div>
                    <div className="text-[12px] text-[#9CA3AF]">
                      {galaxy.completion}% Complete
                    </div>
                  </div>

                  {/* Rotating ring effect on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/0 group-hover:border-white/30"
                    style={{
                      transform: 'scale(1.15)',
                    }}
                    initial={false}
                    animate={{
                      rotate: 360,
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}