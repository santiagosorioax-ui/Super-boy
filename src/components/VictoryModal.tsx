import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Star, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalCoins: number;
  timeElapsedSeconds: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  score,
  totalCoins,
  timeElapsedSeconds,
  onRestart,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti!
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mins = Math.floor(timeElapsedSeconds / 60);
  const secs = Math.floor(timeElapsedSeconds % 60);
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in font-sans">
      <div 
        id="victory-modal-card"
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-white text-center relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-xl mb-4 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
          ¡FELICITACIONES!
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-5">
          Has recolectado todas las monedas y gemas del mapa de Santi 3D.
        </p>

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Star className="w-7 h-7 fill-amber-400 text-amber-400 drop-shadow" />
          <Star className="w-8 h-8 fill-amber-400 text-amber-400 drop-shadow" />
          <Star className="w-7 h-7 fill-amber-400 text-amber-400 drop-shadow" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 mb-6 text-left">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Puntuación</span>
            <span className="text-base font-extrabold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {score} pts
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Monedas</span>
            <span className="text-base font-extrabold text-emerald-400">
              {totalCoins} / {totalCoins}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Tiempo de Aventura</span>
            <span className="text-sm font-bold text-slate-200">{formattedTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            id="victory-btn-restart"
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            Jugar Otra Vez
          </button>

          <button
            type="button"
            id="victory-btn-continue"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            Seguir Explorando el Mundo
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
