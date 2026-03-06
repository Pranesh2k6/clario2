import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { AuthButton } from '../components/AuthButton';
import { Trophy, BookOpen } from 'lucide-react';
const clarioLogo = '/clario-logo.png';

const goals = [
  {
    id: 'exam',
    title: 'Competitive Exam',
    description: 'JEE / NEET / SAT / etc.',
    icon: Trophy,
  },
  {
    id: 'school',
    title: 'School Learning',
    description: 'For classwork, exams, and concept building',
    icon: BookOpen,
  },
];

export default function OnboardingGoal() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleFinish = () => {
    // Navigate to dashboard after onboarding
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Space Background */}
      <SpaceBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[720px]"
        >
          {/* Glassmorphic Onboarding Card */}
          <div className="relative bg-[rgba(12,8,36,0.7)] backdrop-blur-xl rounded-3xl border border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 sm:p-12">
            {/* Logo */}
            <div className="flex items-center mb-6">
              <img
                src={clarioLogo}
                alt="Clario"
                className="w-[200px] h-auto object-contain"
              />
            </div>

            {/* Progress */}
            <ProgressIndicator currentStep={2} totalSteps={2} />

            {/* Headline */}
            <h1 className="text-[32px] font-bold text-[#F3F4F6] tracking-[-0.01em] leading-[130%] mb-3">
              What are you preparing for?
            </h1>

            {/* Subtitle */}
            <p className="text-[14px] text-[#9CA3AF] leading-[150%] mb-10 font-normal">
              This helps us tailor your learning path
            </p>

            {/* Goal Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;

                return (
                  <motion.button
                    key={goal.id}
                    onClick={() => setSelectedGoal(goal.id)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-8 rounded-2xl
                      bg-white/5 backdrop-blur-sm
                      border transition-all duration-300
                      ${isSelected
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                        : 'border-white/12 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      {/* Icon */}
                      <div className={`
                        p-4 rounded-xl transition-colors duration-300
                        ${isSelected ? 'bg-[#7C3AED]/20' : 'bg-white/5'}
                      `}>
                        <Icon
                          size={32}
                          className={`
                            transition-colors duration-300
                            ${isSelected ? 'text-[#A78BFA]' : 'text-[#9CA3AF]'}
                          `}
                        />
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className={`
                          text-[18px] font-semibold mb-2 transition-colors duration-300
                          ${isSelected ? 'text-[#F3F4F6]' : 'text-[#D1D5DB]'}
                        `}>
                          {goal.title}
                        </h3>
                        <p className="text-[13px] text-[#9CA3AF] font-normal">
                          {goal.description}
                        </p>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-6 h-6 bg-[#7C3AED] rounded-full flex items-center justify-center"
                      >
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path d="M1 5.5L5 9.5L13 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Finish Button */}
            <AuthButton
              onClick={handleFinish}
              disabled={!selectedGoal}
            >
              Enter My Galaxy
            </AuthButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}