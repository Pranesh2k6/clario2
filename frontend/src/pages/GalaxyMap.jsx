import { useState, useEffect } from 'react';
import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Zap } from 'lucide-react';
import { Pill } from '../components/Pill';
import client from '../api/client';

// Base planet definitions — progress will be overridden by BKT mastery
const BASE_PLANETS = [
  { id: 'physics', name: 'Physics', icon: '⚛️', baseColor: '#4a80f5', grad: 'linear-gradient(135deg,#1e3a8a,#3b5bdb)', size: 120, x: 22, y: 40 },
  { id: 'chemistry', name: 'Chemistry', icon: '🧪', baseColor: '#10b981', grad: 'linear-gradient(135deg,#064e3b,#059669)', size: 104, x: 62, y: 26 },
  { id: 'maths', name: 'Mathematics', icon: '📐', baseColor: '#8a4bff', grad: 'linear-gradient(135deg,#4c1d95,#7c3aed)', size: 112, x: 75, y: 60 },
];

// Mastery thresholds determine planet visual state
function getMasteryTier(mastery) {
  if (mastery >= 0.9) return { tier: 'mastered', ring: '#FFD700', glow: '0 0 40px rgba(255,215,0,0.6)', label: 'Mastered ✨' };
  if (mastery >= 0.7) return { tier: 'proficient', ring: '#10B981', glow: '0 0 30px rgba(16,185,129,0.5)', label: 'Proficient' };
  if (mastery >= 0.5) return { tier: 'developing', ring: '#F59E0B', glow: '0 0 25px rgba(245,158,11,0.4)', label: 'Developing' };
  if (mastery >= 0.2) return { tier: 'beginner', ring: '#6366F1', glow: '0 0 20px rgba(99,102,241,0.3)', label: 'Beginner' };
  return { tier: 'unexplored', ring: '#4B5563', glow: '0 0 10px rgba(75,85,99,0.2)', label: 'Unexplored' };
}

export default function GalaxyMap() {
  const navigate = useNavigate();
  const [hov, setHov] = useState(null);
  const [masteryData, setMasteryData] = useState({});
  const [xp, setXp] = useState(0);

  // Fetch BKT mastery data per subject
  useEffect(() => {
    async function fetchMastery() {
      try {
        const [knowledgeRes, profileRes] = await Promise.all([
          client.get('/analytics/knowledge').catch(() => null),
          client.get('/users/me').catch(() => null),
        ]);

        if (profileRes?.data?.user) {
          setXp(profileRes.data.user.cached_total_xp || 0);
        }

        if (knowledgeRes?.data) {
          // Aggregate mastery per subject from knowledge vector
          const data = knowledgeRes.data;
          const subjectMastery = {};

          for (const [subject, topics] of Object.entries(data)) {
            if (Array.isArray(topics) && topics.length > 0) {
              const avgMastery = topics.reduce((sum, t) => sum + (t.mastery_probability || 0), 0) / topics.length;
              const totalAttempts = topics.reduce((sum, t) => sum + (t.total_attempts || 0), 0);
              subjectMastery[subject.toLowerCase()] = {
                mastery: avgMastery,
                totalAttempts,
                topicCount: topics.length,
              };
            }
          }
          setMasteryData(subjectMastery);
        }
      } catch (err) {
        console.warn('[GalaxyMap] Mastery fetch error:', err);
      }
    }
    fetchMastery();
  }, []);

  // Build planets with mastery data
  const planets = BASE_PLANETS.map(p => {
    const subjectData = masteryData[p.id] || masteryData[p.name.toLowerCase()] || {};
    const mastery = subjectData.mastery || 0;
    const progress = Math.round(mastery * 100);
    const tier = getMasteryTier(mastery);

    // Scale planet size slightly based on mastery
    const scaledSize = p.size + (mastery * 16);

    // Adjust planet gradient for mastered subjects
    let grad = p.grad;
    if (tier.tier === 'mastered') {
      grad = `linear-gradient(135deg, ${p.baseColor}, #FFD700)`;
    }

    return { ...p, progress, mastery, tier, scaledSize: Math.round(scaledSize), grad, color: tier.tier === 'mastered' ? '#FFD700' : p.baseColor };
  });

  const handleGalaxyClick = (galaxyId) => {
    navigate(`/subject/${galaxyId}`);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Enhanced Space Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0d3e] via-[#0D0A2E] to-[#020114]">
        {/* Dense star field */}
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
        {/* Nebula effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(124,58,237,0.12)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(2,1,20,0.8)_100%)]" />
      </div>

      {/* OLD Top Overlay Bar — STRICTLY RETAINED */}
      <div className="relative z-20 flex items-center justify-between px-6 lg:px-8 py-5">
        <motion.button
          onClick={() => navigate('/dashboard')}
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(12,8,36,0.7)] backdrop-blur-xl border border-white/12 rounded-xl text-[14px] font-medium text-[#F3F4F6] hover:bg-[rgba(12,8,36,0.85)] transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </motion.button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(12,8,36,0.7)] backdrop-blur-xl border border-white/12">
            <Zap size={16} className="text-[#FBBF24]" />
            <span className="text-[13px] font-semibold text-[#F3F4F6]">{xp.toLocaleString()} XP</span>
          </div>
          <ProfileDropdown />
        </div>
      </div>

      {/* Galaxy Display Area */}
      <div style={{ padding: '0 28px 40px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 8, animation: 'fadeUp 0.4s both' }}>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-0.025em' }}>
            Choose Your Galaxy
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: 15, marginTop: 8 }}>
            Select a subject to begin your exploration
          </p>
        </div>

        <div style={{ position: 'relative', height: 'calc(100vh - 280px)', minHeight: 420 }}>
          {/* Orbit lines */}
          {[420, 580, 720].map((r, i) => (
            <div
              key={i}
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                width: r, height: r * 0.52,
                borderRadius: '50%',
                border: `1px solid rgba(139,92,246,${0.07 - i * 0.02})`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Floating planets — BKT mastery driven */}
          {planets.map((p) => {
            const isH = hov === p.id;
            return (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: `translate(-50%,-50%) scale(${isH ? 1.1 : 1})`,
                  transition: 'transform 0.25s ease',
                  cursor: 'pointer',
                  textAlign: 'center',
                  animation: `floatY ${6 + (p.x % 4)}s ease-in-out infinite`,
                }}
                onMouseEnter={() => setHov(p.id)}
                onMouseLeave={() => setHov(null)}
                onClick={() => handleGalaxyClick(p.id)}
              >
                {/* Mastery ring — color and glow based on BKT tier */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: p.scaledSize + 24, height: p.scaledSize + 24,
                  borderRadius: '50%',
                  border: `2px solid ${p.tier.ring}`,
                  boxShadow: isH ? p.tier.glow : 'none',
                  animation: isH ? 'pulseRing 1.5s ease-out infinite' : 'none',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  opacity: p.mastery > 0 ? 1 : 0.3,
                  transition: 'all 0.3s',
                }} />

                {/* Planet sphere */}
                <div style={{
                  width: p.scaledSize, height: p.scaledSize,
                  borderRadius: '50%',
                  background: p.grad,
                  boxShadow: isH
                    ? `0 0 50px ${p.color}80, inset -18px -18px 35px rgba(0,0,0,0.45)`
                    : `0 0 22px ${p.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: p.scaledSize * 0.32,
                  margin: '0 auto 12px',
                  border: isH ? `2px solid ${p.color}70` : '2px solid transparent',
                  transition: 'all 0.25s',
                  position: 'relative',
                }}>
                  {p.icon}

                  {/* Mastery arc indicator */}
                  {p.progress > 0 && (
                    <svg
                      style={{
                        position: 'absolute', top: -4, left: -4,
                        width: p.scaledSize + 8, height: p.scaledSize + 8,
                        transform: 'rotate(-90deg)',
                        pointerEvents: 'none',
                      }}
                    >
                      <circle
                        cx={(p.scaledSize + 8) / 2}
                        cy={(p.scaledSize + 8) / 2}
                        r={(p.scaledSize + 8) / 2 - 3}
                        fill="none"
                        stroke={p.tier.ring}
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * ((p.scaledSize + 8) / 2 - 3) * (p.progress / 100)} ${2 * Math.PI * ((p.scaledSize + 8) / 2 - 3)}`}
                        strokeLinecap="round"
                        opacity="0.8"
                      />
                    </svg>
                  )}
                </div>

                {/* Label below planet */}
                <p style={{ fontWeight: 800, fontSize: 16, color: isH ? 'white' : '#c4cfe8', marginBottom: 3 }}>
                  {p.name}
                </p>
                <p style={{ fontSize: 13, color: p.tier.ring, fontWeight: 600 }}>
                  {p.progress > 0 ? `${p.progress}% Mastery` : 'Unexplored'}
                </p>
                {p.progress > 0 && (
                  <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                    {p.tier.label}
                  </p>
                )}
                {isH && (
                  <div style={{ marginTop: 8 }}>
                    <Pill color={p.color}>Enter Galaxy →</Pill>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}