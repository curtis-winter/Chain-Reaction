import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChainDisplayProps {
  chain: string[];
  isDarkMode: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const ChainDisplay: React.FC<ChainDisplayProps> = ({
  chain,
  isDarkMode,
  scrollRef
}) => {
  return (
    <div 
      ref={scrollRef}
      className="space-y-3 mb-12 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar"
    >
      <AnimatePresence initial={false}>
        {chain.map((word, index) => (
          <motion.div
            key={`${word}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
              index === 0 
                ? (isDarkMode ? "bg-white/5 border-white/5" : "bg-white border-black/5 shadow-sm") 
                : (isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100")
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
              index === 0 
                ? (isDarkMode ? "bg-white/10 text-white/40" : "bg-black/5 text-black/30") 
                : "bg-orange-500 text-white shadow-lg shadow-orange-200"
            )}>
              {index + 1}
            </div>
            <div className="flex-1 font-bold tracking-tight uppercase text-sm">
              {word}
            </div>
            {index > 0 && (
              <History className="w-4 h-4 opacity-20" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
