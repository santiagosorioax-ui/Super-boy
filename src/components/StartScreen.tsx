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
  Trophy,
  Monitor,
  Smartphone,
  LogIn,
  LogOut,
  User as UserIcon,
  CloudCheck,
  Crown,
  Shirt,
  Maximize,
  Minimize,
  Download,
  CheckCircle2
} from 'lucide-react';
import { GameSettings, ControlDevice } from '../types';
import { User } from 'firebase/auth';

interface StartScreenProps {
  onPlay: (mode?: ControlDevice) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenLeaderboard?: () => void;
  onOpenWardrobe?: () => void;
  isVip?: boolean;
  onOpenVipProfile?: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
  bestScore?: number;
  currentUser?: User | null;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onPlay,
  onOpenSettings,
  onOpenHelp,
  onOpenLeaderboard,
  onOpenWardrobe,
  isVip = false,
  onOpenVipProfile,
  settings,
  onUpdateSettings,
  isMusicOn,
  onToggleMusic,
  bestScore = 0,
  currentUser,
  onSignInGoogle,
  onSignOut,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenInstall,
  isInstalled = false,
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

        {/* Top Badges & Auth Section */}
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

          {/* Firebase User Auth Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs border bg-slate-800/80 border-slate-700 text-slate-200 shadow-sm">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full border border-slate-500"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span 
                onClick={() => {
                  if (isVip && onOpenVipProfile) {
                    onOpenVipProfile();
                  }
                }}
                className={`font-semibold max-w-[100px] sm:max-w-[140px] truncate ${isVip ? 'cursor-pointer hover:text-white' : ''}`}
                title={currentUser.displayName || currentUser.email || ''}
              >
                {currentUser.displayName || currentUser.email}
              </span>
              <button
                onClick={onSignOut}
                title="Cerrar sesión"
                className="text-slate-400 hover:text-rose-400 p-0.5 ml-1 transition"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInGoogle}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/50 text-blue-200 text-xs font-semibold hover:scale-105 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Guardar en Nube (Google)</span>
            </button>
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

        {/* Main 2 Buttons: JUGAR EN PC y JUGAR EN CELULAR */}
        <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2 mb-3">
          {/* 1. Jugar en PC */}
          <button
            id="btn-play-pc"
            onClick={() => onPlay('pc')}
            className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-700 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-600 text-white border-2 border-blue-400/60 shadow-[0_8px_25px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_35px_rgba(37,99,235,0.65)] transform hover:-translate-y-1 active:translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer text-center select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md">
              <Monitor className="w-6 h-6 text-cyan-200" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-wide uppercase">
              JUGAR EN PC
            </span>
            <span className="text-[11px] text-cyan-200 font-medium mt-0.5">
              ⌨️ Teclado + Ratón
            </span>
            <span className="text-[10px] text-blue-200/80 font-normal">
              (Sin botones táctiles)
            </span>
          </button>

          {/* 2. Jugar en Celular */}
          <button
            id="btn-play-mobile"
            onClick={() => onPlay('mobile')}
            className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 hover:from-emerald-500 hover:via-teal-500 hover:to-green-600 text-white border-2 border-emerald-400/60 shadow-[0_8px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_12px_35px_rgba(16,185,129,0.65)] transform hover:-translate-y-1 active:translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer text-center select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md">
              <Smartphone className="w-6 h-6 text-emerald-200" />
            </div>
            <span className="text-base sm:text-lg font-black tracking-wide uppercase">
              JUGAR EN CELULAR
            </span>
            <span className="text-[11px] text-emerald-200 font-medium mt-0.5">
              📱 Controles Táctiles
            </span>
            <span className="text-[10px] text-emerald-200/80 font-normal">
              (Joystick y Botones activos)
            </span>
          </button>
        </div>

        {/* Button to Download Full App (PWA) on Mobile or PC */}
        {onOpenInstall && (
          <button
            id="btn-start-download-pwa"
            onClick={onOpenInstall}
            className="w-full max-w-md mb-3 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-2 border-amber-400/60 hover:border-amber-300 text-amber-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-amber-950/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center p-0.5 group-hover:scale-110 transition-transform overflow-hidden shadow-inner">
                <img src="/icon.svg" alt="Espada" className="w-full h-full object-contain drop-shadow" />
              </div>
              <div className="text-left">
                <span className="block font-black text-amber-300 text-xs sm:text-sm tracking-wide">
                  {isInstalled ? '✅ Aplicación Instalada' : '📥 Descargar Aplicación Completa'}
                </span>
                <span className="block text-[10px] text-amber-200/70 font-normal">
                  Instalar directamente en Celular o PC sin barra de navegador
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40">
              PWA
            </span>
          </button>
        )}

        {/* Fullscreen Button to Hide Chrome URL on Mobile */}
        {onToggleFullscreen && (
          <button
            id="btn-start-fullscreen"
            onClick={onToggleFullscreen}
            className="flex items-center gap-2 px-4 py-1.5 mb-3 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-bold shadow-md shadow-black/40 transition active:scale-95 cursor-pointer select-none"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-emerald-400" />
                <span>✅ Pantalla Completa Activa (Barra URL oculta)</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>⛶ Activar Pantalla Completa (Ocultar barra de URL)</span>
              </>
            )}
          </button>
        )}

        {/* Keyboard hint */}
        <p className="text-[11px] text-slate-400 mb-5 font-medium">
          Presiona <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-mono text-[10px]">ENTER</kbd> o <kbd className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-mono text-[10px]">ESPACIO</kbd> para jugar en PC
        </p>

        {/* Quick Settings & Preference Bar */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-lg">
          {/* Leaderboard Button */}
          <button
            id="start-btn-leaderboard"
            onClick={onOpenLeaderboard}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-300 transition"
            title="Ranking y Clasificación"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Ranking</span>
          </button>

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

          {/* Wardrobe & Customization */}
          {onOpenWardrobe && (
            <button
              id="start-btn-wardrobe"
              onClick={onOpenWardrobe}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 border border-purple-500/40 text-xs font-semibold text-purple-200 hover:text-white transition shadow-sm"
              title="Armario: Personalizar Ropa y Personaje"
            >
              <Shirt className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Ropa</span>
            </button>
          )}

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
