import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HelpSectionProps {
  isDarkMode: boolean;
  startWord: string;
  endWord: string;
  setShowTutorial: (val: boolean) => void;
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  isDarkMode,
  startWord,
  endWord,
  setShowTutorial
}) => {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden mb-8"
    >
      <div className={cn(
        "rounded-2xl p-6 text-sm leading-relaxed border transition-colors duration-300",
        isDarkMode 
          ? "bg-orange-950/20 border-orange-900/30 text-orange-200" 
          : "bg-orange-50 border-orange-100 text-orange-900"
      )}>
        <h3 className={cn("font-bold mb-2", isDarkMode ? "text-orange-400" : "text-orange-900")}>How to Play</h3>
        <p className={cn("mb-4", isDarkMode ? "text-orange-200/70" : "text-orange-800/80")}>
          Bridge the <strong>{startWord}</strong> and <strong>{endWord}</strong> by creating a chain of words. 
          Each word must form a common phrase or compound word with the previous one.
        </p>
        <button 
          onClick={() => setShowTutorial(true)}
          className={cn(
            "text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all",
            isDarkMode ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-700 hover:bg-orange-200"
          )}
        >
          View Tutorial
        </button>
      </div>
    </motion.div>
  );
};
