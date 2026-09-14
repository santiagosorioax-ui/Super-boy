import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSlidesForTarget, TransitionTarget, CartoonSlide } from '../assets/cartoons';

export interface LoadingScreenProps {
  isOpen: boolean;
  target?: TransitionTarget;
  title?: string;
  subtitle?: string;
  isWorldReady?: boolean;
  onFinish: () => void;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isOpen,
  target,
  isWorldReady = true,
  onFinish,
  minDurationMs = 450,
}) => {
  const currentTarget: TransitionTarget = target ?? 'game_start';

  // Stable ref for onFinish to prevent infinite loop or resets on parent re-renders
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const isWorldReadyRef = useRef(isWorldReady);
  isWorldReadyRef.current = isWorldReady;

  // Ordered 2D cartoon slides for the transition
  const slides: CartoonSlide[] = useMemo(() => {
    return getSlidesForTarget(currentTarget);
  }, [currentTarget, isOpen]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setProgress(0);
      setCanSkip(false);
    }
  }, [isOpen]);

  // Allow instant skip with keyboard (Space, Enter, WASD, Esc)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      onFinishRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Rotate images & tips
  useEffect(() => {
    if (!isOpen || slides.length <= 1) return;

    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(slideTimer);
  }, [isOpen, slides.length]);

  // Robust progress timer: connects to world readiness and finishes smoothly
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    let hasCompleted = false;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timeRatio = Math.min(1, elapsed / minDurationMs);
      const worldReady = isWorldReadyRef.current;

      let nextProgress: number;

      if (worldReady) {
        // When world is ready, progress advances steadily to 100%
        nextProgress = Math.min(100, Math.round(10 + timeRatio * 90));
      } else {
        // If world is still initializing, cap at 85% until world reports ready
        nextProgress = Math.min(85, Math.round(10 + timeRatio * 75));
      }

      // Hard timeout fallback: after 1.5 seconds, force 100%
      if (elapsed >= 1500) {
        nextProgress = 100;
      }

      setProgress(nextProgress);

      if (elapsed > 150 || worldReady) {
        setCanSkip(true);
      }

      if (nextProgress >= 100 && !hasCompleted) {
        hasCompleted = true;
        clearInterval(interval);
        setTimeout(() => {
          onFinishRef.current();
        }, 80);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, minDurationMs]);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  const handleManualDismiss = () => {
    onFinishRef.current();
  };

  return (
    <AnimatePresence>
      <motion.div
        id="game-fullscreen-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={handleManualDismiss}
        className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none cursor-pointer flex flex-col justify-end"
      >
        {/* 1. Fullscreen 2D Cartoon Background Image with Smooth Crossfade */}
        <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide.id}
              src={currentSlide.imageUrl}
              alt="Caricatura Super Boy 2D"
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          </AnimatePresence>

          {/* Vignette Gradient Overlay at Bottom for Perfect Contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 pointer-events-none" />
        </div>

        {/* Bottom Control Strip: Only Tip, Percentage, and Progress Bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col items-center gap-3.5">
          {/* 2. El Tip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.tip}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-2xl px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 shadow-2xl text-center"
            >
              <p className="text-white text-xs sm:text-sm font-semibold tracking-wide drop-shadow leading-relaxed">
                {currentSlide.tip}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* 3. El Porcentaje & 4. La Barra de Carga */}
          <div className="w-full space-y-1.5">
            <div className="flex justify-between items-center text-xs sm:text-sm font-black px-1">
              <span className="text-amber-300 drop-shadow flex items-center gap-1.5 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                {progress >= 100 ? '¡Listo!' : 'Cargando Mundo...'}
              </span>
              {/* El Porcentaje */}
              <span className="text-amber-400 text-base sm:text-lg font-black tracking-wider drop-shadow">
                {progress}%
              </span>
            </div>

            {/* La Barra de Carga */}
            <div className="w-full h-3.5 sm:h-4 rounded-full bg-black/80 border border-white/20 p-0.5 overflow-hidden shadow-2xl backdrop-blur-sm">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 shadow-lg shadow-emerald-400/40"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
