import React from 'react';
import { 
  Coins, 
  Sun, 
  Moon, 
  Sunset, 
  Sunrise, 
  Compass, 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle, 
  Flashlight, 
  Eye, 
  Zap, 
  Flame,
  ShoppingBag,
  Sword,
  Sparkles,
  Home
} from 'lucide-react';
import { TimeState, PlayerInventory } from '../types';

interface HUDProps {
  score: number;
  collectedCoins: number;
  totalCoins: number;
  timeState: TimeState;
  combo: number;
  fps?: number;
  showFps?: boolean;
  isMusicOn: boolean;
  isFlashlightOn: boolean;
  viewMode: 'first_person' | 'third_person';
  isSprinting: boolean;
  radar: { angleDeg: number; distance: number } | null;
  isNearShop?: boolean;
  inventory?: PlayerInventory;
  onToggleMusic: () => void;
  onToggleFlashlight: () => void;
  onToggleViewMode: () => void;
  onJump: () => void;
  onToggleSprint: (sprint: boolean) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenShop?: () => void;
  onReturnToSpawn?: () => void;
  onSwingSword?: () => void;
  // Touch Joy Callbacks
  onJoyTouchStart: (e: React.TouchEvent) => void;
  onJoyTouchMove: (e: React.TouchEvent) => void;
  onJoyTouchEnd: (e: React.TouchEvent) => void;
  joyStickPos: { x: number; y: number };
  // Touch Look Callbacks
  onLookTouchStart: (e: React.TouchEvent) => void;
  onLookTouchMove: (e: React.TouchEvent) => void;
  onLookTouchEnd: (e: React.TouchEvent) => void;
  lastToast: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  collectedCoins,
  totalCoins,
  timeState,
  combo,
  fps = 60,
  showFps = false,
  isMusicOn,
  isFlashlightOn,
  viewMode,
  isSprinting,
  radar,
  isNearShop = false,
  inventory,
  onToggleMusic,
  onToggleFlashlight,
  onToggleViewMode,
  onJump,
  onToggleSprint,
  onOpenSettings,
  onOpenHelp,
  onOpenShop,
  onReturnToSpawn,
  onSwingSword,
  onJoyTouchStart,
  onJoyTouchMove,
  onJoyTouchEnd,
  joyStickPos,
  onLookTouchStart,
  onLookTouchMove,
  onLookTouchEnd,
  lastToast,
}) => {
  const getPeriodBadge = () => {
    switch (timeState.period) {
      case 'dawn':
        return {
          icon: <Sunrise className="w-4 h-4 text-amber-300" />,
          label: 'Amanecer',
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-200',
        };
      case 'day':
        return {
          icon: <Sun className="w-4 h-4 text-yellow-400" />,
          label: 'Día',
          bg: 'bg-sky-950/60 border-sky-400/40 text-sky-200',
        };
      case 'sunset':
        return {
          icon: <Sunset className="w-4 h-4 text-orange-400" />,
          label: 'Atardecer',
          bg: 'bg-orange-950/60 border-orange-500/40 text-orange-200',
        };
      case 'night':
        return {
          icon: <Moon className="w-4 h-4 text-indigo-300" />,
          label: 'Noche',
          bg: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200',
        };
    }
  };

  const period = getPeriodBadge();
  const coinProgress = Math.min(100, Math.round((collectedCoins / (totalCoins || 1)) * 100));

  const hasActiveBuffs = inventory && (
    inventory.activeBuffs.speedTimeRemaining > 0 ||
    inventory.activeBuffs.jumpTimeRemaining > 0 ||
    inventory.activeBuffs.magnetTimeRemaining > 0
  );

  return (
    <div id="hud-container" className="fixed inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      {/* 1. TOP STATUS BAR */}
      <header className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Coins, Score & Shop Button */}
        <div className="flex items-center gap-2">
          <div 
            id="hud-coins-card"
            className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3.5 py-2 shadow-lg text-white"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-sm leading-tight text-amber-300">
                <span>{inventory ? inventory.coins : collectedCoins}</span>
                <span className="text-slate-400 text-xs font-medium">monedas</span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium tracking-wide">
                {score} pts ({collectedCoins}/{totalCoins})
              </div>
            </div>

            {/* Mini progress bar */}
            <div className="hidden sm:block w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-300 rounded-full"
                style={{ width: `${coinProgress}%` }}
              />
            </div>

            {/* Combo Multiplier Badge */}
            {combo > 1 && (
              <div className="flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow animate-bounce">
                <Flame className="w-3 h-3 fill-current" />
                <span>x{combo}</span>
              </div>
            )}
          </div>

          {/* Dedicated Shop Button */}
          {onOpenShop && (
            <button
              id="hud-btn-shop"
              onPointerDown={(e) => {
                e.stopPropagation();
                onOpenShop();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenShop();
              }}
              aria-label="Abrir Tienda"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border backdrop-blur-md shadow-lg transition active:scale-95 text-xs font-bold touch-none select-none ${
                isNearShop
                  ? 'bg-amber-500 border-amber-300 text-slate-950 animate-bounce shadow-amber-500/30'
                  : 'bg-slate-900/85 border-amber-500/40 text-amber-300 hover:bg-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">Tienda</span>
            </button>
          )}

          {/* Dedicated Return to Spawn / Home Button */}
          {onReturnToSpawn && (
            <button
              id="hud-btn-return-home"
              onPointerDown={(e) => {
                e.stopPropagation();
                onReturnToSpawn();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onReturnToSpawn();
              }}
              aria-label="Volver al Inicio"
              title="Volver al Inicio del mapa (Tecla H)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-sky-500/50 bg-sky-950/80 hover:bg-sky-900/90 text-sky-200 backdrop-blur-md shadow-lg shadow-sky-950/40 transition active:scale-95 text-xs font-bold touch-none select-none hover:border-sky-400"
            >
              <Home className="w-4 h-4 text-sky-400" />
              <span className="hidden xs:inline">Inicio (H)</span>
            </button>
          )}
        </div>

        {/* Center: Day / Night Clock Widget & Radar */}
        <div className="flex items-center gap-2">
          {/* Day/Night Clock */}
          <div 
            id="hud-time-widget"
            className={`flex items-center gap-2 backdrop-blur-md border rounded-2xl px-3 py-1.5 shadow-lg ${period.bg}`}
          >
            {period.icon}
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-wider leading-none">
                {timeState.formattedTime}
              </span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest font-semibold mt-0.5">
                {period.label}
              </span>
            </div>
          </div>

          {/* FPS Badge if enabled */}
          {showFps && (
            <div
              id="hud-fps-counter"
              className={`px-2.5 py-1.5 rounded-2xl backdrop-blur-md border shadow-lg text-xs font-mono font-bold flex items-center gap-1 ${
                fps >= 45 
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                  : fps >= 25 
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' 
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{fps}</span>
              <span className="text-[9px] font-sans opacity-70">FPS</span>
            </div>
          )}

          {/* Radar Compass to nearest coin */}
          {radar && (
            <div
              id="hud-radar-compass"
              className="hidden sm:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-2xl px-3 py-1.5 text-white shadow-lg text-xs"
              title="Brújula a la moneda más cercana"
            >
              <Compass 
                className="w-4 h-4 text-emerald-400 transition-transform duration-100" 
                style={{ transform: `rotate(${radar.angleDeg}deg)` }}
              />
              <span className="font-semibold text-emerald-300">{radar.distance}m</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls (Sound, Help, Settings) */}
        <div className="flex items-center gap-1.5">
          <button
            id="hud-btn-music"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleMusic();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMusic();
            }}
            aria-label="Música"
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-md transition active:scale-95 touch-none select-none ${
              isMusicOn
                ? 'bg-emerald-600/80 border-emerald-400/50 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isMusicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="hud-btn-help"
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenHelp();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenHelp();
            }}
            aria-label="Ayuda"
            className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-md transition active:scale-95 touch-none select-none"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            id="hud-btn-settings"
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            aria-label="Ajustes"
            className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-md transition active:scale-95 touch-none select-none"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. ACTIVE BUFFS CHIPS (Top left underneath status bar) */}
      {hasActiveBuffs && inventory && (
        <div className="absolute top-16 left-3 flex flex-col gap-1.5 pointer-events-auto">
          {inventory.activeBuffs.speedTimeRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/50 backdrop-blur-md text-blue-300 text-xs font-bold shadow-lg">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Velocidad: {Math.ceil(inventory.activeBuffs.speedTimeRemaining)}s</span>
            </div>
          )}
          {inventory.activeBuffs.jumpTimeRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-400/50 backdrop-blur-md text-purple-300 text-xs font-bold shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>Salto Lunar: {Math.ceil(inventory.activeBuffs.jumpTimeRemaining)}s</span>
            </div>
          )}
          {inventory.activeBuffs.magnetTimeRemaining > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-400/50 backdrop-blur-md text-amber-300 text-xs font-bold shadow-lg">
              <span>🧲</span>
              <span>Imán de Monedas: {Math.ceil(inventory.activeBuffs.magnetTimeRemaining)}s</span>
            </div>
          )}
        </div>
      )}

      {/* 3. PROXIMITY SHOP PROMPT BANNER */}
      {isNearShop && onOpenShop && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-20 transition-all animate-bounce">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenShop();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenShop();
            }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-2xl border-2 border-white hover:scale-105 active:scale-95 transition touch-none select-none"
          >
            <span className="text-xl">🏪</span>
            <span>Entrar a la Tienda de Santi (E)</span>
          </button>
        </div>
      )}

      {/* 4. CENTER CROSSHAIR (For First Person) */}
      {viewMode === 'first_person' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center opacity-70">
          <div className="w-2.5 h-2.5 rounded-full border border-white/80 bg-white/30" />
        </div>
      )}

      {/* 5. TOAST NOTIFICATION */}
      {lastToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 animate-fade-in">
          <div className="bg-slate-900/90 text-amber-300 border border-amber-500/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5">
            <span>✨</span>
            <span>{lastToast}</span>
          </div>
        </div>
      )}

      {/* 6. TOUCH LOOK AREA (Right side of screen for camera drag) */}
      <div
        id="touch-look-zone"
        className="absolute top-16 right-0 bottom-0 w-[55%] pointer-events-auto touch-none z-0"
        onTouchStart={onLookTouchStart}
        onTouchMove={onLookTouchMove}
        onTouchEnd={onLookTouchEnd}
      />

      {/* 7. VIRTUAL JOYSTICK (Bottom Left) */}
      <div
        id="touch-joy-zone"
        className="absolute bottom-6 left-6 w-36 h-36 rounded-full border-2 border-white/20 bg-slate-900/30 backdrop-blur-sm pointer-events-auto touch-none flex items-center justify-center shadow-2xl z-20 select-none"
        onTouchStart={onJoyTouchStart}
        onTouchMove={onJoyTouchMove}
        onTouchEnd={onJoyTouchEnd}
      >
        {/* Joystick Base Indicator */}
        <div className="w-12 h-12 rounded-full border border-white/20 bg-white/10 flex items-center justify-center pointer-events-none text-white/40 text-[10px] font-bold">
          MOVE
        </div>
        {/* Dynamic Thumb stick */}
        <div
          className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-white/80 to-white/40 shadow-lg border border-white/60 pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${joyStickPos.x}px, ${joyStickPos.y}px)`,
          }}
        />
      </div>

      {/* 8. MOBILE ACTION BUTTONS (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto z-20 touch-none select-none">
        {/* Small Utility Action Row: Linterna, Cámara, Espada, Turbo */}
        <div className="flex items-center gap-2">
          {/* Sword Attack Button (if sword equipped or callable) */}
          {inventory?.equippedSwordId && onSwingSword && (
            <button
              id="btn-action-sword"
              onPointerDown={(e) => {
                e.stopPropagation();
                onSwingSword();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSwingSword();
              }}
              className="w-11 h-11 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 bg-rose-600/90 border-rose-400 text-white animate-pulse touch-none select-none"
              title="Atacar con Espada (R)"
            >
              <Sword className="w-5 h-5" />
            </button>
          )}

          {/* View Mode Toggle (1st vs 3rd Person) */}
          <button
            id="btn-action-camera"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleViewMode();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleViewMode();
            }}
            className={`w-11 h-11 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 touch-none select-none ${
              viewMode === 'third_person'
                ? 'bg-indigo-600/80 border-indigo-400 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
            title="Cambiar Cámara (1ª/3ª persona)"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* Flashlight Toggle */}
          <button
            id="btn-action-flashlight"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleFlashlight();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFlashlight();
            }}
            className={`w-11 h-11 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 touch-none select-none ${
              isFlashlightOn
                ? 'bg-amber-500/80 border-amber-300 text-white shadow-amber-500/30'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
            title="Linterna (F)"
          >
            <Flashlight className="w-5 h-5" />
          </button>

          {/* Sprint / Turbo Button */}
          <button
            id="btn-action-turbo"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleSprint(!isSprinting);
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSprint(!isSprinting);
            }}
            className={`w-11 h-11 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 touch-none select-none ${
              isSprinting
                ? 'bg-amber-600/90 border-amber-400 text-white animate-pulse'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
            title="Correr / Turbo (Shift)"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>

        {/* Big Jump Button */}
        <button
          id="btn-action-jump"
          onPointerDown={(e) => {
            e.stopPropagation();
            onJump();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onJump();
          }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 active:from-blue-700 active:to-indigo-600 border-2 border-blue-300/60 text-white font-extrabold text-sm tracking-wider shadow-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition touch-none select-none"
        >
          <span className="text-xl">⬆️</span>
          <span>SALTAR</span>
        </button>
      </div>

      {/* 9. DESKTOP HELPER HINT (Bottom center) */}
      <div className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-3 text-[11px] text-slate-300/80 bg-slate-950/70 border border-slate-800 backdrop-blur-md px-4 py-1 rounded-full shadow pointer-events-none">
        <span><b>WASD</b> Mover</span>
        <span>•</span>
        <span><b>Espacio</b> Saltar</span>
        <span>•</span>
        <span><b>E</b> Tienda</span>
        <span>•</span>
        <span><b>R</b> Atacar</span>
        <span>•</span>
        <span><b>Shift</b> Correr</span>
        <span>•</span>
        <span><b>F</b> Linterna</span>
        <span>•</span>
        <span><b>V</b> Cámara</span>
        <span>•</span>
        <span><b>M</b> Música</span>
      </div>
    </div>
  );
};
