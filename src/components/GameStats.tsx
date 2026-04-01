import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GameStatsProps {
  isDarkMode: boolean;
  startWord: string;
  endWord: string;
  score: number;
  scoreAnimation: { amount: number; reason: string } | null;
}

export const GameStats: React.FC<GameStatsProps> = ({
  isDarkMode,
  startWord,
  endWord,
  score,
  scoreAnimation
}) => {
  return (
    <div className={cn(
      "grid grid-cols-3 items-center p-6 rounded-3xl mb-8 border transition-all duration-300",
      isDarkMode 
        ? "bg-white/5 border-white/5 shadow-2xl shadow-black/20" 
        : "bg-white border-black/5 shadow-xl shadow-orange-100/50"
    )}>
      <div className="text-center">
        <span className={cn(
          "text-[10px] uppercase tracking-widest font-bold block mb-1",
          isDarkMode ? "opacity-40" : "opacity-30"
        )}>Start</span>
        <div className="text-2xl font-black tracking-tighter">{startWord}</div>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <div className="text-3xl font-black tracking-tighter text-orange-500 tabular-nums">
            {score}
          </div>
          <AnimatePresence>
            {scoreAnimation && (
              <motion.div
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: -20 }}
                exit={{ opacity: 0 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 text-red-500 font-bold text-sm whitespace-nowrap"
              >
                {scoreAnimation.amount} {scoreAnimation.reason}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className={cn(
          "text-[8px] uppercase font-black tracking-widest",
          isDarkMode ? "opacity-30" : "opacity-20"
        )}>Score</span>
      </div>

      <div className="text-center">
        <span className={cn(
          "text-[10px] uppercase tracking-widest font-bold block mb-1",
          isDarkMode ? "opacity-40" : "opacity-30"
        )}>Target</span>
        <div className="text-2xl font-black tracking-tighter text-orange-500">{endWord}</div>
      </div>
    </div>
  );
};
