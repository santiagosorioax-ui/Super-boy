import React from 'react';
import { Skull, RotateCcw, Coins, Heart, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface DeathModalProps {
  isOpen: boolean;
  coinsLost: number;
  remainingCoins: number;
  onRetry: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  isOpen,
  coinsLost,
  remainingCoins,
  onRetry,
}) => {
  if (!isOpen) return null;

  const handleRetryClick = () => {
    soundEngine.playButtonClick();
    onRetry();
  };

  return (
    <div
      id="death-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in font-sans"
    >
      <div
        id="death-modal-card"
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-rose-950/60 to-slate-950 border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-white text-center relative overflow-hidden ring-1 ring-rose-500/20"
      >
        {/* Ominous Red Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Skull Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-xl mb-4 animate-bounce">
          <Skull className="w-8 h-8 text-rose-400" />
        </div>

        {/* Header */}
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-rose-500 tracking-tight">
          ¡HAS SIDO DERROTADO!
        </h2>
        <p className="text-xs text-rose-200/80 mt-1.5 mb-5 leading-relaxed">
          Los zombis nocturnos te golpearon 5 veces consecutivas y caíste en combate.
        </p>

        {/* Penalty / Stats Summary */}
        <div className="bg-slate-950/80 border border-rose-900/40 rounded-2xl p-4 mb-6 text-left space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Monedas perdidas:
            </span>
            <span className="text-sm font-extrabold text-rose-400">
              {coinsLost > 0 ? `-${coinsLost}` : '0'} monedas
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">Monedas restantes:</span>
            <span className="text-sm font-bold text-amber-300">
              {remainingCoins} monedas
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Salud al revivir:
            </span>
            <span className="text-emerald-400 font-bold">5 / 5 (Completa)</span>
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 mb-5 text-left text-[11px] text-amber-200/90">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Consejo:</strong> Los zombis solo merodean y atacan durante la <strong>noche</strong>. Usa tu espada para eliminarlos o busca refugio hasta que amanezca.
          </span>
        </div>

        {/* Reintentar Button */}
        <button
          id="btn-retry-respawn"
          onClick={handleRetryClick}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-600/30 transition-all border border-rose-400/40"
        >
          <RotateCcw className="w-5 h-5 animate-spin-reverse" />
          <span>Reintentar (Reaparecer en la Plaza)</span>
        </button>
      </div>
    </div>
  );
};
