import React from 'react';
import { RotateCcw, Info, Sun, Moon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isDaily: boolean;
  handleNewGame: () => void;
  handleResetDaily: () => void;
  gameNumber: number;
  difficulty: string;
  showHelp: boolean;
  setShowHelp: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  setIsDarkMode,
  isDaily,
  handleNewGame,
  handleResetDaily,
  gameNumber,
  difficulty,
  showHelp,
  setShowHelp
}) => {
  return (
    <header className={cn(
      "border-b sticky top-0 z-10 backdrop-blur-md transition-colors duration-300",
      isDarkMode ? "bg-[#0F0F0F]/80 border-white/5" : "bg-white/80 border-black/5"
    )}>
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
            <RotateCcw className="text-white w-6 h-6 rotate-45" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Chain Reaction</h1>
            <p className={cn(
              "text-[10px] uppercase tracking-widest font-semibold",
              isDarkMode ? "text-white/40" : "text-black/40"
            )}>
              {isDaily ? 'Daily Challenge' : 'Random Challenge'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showHelp 
                  ? (isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600")
                  : (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")
              )}
              title="How to Play"
            >
              <Info className="w-5 h-5 opacity-60" />
            </button>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 opacity-60" />}
            </button>
            <button 
              onClick={isDaily ? handleNewGame : handleResetDaily}
              className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 text-xs font-bold"
              title={isDaily ? "Play Random" : "Back to Daily"}
            >
              <RotateCcw className="w-4 h-4 opacity-60" />
              <span className="hidden sm:inline">{isDaily ? "Random" : "Daily"}</span>
            </button>
          </div>
          <div className="px-2 flex flex-col items-end">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              isDarkMode ? "opacity-30" : "opacity-20"
            )}>
              Game #{gameNumber}
            </span>
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5",
              difficulty === 'Easy' && (isDarkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600"),
              difficulty === 'Medium' && (isDarkMode ? "bg-yellow-500/10 text-yellow-400" : "bg-yellow-50 text-yellow-600"),
              difficulty === 'Hard' && (isDarkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600")
            )}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
