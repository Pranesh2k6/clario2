import { motion } from 'motion/react';

export function AuthButton({ children, variant = 'primary', icon, onClick, type = 'button', disabled = false }) {
  if (variant === 'secondary') {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="
          w-full px-4 py-3 rounded-xl
          bg-white text-[#0D0A2E]
          text-[14px] font-semibold
          border border-gray-200
          hover:bg-gray-50
          transition-all duration-200
          flex items-center justify-center gap-3
          shadow-sm
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.01, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.99 } : {}}
      className="
        w-full px-4 py-4 rounded-xl
        bg-[#7C3AED] text-white
        text-[14px] font-semibold
        relative overflow-hidden
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-[0_4px_16px_rgba(124,58,237,0.2)]
        hover:shadow-[0_6px_24px_rgba(124,58,237,0.35)]
      "
    >
      {/* Subtle inner highlight on top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}