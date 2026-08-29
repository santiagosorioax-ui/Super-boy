import React from 'react';
import { X, Crown, Shield, Zap, Sparkles, Coins, Swords, Flame, Heart, Check, Lock, Unlock, Compass } from 'lucide-react';
import { UserProfile, PlayerInventory, WorldDimension } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  inventory: PlayerInventory;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onRefillInfiniteCoins: () => void;
  onUnlockAllSwords: () => void;
  onUnlockAllMultipliers: () => void;
  onTeleportTo: (world: WorldDimension) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  inventory,
  onUpdateUser,
  onRefillInfiniteCoins,
  onUnlockAllSwords,
  onUnlockAllMultipliers,
  onTeleportTo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        id="user-profile-modal"
        className="relative w-full max-w-xl max-h-[92vh] bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl shadow-2xl shadow-amber-950/60 text-slate-100 flex flex-col overflow-hidden"
      >
        {/* Header with VIP Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/80 via-indigo-950/90 to-amber-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl">
                👑
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-purple-300 bg-clip-text text-transparent">
                  {user.username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-sm">
                  VIP SUPREMO
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-mono flex items-center gap-1">
                <span>📧</span> {user.email}
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            aria-label="Cerrar perfil"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm scrollbar-thin">
          {/* Status Overview Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-950/90 border border-amber-500/30 shadow-inner flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xl">
                ⚡
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">Estado de Cuenta</div>
                <div className="text-sm font-black text-amber-300">
                  {user.isUnlimited ? 'Ilimitado / Sin Restricciones' : 'Estándar'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Saldo Actual</div>
                <div className="text-base font-black text-yellow-400">
                  {user.infiniteCoins ? '∞ (Ilimitadas)' : `${inventory.coins.toLocaleString()} 🪙`}
                </div>
              </div>
              <button
                onClick={onRefillInfiniteCoins}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md active:scale-95 transition"
              >
                +999M 🪙
              </button>
            </div>
          </div>

          {/* Super Perks Controls */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Privilegios & Poderes Ilimitados
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Infinite Coins Toggle */}
              <div
                onClick={() => onUpdateUser({ infiniteCoins: !user.infiniteCoins })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.infiniteCoins
                    ? 'bg-amber-950/40 border-amber-400/80 shadow-md shadow-amber-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Monedas Infinitas</div>
                    <div className="text-[10px] text-slate-400">Compras gratis y saldo 999M</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.infiniteCoins ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.infiniteCoins ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* God Mode (Invulnerability) */}
              <div
                onClick={() => onUpdateUser({ isGodMode: !user.isGodMode })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.isGodMode
                    ? 'bg-emerald-950/40 border-emerald-400/80 shadow-md shadow-emerald-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Modo Dios (Inmortal)</div>
                    <div className="text-[10px] text-slate-400">0 daño de zombis y jefes</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.isGodMode ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.isGodMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Super Speed */}
              <div
                onClick={() => onUpdateUser({ superSpeed: !user.superSpeed })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.superSpeed
                    ? 'bg-blue-950/40 border-blue-400/80 shadow-md shadow-blue-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Súper Velocidad</div>
                    <div className="text-[10px] text-slate-400">+100% velocidad de sprint</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.superSpeed ? 'bg-blue-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.superSpeed ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Super Jump */}
              <div
                onClick={() => onUpdateUser({ superJump: !user.superJump })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.superJump
                    ? 'bg-purple-950/40 border-purple-400/80 shadow-md shadow-purple-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Salto Lunar Supremo</div>
                    <div className="text-[10px] text-slate-400">+100% altura de salto</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.superJump ? 'bg-purple-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.superJump ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Super Magnet */}
              <div
                onClick={() => onUpdateUser({ superMagnet: !user.superMagnet })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.superMagnet
                    ? 'bg-yellow-950/40 border-yellow-400/80 shadow-md shadow-yellow-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Súper Imán Permanente</div>
                    <div className="text-[10px] text-slate-400">Atrae monedas en 50m</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.superMagnet ? 'bg-yellow-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.superMagnet ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>

              {/* Free Temple Pass */}
              <div
                onClick={() => onUpdateUser({ freeTemplePass: !user.freeTemplePass })}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  user.freeTemplePass
                    ? 'bg-teal-950/40 border-teal-400/80 shadow-md shadow-teal-900/30'
                    : 'bg-slate-800/50 border-slate-700/60 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Pase Libre Templo Maya</div>
                    <div className="text-[10px] text-slate-400">Entrada gratis sin 500 monedas</div>
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${user.freeTemplePass ? 'bg-teal-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.25 transition-transform ${user.freeTemplePass ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Unlock All) */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              Desbloqueo Rápido de Inventario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={onUnlockAllSwords}
                className="p-3 rounded-2xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Swords className="w-4 h-4" />
                Desbloquear Todas las Espadas
              </button>
              <button
                onClick={onUnlockAllMultipliers}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-600/90 to-yellow-600/90 hover:from-amber-500 hover:to-yellow-500 border border-amber-400/40 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Crown className="w-4 h-4" />
                Desbloquear Todos Multiplicadores
              </button>
            </div>
          </div>

          {/* Fast Dimension Teleport */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Teletransporte Directo
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onTeleportTo('main');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex flex-col items-center gap-1 transition active:scale-95"
              >
                <span className="text-base">🌿</span>
                <span>Valle Principal</span>
              </button>
              <button
                onClick={() => {
                  onTeleportTo('candy');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/40 text-xs font-bold text-pink-200 hover:text-white flex flex-col items-center gap-1 transition active:scale-95"
              >
                <span className="text-base">🍭</span>
                <span>Mundo Caramelo</span>
              </button>
              <button
                onClick={() => {
                  onTeleportTo('mayan_boss');
                  onClose();
                }}
                className="p-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-xs font-bold text-emerald-200 hover:text-white flex flex-col items-center gap-1 transition active:scale-95"
              >
                <span className="text-base">🏛️</span>
                <span>Cripta Maya Boss</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Usuario verificado: <span className="text-amber-300 font-mono font-semibold">santiagosorioax@gmail.com</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition active:scale-95"
          >
            Listo / Continuar Juego
          </button>
        </div>
      </div>
    </div>
  );
};
