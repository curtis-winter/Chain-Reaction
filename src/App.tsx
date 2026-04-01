/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { validateLink, getDailyPair, getRandomPair, findNextWord, findShortestPath, getDifficulty } from './lib/gameLogic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Header } from './components/Header';
import { HelpSection } from './components/HelpSection';
import { GameStats } from './components/GameStats';
import { ChainDisplay } from './components/ChainDisplay';
import { InputSection } from './components/InputSection';
import { WinModal } from './components/WinModal';
import { Tutorial } from './components/Tutorial';

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

        const interval: ReturnType<typeof setInterval> = setInterval(function() {
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

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans selection:bg-orange-100",
      isDarkMode ? "bg-[#0F0F0F] text-[#F5F5F5]" : "bg-[#FDFCFB] text-[#1A1A1A]"
    )}>
      <Header 
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isDaily={isDaily}
        handleNewGame={handleNewGame}
        handleResetDaily={handleResetDaily}
        gameNumber={dailyPair.number}
        difficulty={difficulty}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
      />

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence>
          {showHelp && (
            <HelpSection 
              isDarkMode={isDarkMode}
              startWord={dailyPair.start}
              endWord={dailyPair.end}
              setShowTutorial={setShowTutorial}
            />
          )}
        </AnimatePresence>

        <GameStats 
          isDarkMode={isDarkMode}
          startWord={dailyPair.start}
          endWord={dailyPair.end}
          score={score}
          scoreAnimation={scoreAnimation}
        />

        <ChainDisplay 
          chain={chain}
          isDarkMode={isDarkMode}
          scrollRef={scrollRef}
        />

        <InputSection 
          input={input}
          setInput={setInput}
          isValidating={isValidating}
          error={error}
          setError={setError}
          hintLevel={hintLevel}
          handleHint={handleHint}
          handleSubmit={handleAddWord}
          inputRef={inputRef}
          isDarkMode={isDarkMode}
          handleUndo={handleUndo}
          chain={chain}
          isWon={isWon}
          successMessage={successMessage}
          isHintMaxed={hintWord ? input.length >= hintWord.length : false}
        />

        <WinModal 
          isWon={isWon}
          setIsWon={setIsWon}
          isDarkMode={isDarkMode}
          dailyPair={dailyPair}
          finalScoreBreakdown={finalScoreBreakdown}
          idealPath={idealPath}
          shareResult={shareResult}
          isCopied={isCopied}
          isDaily={isDaily}
          handleNewGame={handleNewGame}
          handleResetDaily={handleResetDaily}
          chain={chain}
        />

        <Tutorial 
          showTutorial={showTutorial}
          setShowTutorial={setShowTutorial}
          tutorialStep={tutorialStep}
          setTutorialStep={setTutorialStep}
          isDarkMode={isDarkMode}
        />
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.4);
        }
      `}</style>
    </div>
  );
}

