import React, { useState } from 'react';
import {
  Trophy,
  Medal,
  X,
  CheckCircle2,
  Lock,
  Gift,
  Coins,
  Sparkles,
  Swords,
  Compass,
  ShieldAlert,
} from 'lucide-react';
import {
  ACHIEVEMENTS_LIST,
  AchievementCategory,
  AchievementItem,
  PlayerAchievementStats,
  getAchievementStatus,
} from '../achievements/achievementsData';
import { soundEngine } from '../audio/soundEngine';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerAchievementStats;
  onClaimReward: (achievementId: string, rewardCoins: number) => void;
  onClaimAllRewards: (claimList: { id: string; rewardCoins: number }[]) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onClaimReward,
  onClaimAllRewards,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('all');

  if (!isOpen) return null;

  // Process all achievements with live status
  const processedAchievements = ACHIEVEMENTS_LIST.map((ach) => {
    const status = getAchievementStatus(ach, stats);
    return {
      ...ach,
      status,
    };
  });

  const filteredAchievements = processedAchievements.filter((ach) => {
    if (selectedCategory === 'all') return true;
    return ach.category === selectedCategory;
  });

  const totalUnlocked = processedAchievements.filter((a) => a.status.isUnlocked).length;
  const claimableList = processedAchievements.filter((a) => a.status.canClaim);
  const totalCoinsPending = claimableList.reduce((sum, a) => sum + a.rewardCoins, 0);

  const categories: { id: AchievementCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'Todos', icon: <Medal className="w-4 h-4" /> },
    { id: 'combat', label: 'Combate', icon: <Swords className="w-4 h-4" /> },
    { id: 'coins', label: 'Monedas', icon: <Coins className="w-4 h-4" /> },
    { id: 'exploration', label: 'Exploración', icon: <Compass className="w-4 h-4" /> },
    { id: 'arsenal', label: 'Arsenal y Estilo', icon: <ShieldAlert className="w-4 h-4" /> },
  ];

  const getTierColor = (tier: AchievementItem['badgeTier']) => {
    switch (tier) {
      case 'diamond':
        return 'from-cyan-400 via-sky-300 to-indigo-500 border-cyan-400/60 shadow-cyan-500/30';
      case 'gold':
        return 'from-amber-400 via-yellow-300 to-amber-600 border-amber-400/60 shadow-amber-500/30';
      case 'silver':
        return 'from-slate-300 via-slate-100 to-slate-400 border-slate-300/60 shadow-slate-400/30';
      case 'bronze':
      default:
        return 'from-orange-600 via-amber-700 to-stone-800 border-orange-500/40 shadow-orange-700/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-amber-500/10 flex flex-col max-h-[88vh] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-lg shadow-amber-500/30 text-slate-950">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
                Logros y Medallas
              </h2>
              <p className="text-xs text-slate-400">
                ¡Alcanza hitos heroicos y gana grandes recompensas en monedas!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Overview Bar & Claim All Action */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1.5 rounded-full border border-slate-700">
              <Medal className="w-4 h-4 text-amber-400" />
              <span>
                Desbloqueados: <strong className="text-amber-400">{totalUnlocked}</strong> / {ACHIEVEMENTS_LIST.length}
              </span>
            </div>
            {claimableList.length > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/90 px-3 py-1.5 rounded-full border border-emerald-600/50 text-emerald-300 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  Por reclamar: <strong className="text-yellow-300">+{totalCoinsPending.toLocaleString()} 🪙</strong>
                </span>
              </div>
            )}
          </div>

          {claimableList.length > 0 && (
            <button
              onClick={() => {
                soundEngine.playVictoryFanfare();
                onClaimAllRewards(claimableList.map((a) => ({ id: a.id, rewardCoins: a.rewardCoins })));
              }}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1.5 transform active:scale-95 transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>Reclamar Todo (+{totalCoinsPending.toLocaleString()} 🪙)</span>
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 overflow-x-auto no-scrollbar border-b border-slate-800/60 bg-slate-900/40">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playButtonClick();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredAchievements.map((ach) => {
            const { currentValue, targetValue, percentage, isUnlocked, isClaimed, canClaim } = ach.status;

            return (
              <div
                key={ach.id}
                className={`relative p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isClaimed
                    ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    : canClaim
                    ? 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                {/* Left side: Icon & Details */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md border ${
                      isClaimed
                        ? 'bg-slate-800/90 border-slate-700 text-slate-500'
                        : isUnlocked
                        ? `bg-gradient-to-br ${getTierColor(ach.badgeTier)} text-white`
                        : 'bg-slate-800/90 border-slate-700 text-slate-400'
                    }`}
                  >
                    {ach.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-slate-100">{ach.title}</h3>
                      {isClaimed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-700/50">
                          <CheckCircle2 className="w-3 h-3" /> Reclamado
                        </span>
                      )}
                      {canClaim && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          <Sparkles className="w-3 h-3" /> ¡Completado!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                        <span>Progreso</span>
                        <span className="font-mono">
                          {currentValue.toLocaleString()} / {targetValue.toLocaleString()} {ach.unit} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            isUnlocked
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
                              : 'bg-indigo-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Reward & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:flex-col sm:items-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-500/30">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span>+{ach.rewardCoins.toLocaleString()}</span>
                  </div>

                  {isClaimed ? (
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Reclamado
                    </span>
                  ) : canClaim ? (
                    <button
                      onClick={() => {
                        soundEngine.playCoinSound();
                        onClaimReward(ach.id, ach.rewardCoins);
                      }}
                      className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transform active:scale-95 transition-all animate-bounce"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>Reclamar</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloqueado</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>¡Sigue explorando y luchando para desbloquear más medallas!</span>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
