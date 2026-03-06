import { ProfileDropdown } from '../components/ProfileDropdown';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, Lightbulb, Clock, AlertCircle, FileQuestion, CheckCircle } from 'lucide-react';
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

// Mock case data
const caseData = {
  title: "Why Did the Satellite Drift?",
  intro: "A communications satellite has drifted from its orbit. Your mission: analyze the clues and determine what went wrong.",
  xpReward: 50,
  clues: [
    { id: 1, text: "Initial orbit altitude: 35,786 km", unlocked: true, icon: CheckCircle },
    { id: 2, text: "Unexpected velocity change detected", unlocked: true, icon: CheckCircle },
    { id: 3, text: "Solar radiation pressure anomaly", unlocked: false, icon: AlertCircle },
  ],
  question: {
    text: "Given the satellite's mass of 2,500 kg and the detected velocity change of 0.5 m/s, calculate the force that caused the drift.",
    type: "numerical",
    hint: "Use Newton's second law: F = ma. First, find acceleration from the velocity change.",
  },
  diagram: "🛰️", // In real app, this would be an actual diagram
};

export default function Practice() {
  const navigate = useNavigate();
  const { subjectId, chapterId } = useParams();
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

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
              className="h-[96px] w-auto"
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
              {/* Timer */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <Clock size={16} className="text-[#9CA3AF]" />
                <span className="text-[13px] font-semibold text-[#F3F4F6]">12:35</span>
              </div>

              {/* XP Reward */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/20">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#FBBF24]">+{caseData.xpReward} XP</span>
              </div>

              {/* Profile Avatar */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Content Area - Three Column Layout */}
          <div className="flex-1 overflow-y-auto">
            {/* Top Section - Case Title */}
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
                  Thermodynamics
                </button>
                <ChevronRight size={14} />
                <span className="text-[#F3F4F6]">Practice Case</span>
              </div>

              <h1 className="text-[28px] font-bold text-[#F3F4F6] mb-2">
                {caseData.title}
              </h1>
              <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-3xl">
                {caseData.intro}
              </p>
            </div>

            {/* Three Zone Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 lg:p-8">
              {/* LEFT PANEL - Story Progression */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] sticky top-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileQuestion size={18} className="text-[#A78BFA]" />
                    <h2 className="text-[16px] font-bold text-[#F3F4F6]">
                      Investigation Clues
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {caseData.clues.map((clue, index) => {
                      const ClueIcon = clue.icon;
                      return (
                        <motion.div
                          key={clue.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            p-3 rounded-xl border transition-all
                            ${clue.unlocked
                              ? 'bg-white/5 border-[#10B981]/30'
                              : 'bg-white/[0.02] border-white/5 opacity-50'
                            }
                          `}
                        >
                          <div className="flex items-start gap-2">
                            <ClueIcon
                              size={16}
                              className={clue.unlocked ? 'text-[#10B981] mt-0.5' : 'text-[#9CA3AF] mt-0.5'}
                            />
                            <div className="flex-1">
                              <div className="text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1">
                                Clue {clue.id}
                              </div>
                              <p className="text-[13px] text-[#D1D5DB] leading-relaxed">
                                {clue.unlocked ? clue.text : '???'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Progress */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-[12px] text-[#9CA3AF] mb-2">
                      <span>Case Progress</span>
                      <span className="font-semibold">2/3 Clues</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] rounded-full w-[66%]" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* CENTER - Question Area */}
              <div className="lg:col-span-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                      <span className="text-[14px] font-bold text-white">Q1</span>
                    </div>
                    <h2 className="text-[18px] font-bold text-[#F3F4F6]">
                      Main Question
                    </h2>
                  </div>

                  {/* Diagram */}
                  <div className="mb-6 p-8 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                    <div className="text-[80px]">
                      {caseData.diagram}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-6 p-5 bg-[rgba(99,102,241,0.08)] border border-[#6366F1]/20 rounded-xl">
                    <p className="text-[15px] text-[#F3F4F6] leading-relaxed">
                      {caseData.question.text}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div className="mb-6">
                    <label className="block text-[13px] font-medium text-[#9CA3AF] mb-2">
                      Your Answer
                    </label>
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your calculation..."
                      className="
                        w-full px-4 py-3.5 rounded-xl
                        bg-[rgba(255,255,255,0.05)] 
                        border border-white/12
                        text-[14px] text-[#F3F4F6]
                        placeholder:text-[#9CA3AF]/50
                        focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/40
                        transition-all
                      "
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                        flex-1 px-6 py-3.5 rounded-xl
                        bg-[#7C3AED] text-white
                        text-[14px] font-semibold
                        shadow-[0_4px_16px_rgba(124,58,237,0.3)]
                        hover:shadow-[0_6px_24px_rgba(124,58,237,0.4)]
                        transition-all duration-200
                      "
                    >
                      Submit Answer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                        px-6 py-3.5 rounded-xl
                        bg-white/5 border border-white/12 text-[#F3F4F6]
                        text-[14px] font-semibold
                        hover:bg-white/8
                        transition-all duration-200
                      "
                    >
                      Skip
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* RIGHT PANEL - Support Tools */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4 sticky top-6"
                >
                  {/* Hints */}
                  <div className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb size={18} className="text-[#FBBF24]" />
                      <h2 className="text-[16px] font-bold text-[#F3F4F6]">
                        Hints
                      </h2>
                    </div>

                    {!showHint ? (
                      <button
                        onClick={() => setShowHint(true)}
                        className="
                          w-full px-4 py-2.5 rounded-xl
                          bg-[#FBBF24]/10 border border-[#FBBF24]/30 
                          text-[13px] font-semibold text-[#FBBF24]
                          hover:bg-[#FBBF24]/15
                          transition-all
                        "
                      >
                        Reveal Hint (-5 XP)
                      </button>
                    ) : (
                      <div className="p-4 bg-[#FBBF24]/5 border border-[#FBBF24]/20 rounded-xl">
                        <p className="text-[13px] text-[#F3F4F6] leading-relaxed">
                          {caseData.question.hint}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Scratchpad */}
                  <div className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <h2 className="text-[16px] font-bold text-[#F3F4F6] mb-3">
                      Scratchpad
                    </h2>
                    <textarea
                      placeholder="Work out your calculations here..."
                      rows={6}
                      className="
                        w-full px-3 py-2.5 rounded-xl
                        bg-[rgba(255,255,255,0.05)] 
                        border border-white/12
                        text-[13px] text-[#F3F4F6]
                        placeholder:text-[#9CA3AF]/50
                        focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/40
                        resize-none
                        transition-all
                      "
                    />
                  </div>

                  {/* Formula Reference */}
                  <div className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <h2 className="text-[16px] font-bold text-[#F3F4F6] mb-3">
                      Formulas
                    </h2>
                    <div className="space-y-2 text-[12px]">
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-[#9CA3AF] mb-1">Newton's 2nd Law:</div>
                        <div className="text-[#F3F4F6] font-mono">F = ma</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded-lg">
                        <div className="text-[#9CA3AF] mb-1">Acceleration:</div>
                        <div className="text-[#F3F4F6] font-mono">a = Δv / Δt</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}