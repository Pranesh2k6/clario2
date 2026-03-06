import { ProfileDropdown } from '../components/ProfileDropdown';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';
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

const formulaCards = [
  {
    title: 'Range Formula',
    equation: 'R = (u² sin2θ) / g',
    explanation: 'Horizontal distance covered by the projectile',
    example: 'At 45°, range is maximum = u²/g'
  },
  {
    title: 'Maximum Height',
    equation: 'H = (u² sin²θ) / 2g',
    explanation: 'Highest point reached by the projectile',
    example: 'At 90°, height is maximum = u²/2g'
  },
  {
    title: 'Time of Flight',
    equation: 'T = (2u sinθ) / g',
    explanation: 'Total time the projectile remains in air',
    example: 'At θ=30°, T = u/g'
  },
  {
    title: 'Horizontal Velocity',
    equation: 'vₓ = u cosθ',
    explanation: 'Remains constant throughout the motion',
    example: 'Independent of time and g'
  }
];

const conceptSnippets = [
  'Projectile motion splits into horizontal and vertical components',
  'Horizontal velocity stays constant (no acceleration in x-direction)',
  'Vertical motion behaves like free fall (acceleration = g downward)',
  'At maximum height, vertical velocity becomes zero'
];

export default function Learn() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();

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
              className="h-[80px] w-auto"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = false;
              const isImplemented = ['/dashboard', '/galaxy', '/duels', '/planner'].includes(item.path);

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
                <span className="text-[#F3F4F6]">Learn Mode</span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#8B5CF6]/20 rounded-lg">
                  <BookOpen size={24} className="text-[#8B5CF6]" />
                </div>
                <h1 className="text-[28px] font-bold text-[#F3F4F6]">
                  Motion in 2D — Mission Notebook
                </h1>
              </div>
              <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-3xl">
                Study from mission notebook — clean, structured, bite-sized concepts and formulas
              </p>
            </div>

            {/* Main Content */}
            <div className="p-6 lg:p-8 space-y-8">
              {/* 1. Formula Cards */}
              <section>
                <h2 className="text-[20px] font-bold text-[#F3F4F6] mb-4">
                  Essential Formulas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formulaCards.map((formula, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                    >
                      <h3 className="text-[16px] font-bold text-[#F3F4F6] mb-2">{formula.title}</h3>
                      <div className="p-3 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-lg mb-3">
                        <code className="text-[18px] text-[#A78BFA] font-mono">{formula.equation}</code>
                      </div>
                      <p className="text-[13px] text-[#D1D5DB] mb-2">{formula.explanation}</p>
                      <div className="text-[12px] text-[#9CA3AF] italic">
                        Example: {formula.example}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* 2. Concept Snippets */}
              <section>
                <h2 className="text-[20px] font-bold text-[#F3F4F6] mb-4">
                  Key Concepts
                </h2>
                <div className="space-y-3">
                  {conceptSnippets.map((concept, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-xl border border-white/12 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-[#6366F1]" />
                        </div>
                        <p className="text-[14px] text-[#F3F4F6] leading-relaxed">{concept}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* 3. Simulation Panel */}
              <section>
                <h2 className="text-[20px] font-bold text-[#F3F4F6] mb-4">
                  Test the Trajectory Simulator
                </h2>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-[#8B5CF6]/30 overflow-hidden shadow-[0_0_24px_rgba(139,92,246,0.2)]"
                >
                  {/* Embedded Simulation iframe */}
                  <iframe
                    srcDoc={`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Clario – Projectile Motion</title>
  <style>
    body {
      margin: 0;
      background: radial-gradient(circle at top, #14001f, #050009);
      color: white;
      font-family: 'Space Grotesk', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }
    h1 {
      margin: 20px 0;
      color: white;
      letter-spacing: 1px;
      font-size: 24px;
    }
    canvas {
      background: radial-gradient(circle at bottom, #1a042a, #050009);
      border-radius: 14px;
      box-shadow: 0 0 18px rgba(184,146,255,0.18);
    }
    .controls {
      margin-top: 20px;
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .control {
      display: flex;
      flex-direction: column;
      color: #d9c7ff;
    }
    input {
      width: 180px;
      accent-color: #b892ff;
    }
    button {
      padding: 10px 18px;
      background: linear-gradient(135deg, #4b1fa6, #7b2cff);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(123,44,255,0.3);
    }
    button:hover {
      opacity: 0.9;
    }
    .stats {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
      max-width: 800px;
      width: 100%;
    }
    .stat {
      background: rgba(255,255,255,0.04);
      padding: 12px;
      border-radius: 12px;
    }
    .label {
      color: #bfa9ff;
      font-size: 13px;
    }
    .value {
      font-size: 18px;
      color: #b892ff;
      font-weight: bold;
    }
  </style>
</head>
<body>

<h1>Projectile Motion – Visual Repair Mission</h1>

<canvas id="canvas" width="800" height="400"></canvas>

<div class="controls">
  <div class="control">
    <label>Angle (°): <span id="angleVal">45</span></label>
    <input type="range" id="angle" min="10" max="80" value="45">
  </div>

  <div class="control">
    <label>Speed (m/s): <span id="speedVal">50</span></label>
    <input type="range" id="speed" min="20" max="100" value="50">
  </div>

  <button id="pauseBtn">Pause</button>
  <button id="resetBtn">Reset</button>
</div>

<div class="stats">
  <div class="stat"><div class="label">Time (s)</div><div class="value" id="timeStat">0.00</div></div>
  <div class="stat"><div class="label">Horizontal Velocity (m/s)</div><div class="value" id="vxStat">0</div></div>
  <div class="stat"><div class="label">Vertical Velocity (m/s)</div><div class="value" id="vyStat">0</div></div>
  <div class="stat"><div class="label">Height (m)</div><div class="value" id="heightStat">0</div></div>
  <div class="stat"><div class="label">Range (m)</div><div class="value" id="rangeStat">0</div></div>
</div>

<script>
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const angleSlider = document.getElementById("angle");
  const speedSlider = document.getElementById("speed");
  const angleVal = document.getElementById("angleVal");
  const speedVal = document.getElementById("speedVal");

  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const timeStat = document.getElementById("timeStat");
  const vxStat = document.getElementById("vxStat");
  const vyStat = document.getElementById("vyStat");
  const heightStat = document.getElementById("heightStat");
  const rangeStat = document.getElementById("rangeStat");

  const g = 9.8;
  let time = 0;
  let paused = false;

  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
  };

  resetBtn.onclick = () => {
    time = 0;
    paused = false;
    pauseBtn.textContent = "Pause";
  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const angle = angleSlider.value * Math.PI / 180;
    const speed = speedSlider.value;

    angleVal.textContent = angleSlider.value;
    speedVal.textContent = speedSlider.value;

    const vx = speed * Math.cos(angle);
    const vy0 = speed * Math.sin(angle);
    const vy = vy0 - g * time;

    const x = vx * time;
    const y = vy0 * time - 0.5 * g * time * time;

    // Ground
    ctx.strokeStyle = "#2a0a4a";
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(800, 350);
    ctx.stroke();

    // Trajectory
    ctx.strokeStyle = "#b892ff";
    ctx.beginPath();
    for (let t = 0; t <= time; t += 0.05) {
      const tx = vx * t;
      const ty = vy0 * t - 0.5 * g * t * t;
      if (ty < 0) break;
      ctx.lineTo(50 + tx * 3, 350 - ty * 3);
    }
    ctx.stroke();

    // Ball
    if (y >= 0) {
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(50 + x * 3, 350 - y * 3, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Velocity vectors
    ctx.strokeStyle = "#7df9ff";
    ctx.beginPath();
    ctx.moveTo(50 + x * 3, 350 - y * 3);
    ctx.lineTo(50 + x * 3 + vx * 0.8, 350 - y * 3);
    ctx.stroke();

    ctx.strokeStyle = "#ff5da2";
    ctx.beginPath();
    ctx.moveTo(50 + x * 3, 350 - y * 3);
    ctx.lineTo(50 + x * 3, 350 - y * 3 - vy * 0.8);
    ctx.stroke();

    // Stats
    timeStat.textContent = time.toFixed(2);
    vxStat.textContent = vx.toFixed(2);
    vyStat.textContent = vy.toFixed(2);
    heightStat.textContent = Math.max(y, 0).toFixed(2);
    rangeStat.textContent = x.toFixed(2);

    if (!paused) {
      time += 0.03;
      if (y < 0) time = 0;
    }

    requestAnimationFrame(draw);
  }

  draw();
</script>

</body>
</html>
                    `}
                    className="w-full h-[800px] border-0"
                    title="Projectile Motion Simulation"
                  />
                </motion.div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}