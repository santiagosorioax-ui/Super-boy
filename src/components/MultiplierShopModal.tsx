import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Flame, Zap, Gem, Crown, Star, Heart, Sun, Moon } from 'lucide-react';
import { PlayerInventory, MultiplierTier, WorldDimension } from '../types';
import { VALLEY_MULTIPLIER_TIERS, CANDY_MULTIPLIER_TIERS } from '../game/multiplierCatalog';
import { soundEngine } from '../audio/soundEngine';

interface MultiplierShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PlayerInventory;
  currentDimension?: WorldDimension;
  onBuyMultiplier: (tier: MultiplierTier) => void;
  onEquipMultiplier: (multiplier: number) => void;
}

export const MultiplierShopModal: React.FC<MultiplierShopModalProps> = ({
  isOpen,
  onClose,
  inventory,
  currentDimension = 'main',
  onBuyMultiplier,
  onEquipMultiplier,
}) => {
  const [activeTab, setActiveTab] = useState<'valley' | 'candy'>('valley');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(currentDimension === 'candy' ? 'candy' : 'valley');
    }
  }, [isOpen, currentDimension]);

  if (!isOpen) return null;

  const currentMultiplier = inventory.playerMultiplier || 1;
  const unlocked = inventory.unlockedMultipliers || [1];

  const displayedTiers = activeTab === 'candy' ? CANDY_MULTIPLIER_TIERS : VALLEY_MULTIPLIER_TIERS;

  const getTierIconComponent = (m: number) => {
    switch (m) {
      case 1:
        return <span className="text-2xl">🪙</span>;
      case 2:
        return <Zap className="w-7 h-7 text-sky-400 animate-pulse" />;
      case 3:
        return <Flame className="w-7 h-7 text-amber-400 animate-bounce" />;
      case 4:
        return <Gem className="w-7 h-7 text-purple-400" />;
      case 5:
        return <Crown className="w-7 h-7 text-pink-400" />;
      case 6:
        return <Star className="w-7 h-7 text-emerald-400 animate-spin" />;
      case 7:
        return <span className="text-2xl animate-bounce">🍬</span>;
      case 8:
        return <span className="text-2xl animate-pulse">🍭</span>;
      case 9:
        return <Heart className="w-7 h-7 text-fuchsia-400 animate-pulse" />;
      case 10:
        return <Sun className="w-7 h-7 text-purple-300 animate-spin" />;
      case 11:
        return <Moon className="w-7 h-7 text-sky-300 animate-bounce" />;
      case 12:
        return <Crown className="w-8 h-8 text-amber-300 animate-bounce" />;
      default:
        return <Sparkles className="w-7 h-7 text-yellow-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="multiplier-shop-modal"
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900/95 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/50 text-slate-100 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl shadow-inner shadow-purple-500/30">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                  Tienda de Multiplicadores
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-400/30">
                  {currentMultiplier}x Activo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ¡Multiplica el valor de todas tus monedas (1) y diamantes (5) en todo momento!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins Balance */}
            <div
              id="multiplier-shop-coins"
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 shadow-inner text-amber-300"
            >
              <span className="text-lg">🪙</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-200/70 font-semibold leading-none">MONEDAS</span>
                <span className="text-base sm:text-lg font-black tracking-tight leading-tight">{inventory.coins}</span>
              </div>
            </div>

            <button
              id="multiplier-shop-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* World Tabs Switcher */}
        <div className="px-4 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="tab-valle-multipliers"
              onClick={() => setActiveTab('valley')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'valley'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40 border border-indigo-400/50'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <span>🌲</span>
              <span>Valle Principal (1x - 6x)</span>
            </button>

            <button
              type="button"
              id="tab-candy-multipliers"
              onClick={() => setActiveTab('candy')}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                activeTab === 'candy'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-900/40 border border-pink-400/50 animate-pulse'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <span>🍬</span>
              <span>Mundo Caramelo (7x - 12x)</span>
              <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full uppercase">Nuevo</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Mundo actual: <strong className="text-amber-300">{currentDimension === 'candy' ? '🍬 Caramelo' : '🌲 Valle'}</strong></span>
          </div>
        </div>

        {/* Current Multiplier Status Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-950/60 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-bold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" /> Multiplicador Activo:
            </span>
            <span className="px-2.5 py-0.5 rounded-xl bg-purple-600 text-white font-black text-xs shadow-md">
              {currentMultiplier}x
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-300 font-medium">
            <span>🪙 Monedas: <strong className="text-amber-300 font-bold">+{1 * currentMultiplier}</strong></span>
            <span>💎 Diamantes: <strong className="text-cyan-300 font-bold">+{5 * currentMultiplier}</strong></span>
          </div>
        </div>

        {/* Multiplier Cards Grid */}
        <div className="p-4 overflow-y-auto max-h-[58vh] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedTiers.map((tier) => {
              const isUnlocked = unlocked.includes(tier.multiplier);
              const isActive = currentMultiplier === tier.multiplier;
              const canAfford = inventory.coins >= tier.price;

              return (
                <div
                  key={tier.multiplier}
                  id={`multiplier-card-${tier.multiplier}x`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-950/60 via-slate-800/90 to-indigo-950/80 border-purple-400 shadow-xl shadow-purple-500/20 ring-1 ring-purple-400/50'
                      : isUnlocked
                      ? 'bg-slate-800/60 border-slate-700 hover:border-purple-500/50'
                      : 'bg-slate-850/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge */}
                  <span
                    className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm"
                    style={{
                      backgroundColor: `${tier.color}22`,
                      borderColor: `${tier.color}66`,
                      color: tier.color,
                    }}
                  >
                    {tier.badge || `${tier.multiplier}x Multiplicador`}
                  </span>

                  {/* Icon & Title */}
                  <div className="flex gap-3 items-start">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md border"
                      style={{
                        backgroundColor: `${tier.color}20`,
                        borderColor: `${tier.color}55`,
                      }}
                    >
                      {getTierIconComponent(tier.multiplier)}
                    </div>

                    <div className="space-y-1 pr-14">
                      <h3 className="font-black text-base text-slate-100 flex items-center gap-1.5">
                        {tier.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  {/* Value Preview Strip */}
                  <div className="mt-3 py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-around text-xs">
                    <div className="flex items-center gap-1">
                      <span>🪙 Moneda:</span>
                      <strong className="text-amber-300 font-bold">+{1 * tier.multiplier}</strong>
                    </div>
                    <div className="h-3 w-px bg-slate-700" />
                    <div className="flex items-center gap-1">
                      <span>💎 Diamante:</span>
                      <strong className="text-cyan-300 font-bold">+{5 * tier.multiplier}</strong>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      {isUnlocked ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Desbloqueado
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-300 font-black text-sm">
                          <span>🪙</span>
                          <span>{tier.price.toLocaleString()}</span>
                          <span className="text-[10px] font-normal text-slate-400">monedas</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {isActive ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 rounded-xl bg-purple-500/25 border border-purple-400 text-purple-300 text-xs font-black flex items-center gap-1 cursor-default shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Activo ({tier.multiplier}x)
                        </button>
                      ) : isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playBuySound();
                            onEquipMultiplier(tier.multiplier);
                          }}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-900/40 transition active:scale-95 flex items-center gap-1"
                        >
                          <span>⚡ Equipar {tier.multiplier}x</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onBuyMultiplier(tier)}
                          disabled={!canAfford}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Comprar {tier.multiplier}x
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>💡</span>
          <span>
            {activeTab === 'candy'
              ? 'Los multiplicadores del Mundo de Caramelo (7x a 12x) aceleran tus ganancias de forma colosal.'
              : 'Una vez comprado cualquier multiplicador, se guarda para siempre y puedes cambiar entre ellos.'}
          </span>
        </div>
      </div>
    </div>
  );
};
