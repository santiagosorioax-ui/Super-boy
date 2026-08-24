import React from 'react';
import { 
  Play, 
  Settings, 
  HelpCircle, 
  Sparkles, 
  Sword, 
  ShoppingBag, 
  Zap, 
  Eye, 
  Gamepad2, 
  Volume2, 
  VolumeX,
  Compass,
  Trophy
} from 'lucide-react';
import { GameSettings } from '../types';

interface StartScreenProps {
  onPlay: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
  bestScore?: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onPlay,
  onOpenSettings,
  onOpenHelp,
  settings,
  onUpdateSettings,
  isMusicOn,
  onToggleMusic,
  bestScore = 0,
}) => {
  return (
    <div 
      id="start-screen-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-indigo-950/90 backdrop-blur-md select-none font-sans overflow-y-auto"
    >
      <div 
        id="start-screen-card"
        className="w-full max-w-xl flex flex-col items-center text-center relative py-6 px-4 sm:px-8 my-auto"
      >
        {/* Floating Decorative Elements */}
        <div className="absolute -top-10 -left-6 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-6 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mundo Abierto 3D</span>
          </div>
          {bestScore > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Récord: {bestScore} pts</span>
            </div>
          )}
        </div>

        {/* Game Title: SUPER BOY */}
        <div className="relative mb-3 group">
          <h1 
            id="game-title"
            className="text-5xl sm:text-7xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_4px_24px_rgba(245,158,11,0.45)] transform hover:scale-105 transition-transform duration-300"
            style={{
              textShadow: '0 0 35px rgba(245, 158, 11, 0.4), 0 4px 0 #b45309, 0 8px 16px rgba(0,0,0,0.6)',
              letterSpacing: '0.06em'
            }}
          >
            SUPER BOY
          </h1>
          <div className="text-cyan-300 text-sm sm:text-base font-bold tracking-widest uppercase mt-1 drop-shadow-md flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-cyan-400/50" />
            <span>Plataformas & Aventura 3D</span>
            <span className="h-px w-8 bg-cyan-400/50" />
          </div>
        </div>

        {/* Feature Highlights Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full my-5 max-w-lg text-slate-300 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2 justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">27 Monedas</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2 justify-center shadow-sm">
            <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">Tienda & Buffs</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2 justify-center shadow-sm">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-medium">Trampolines</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl flex items-center gap-2 justify-center shadow-sm">
            <Sword className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">3 Espadas</span>
          </div>
        </div>

        {/* Main PLAY Button */}
        <button
          id="btn-play-game"
          onClick={onPlay}
          className="group relative w-full max-w-sm py-4 px-8 mt-2 mb-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white text-2xl sm:text-3xl font-extrabold rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.45)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.65)] transform hover:-translate-y-1 active:translate-y-0.5 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 border-2 border-emerald-300/40"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white text-white ml-0.5" />
          </div>
          <span className="tracking-wider uppercase">PLAY</span>
        </button>

        {/* Keyboard hint */}
        <p className="text-[11px] text-slate-400 mb-6 font-medium">
          Presiona <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-mono text-[10px]">ENTER</kbd> o <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-mono text-[10px]">ESPACIO</kbd> para iniciar
        </p>

        {/* Quick Settings & Preference Bar */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-lg">
          {/* View Mode Toggle */}
          <button
            id="start-toggle-view"
            onClick={() => onUpdateSettings({
              viewMode: settings.viewMode === 'first_person' ? 'third_person' : 'first_person'
            })}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">
              {settings.viewMode === 'first_person' ? '1ª Persona' : '3ª Persona'}
            </span>
          </button>

          {/* Music Toggle */}
          <button
            id="start-toggle-music"
            onClick={onToggleMusic}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              isMusicOn 
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
            title="Música de Aventura"
          >
            {isMusicOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">Música</span>
          </button>

          {/* Help Button */}
          <button
            id="start-btn-help"
            onClick={onOpenHelp}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            title="Cómo Jugar"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ayuda</span>
          </button>

          {/* Settings Button */}
          <button
            id="start-btn-settings"
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
            title="Ajustes"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Ajustes</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-[11px] text-slate-500 flex items-center gap-3">
          <span>🎮 WASD / Táctil para mover</span>
          <span>•</span>
          <span>⚡ Barra Espaciadora / Salto</span>
        </div>
      </div>
    </div>
  );
};
