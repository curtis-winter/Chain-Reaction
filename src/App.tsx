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
  Lightbulb,
  Moon,
  Sun,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { validateLink, getDailyPair, getRandomPair, findNextWord, findShortestPath, getDifficulty } from './lib/gameLogic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [dailyPair, setDailyPair] = useState(() => getDailyPair());
  const [chain, setChain] = useState<string[]>(() => [dailyPair.start]);
  const [idealPath, setIdealPath] = useState<string[] | null>(() => findShortestPath(dailyPair.start, dailyPair.end));
  const [input, setInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isDaily, setIsDaily] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [score, setScore] = useState(100);
  const [scoreAnimation, setScoreAnimation] = useState<{ amount: number; reason: string } | null>(null);
  const [finalScoreBreakdown, setFinalScoreBreakdown] = useState<{ base: number; hintPenalty: number; lengthPenalty: number; total: number } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const difficulty = React.useMemo(() => getDifficulty(idealPath), [idealPath]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chain]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const handleNewGame = React.useCallback(() => {
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
  }, []);

  const handleResetDaily = React.useCallback(() => {
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
  }, []);

  const getFibonacci = React.useCallback((n: number): number => {
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
  }, []);

  const handleHint = React.useCallback(() => {
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
  }, [chain, dailyPair.end, getFibonacci, hintLevel, hintWord, isWon, isValidating]);

  const handleAddWord = React.useCallback(async (e?: React.FormEvent) => {
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
  }, [chain, dailyPair.end, idealPath, input, isWon, isValidating, score]);

  const handleUndo = React.useCallback(() => {
    if (chain.length > 1 && !isWon) {
      setChain(chain.slice(0, -1));
      setError(null);
    }
  }, [chain, isWon]);

  const shareResult = React.useCallback(async () => {
    const idealLinks = idealPath ? idealPath.length - 1 : 0;
    const userLinks = chain.length - 1;
    const finalScore = finalScoreBreakdown?.total || 0;
    const dateStr = new Date().toLocaleDateString();
    const emojis = chain.map(() => '⛓️').join('');
    let appUrl = '';
    if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' && process.env.APP_URL !== '') {
      appUrl = process.env.APP_URL;
    } else {
      appUrl = window.location.origin;
    }
    
    // Replace 0.0.0.0 with localhost for better link recognition
    if (appUrl.includes('0.0.0.0')) {
      appUrl = appUrl.replace('0.0.0.0', 'localhost');
    }
    
    // Ensure trailing slash
    if (!appUrl.endsWith('/')) appUrl += '/';

    const text = `Chain Reaction #${dailyPair.number} (${dateStr})\nStart: ${dailyPair.start}\nEnd: ${dailyPair.end}\nLinks: ${userLinks} (Ideal: ${idealLinks})\nScore: ${finalScore}/100\n${emojis}\n\nPlay at: ${appUrl}`;
    
    console.log('Sharing text:', text);

    // Try Web Share API first (requires HTTPS or localhost)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chain Reaction Results',
          text: text,
          url: appUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Fallback to Clipboard API
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return;
      }
    } catch (err) {
      console.error('Clipboard API failed:', err);
    }

    // Final fallback: Legacy execCommand('copy')
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM and "visible" to the browser
      textArea.style.position = "fixed";
      textArea.style.left = "0";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      textArea.style.pointerEvents = "none";
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // For iOS
      textArea.setSelectionRange(0, 999999);
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (err) {
      console.error('Legacy copy failed:', err);
      // If all else fails, show the text in a prompt so they can copy it
      window.prompt('Copy your results:', text);
    }
  }, [chain, dailyPair.end, dailyPair.number, dailyPair.start, finalScoreBreakdown?.total, idealPath]);

  const tutorialSteps = [
    {
      title: "The Goal",
      description: "Bridge the gap between the Start and Target words using as few links as possible.",
      icon: <Trophy className="w-12 h-12 text-orange-500" />,
      color: "bg-orange-500"
    },
    {
      title: "How to Link",
      description: "Each word must form a common phrase or compound word with the previous one.",
      example: "ICE → CREAM → CONE",
      icon: <ChevronRight className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-500"
    },
    {
      title: "Controls",
      description: "Type words in the input. Use Undo to go back, and Hint if you're stuck.",
      icon: <Lightbulb className="w-12 h-12 text-yellow-500" />,
      color: "bg-yellow-500"
    },
    {
      title: "Scoring",
      description: "Start with 100 points. Hints and extra links deduct from your final score.",
      icon: <History className="w-12 h-12 text-green-500" />,
      color: "bg-green-500"
    }
  ];

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans selection:bg-orange-100",
      isDarkMode ? "bg-[#0F0F0F] text-[#F5F5F5]" : "bg-[#FDFCFB] text-[#1A1A1A]"
    )}>
      {/* Header */}
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
                onClick={() => setShowTutorial(true)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
                title="Tutorial"
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
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <Info className="w-5 h-5 opacity-60" />
              </button>
            </div>
            <div className="px-2 flex flex-col items-end">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                isDarkMode ? "opacity-30" : "opacity-20"
              )}>
                Game #{dailyPair.number}
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
              <div className={cn(
                "rounded-2xl p-6 text-sm leading-relaxed border transition-colors duration-300",
                isDarkMode 
                  ? "bg-orange-950/20 border-orange-900/30 text-orange-200" 
                  : "bg-orange-50 border-orange-100 text-orange-900"
              )}>
                <h3 className={cn("font-bold mb-2", isDarkMode ? "text-orange-400" : "text-orange-900")}>How to Play</h3>
                <p className={cn("mb-4", isDarkMode ? "text-orange-200/70" : "text-orange-800/80")}>
                  Bridge the <strong>{dailyPair.start}</strong> and <strong>{dailyPair.end}</strong> by creating a chain of words. 
                  Each word must form a common phrase or compound word with the previous one.
                </p>
                <button 
                  onClick={() => setShowTutorial(true)}
                  className={cn(
                    "mb-4 text-xs font-bold underline underline-offset-4 decoration-2 transition-colors",
                    isDarkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-700 hover:text-orange-800"
                  )}
                >
                  View Full Tutorial
                </button>
                <div className={cn(
                  "flex gap-4 items-center text-xs font-mono p-3 rounded-lg border transition-colors",
                  isDarkMode ? "bg-black/40 border-orange-900/20" : "bg-white/50 border-orange-200/50"
                )}>
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

        {/* Tutorial Modal */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className={cn(
                  "max-w-sm w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden",
                  isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black"
                )}
              >
                <div className="relative z-10">
                  <button 
                    onClick={() => {
                      setShowTutorial(false);
                      setTutorialStep(0);
                    }}
                    className={cn(
                      "absolute -top-2 -right-2 p-2 rounded-full transition-colors",
                      isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                    )}
                    aria-label="Close tutorial"
                  >
                    <X className="w-5 h-5 opacity-40" />
                  </button>
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-1">
                      {tutorialSteps.map((_, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            i === tutorialStep ? "w-8 bg-orange-500" : "w-2 bg-gray-300 dark:bg-gray-700"
                          )}
                        />
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setShowTutorial(false);
                        setTutorialStep(0);
                      }}
                      className="text-xs font-bold opacity-40 hover:opacity-100 transition-opacity"
                    >
                      Skip
                    </button>
                  </div>

                  <motion.div
                    key={tutorialStep}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="text-center"
                  >
                    <div className={cn(
                      "w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-colors",
                      isDarkMode ? "bg-white/5" : "bg-black/5"
                    )}>
                      {tutorialSteps[tutorialStep].icon}
                    </div>
                    <h3 className="text-2xl font-black mb-3 tracking-tight">
                      {tutorialSteps[tutorialStep].title}
                    </h3>
                    <p className={cn(
                      "text-sm font-medium leading-relaxed mb-6",
                      isDarkMode ? "text-white/60" : "text-black/60"
                    )}>
                      {tutorialSteps[tutorialStep].description}
                    </p>
                    {tutorialSteps[tutorialStep].example && (
                      <div className={cn(
                        "p-4 rounded-2xl font-mono text-xs mb-8 border",
                        isDarkMode ? "bg-black/40 border-white/5" : "bg-black/5 border-black/5"
                      )}>
                        {tutorialSteps[tutorialStep].example}
                      </div>
                    )}
                  </motion.div>

                  <div className="flex gap-3">
                    {tutorialStep > 0 && (
                      <button 
                        onClick={() => setTutorialStep(prev => prev - 1)}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-bold transition-all active:scale-95",
                          isDarkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                        )}
                      >
                        Back
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (tutorialStep < tutorialSteps.length - 1) {
                          setTutorialStep(prev => prev + 1);
                        } else {
                          setShowTutorial(false);
                          setTutorialStep(0);
                        }
                      }}
                      className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all active:scale-95 hover:bg-orange-600"
                    >
                      {tutorialStep === tutorialSteps.length - 1 ? "Start Playing" : "Next"}
                    </button>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className={cn(
                  "absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl opacity-10",
                  tutorialSteps[tutorialStep].color
                )} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target Display */}
        <div className="flex justify-between items-center mb-12 px-2 relative">
          <div className="text-center">
            <span className={cn(
              "text-[10px] uppercase tracking-widest font-bold block mb-1",
              isDarkMode ? "opacity-40" : "opacity-30"
            )}>Start</span>
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
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                  index === chain.length - 1 && !isWon 
                    ? (isDarkMode ? "bg-white/5 border-orange-500/30 shadow-sm shadow-orange-500/10" : "bg-white border-orange-200 shadow-sm") 
                    : (isDarkMode ? "bg-white/5 border-transparent opacity-40" : "bg-black/5 border-transparent opacity-60"),
                  word === dailyPair.end && "bg-orange-500 border-orange-400 opacity-100 text-white shadow-xl shadow-orange-200"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                  isDarkMode ? "bg-white/10 opacity-60" : "bg-black/5 opacity-40"
                )}>
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
              className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-colors duration-300",
                isDarkMode ? "bg-black/60" : "bg-white/60"
              )}
            >
              <motion.div 
                className={cn(
                  "border-2 rounded-[2.5rem] p-10 text-center max-w-md w-full transition-colors duration-300",
                  isDarkMode 
                    ? "bg-[#1A1A1A] border-orange-500/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]" 
                    : "bg-white border-orange-500 shadow-[0_32px_64px_-12px_rgba(249,115,22,0.2)]"
                )}
                layoutId="win-card"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors",
                    isDarkMode ? "bg-orange-500/20" : "bg-orange-100"
                  )}
                >
                  <Trophy className="w-10 h-10 text-orange-500" />
                </motion.div>
                <div className="mb-2">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em]">Game #{dailyPair.number}</span>
                </div>
                <h2 className={cn(
                  "text-4xl font-black mb-2 tracking-tighter transition-colors",
                  isDarkMode ? "text-orange-400" : "text-orange-600"
                )}>CHAIN COMPLETE!</h2>
                <p className={cn(
                  "mb-8 font-medium text-lg transition-colors",
                  isDarkMode ? "text-white/60" : "text-black/60"
                )}>
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
                    <div className={cn("p-4 rounded-2xl text-left transition-colors", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                      <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Base Score</span>
                      <span className="text-xl font-black">100</span>
                    </div>
                    <div className={cn("p-4 rounded-2xl text-left transition-colors", isDarkMode ? "bg-white/5" : "bg-black/5")}>
                      <span className="text-[9px] uppercase font-bold opacity-40 block mb-1">Links Used</span>
                      <span className="text-xl font-black">{chain.length - 1}</span>
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-left border transition-colors",
                      isDarkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100"
                    )}>
                      <span className="text-[9px] uppercase font-bold text-red-400 block mb-1">Hint Penalty</span>
                      <span className="text-xl font-black text-red-600">-{finalScoreBreakdown?.hintPenalty}</span>
                    </div>
                    <div className={cn(
                      "p-4 rounded-2xl text-left border transition-colors",
                      isDarkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100"
                    )}>
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
                    onClick={isDaily ? handleResetDaily : handleNewGame}
                    className={cn(
                      "w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                      isDarkMode ? "bg-white/5 text-white hover:bg-white/10" : "bg-black/5 text-black hover:bg-black/10"
                    )}
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </button>
                  {!isDaily && (
                    <button 
                      onClick={handleResetDaily}
                      className={cn(
                        "w-full py-3 rounded-xl text-xs font-bold opacity-60 hover:opacity-100 transition-opacity",
                        isDarkMode ? "text-white" : "text-black"
                      )}
                    >
                      Back to Daily Challenge
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input Area */}
      {!isWon && (
        <div className={cn(
          "fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t p-4 pb-8 transition-colors duration-300",
          isDarkMode ? "bg-[#0F0F0F]/80 border-white/5" : "bg-white/80 border-black/5"
        )}>
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
                  hintLevel > 0 
                    ? (isDarkMode ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600") 
                    : (isDarkMode ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-black/5 text-black/40 hover:bg-black/10")
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
                    "w-full h-14 px-6 rounded-2xl font-bold uppercase tracking-wide focus:outline-none focus:ring-2 transition-all disabled:opacity-50",
                    isDarkMode ? "bg-white/5 focus:bg-white/10" : "bg-black/5 focus:bg-white",
                    error ? "focus:ring-red-500/20" : "focus:ring-orange-500/20",
                    successMessage ? (isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50/50 border-green-100") : "",
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
                className={cn(
                  "w-14 h-14 flex items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-20",
                  isDarkMode ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-black/5 text-black/60 hover:bg-black/10"
                )}
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
