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
  durationMs?: number;
  minDurationMs?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isOpen,
  target,
  title,
  subtitle,
  isWorldReady = true,
  onFinish,
  durationMs,
  minDurationMs,
}) => {
  const currentTarget: TransitionTarget = target ?? 'game_start';

  // Specific durations required by user:
  // - Start game: 15s
  // - Enter structure: 5s
  // - Enter world: 10s
  const effectiveDuration = useMemo(() => {
    if (durationMs && durationMs > 0) return durationMs;
    if (minDurationMs && minDurationMs !== 20000 && minDurationMs > 0) return minDurationMs;
    if (currentTarget === 'game_start') return 15000;
    if (currentTarget === 'structure') return 5000;
    return 10000; // 'candy' | 'mayan_boss' | 'main'
  }, [durationMs, minDurationMs, currentTarget]);

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

  // Dynamic slide rotation interval scaled to loading duration
  const rotationInterval = useMemo(() => {
    if (effectiveDuration <= 6000) return 2200;
    if (effectiveDuration <= 11000) return 3200;
    return 4000;
  }, [effectiveDuration]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setProgress(0);
      setCanSkip(false);
    }
  }, [isOpen]);

  // Rotate images & tips dynamically during the loading period
  useEffect(() => {
    if (!isOpen || slides.length <= 1) return;

    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, rotationInterval);

    return () => clearInterval(slideTimer);
  }, [isOpen, slides.length, rotationInterval]);

  // Progress timer: smoothly scales from 0% to 100% over the exact duration
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    let hasCompleted = false;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timeRatio = Math.min(1, elapsed / effectiveDuration);

      // Smooth percentage progression 0 -> 100%
      const nextProgress = Math.min(100, Math.round(timeRatio * 100));
      setProgress(nextProgress);

      if (elapsed > 1000) {
        setCanSkip(true);
      }

      if (elapsed >= effectiveDuration && !hasCompleted) {
        hasCompleted = true;
        clearInterval(interval);
        setTimeout(() => {
          onFinishRef.current();
        }, 100);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isOpen, effectiveDuration]);

  const statusLabel = useMemo(() => {
    if (progress >= 100) return '¡Listo para Jugar!';
    if (currentTarget === 'structure') return 'Cargando Estructura...';
    if (currentTarget === 'game_start') return 'Iniciando Super Boy 3D...';
    if (currentTarget === 'choco_temple') return 'Cargando Templo Choco...';
    if (currentTarget === 'candy') return 'Cargando Mundo Caramelo...';
    if (currentTarget === 'mayan_boss') return 'Cargando Templo Maya...';
    return 'Cargando Mundo...';
  }, [progress, currentTarget]);

  if (!isOpen) return null;

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <AnimatePresence>
      <motion.div
        id="game-fullscreen-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[99999] w-screen h-screen overflow-hidden select-none flex flex-col justify-end"
      >
        {/* Skip button in top right corner */}
        {canSkip && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFinishRef.current();
            }}
            className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/20 text-xs font-bold tracking-wide backdrop-blur-md transition-all shadow-lg active:scale-95"
          >
            Saltar ⏭️
          </button>
        )}
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

        {/* Bottom Control Strip: Title Badge, Tip, Percentage, and Progress Bar */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col items-center gap-3">
          {title && (
            <div className="px-4 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/30 text-[11px] sm:text-xs font-black text-amber-300 tracking-widest uppercase shadow-lg">
              {title}
            </div>
          )}

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
                {statusLabel}
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
