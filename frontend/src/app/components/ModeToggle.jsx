import { motion } from 'motion/react';

export function ModeToggle({ mode, onChange }) {
  return (
    <div className="relative bg-white/5 p-1 rounded-full border border-white/10">
      <div className="relative flex gap-1">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          initial={false}
          animate={{
            x: mode === 'login' ? 0 : '100%',
            width: mode === 'login' ? 'calc(50% - 2px)' : 'calc(50% - 2px)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <button
          onClick={() => onChange('login')}
          className={`
            relative z-10 flex-1 px-6 py-2.5 rounded-full
            text-[14px] font-medium transition-colors duration-200
            ${mode === 'login' ? 'text-white' : 'text-[#9CA3AF]'}
          `}
        >
          Login
        </button>
        <button
          onClick={() => onChange('signup')}
          className={`
            relative z-10 flex-1 px-6 py-2.5 rounded-full
            text-[14px] font-medium transition-colors duration-200
            ${mode === 'signup' ? 'text-white' : 'text-[#9CA3AF]'}
          `}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}