import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function AuthInput({ label, type = 'text', placeholder, error, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const isPassword = type === 'password';

  return (
    <div className="space-y-3">
      <label className="block text-[11px] uppercase tracking-[0.06em] text-[#9CA3AF] font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white/5 
            border transition-all duration-300
            text-[14px] text-[#F3F4F6] font-normal
            placeholder:text-[#6B7280] placeholder:font-normal
            outline-none
            ${error 
              ? 'border-red-500/50 bg-red-500/5' 
              : isFocused 
                ? 'border-[#8B5CF6]/60 bg-white/8 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                : 'border-white/12'
            }
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[12px] text-red-400 font-normal">{error}</p>
      )}
    </div>
  );
}