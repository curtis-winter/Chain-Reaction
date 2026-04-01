import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TutorialProps {
  showTutorial: boolean;
  setShowTutorial: (val: boolean) => void;
  tutorialStep: number;
  setTutorialStep: (val: number) => void;
  isDarkMode: boolean;
}

export const Tutorial: React.FC<TutorialProps> = ({
  showTutorial,
  setShowTutorial,
  tutorialStep,
  setTutorialStep,
  isDarkMode
}) => {
  const tutorialSteps = [
    {
      title: "The Goal",
      content: "Connect the start word to the target word using common phrases or compound words.",
      example: "Start: HOT, Target: DOG. Link: DOG (HOT DOG)."
    },
    {
      title: "How to Link",
      content: "Each new word must form a phrase with the previous word in the chain.",
      example: "ICE -> CREAM (ICE CREAM) -> SODA (CREAM SODA)."
    },
    {
      title: "Scoring",
      content: "Start with 100 points. Penalties apply for hints (-10) and long chains (-5 per extra link).",
      example: "Try to find the 'Ideal Path' for maximum points!"
    }
  ];

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className={cn(
              "w-full max-w-md rounded-[32px] p-8 relative overflow-hidden",
              isDarkMode ? "bg-[#1A1A1A] text-white" : "bg-white text-black shadow-2xl"
            )}
          >
            <button 
              onClick={() => {
                setShowTutorial(false);
                setTutorialStep(0);
              }}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 opacity-40" />
            </button>

            <div className="mb-8">
              <div className="flex gap-1 mb-6">
                {tutorialSteps.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500",
                      i <= tutorialStep ? "bg-orange-500" : (isDarkMode ? "bg-white/10" : "bg-black/5")
                    )}
                  />
                ))}
              </div>
              <h2 className="text-2xl font-black tracking-tighter mb-4">{tutorialSteps[tutorialStep].title}</h2>
              <p className={cn("text-sm leading-relaxed mb-6", isDarkMode ? "text-white/60" : "text-black/60")}>
                {tutorialSteps[tutorialStep].content}
              </p>
              <div className={cn(
                "p-4 rounded-2xl text-xs border italic",
                isDarkMode ? "bg-white/5 border-white/5 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-700"
              )}>
                {tutorialSteps[tutorialStep].example}
              </div>
            </div>

            <button 
              onClick={() => {
                if (tutorialStep < tutorialSteps.length - 1) {
                  setTutorialStep(tutorialStep + 1);
                } else {
                  setShowTutorial(false);
                  setTutorialStep(0);
                }
              }}
              className="w-full py-5 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              {tutorialStep < tutorialSteps.length - 1 ? "Next Step" : "Got it!"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
