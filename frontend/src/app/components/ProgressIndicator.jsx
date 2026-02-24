
export function ProgressIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {[...Array(totalSteps)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className={`
              h-[2px] flex-1 transition-all duration-500
              ${i < currentStep ? 'bg-[#7C3AED] w-12' : 'bg-white/20 w-12'}
            `}
          />
        </div>
      ))}
      <span className="text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.06em]">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
