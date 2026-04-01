import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Share2, ChevronRight, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WinModalProps {
  isWon: boolean;
  setIsWon: (val: boolean) => void;
  isDarkMode: boolean;
  dailyPair: { number: number; start: string; end: string };
  finalScoreBreakdown: { base: number; hintPenalty: number; lengthPenalty: number; total: number } | null;
  idealPath: string[] | null;
  shareResult: () => void;
  isCopied: boolean;
  isDaily: boolean;
  handleNewGame: () => void;
  handleResetDaily: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isWon,
  setIsWon,
  isDarkMode,
  dailyPair,
  finalScoreBreakdown,
  idealPath,
  shareResult,
  isCopied,
  isDaily,
  handleNewGame,
  handleResetDaily
}) => {
  return (
    <AnimatePresence>
      {isWon && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={cn(
              "w-full max-w-md rounded-[32px] p-8 text-center relative overflow-hidden",
              isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black shadow-2xl"
            )}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
            
            <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200">
              <Trophy className="text-white w-10 h-10" />
            </div>

            <h2 className="text-3xl font-black tracking-tighter mb-2">Chain Complete!</h2>
            <p className="text-orange-500 font-bold text-sm uppercase tracking-widest mb-8">Game #{dailyPair.number}</p>

            {finalScoreBreakdown && (
              <div className={cn(
                "rounded-2xl p-6 mb-8 text-left space-y-3",
                isDarkMode ? "bg-white/5" : "bg-orange-50/50"
              )}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold opacity-40 uppercase tracking-widest">Base Score</span>
                  <span className="font-bold">{finalScoreBreakdown.base}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-xs font-bold uppercase tracking-widest">Hint Penalties</span>
                  <span className="font-bold">-{finalScoreBreakdown.hintPenalty}</span>
                </div>
                <div className="flex justify-between items-center text-red-500">
                  <span className="text-xs font-bold uppercase tracking-widest">Length Penalty</span>
                  <span className="font-bold">-{finalScoreBreakdown.lengthPenalty}</span>
                </div>
                <div className="pt-3 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-xl">
                  <span className="font-black tracking-tighter uppercase">Final Score</span>
                  <span className="font-black text-orange-500 tabular-nums">{finalScoreBreakdown.total}</span>
                </div>
              </div>
            )}

            {idealPath && (
              <div className="mb-10 text-left">
                <span className="text-[10px] uppercase font-bold opacity-40 block mb-3 tracking-widest">Ideal Path</span>
                <div className="flex flex-wrap gap-2">
                  {idealPath.map((word, i) => (
                    <React.Fragment key={word}>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors",
                        isDarkMode ? "bg-white/10" : "bg-black/5"
                      )}>{word}</span>
                      {i < idealPath.length - 1 && <ChevronRight className="w-3 h-3 self-center opacity-20" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={shareResult}
                className={cn(
                  "w-full py-5 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                  isCopied ? "bg-green-500 shadow-green-200" : "bg-orange-500 hover:bg-orange-600 shadow-orange-200"
                )}
              >
                <Share2 className="w-5 h-5" />
                {isCopied ? "Copied to Clipboard!" : "Share Results"}
              </button>
              <button 
                onClick={() => setIsWon(false)}
                className={cn(
                  "w-full py-3 rounded-xl text-xs font-bold opacity-60 hover:opacity-100 transition-opacity",
                  isDarkMode ? "text-white" : "text-black"
                )}
              >
                Close & View Board
              </button>
              <button 
                onClick={isDaily ? handleNewGame : handleResetDaily}
                className={cn(
                  "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                  isDarkMode ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"
                )}
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
