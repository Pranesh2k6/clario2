import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { SpaceBackground } from '../components/SpaceBackground';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { AuthButton } from '../components/AuthButton';
import { Atom, FlaskConical, Calculator, Dna, Code } from 'lucide-react';
const clarioLogo = '/clario-logo.png';

const subjects = [
  { id: 'physics', name: 'Physics', icon: Atom },
  { id: 'chemistry', name: 'Chemistry', icon: FlaskConical },
  { id: 'math', name: 'Math', icon: Calculator },
  { id: 'biology', name: 'Biology', icon: Dna },
  { id: 'computer-science', name: 'Computer Science', icon: Code },
];

export default function OnboardingSubjects() {
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleContinue = () => {
    navigate('/onboarding/goal');
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
            <div className="flex items-center mb-8">
              <img
                src={clarioLogo}
                alt="Clario"
                className="h-[96px] w-auto"
              />
            </div>

            {/* Progress */}
            <ProgressIndicator currentStep={1} totalSteps={2} />

            {/* Headline */}
            <h1 className="text-[32px] font-bold text-[#F3F4F6] tracking-[-0.01em] leading-[130%] mb-3">
              Choose Your Subjects
            </h1>

            {/* Subtitle */}
            <p className="text-[14px] text-[#9CA3AF] leading-[150%] mb-10 font-normal">
              Select the areas you want to explore first
            </p>

            {/* Subject Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {subjects.map((subject) => {
                const Icon = subject.icon;
                const isSelected = selectedSubjects.includes(subject.id);

                return (
                  <motion.button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative p-6 rounded-2xl
                      bg-white/5 backdrop-blur-sm
                      border transition-all duration-300
                      ${isSelected
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10 shadow-[0_0_20px_rgba(124,58,237,0.25)]'
                        : 'border-white/12 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`
                        p-3 rounded-xl transition-colors duration-300
                        ${isSelected ? 'bg-[#7C3AED]/20' : 'bg-white/5'}
                      `}>
                        <Icon
                          size={28}
                          className={`
                            transition-colors duration-300
                            ${isSelected ? 'text-[#A78BFA]' : 'text-[#9CA3AF]'}
                          `}
                        />
                      </div>
                      <span className={`
                        text-[15px] font-medium transition-colors duration-300
                        ${isSelected ? 'text-[#F3F4F6]' : 'text-[#D1D5DB]'}
                      `}>
                        {subject.name}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center"
                      >
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Continue Button */}
            <AuthButton
              onClick={handleContinue}
              disabled={selectedSubjects.length === 0}
            >
              Continue
            </AuthButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}