import { ProfileDropdown } from '../components/ProfileDropdown';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { LayoutDashboard, Map, FileText, Swords, Calendar, BarChart3, Settings, Flame, Zap, ArrowLeft, ChevronRight, Lightbulb, CheckCircle, FileQuestion } from 'lucide-react';
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

export default function CaseDetail() {
  const navigate = useNavigate();
  const { subjectId, chapterId, caseId } = useParams();
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const caseData = {
    title: `Case #${caseId}: The Projectile Trajectory Mystery`,
    intro: 'A projectile is launched at 30° with an initial velocity of 40 m/s. Mission: Calculate the maximum height reached.',
    question: 'Calculate the maximum height reached by the projectile using H = (u² sin²θ) / 2g. Take g = 10 m/s².',
    hint: 'First find sin(30°) = 0.5, then substitute into the formula: H = (40² × 0.5²) / (2 × 10)',
    correctAnswer: '20',
    diagram: '📐'
  };

  const handleSubmit = () => {
    // In real app, validate answer
    if (answer.trim() === caseData.correctAnswer) {
      setShowSummary(true);
    } else {
      alert('Try again! Check your calculation.');
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
              className="w-[160px] h-[57.6px] object-cover"
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
              onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}/practice`)}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[14px] font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Case Archive</span>
            </motion.button>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* XP Reward */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/20">
                <Zap size={16} className="text-[#FBBF24]" />
                <span className="text-[13px] font-semibold text-[#FBBF24]">+50 XP</span>
              </div>

              {/* Profile Avatar */}
              <ProfileDropdown />
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Case Header */}
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
                  Projectile Motion
                </button>
                <ChevronRight size={14} />
                <button
                  onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}/practice`)}
                  className="hover:text-[#F3F4F6] transition-colors"
                >
                  Cases
                </button>
                <ChevronRight size={14} />
                <span className="text-[#F3F4F6]">Case #{caseId}</span>
              </div>

              <h1 className="text-[28px] font-bold text-[#F3F4F6] mb-2">
                {caseData.title}
              </h1>
              <p className="text-[14px] text-[#9CA3AF] leading-relaxed max-w-3xl">
                {caseData.intro}
              </p>
            </div>

            {!showSummary ? (
              /* Case Content - Before Solving */
              <div className="p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Main Question Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-8 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                        <FileQuestion size={18} className="text-white" />
                      </div>
                      <h2 className="text-[18px] font-bold text-[#F3F4F6]">
                        Investigation Question
                      </h2>
                    </div>

                    {/* Diagram */}
                    <div className="mb-6 p-8 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                      <div className="text-[80px]">
                        {caseData.diagram}
                      </div>
                    </div>

                    {/* Question */}
                    <div className="mb-6 p-5 bg-[rgba(99,102,241,0.08)] border border-[#6366F1]/20 rounded-xl">
                      <p className="text-[15px] text-[#F3F4F6] leading-relaxed">
                        {caseData.question}
                      </p>
                    </div>

                    {/* Answer Input */}
                    <div className="mb-6">
                      <label className="block text-[13px] font-medium text-[#9CA3AF] mb-2">
                        Your Answer (in meters)
                      </label>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter your answer..."
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

                    {/* Submit Button */}
                    <motion.button
                      onClick={handleSubmit}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                        w-full px-6 py-3.5 rounded-xl
                        bg-[#7C3AED] text-white
                        text-[14px] font-semibold
                        shadow-[0_4px_16px_rgba(124,58,237,0.3)]
                        hover:shadow-[0_6px_24px_rgba(124,58,237,0.4)]
                        transition-all duration-200
                      "
                    >
                      Submit Answer
                    </motion.button>
                  </motion.div>

                  {/* Hint Panel */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb size={18} className="text-[#FBBF24]" />
                      <h2 className="text-[16px] font-bold text-[#F3F4F6]">
                        Need Help?
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
                          {caseData.hint}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Scratchpad */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-2xl border border-white/12 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                  >
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
                  </motion.div>
                </div>
              </div>
            ) : (
              /* Case Summary - After Correct Answer */
              <div className="p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-[rgba(16,185,129,0.15)] to-[rgba(16,185,129,0.05)] backdrop-blur-xl rounded-2xl border border-[#10B981]/30 p-8 shadow-[0_8px_32px_rgba(16,185,129,0.2)]"
                  >
                    {/* Success Header */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="p-3 bg-[#10B981] rounded-full">
                        <CheckCircle size={32} className="text-white" />
                      </div>
                      <h2 className="text-[28px] font-bold text-[#F3F4F6]">
                        Case Solved!
                      </h2>
                    </div>

                    {/* XP Gained */}
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FBBF24]/20 border border-[#FBBF24]/40 rounded-xl">
                        <Zap size={20} className="text-[#FBBF24]" />
                        <span className="text-[18px] font-bold text-[#FBBF24]">+50 XP Earned</span>
                      </div>
                    </div>

                    {/* Concept Explanation */}
                    <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-[18px] font-bold text-[#F3F4F6] mb-3">
                        Concept Explanation
                      </h3>
                      <p className="text-[14px] text-[#D1D5DB] leading-relaxed mb-4">
                        The maximum height formula H = (u² sin²θ) / 2g is derived from the vertical component of projectile motion. At maximum height, the vertical velocity becomes zero, allowing us to calculate the peak of the trajectory.
                      </p>
                    </div>

                    {/* Step-by-Step Logic */}
                    <div className="mb-6 p-6 bg-white/5 rounded-xl border border-white/10">
                      <h3 className="text-[18px] font-bold text-[#F3F4F6] mb-3">
                        Step-by-Step Solution
                      </h3>
                      <ol className="space-y-2 text-[14px] text-[#D1D5DB]">
                        <li className="flex gap-3">
                          <span className="text-[#6366F1] font-bold">1.</span>
                          <span>Identify values: u = 40 m/s, θ = 30°, g = 10 m/s²</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-[#6366F1] font-bold">2.</span>
                          <span>Calculate sin(30°) = 0.5</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-[#6366F1] font-bold">3.</span>
                          <span>Substitute: H = (40² × 0.5²) / (2 × 10)</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-[#6366F1] font-bold">4.</span>
                          <span>Simplify: H = (1600 × 0.25) / 20 = 400 / 20 = 20 m</span>
                        </li>
                      </ol>
                    </div>

                    {/* Key Takeaway */}
                    <div className="mb-8 p-6 bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-xl">
                      <h3 className="text-[16px] font-bold text-[#A78BFA] mb-2">
                        💡 Key Takeaway
                      </h3>
                      <p className="text-[14px] text-[#D1D5DB] leading-relaxed">
                        The vertical component of velocity determines the maximum height. At the peak, vertical velocity is zero, which is why we can use this specific formula.
                      </p>
                    </div>

                    {/* Back to Archive Button */}
                    <motion.button
                      onClick={() => navigate(`/planet/${subjectId}/chapter/${chapterId}/practice`)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="
                        w-full px-6 py-3.5 rounded-xl
                        bg-[#7C3AED] text-white
                        text-[14px] font-semibold
                        shadow-[0_4px_16px_rgba(124,58,237,0.3)]
                        hover:shadow-[0_6px_24px_rgba(124,58,237,0.4)]
                        transition-all duration-200
                      "
                    >
                      Back to Case Archive
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}