// Reusable space background component
export function SpaceBackground() {
  // Generate stars with varying sizes and brightness
  const stars = [...Array(120)].map((_, i) => {
    const isBright = i % 8 === 0; // Every 8th star is brighter
    const size = isBright ? Math.random() * 2 + 1 : 1;
    
    return {
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size,
      opacity: isBright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.4 + 0.3,
      delay: Math.random() * 3,
    };
  });

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#2D1260] via-[#0D0A2E] to-[#050318]">
      {/* Star field effect */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      
      {/* Subtle radial glow effect */}
      <div className="absolute inset-0 bg-radial-gradient from-[#2D1260]/40 via-transparent to-transparent" />
    </div>
  );
}
