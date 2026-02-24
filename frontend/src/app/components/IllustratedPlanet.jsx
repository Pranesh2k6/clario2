import { motion } from 'motion/react';

/**
 * IllustratedPlanet - Creates a soft illustrated planet with texture and glow
 * Follows the design system's celestial illustration style
 */
export function IllustratedPlanet({ 
  size, 
  color, 
  type, 
  glowColor, 
  animate = true,
  className = '' 
}) {
  
  // Generate texture patterns based on subject type
  const getTexture = () => {
    switch (type) {
      case 'physics':
        return (
          <>
            {/* Electric streak texture */}
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%" className="absolute inset-0">
                <path
                  d={`M ${size * 0.2} ${size * 0.3} Q ${size * 0.5} ${size * 0.4}, ${size * 0.7} ${size * 0.6}`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d={`M ${size * 0.3} ${size * 0.5} Q ${size * 0.6} ${size * 0.5}, ${size * 0.8} ${size * 0.4}`}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </div>
          </>
        );
      case 'chemistry':
        return (
          <>
            {/* Swirl pattern */}
            <div className="absolute inset-0 opacity-25">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-white/30"
                  style={{
                    width: `${size * (0.3 + i * 0.2)}px`,
                    height: `${size * (0.3 + i * 0.2)}px`,
                    top: `${20 + i * 10}%`,
                    left: `${15 + i * 15}%`,
                  }}
                />
              ))}
            </div>
          </>
        );
      case 'math':
        return (
          <>
            {/* Geometric pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <circle cx="30%" cy="40%" r="8" fill="rgba(255,255,255,0.3)" />
                <circle cx="60%" cy="35%" r="6" fill="rgba(255,255,255,0.3)" />
                <circle cx="45%" cy="65%" r="7" fill="rgba(255,255,255,0.3)" />
                <line x1="30%" y1="40%" x2="60%" y2="35%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <line x1="60%" y1="35%" x2="45%" y2="65%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </svg>
            </div>
          </>
        );
      case 'biology':
        return (
          <>
            {/* Organic surface texture */}
            <div className="absolute inset-0 opacity-25">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20"
                  style={{
                    width: `${size * (0.08 + Math.random() * 0.1)}px`,
                    height: `${size * (0.08 + Math.random() * 0.1)}px`,
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                  }}
                />
              ))}
            </div>
          </>
        );
      case 'cs':
        return (
          <>
            {/* Tech grid dots */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                {[...Array(16)].map((_, i) => (
                  <circle
                    key={i}
                    cx={`${25 + (i % 4) * 16}%`}
                    cy={`${30 + Math.floor(i / 4) * 15}%`}
                    r="2"
                    fill="rgba(255,255,255,0.4)"
                  />
                ))}
              </svg>
            </div>
          </>
        );
      case 'chapter':
        return (
          <>
            {/* Simple surface variation */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/20"
                  style={{
                    width: `${size * (0.15 + i * 0.05)}px`,
                    height: `${size * (0.15 + i * 0.05)}px`,
                    top: `${30 + i * 20}%`,
                    left: `${25 + i * 15}%`,
                  }}
                />
              ))}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          backgroundColor: glowColor,
          transform: 'scale(1.5)',
          opacity: 0.6,
        }}
        animate={animate ? {
          opacity: [0.4, 0.7, 0.4],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main planet sphere */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden"
        style={{
          background: `radial-gradient(circle at 28% 28%, ${color}E6, ${color}CC 45%, ${color}99 75%, ${color}66)`,
          boxShadow: `
            inset -${size * 0.1}px -${size * 0.1}px ${size * 0.15}px rgba(0,0,0,0.3),
            inset ${size * 0.05}px ${size * 0.05}px ${size * 0.1}px rgba(255,255,255,0.1),
            0 ${size * 0.08}px ${size * 0.25}px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Top highlight shine */}
        <div
          className="absolute rounded-full"
          style={{
            top: '15%',
            left: '20%',
            width: '35%',
            height: '35%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />

        {/* Secondary highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: '25%',
            left: '15%',
            width: '20%',
            height: '20%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)',
            filter: 'blur(3px)',
          }}
        />

        {/* Texture overlay */}
        {getTexture()}

        {/* Subtle edge darkening */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
          }}
        />
      </div>

      {/* Faint star particles nearby */}
      {animate && [...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            top: `${-10 + Math.random() * 120}%`,
            left: `${-10 + Math.random() * 120}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
