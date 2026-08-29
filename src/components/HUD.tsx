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
  Home,
  Heart,
  Shirt,
  Crown,
  Monitor,
  Smartphone
} from 'lucide-react';
import { TimeState, PlayerInventory, WorldDimension, MayanBossState, UserProfile, ControlDevice } from '../types';

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
  controlMode?: ControlDevice;
  onToggleControlMode?: () => void;
  radar: { angleDeg: number; distance: number } | null;
  isNearShop?: boolean;
  isNearMultiplierShop?: boolean;
  isNearTemple?: boolean;
  templeCost?: number;
  onEnterTemple?: () => void;
  bossState?: MayanBossState | null;
  inventory?: PlayerInventory;
  currentDimension?: WorldDimension;
  zombiesDefeated?: number;
  userProfile?: UserProfile;
  onOpenUserProfile?: () => void;
  onToggleMusic: () => void;
  onToggleFlashlight: () => void;
  onToggleViewMode: () => void;
  onJump: () => void;
  onToggleSprint: (sprint: boolean) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenShop?: () => void;
  onOpenMultiplierShop?: () => void;
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
  controlMode = 'pc',
  onToggleControlMode,
  radar,
  isNearShop = false,
  isNearMultiplierShop = false,
  isNearTemple = false,
  templeCost = 500,
  onEnterTemple,
  bossState,
  inventory,
  currentDimension = 'main',
  zombiesDefeated = 0,
  userProfile,
  onOpenUserProfile,
  onToggleMusic,
  onToggleFlashlight,
  onToggleViewMode,
  onJump,
  onToggleSprint,
  onOpenSettings,
  onOpenHelp,
  onOpenShop,
  onOpenMultiplierShop,
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
      <header className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-auto">
        {/* Left Column: Compact Coins Card & Health Hearts underneath */}
        <div className="flex flex-col gap-1.5 items-start">
          {/* Mini Coins Card */}
          <div 
            id="hud-coins-card"
            className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-2.5 py-1.5 shadow-md text-white"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-400">
              <Coins className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 font-black text-xs leading-none text-amber-300">
              <span>{inventory ? inventory.coins : collectedCoins}</span>
              <span className="text-slate-400 text-[10px] font-normal">monedas</span>
            </div>

            {/* Mini Combo Badge if active */}
            {combo > 1 && (
              <div className="flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow animate-bounce">
                <Flame className="w-2.5 h-2.5 fill-current" />
                <span>x{combo}</span>
              </div>
            )}
          </div>

          {/* 5-Heart Health Bar right underneath coins */}
          <div
            id="hud-health-card"
            className={`flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border rounded-xl px-2.5 py-1 shadow-md text-white transition-all ${
              (inventory?.health ?? 5) <= 2
                ? 'border-rose-500/80 bg-rose-950/60 ring-1 ring-rose-500/50 animate-pulse'
                : 'border-slate-700/60'
            }`}
            title={`Salud: ${inventory?.health ?? 5} de ${inventory?.maxHealth ?? 5} golpes`}
          >
            <Heart className={`w-3.5 h-3.5 fill-rose-500 text-rose-500 ${(inventory?.health ?? 5) <= 2 ? 'animate-ping' : ''}`} />
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((heartIndex) => {
                const isFull = heartIndex <= (inventory?.health ?? 5);
                return (
                  <span
                    key={heartIndex}
                    className={`text-[11px] leading-none transition-transform duration-200 ${
                      isFull ? 'scale-100' : 'scale-75 opacity-25 grayscale'
                    }`}
                  >
                    {isFull ? '❤️' : '🖤'}
                  </span>
                );
              })}
            </div>
            <span className="text-[11px] font-bold text-rose-300 ml-0.5 leading-none">
              {inventory?.health ?? 5}/5
            </span>
          </div>
        </div>

        {/* Center: Day/Night Clock Widget & Optional Zombie/FPS Indicators */}
        <div className="flex items-center gap-1.5">
          {/* Zombie Kills Badge if any */}
          {zombiesDefeated > 0 && (
            <div
              id="hud-zombie-counter"
              className="flex items-center gap-1 bg-red-950/80 backdrop-blur-md border border-red-500/40 text-red-300 rounded-xl px-2 py-1 shadow-md text-xs font-bold"
            >
              <Sword className="w-3 h-3 text-red-400" />
              <span>{zombiesDefeated}</span>
            </div>
          )}

          {/* Day/Night Clock */}
          <div 
            id="hud-time-widget"
            className={`flex items-center gap-1.5 backdrop-blur-md border rounded-xl px-2.5 py-1 shadow-md ${period.bg}`}
          >
            {period.icon}
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-wider leading-none">
                {timeState.formattedTime}
              </span>
              <span className="text-[9px] opacity-80 uppercase tracking-widest font-semibold mt-0.5 leading-none">
                {period.label}
              </span>
            </div>
          </div>

          {/* FPS Badge if enabled */}
          {showFps && (
            <div
              id="hud-fps-counter"
              className={`px-2 py-1 rounded-xl backdrop-blur-md border shadow-md text-[11px] font-mono font-bold flex items-center gap-1 ${
                fps >= 45 
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                  : fps >= 25 
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' 
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{fps}</span>
              <span className="text-[8px] font-sans opacity-70">FPS</span>
            </div>
          )}

          {/* Radar Compass to nearest coin */}
          {radar && (
            <div
              id="hud-radar-compass"
              className="hidden md:flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-2 py-1 text-white shadow-md text-xs"
              title="Brújula a la moneda más cercana"
            >
              <Compass 
                className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-100" 
                style={{ transform: `rotate(${radar.angleDeg}deg)` }}
              />
              <span className="font-semibold text-emerald-300 text-[11px]">{radar.distance}m</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls (Sound, Outfits, Help, Settings) */}
        <div className="flex items-center gap-1.5">
          {/* VIP Admin User Profile Button */}
          {userProfile && (
            <button
              id="hud-btn-user-profile"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenUserProfile?.();
              }}
              aria-label="Perfil VIP Ilimitado"
              title="Cuenta VIP de Santiago (Modo Dios / Monedas Infinitas)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 border border-amber-300 active:scale-95 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">VIP</span>
              <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">∞</span>
            </button>
          )}

          {/* Control Mode Toggle Button (PC vs Celular) */}
          <button
            id="hud-btn-control-mode"
            onPointerDown={(e) => {
              e.stopPropagation();
              onToggleControlMode?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleControlMode?.();
            }}
            aria-label={controlMode === 'mobile' ? 'Modo Celular (Táctil)' : 'Modo PC (Teclado/Ratón)'}
            title={controlMode === 'mobile' ? 'Modo Celular (Clic para cambiar a PC)' : 'Modo PC (Clic para cambiar a Celular)'}
            className={`p-2 rounded-xl border backdrop-blur-md shadow-md transition active:scale-95 touch-none select-none flex items-center gap-1 text-xs font-bold ${
              controlMode === 'mobile'
                ? 'bg-emerald-600/80 border-emerald-400/60 text-white shadow-emerald-950/40'
                : 'bg-blue-600/80 border-blue-400/60 text-white shadow-blue-950/40'
            }`}
          >
            {controlMode === 'mobile' ? (
              <>
                <Smartphone className="w-4 h-4 text-emerald-200" />
                <span className="hidden sm:inline text-[10px]">CEL</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4 text-cyan-200" />
                <span className="hidden sm:inline text-[10px]">PC</span>
              </>
            )}
          </button>

          {/* Clothing Button (sin función asignada por ahora) */}
          <button
            id="hud-btn-outfits"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            aria-label="Ropa"
            title="Ropa y Aspectos"
            className="p-2 rounded-xl border border-purple-500/40 bg-purple-950/80 backdrop-blur-md text-purple-300 hover:text-purple-100 hover:border-purple-400 shadow-md transition active:scale-95 touch-none select-none"
          >
            <Shirt className="w-4 h-4" />
          </button>

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
            className={`p-2 rounded-xl border backdrop-blur-md shadow-md transition active:scale-95 touch-none select-none ${
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
            className="p-2 rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-md transition active:scale-95 touch-none select-none"
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
            className="p-2 rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-md transition active:scale-95 touch-none select-none"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 1.1 MAYAN BOSS HEALTH BAR & STATUS */}
      {currentDimension === 'mayan_boss' && bossState && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-md pointer-events-none z-15 flex flex-col items-center gap-1">
          <div className={`w-full backdrop-blur-md border-2 rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1.5 transition-all ${
            bossState.isTired
              ? 'bg-amber-950/90 border-amber-400/80 ring-2 ring-amber-400/40'
              : 'bg-slate-950/90 border-emerald-500/60'
          }`}>
            <div className="flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="text-sm">🧟👑</span>
                <span>Rey Zombi Maya</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${
                bossState.isTired 
                  ? 'bg-amber-400 text-slate-950 font-black animate-bounce shadow-md' 
                  : bossState.phase === 'defeated'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-950 border border-rose-500/50 text-rose-300'
              }`}>
                {bossState.statusMessage}
              </span>
            </div>
            {/* Health Bar */}
            <div className="w-full bg-slate-900 rounded-full h-4 border border-slate-700 overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  bossState.isTired
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 animate-pulse'
                    : 'bg-gradient-to-r from-rose-600 via-red-500 to-emerald-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (bossState.health / bossState.maxHealth) * 100))}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                {bossState.health} / {bossState.maxHealth} HP {bossState.isTired ? '— ¡ATÁCALO AHORA!' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE BUFFS CHIPS (Top left underneath status bar) */}
      {hasActiveBuffs && inventory && (
        <div className="absolute top-20 left-3 flex flex-col gap-1.5 pointer-events-auto">
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

      {isNearMultiplierShop && onOpenMultiplierShop && !isNearShop && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-20 transition-all animate-bounce">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenMultiplierShop();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMultiplierShop();
            }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500 text-white font-black text-sm shadow-2xl border-2 border-white hover:scale-105 active:scale-95 transition touch-none select-none"
          >
            <span className="text-xl">✨</span>
            <span>Altar de Multiplicadores (1x a 6x) (Presiona E)</span>
          </button>
        </div>
      )}

      {/* 3.2 PROXIMITY MAYAN TEMPLE PROMPT BANNER */}
      {isNearTemple && onEnterTemple && !isNearShop && !isNearMultiplierShop && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-20 transition-all animate-bounce">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onEnterTemple();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEnterTemple();
            }}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500 text-white font-black text-sm shadow-2xl border-2 border-emerald-300 hover:scale-105 active:scale-95 transition touch-none select-none"
          >
            <span className="text-xl">🏛️</span>
            <span>Entrar al Templo Maya ({templeCost} Monedas) [E]</span>
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

      {/* 6. TOUCH LOOK AREA (Active only when playing in Mobile mode) */}
      {controlMode === 'mobile' && (
        <div
          id="touch-look-zone"
          className="absolute top-16 right-0 bottom-0 w-[55%] pointer-events-auto touch-none z-0"
          onTouchStart={onLookTouchStart}
          onTouchMove={onLookTouchMove}
          onTouchEnd={onLookTouchEnd}
        />
      )}

      {/* 7. VIRTUAL JOYSTICK (Active only when playing in Mobile mode) */}
      {controlMode === 'mobile' && (
        <div
          id="touch-joy-zone"
          className="absolute bottom-6 left-6 w-36 h-36 rounded-full border-2 border-white/20 bg-slate-900/40 backdrop-blur-sm pointer-events-auto touch-none flex items-center justify-center shadow-2xl z-20 select-none animate-fade-in"
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
      )}

      {/* 8. MOBILE ACTION BUTTONS (Active only when playing in Mobile mode) */}
      {controlMode === 'mobile' && (
        <div 
          id="mobile-action-buttons-container"
          className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto z-20 touch-none select-none animate-fade-in"
        >
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
                title="Atacar con Espada"
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
              title="Linterna"
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
              title="Correr / Turbo"
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
      )}

      {/* 9. DESKTOP HELPER HINT (Active only when playing in PC mode) */}
      {controlMode === 'pc' && (
        <div 
          id="pc-controls-hint-bar"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 text-[11px] text-slate-200/90 bg-slate-950/85 border border-slate-700/80 backdrop-blur-md px-4 py-1.5 rounded-full shadow-xl pointer-events-none z-20 max-w-[95vw] overflow-x-auto whitespace-nowrap animate-fade-in"
        >
          <span className="text-amber-300 font-semibold">🖱️ Clic Derecho (mantener)</span> Girar Cámara
          <span className="text-slate-500">•</span>
          <span className="text-rose-300 font-semibold">🖱️ Clic Izq / R</span> Atacar
          <span className="text-slate-500">•</span>
          <span><b>WASD</b> Mover</span>
          <span className="text-slate-500">•</span>
          <span><b>Espacio</b> Saltar</span>
          <span className="text-slate-500">•</span>
          <span><b>Shift</b> Correr</span>
          <span className="text-slate-500">•</span>
          <span><b>E</b> Tienda/Templo</span>
          <span className="text-slate-500">•</span>
          <span><b>V</b> Cámara</span>
          <span className="text-slate-500">•</span>
          <span><b>Rueda</b> Zoom</span>
        </div>
      )}
    </div>
  );
};
