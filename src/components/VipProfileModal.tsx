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
  Maximize2,
  CloudRain,
  CloudFog,
  Wind,
  Sun
} from 'lucide-react';
import { UserProfile, PlayerInventory, WeatherType } from '../types';

interface VipProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  inventory: PlayerInventory;
  currentWeather?: WeatherType;
  onSetWeather?: (type: WeatherType) => void;
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
  currentWeather,
  onSetWeather,
  onUpdateUser,
  onRefillInfiniteCoins,
  onUnlockAllSwords,
  onUnlockAllMultipliers,
  onTeleportTo,
}) => {
  if (!isOpen || user.email.toLowerCase() !== 'santiagosorioax@gmail.com') return null;

  const togglePower = (key: keyof Pick<UserProfile, 'isGodMode' | 'superSpeed' | 'superJump' | 'superMagnet' | 'freeTemplePass' | 'infiniteCoins' | 'flyMode'>) => {
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
        {/* Header with Creator Console */}
        <div className="relative p-5 bg-gradient-to-r from-amber-600/40 via-yellow-500/30 to-amber-600/40 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-400/40 animate-pulse">
              <Sparkles className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">Consola de Creador</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow">
                  CREATOR
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
          {/* Quick Action Buttons */}
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
              Parámetros y Habilidades del Creador
            </h3>

            <div className="space-y-2">
              {/* Fly & Noclip Mode */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-yellow-500/15 via-amber-500/15 to-sky-500/15 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/25 border border-yellow-300 flex items-center justify-center text-yellow-300 font-bold text-base shadow-sm animate-pulse">
                    🕊️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-yellow-300 block">Modo Vuelo & Noclip</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-yellow-400 text-slate-950 rounded">MODO LIBRE [G]</span>
                    </div>
                    <span className="text-[10px] text-slate-300">Vuela en 3D, super velocidad y atraviesa estructuras sólidas</span>
                  </div>
                </div>
                <button
                  id="creator-modal-toggle-fly"
                  onClick={() => togglePower('flyMode')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer ${
                    user.flyMode
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 font-black shadow-md shadow-yellow-400/40 ring-2 ring-yellow-300 animate-pulse'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {user.flyMode ? 'VOLANDO' : 'ACTIVAR'}
                </button>
              </div>

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

          {/* Weather Controller Section */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4" />
                Control de Clima del Mundo
              </h3>
              {currentWeather && (
                <span className="text-[10px] uppercase font-bold text-sky-300 px-2 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/40">
                  Activo: {currentWeather}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onSetWeather?.('clear')}
                className={`p-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                  currentWeather === 'clear'
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <span className="text-xs font-bold block">Despejado</span>
                <span className="text-[9px] text-slate-400">Soleado</span>
              </button>

              <button
                type="button"
                onClick={() => onSetWeather?.('rain')}
                className={`p-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                  currentWeather === 'rain'
                    ? 'bg-sky-950/90 border-sky-400 text-sky-200 ring-2 ring-sky-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <CloudRain className="w-5 h-5 mx-auto mb-1 text-sky-400 animate-bounce" />
                <span className="text-xs font-bold block">Lluvia</span>
                <span className="text-[9px] text-slate-400">Piso resbaladizo</span>
              </button>

              <button
                type="button"
                onClick={() => onSetWeather?.('fog')}
                className={`p-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                  currentWeather === 'fog'
                    ? 'bg-slate-800 border-slate-300 text-slate-100 ring-2 ring-slate-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <CloudFog className="w-5 h-5 mx-auto mb-1 text-slate-300 animate-pulse" />
                <span className="text-xs font-bold block">Neblina</span>
                <span className="text-[9px] text-slate-400">Niebla densa</span>
              </button>

              <button
                type="button"
                onClick={() => onSetWeather?.('wind')}
                className={`p-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                  currentWeather === 'wind'
                    ? 'bg-teal-950/90 border-teal-400 text-teal-200 ring-2 ring-teal-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Wind className="w-5 h-5 mx-auto mb-1 text-teal-400 animate-pulse" />
                <span className="text-xs font-bold block">Viento</span>
                <span className="text-[9px] text-slate-400">Ráfagas fuertes</span>
              </button>
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
                onClick={() => onTeleportTo('mayan_temple')}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-amber-950/80 hover:from-emerald-900/90 hover:to-amber-900/90 border-2 border-emerald-400 text-left transition active:scale-95 cursor-pointer col-span-2 shadow-lg ring-2 ring-emerald-500/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-emerald-300 block">🏛️ Templo Maya (Interior & Rey Zombi)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/50">DESTINO PRINCIPAL</span>
                </div>
                <span className="text-xs text-amber-200/80">Teletransportación directa a la Gran Sala Ceremonial y Altar</span>
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
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Consola de Creador sincronizada con Firebase</span>
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
