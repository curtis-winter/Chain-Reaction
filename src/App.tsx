/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  RotateCcw, 
  Share2, 
  Trophy, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Info,
  History,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateLink, getDailyPair, getRandomPair, findNextWord, findShortestPath } from './lib/gameLogic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [dailyPair, setDailyPair] = useState(getDailyPair());
  const [chain, setChain] = useState<string[]>([dailyPair.start]);
  const [idealPath, setIdealPath] = useState<string[] | null>(findShortestPath(dailyPair.start, dailyPair.end));
  const [input, setInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDaily, setIsDaily] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [score, setScore] = useState(100);
  const [scoreAnimation, setScoreAnimation] = useState<{ amount: number; reason: string } | null>(null);
  const [finalScoreBreakdown, setFinalScoreBreakdown] = useState<{ base: number; hintPenalty: number; lengthPenalty: number; total: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chain]);

  const handleNewGame = () => {
    const pair = getRandomPair();
    setDailyPair(pair);
    setChain([pair.start]);
    setIdealPath(findShortestPath(pair.start, pair.end));
    setInput('');
    setIsWon(false);
    setError(null);
    setSuccessMessage(null);
    setHintLevel(0);
    setHintWord(null);
    setIsDaily(false);
    setScore(100);
    setFinalScoreBreakdown(null);
    setScoreAnimation(null);
  };

  const handleResetDaily = () => {
    const pair = getDailyPair();
    setDailyPair(pair);
    setChain([pair.start]);
    setIdealPath(findShortestPath(pair.start, pair.end));
    setInput('');
    setIsWon(false);
    setError(null);
    setSuccessMessage(null);
    setHintLevel(0);
    setHintWord(null);
    setIsDaily(true);
    setScore(100);
    setFinalScoreBreakdown(null);
    setScoreAnimation(null);
  };

  const getFibonacci = (n: number): number => {
    if (n <= 1) return 1;
    if (n === 2) return 2;
    let a = 1;
    let b = 2;
    for (let i = 3; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  };

  const handleHint = () => {
    if (isWon || isValidating) return;

    let currentHintWord = hintWord;
    let nextLevel = hintLevel + 1;

    if (hintLevel === 0) {
      const nextWord = findNextWord(chain[chain.length - 1], dailyPair.end);
      if (nextWord) {
        currentHintWord = nextWord;
        setHintWord(nextWord);
      } else {
        setError("No hint available for this path.");
        return;
      }
    }

    setHintLevel(nextLevel);

    // Overwrite the input field with the hint based on Fibonacci sequence
    if (currentHintWord) {
      const prevLetters = hintLevel > 0 ? getFibonacci(hintLevel) : 0;
      const nextLetters = getFibonacci(nextLevel);
      const revealedNew = Math.min(nextLetters, currentHintWord.length) - Math.min(prevLetters, currentHintWord.length);
      
      if (revealedNew > 0) {
        setScore(prev => Math.max(0, prev - (revealedNew * 10)));
        setScoreAnimation({ amount: -(revealedNew * 10), reason: 'Hint' });
        setTimeout(() => setScoreAnimation(null), 1500);
      }

      setInput(currentHintWord.slice(0, Math.min(nextLetters, currentHintWord.length)));
    }
    
    inputRef.current?.focus();
  };

  const handleAddWord = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const word = input.trim().toUpperCase();
    if (!word || isValidating || isWon) return;

    if (chain.includes(word)) {
      setError("Word already in chain!");
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccessMessage(null);

    const lastWord = chain[chain.length - 1];
    const validation = await validateLink(lastWord, word);

    if (validation.isValid) {
      const newChain = [...chain, word];
      setChain(newChain);
      setInput('');
      setSuccessMessage("Valid Connection!");
      setHintLevel(0);
      setHintWord(null);
      setTimeout(() => setSuccessMessage(null), 2000);
      
      // Check if the word entered is the target word
      if (word === dailyPair.end.toUpperCase()) {
        const idealLength = idealPath ? idealPath.length : 0;
        const userLength = newChain.length;
        const extraWords = Math.max(0, userLength - idealLength);
        const lengthPenalty = extraWords * 10;
        
        const hintPenalty = 100 - score;
        const finalTotal = Math.max(0, 100 - hintPenalty - lengthPenalty);
        
        setFinalScoreBreakdown({
          base: 100,
          hintPenalty,
          lengthPenalty,
          total: finalTotal
        });

        setIsWon(true);
        setSuccessMessage(null);
        
        // Celebration
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    } else {
      setError(validation.reason || "Invalid link!");
    }
    setIsValidating(false);
    inputRef.current?.focus();
  };

  const handleUndo = () => {
    if (chain.length > 1 && !isWon) {
      setChain(chain.slice(0, -1));
      setError(null);
    }
  };

  const shareResult = () => {
    const idealLinks = idealPath ? idealPath.length - 1 : 0;
    const userLinks = chain.length - 1;
    const finalScore = finalScoreBreakdown?.total || 0;
    const dateStr = new Date().toLocaleDateString();
    const emojis = chain.map(() => '⛓️').join('');
    const text = `Chain Reaction #${dailyPair.number} (${dateStr})\nStart: ${dailyPair.start}\nEnd: ${dailyPair.end}\nLinks: ${userLinks} (Ideal: ${idealLinks})\nScore: ${finalScore}/100\n${emojis}\nPlay here: ${window.location.href}`;
    
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <RotateCcw className="text-white w-6 h-6 rotate-45" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chain Reaction</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-black/40">
                {isDaily ? 'Daily Challenge' : 'Random Challenge'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={isDaily ? handleNewGame : handleResetDaily}
                className="p-2 hover:bg-black/5 rounded-full transition-colors flex items-center gap-2 text-xs font-bold"
                title={isDaily ? "Play Random" : "Back to Daily"}
              >
                <RotateCcw className="w-4 h-4 opacity-60" />
                <span className="hidden sm:inline">{isDaily ? "Random" : "Daily"}</span>
              </button>
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <Info className="w-5 h-5 opacity-60" />
              </button>
            </div>
            <div className="px-2">
              <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">
                Game #{dailyPair.number}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Help Section */}
        <AnimatePresence>
          {showHelp && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-sm leading-relaxed">
                <h3 className="font-bold mb-2 text-orange-900">How to Play</h3>
                <p className="text-orange-800/80 mb-4">
                  Bridge the <strong>{dailyPair.start}</strong> and <strong>{dailyPair.end}</strong> by creating a chain of words. 
                  Each word must form a common phrase or compound word with the previous one.
                </p>
                <div className="flex gap-4 items-center text-xs font-mono bg-white/50 p-3 rounded-lg border border-orange-200/50">
                  <span>ICE</span>
                  <ChevronRight className="w-3 h-3 opacity-30" />
                  <span>CREAM</span>
                  <ChevronRight className="w-3 h-3 opacity-30" />
                  <span>CONE</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target Display */}
        <div className="flex justify-between items-center mb-12 px-2 relative">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-1">Start</span>
            <div className="text-2xl font-black tracking-tighter">{dailyPair.start}</div>
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
            <span className="text-[8px] uppercase font-black opacity-20 tracking-widest">Score</span>
          </div>

          <div className="text-center">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-30 block mb-1">Target</span>
            <div className="text-2xl font-black tracking-tighter text-orange-500">{dailyPair.end}</div>
          </div>
        </div>

        {/* The Chain */}
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  index === chain.length - 1 && !isWon 
                    ? "bg-white border-orange-200 shadow-sm" 
                    : "bg-black/5 border-transparent opacity-60",
                  word === dailyPair.end && "bg-orange-500 border-orange-400 opacity-100 text-white shadow-xl shadow-orange-200"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-bold opacity-40">
                  {index + 1}
                </div>
                <span className="text-lg font-bold tracking-tight uppercase">{word}</span>
                {index === chain.length - 1 && isWon && (
                  <Trophy className="w-5 h-5 ml-auto text-white animate-bounce" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Win State */}
        <AnimatePresence>
          {isWon && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm"
            >
              <motion.div 
                className="bg-white border-2 border-orange-500 rounded-[2.5rem] p-10 text-center shadow-[0_32px_64px_-12px_rgba(249,115,22,0.2)] max-w-md w-full"
                layoutId="win-card"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Trophy className="w-10 h-10 text-orange-500" />
                </motion.div>
                <div className="mb-2">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Game #{dailyPair.number}</span>
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tighter text-orange-600">CHAIN COMPLETE!</h2>
                <p className="text-black/60 mb-8 font-medium text-lg">
                  Excellent work! You bridged the gap in {chain.length - 1} links.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-10">
                  <div className="bg-orange-500 p-8 rounded-[2rem] text-white shadow-xl shadow-orange-200 relative overflow-hidden">
                    <div className="relative z-10">
                      <span className="text-[10px] uppercase font-black text-white/60 block mb-1 tracking-[0.2em]">Final Score</span>
                      <span className="text-6xl font-black tracking-tighter">
                        {finalScoreBreakdown?.total}
                      </span>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                      <Trophy size={120} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/5 p-4 rounded-2xl text-left">
                      <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Base Score</span>
                      <span className="text-xl font-black">100</span>
                    </div>
                    <div className="bg-black/5 p-4 rounded-2xl text-left">
                      <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Links Used</span>
                      <span className="text-xl font-black">{chain.length - 1}</span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl text-left border border-red-100">
                      <span className="text-[9px] uppercase font-bold text-red-400 block mb-1">Hint Penalty</span>
                      <span className="text-xl font-black text-red-600">-{finalScoreBreakdown?.hintPenalty}</span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl text-left border border-red-100">
                      <span className="text-[9px] uppercase font-bold text-red-400 block mb-1">Length Penalty</span>
                      <span className="text-xl font-black text-red-600">-{finalScoreBreakdown?.lengthPenalty}</span>
                    </div>
                  </div>
                </div>

                {/* Ideal Path Display */}
                {idealPath && (
                  <div className="mb-10 text-left">
                    <span className="text-[10px] uppercase font-bold opacity-40 block mb-3 tracking-widest">Ideal Path</span>
                    <div className="flex flex-wrap gap-2">
                      {idealPath.map((word, i) => (
                        <React.Fragment key={word}>
                          <span className="px-3 py-1 bg-black/5 rounded-full text-xs font-bold uppercase">{word}</span>
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
                    onClick={handleNewGame}
                    className="w-full py-5 bg-black/5 text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/10 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                    New Random Game
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      {!isWon && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-black/5 p-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-red-500 text-xs font-bold mb-3 px-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-green-600 text-xs font-bold mb-3 px-2"
                >
                  <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>
            <form onSubmit={handleAddWord} className="flex gap-2">
              <button
                type="button"
                onClick={handleHint}
                disabled={isWon || isValidating}
                className={cn(
                  "w-14 h-14 flex items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-20",
                  hintLevel > 0 ? "bg-orange-100 text-orange-600" : "bg-black/5 text-black/40 hover:bg-black/10"
                )}
                title="Get a hint"
              >
                <Lightbulb className={cn("w-6 h-6", hintLevel > 0 && "fill-orange-500")} />
              </button>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    hintLevel > 0 
                      ? `Hint: "${hintWord?.slice(0, getFibonacci(hintLevel))}"...` 
                      : `Links with ${chain[chain.length - 1]}...`
                  }
                  disabled={isValidating}
                  className={cn(
                    "w-full h-14 px-6 bg-black/5 rounded-2xl font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50",
                    error ? "focus:ring-red-500/20" : "focus:ring-orange-500/20",
                    successMessage ? "bg-green-50/50 border-green-100" : "",
                    hintLevel > 0 ? "placeholder:text-orange-400/60" : ""
                  )}
                  autoFocus
                />
                {isValidating && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin opacity-40" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleUndo}
                disabled={chain.length <= 1 || isValidating}
                className="w-14 h-14 flex items-center justify-center bg-black/5 rounded-2xl hover:bg-black/10 transition-colors disabled:opacity-20"
              >
                <History className="w-6 h-6" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isValidating}
                className="w-14 h-14 flex items-center justify-center bg-orange-500 text-white rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg shadow-orange-200"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
