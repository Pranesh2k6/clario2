import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, X, Clock, Brain } from 'lucide-react';

export function FlippableQuestionCard({
  round,
  correct,
  difficulty,
  timeTaken,
  question,
  options,
  correctAnswer,
  userAnswer,
  explanation,
  delay,
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* FRONT SIDE */}
        <div
          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`
                w-6 h-6 rounded-lg flex items-center justify-center
                ${correct 
                  ? 'bg-[#10B981]/20 border border-[#10B981]/40' 
                  : 'bg-[#EF4444]/20 border border-[#EF4444]/40'
                }
              `}>
                {correct ? (
                  <CheckCircle size={14} className="text-[#10B981]" />
                ) : (
                  <X size={14} className="text-[#EF4444]" />
                )}
              </div>
              <span className="text-[12px] font-semibold text-[#F3F4F6]">Round {round}</span>
              <span className={`
                text-[10px] px-2 py-0.5 rounded
                ${difficulty === 'Easy' 
                  ? 'bg-[#10B981]/15 text-[#10B981]' 
                  : difficulty === 'Medium'
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                    : 'bg-[#EF4444]/15 text-[#EF4444]'
                }
              `}>
                {difficulty}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#9CA3AF]">
              <Clock size={11} />
              <span className="text-[11px]">{timeTaken}s</span>
            </div>
          </div>

          {/* Question Text */}
          <p className="text-[12px] text-[#D1D5DB] mb-3 leading-relaxed">
            {question}
          </p>

          {/* Options */}
          <div className="space-y-2">
            {options.map((option, optIndex) => {
              const isCorrect = optIndex === correctAnswer;
              const isUserAnswer = optIndex === userAnswer;
              
              return (
                <div
                  key={optIndex}
                  className={`
                    flex items-center gap-2 p-2 rounded-lg text-[11px]
                    ${isCorrect 
                      ? 'bg-[#10B981]/15 border border-[#10B981]/40' 
                      : isUserAnswer && !isCorrect
                        ? 'bg-[#EF4444]/15 border border-[#EF4444]/40'
                        : 'bg-white/5 border border-white/10'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded flex items-center justify-center font-semibold text-[10px]
                    ${isCorrect 
                      ? 'bg-[#10B981]/30 text-[#10B981]' 
                      : isUserAnswer && !isCorrect
                        ? 'bg-[#EF4444]/30 text-[#EF4444]'
                        : 'bg-white/10 text-[#9CA3AF]'
                    }
                  `}>
                    {String.fromCharCode(65 + optIndex)}
                  </div>
                  <span className={
                    isCorrect 
                      ? 'text-[#10B981]' 
                      : isUserAnswer && !isCorrect
                        ? 'text-[#EF4444]'
                        : 'text-[#9CA3AF]'
                  }>
                    {option}
                  </span>
                  {isCorrect && (
                    <CheckCircle size={12} className="text-[#10B981] ml-auto" />
                  )}
                  {isUserAnswer && !isCorrect && (
                    <X size={12} className="text-[#EF4444] ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Click hint */}
          <div className="mt-3 text-center">
            <span className="text-[10px] text-[#6366F1] opacity-60">Click to see explanation</span>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 w-full p-4 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-2xl"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-[#6366F1]" />
              <span className="text-[13px] font-semibold text-[#F3F4F6]">Answer Explanation</span>
            </div>
            <div className={`
              w-6 h-6 rounded-lg flex items-center justify-center
              ${correct 
                ? 'bg-[#10B981]/20 border border-[#10B981]/40' 
                : 'bg-[#EF4444]/20 border border-[#EF4444]/40'
              }
            `}>
              {correct ? (
                <CheckCircle size={14} className="text-[#10B981]" />
              ) : (
                <X size={14} className="text-[#EF4444]" />
              )}
            </div>
          </div>

          {/* Correct Answer */}
          <div className="mb-4 p-3 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl">
            <p className="text-[11px] text-[#9CA3AF] mb-1">Correct Answer</p>
            <p className="text-[13px] font-semibold text-[#10B981]">
              {String.fromCharCode(65 + correctAnswer)}. {options[correctAnswer]}
            </p>
          </div>

          {/* Explanation */}
          <div className="mb-4">
            <p className="text-[11px] text-[#9CA3AF] mb-2">Why this works:</p>
            <p className="text-[12px] text-[#D1D5DB] leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Click hint */}
          <div className="text-center">
            <span className="text-[10px] text-[#6366F1] opacity-60">Click to flip back</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
