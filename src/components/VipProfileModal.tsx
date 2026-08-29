import React from 'react';
import {
  Crown,
  X,
  Zap,
  Shield,
  Coins,
  Sparkles,
  Sword,
  Flame,
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { UserProfile, PlayerInventory } from '../types';

interface VipProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  inventory: PlayerInventory;
  onUpdateUser: (updated: UserProfile) => void;
  onRefillInfiniteCoins: () => void;
  onUnlockAllSwords: () => void;
  onUnlockAllMultipliers: () => void;
  onTeleportTo: (dest: 'spawn' | 'shop' | 'multiplier_shop' | 'candy_portal' | 'mayan_temple' | 'boss_arena') => void;
}

export const VipProfileModal: React.FC<VipProfileModalProps> = ({
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

  const togglePower = (key: keyof Pick<UserProfile, 'isGodMode' | 'superSpeed' | 'superJump' | 'superMagnet' | 'freeTemplePass' | 'infiniteCoins'>) => {
    onUpdateUser({
      ...user,
      [key]: !user[key],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with VIP Crown */}
        <div className="relative p-5 bg-gradient-to-r from-amber-600/40 via-yellow-500/30 to-amber-600/40 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-400/40 animate-pulse">
              <Crown className="w-7 h-7 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">Panel VIP Santiago</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow">
                  UNLIMITED
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-medium">santiagosorioax@gmail.com</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Quick VIP Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onRefillInfiniteCoins}
              className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-400/50 hover:border-amber-300 hover:from-amber-500/30 text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center justify-between">
                <Coins className="w-6 h-6 text-amber-400 group-hover:scale-110 transition" />
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-white block">+999M Monedas</span>
                <span className="text-[10px] text-amber-300/80 font-medium">Monedas Infinitas</span>
              </div>
            </button>

            <button
              onClick={onUnlockAllSwords}
              className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-600/20 border border-rose-400/50 hover:border-rose-300 hover:from-rose-500/30 text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer shadow-lg shadow-rose-500/10"
            >
              <div className="flex items-center justify-between">
                <Sword className="w-6 h-6 text-rose-400 group-hover:scale-110 transition" />
                <Flame className="w-4 h-4 text-rose-300" />
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-white block">Todas las Espadas</span>
                <span className="text-[10px] text-rose-300/80 font-medium">Equipa Hoja de Dios</span>
              </div>
            </button>

            <button
              onClick={onUnlockAllMultipliers}
              className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/50 hover:border-cyan-300 hover:from-cyan-500/30 text-left transition flex flex-col justify-between group active:scale-95 cursor-pointer shadow-lg shadow-cyan-500/10"
            >
              <div className="flex items-center justify-between">
                <Zap className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition" />
                <Crown className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="mt-2">
                <span className="text-xs font-black text-white block">Multiplicador 1000x</span>
                <span className="text-[10px] text-cyan-300/80 font-medium">Multiplicador Máximo</span>
              </div>
            </button>
          </div>

          {/* Superpowers Section (God Mode, Speed, Jump, Magnet, Pass) */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Superpoderes Activos de Administrador VIP
            </h3>

            <div className="space-y-2">
              {/* God Mode */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    🛡️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Modo Dios (Inmortal)</span>
                    <span className="text-[10px] text-slate-400">Inmune a daño de zombis y jefes</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePower('isGodMode')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.isGodMode
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {user.isGodMode ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Super Speed */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-bold">
                    ⚡
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Super Velocidad</span>
                    <span className="text-[10px] text-slate-400">+100% velocidad de carrera</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePower('superSpeed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.superSpeed
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {user.superSpeed ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Super Jump */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                    🦘
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Super Salto</span>
                    <span className="text-[10px] text-slate-400">+100% altura de salto</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePower('superJump')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.superJump
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-400/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {user.superJump ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Super Magnet */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                    🧲
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Super Imán de Monedas</span>
                    <span className="text-[10px] text-slate-400">Atrae monedas a 50m de distancia</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePower('superMagnet')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.superMagnet
                      ? 'bg-purple-400 text-slate-950 font-black shadow-md shadow-purple-400/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {user.superMagnet ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>

              {/* Free Temple Pass */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold">
                    🏛️
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Pase Libre al Templo Maya</span>
                    <span className="text-[10px] text-slate-400">Entrada gratuita sin pagar 500 monedas</span>
                  </div>
                </div>
                <button
                  onClick={() => togglePower('freeTemplePass')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.freeTemplePass
                      ? 'bg-orange-400 text-slate-950 font-black shadow-md shadow-orange-400/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {user.freeTemplePass ? 'ACTIVADO' : 'DESACTIVADO'}
                </button>
              </div>
            </div>
          </div>

          {/* Instant Teleporter Section */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              Teletransportación Instantánea
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onTeleportTo('spawn')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-white block">🌲 Plaza Principal</span>
                <span className="text-[10px] text-slate-400">Punto de inicio</span>
              </button>

              <button
                onClick={() => onTeleportTo('shop')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-white block">🗡️ Tienda de Espadas</span>
                <span className="text-[10px] text-slate-400">Armas y pócimas</span>
              </button>

              <button
                onClick={() => onTeleportTo('multiplier_shop')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-white block">⚡ Tienda de Multiplicadores</span>
                <span className="text-[10px] text-slate-400">Poder de monedas</span>
              </button>

              <button
                onClick={() => onTeleportTo('candy_portal')}
                className="p-2.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/40 border border-pink-500/40 text-left transition active:scale-95 cursor-pointer"
              >
                <span className="text-xs font-bold text-pink-300 block">🍬 Mundo Caramelo</span>
                <span className="text-[10px] text-pink-400/70">Dimensión dulce</span>
              </button>

              <button
                onClick={() => onTeleportTo('mayan_temple')}
                className="p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/40 text-left transition active:scale-95 cursor-pointer col-span-2 sm:col-span-2"
              >
                <span className="text-xs font-bold text-amber-300 block">🏛️ Cripta Maya (Jefe Final)</span>
                <span className="text-[10px] text-amber-400/70">Combate contra el Rey Zombi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Perfil VIP Santiago sincronizado con Firebase</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition active:scale-95 cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
