import { motion } from 'motion/react';

export function SpiralGalaxy({ size, color, glowColor, animate = true }) {
  // Generate star particles around galaxy
  const starParticles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const distance = size * 0.6 + Math.random() * size * 0.2;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.3,
      delay: Math.random() * 2,
    };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer halo glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[40px] opacity-30"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: 'scale(1.5)',
        }}
      />

      {/* Star particles */}
      {starParticles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: particle.x,
            marginTop: particle.y,
            opacity: particle.opacity,
          }}
          animate={animate ? {
            opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main galaxy container */}
      <motion.div
        className="absolute inset-0"
        animate={animate ? {
          rotate: 360,
        } : {}}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Glowing core */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 0.25,
            height: size * 0.25,
            background: `radial-gradient(circle, ${color} 0%, ${glowColor} 50%, transparent 100%)`,
            boxShadow: `0 0 ${size * 0.3}px ${glowColor}, 0 0 ${size * 0.15}px ${color}`,
          }}
        />

        {/* Inner bright core */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            background: `radial-gradient(circle, #ffffff 0%, ${color} 60%, transparent 100%)`,
            filter: 'blur(2px)',
          }}
        />

        {/* Spiral arms - 4 main arms */}
        {[0, 1, 2, 3].map((armIndex) => {
          const rotation = (armIndex * 90);
          
          return (
            <svg
              key={armIndex}
              className="absolute inset-0"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <defs>
                <linearGradient id={`armGradient-${armIndex}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                  <stop offset="50%" stopColor={color} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
                
                <filter id={`armGlow-${armIndex}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="blur" in2="SourceGraphic" operator="over" />
                </filter>
              </defs>
              
              {/* Main spiral arm */}
              <path
                d={`M ${size/2} ${size/2} Q ${size * 0.7} ${size * 0.35}, ${size * 0.85} ${size * 0.5}`}
                fill="none"
                stroke={`url(#armGradient-${armIndex})`}
                strokeWidth={size * 0.08}
                strokeLinecap="round"
                filter={`url(#armGlow-${armIndex})`}
                opacity="0.9"
              />
              
              {/* Secondary thinner arm */}
              <path
                d={`M ${size/2} ${size/2} Q ${size * 0.65} ${size * 0.4}, ${size * 0.8} ${size * 0.55}`}
                fill="none"
                stroke={`url(#armGradient-${armIndex})`}
                strokeWidth={size * 0.04}
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Dust particles along arm */}
              {Array.from({ length: 8 }, (_, i) => {
                const progress = i / 8;
                const x = size/2 + (size * 0.35 * progress);
                const y = size/2 - (size * 0.15 * progress) * Math.sin(progress * Math.PI);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={Math.random() * 1.5 + 0.5}
                    fill="#ffffff"
                    opacity={Math.random() * 0.4 + 0.2}
                  />
                );
              })}
            </svg>
          );
        })}

        {/* Additional bright streaks */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 0.7,
            height: size * 0.7,
            background: `conic-gradient(from 0deg, transparent 0%, ${glowColor} 10%, transparent 20%, transparent 40%, ${glowColor} 50%, transparent 60%, transparent 80%, ${glowColor} 90%, transparent 100%)`,
            opacity: 0.3,
            filter: 'blur(8px)',
          }}
        />
      </motion.div>

      {/* Soft outer glow layer */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 50%)`,
          filter: 'blur(20px)',
          opacity: 0.4,
        }}
      />
    </div>
  );
}
