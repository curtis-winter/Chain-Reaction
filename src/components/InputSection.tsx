import React from 'react';
import { Send, Lightbulb, AlertCircle, Loader2, X, Undo2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputSectionProps {
  input: string;
  setInput: (val: string) => void;
  isValidating: boolean;
  error: string | null;
  setError: (val: string | null) => void;
  hintLevel: number;
  handleHint: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isDarkMode: boolean;
  handleUndo: () => void;
  chain: string[];
  isWon: boolean;
  successMessage: string | null;
  isHintMaxed: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  input,
  setInput,
  isValidating,
  error,
  setError,
  hintLevel,
  handleHint,
  handleSubmit,
  inputRef,
  isDarkMode,
  handleUndo,
  chain,
  isWon,
  successMessage,
  isHintMaxed
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0F0F0F] dark:via-[#0F0F0F] dark:to-transparent pt-12">
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-center gap-3 text-green-600 dark:text-green-400 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Type the next word..."
            className={cn(
              "w-full py-6 pl-6 pr-32 rounded-3xl font-bold text-lg transition-all outline-none border-2 uppercase",
              isDarkMode 
                ? "bg-white/5 border-white/5 focus:border-orange-500/50 text-white placeholder:text-white/20" 
                : "bg-white border-black/5 focus:border-orange-500/30 shadow-2xl shadow-orange-100/50 placeholder:text-black/20"
            )}
            disabled={isValidating}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={isValidating || chain.length <= 1 || isWon}
              className={cn(
                "p-3 rounded-2xl transition-all active:scale-95",
                (chain.length <= 1 || isWon)
                  ? "opacity-20 cursor-not-allowed" 
                  : (isDarkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-gray-50 text-gray-500 hover:bg-gray-100")
              )}
              title="Undo last word"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleHint}
              disabled={isValidating || isHintMaxed || isWon}
              className={cn(
                "p-3 rounded-2xl transition-all active:scale-95",
                (isHintMaxed || isWon)
                  ? "opacity-20 cursor-not-allowed" 
                  : (isDarkMode ? "bg-white/5 text-orange-400 hover:bg-white/10" : "bg-orange-50 text-orange-500 hover:bg-orange-100")
              )}
              title="Get a hint (-10 points per letter)"
            >
              <Lightbulb className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={isValidating || !input.trim()}
              className={cn(
                "p-3 rounded-2xl transition-all active:scale-95 shadow-lg",
                input.trim() 
                  ? "bg-orange-500 text-white shadow-orange-200" 
                  : "bg-black/5 text-black/20 dark:bg-white/5 dark:text-white/20 shadow-none"
              )}
            >
              {isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
