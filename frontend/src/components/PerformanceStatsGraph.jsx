import { motion } from 'motion/react';
import { Gauge, Clock, Award, Target } from 'lucide-react';

export function PerformanceStatsGraph({
  accuracy,
  avgResponseTime,
  fastestCorrect,
  hardestSolved,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="p-5 bg-white/5 border border-white/10 rounded-2xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Gauge size={18} className="text-[#6366F1]" />
        <h3 className="text-[14px] font-semibold text-[#F3F4F6]">Performance Stats</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Accuracy */}
        <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className="text-[#10B981]" />
            <p className="text-[11px] text-[#9CA3AF]">Accuracy</p>
          </div>
          <p className="text-[24px] font-bold text-[#10B981]">{accuracy}%</p>
          <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${accuracy}%` }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-full bg-[#10B981] rounded-full"
            />
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="p-3 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#6366F1]" />
            <p className="text-[11px] text-[#9CA3AF]">Avg Time</p>
          </div>
          <p className="text-[24px] font-bold text-[#6366F1]">{avgResponseTime}s</p>
          <p className="text-[10px] text-[#9CA3AF] mt-1">per question</p>
        </div>

        {/* Fastest Correct */}
        <div className="p-3 bg-[#FBBF24]/10 border border-[#FBBF24]/30 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-[#FBBF24]" />
            <p className="text-[11px] text-[#9CA3AF]">Fastest</p>
          </div>
          <p className="text-[24px] font-bold text-[#FBBF24]">{fastestCorrect}s</p>
          <p className="text-[10px] text-[#9CA3AF] mt-1">correct answer</p>
        </div>

        {/* Hardest Question */}
        <div className={`
          p-3 rounded-xl
          ${hardestSolved
            ? 'bg-[#10B981]/10 border border-[#10B981]/30'
            : 'bg-[#EF4444]/10 border border-[#EF4444]/30'
          }
        `}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={14} className={hardestSolved ? 'text-[#10B981]' : 'text-[#EF4444]'} />
            <p className="text-[11px] text-[#9CA3AF]">Hard Q</p>
          </div>
          <p className={`text-[20px] font-bold ${hardestSolved ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {hardestSolved ? 'Solved' : 'Missed'}
          </p>
          <p className="text-[10px] text-[#9CA3AF] mt-1">difficulty level</p>
        </div>
      </div>
    </motion.div>
  );
}
