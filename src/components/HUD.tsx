import React, { useState } from 'react';
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
  Monitor,
  Smartphone,
  Trophy,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud,
  Crown,
  CloudRain,
  CloudFog,
  Wind,
  Maximize,
  Minimize,
  Download,
  X
} from 'lucide-react';
import { TimeState, PlayerInventory, WorldDimension, MayanBossState, ControlDevice, WeatherState, WeatherType } from '../types';
import { User } from 'firebase/auth';

interface HUDProps {
  score: number;
  collectedCoins: number;
  totalCoins: number;
  timeState: TimeState;
  weatherState?: WeatherState | null;
  onSelectWeather?: (type: WeatherType) => void;
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
  isNearCampfire?: boolean;
  templeCost?: number;
  onEnterTemple?: () => void;
  bossState?: MayanBossState | null;
  inventory?: PlayerInventory;
  currentDimension?: WorldDimension;
  zombiesDefeated?: number;
  currentUser?: User | null;
  isVip?: boolean;
  onOpenVipProfile?: () => void;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
  onOpenLeaderboard?: () => void;
  onToggleMusic: () => void;
  onToggleFlashlight: () => void;
  onToggleViewMode: () => void;
  onJump: () => void;
  onToggleSprint: (sprint: boolean) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenWardrobe?: () => void;
  onOpenShop?: () => void;
  onOpenMultiplierShop?: () => void;
  onReturnToSpawn?: () => void;
  onTeleportToTemple?: () => void;
  onSwingSword?: () => void;
  isFlying?: boolean;
  onToggleFlight?: () => void;
  onFlyVertical?: (dir: -1 | 0 | 1) => void;
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  collectedCoins,
  totalCoins,
  timeState,
  weatherState,
  onSelectWeather,
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
  isNearCampfire = false,
  templeCost = 500,
  onEnterTemple,
  bossState,
  inventory,
  currentDimension = 'main',
  zombiesDefeated = 0,
  currentUser,
  isVip = false,
  onOpenVipProfile,
  onSignInGoogle,
  onSignOut,
  onOpenLeaderboard,
  onToggleMusic,
  onToggleFlashlight,
  onToggleViewMode,
  onJump,
  onToggleSprint,
  onOpenSettings,
  onOpenHelp,
  onOpenWardrobe,
  onOpenShop,
  onOpenMultiplierShop,
  onReturnToSpawn,
  onTeleportToTemple,
  onSwingSword,
  isFlying = false,
  onToggleFlight,
  onFlyVertical,
  onJoyTouchStart,
  onJoyTouchMove,
  onJoyTouchEnd,
  joyStickPos,
  onLookTouchStart,
  onLookTouchMove,
  onLookTouchEnd,
  lastToast,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenInstall,
  isInstalled = false,
}) => {
  const [hideFsBanner, setHideFsBanner] = useState(false);
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

  const getWeatherBadge = () => {
    if (!weatherState) {
      return {
        icon: <Sun className="w-3.5 h-3.5 text-amber-300" />,
        label: 'Despejado',
        detail: 'Normal',
        bg: 'bg-amber-950/70 border-amber-500/40 text-amber-200',
        alert: null,
      };
    }

    switch (weatherState.type) {
      case 'rain':
        return {
          icon: <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-bounce" />,
          label: 'Lluvia',
          detail: 'Suelo resbaladizo',
          bg: 'bg-sky-950/85 border-sky-400/60 text-sky-200 shadow-sky-500/20',
          alert: '⚠️ Piso resbaladizo: mayor inercia al moverte',
        };
      case 'fog':
        return {
          icon: <CloudFog className="w-3.5 h-3.5 text-slate-300 animate-pulse" />,
          label: 'Neblina',
          detail: 'Baja visibilidad',
          bg: 'bg-slate-900/85 border-slate-500/50 text-slate-200',
          alert: '🌫️ Neblina densa: visibilidad reducida',
        };
      case 'wind':
        return {
          icon: <Wind className="w-3.5 h-3.5 text-teal-300 animate-pulse" />,
          label: 'Viento Fuerte',
          detail: `${weatherState.windSpeed} m/s`,
          bg: 'bg-teal-950/85 border-teal-400/60 text-teal-200 shadow-teal-500/20',
          alert: `💨 Ráfagas de ${weatherState.windSpeed} m/s empujándote`,
        };
      case 'clear':
      default:
        return {
          icon: <Sun className="w-3.5 h-3.5 text-amber-300" />,
          label: 'Despejado',
          detail: 'Cielo claro',
          bg: 'bg-amber-950/70 border-amber-500/40 text-amber-200',
          alert: null,
        };
    }
  };

  const weatherBadge = getWeatherBadge();
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

          {/* Dimension Tag */}
          {currentDimension !== 'main' && (
            <div
              id="hud-dimension-tag"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase backdrop-blur-md border shadow-lg ${
                currentDimension === 'mayan_boss'
                  ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-300'
                  : 'bg-pink-950/90 border-pink-500/70 text-pink-300'
              }`}
            >
              <span>{currentDimension === 'mayan_boss' ? '🏛️ Templo Maya' : '🍭 Mundo Caramelo'}</span>
            </div>
          )}
        </div>

        {/* Center: Day/Night Clock Widget & Optional Zombie/FPS Indicators - Compact */}
        <div className="flex items-center gap-1">
          {/* Zombie Kills Badge if any */}
          {zombiesDefeated > 0 && (
            <div
              id="hud-zombie-counter"
              className="flex items-center gap-1 bg-red-950/80 backdrop-blur-md border border-red-500/40 text-red-300 rounded-lg px-1.5 py-0.5 shadow-sm text-[10px] font-bold"
            >
              <Sword className="w-2.5 h-2.5 text-red-400" />
              <span>{zombiesDefeated}</span>
            </div>
          )}

          {/* Day/Night Clock */}
          <div 
            id="hud-time-widget"
            className={`flex items-center gap-1 backdrop-blur-md border rounded-lg px-2 py-0.5 shadow-sm ${period.bg}`}
          >
            {period.icon}
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold tracking-wider leading-none">
                {timeState.formattedTime}
              </span>
              <span className="text-[8px] opacity-80 uppercase tracking-widest font-semibold leading-none">
                {period.label}
              </span>
            </div>
          </div>

          {/* Dynamic Weather Widget */}
          <button
            id="hud-weather-widget"
            type="button"
            onClick={() => {
              if (onSelectWeather && weatherState) {
                const order: WeatherType[] = ['clear', 'rain', 'fog', 'wind'];
                const currIdx = order.indexOf(weatherState.type);
                const nextType = order[(currIdx + 1) % order.length];
                onSelectWeather(nextType);
              }
            }}
            className={`flex items-center gap-1 backdrop-blur-md border rounded-lg px-2 py-0.5 shadow-sm transition-all select-none hover:scale-105 active:scale-95 ${weatherBadge.bg}`}
            title={weatherState ? `${weatherState.description} (Haz clic para alternar clima)` : 'Clima dinámico'}
          >
            {weatherBadge.icon}
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold tracking-wider leading-none">
                {weatherBadge.label}
              </span>
              <span className="text-[8px] opacity-80 uppercase tracking-wider font-semibold leading-none">
                {weatherBadge.detail}
              </span>
            </div>
          </button>

          {/* FPS Badge if enabled */}
          {showFps && (
            <div
              id="hud-fps-counter"
              className={`px-1.5 py-0.5 rounded-lg backdrop-blur-md border shadow-sm text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                fps >= 45 
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                  : fps >= 25 
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' 
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}
            >
              <span>{fps}</span>
              <span className="text-[7px] font-sans opacity-70">FPS</span>
            </div>
          )}

          {/* Radar Compass to nearest coin */}
          {radar && (
            <div
              id="hud-radar-compass"
              className="hidden md:flex items-center gap-1 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-1.5 py-0.5 text-white shadow-sm text-[10px]"
              title="Brújula a la moneda más cercana"
            >
              <Compass 
                className="w-3 h-3 text-emerald-400 transition-transform duration-100" 
                style={{ transform: `rotate(${radar.angleDeg}deg)` }}
              />
              <span className="font-semibold text-emerald-300 text-[10px]">{radar.distance}m</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls (Shrunk except Life and Coins, with highlighted ROPA button) */}
        <div className="flex items-center gap-1">
          {/* Google Auth Status / Cloud Save */}
          {currentUser ? (
            <div
              id="hud-user-profile"
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-lg backdrop-blur-md shadow-sm text-[10px] border bg-slate-900/80 border-slate-700/80 text-slate-200"
              title={`Conectado como ${currentUser.displayName || currentUser.email} (Progreso guardado)`}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-3 h-3 rounded-full border border-emerald-400/70"
                />
              ) : (
                <UserIcon className="w-2.5 h-2.5 text-slate-300" />
              )}
              <span className="font-semibold text-[9px] max-w-[65px] truncate text-slate-200">
                {currentUser.displayName?.split(' ')[0] || (isVip ? 'Santiago' : 'Jugador')}
              </span>
              <Cloud className="w-2 h-2 text-emerald-400" />
            </div>
          ) : (
            <button
              id="hud-btn-signin"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSignInGoogle?.();
              }}
              title="Guardar partida en Firebase con Google"
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 border border-blue-400/60 text-white font-bold text-[9px] shadow-sm transition active:scale-95 touch-none select-none"
            >
              <LogIn className="w-2.5 h-2.5 text-blue-200" />
              <span className="hidden sm:inline text-[9px]">Guardar</span>
            </button>
          )}

          {/* Creator Flight Mode Button (Discreet) */}
          {isVip && (
            <button
              id="hud-btn-fly"
              onClick={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement)?.blur();
                onToggleFlight?.();
              }}
              aria-label="Volar"
              title="Volar [G]"
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg border backdrop-blur-md shadow-sm transition active:scale-95 touch-none select-none cursor-pointer font-bold text-[9px] ${
                isFlying
                  ? 'bg-sky-500 border-sky-300 text-white shadow-sm'
                  : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-[10px] leading-none">🕊️</span>
              <span className="text-[9px] font-bold tracking-wide hidden sm:inline">
                {isFlying ? 'VOLANDO' : 'VUELO'}
              </span>
            </button>
          )}

          {/* Leaderboard High Scores Button (Shrunk) */}
          <button
            id="hud-btn-leaderboard"
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenLeaderboard?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenLeaderboard?.();
            }}
            aria-label="Ranking Global"
            title="Ranking de Mejores Jugadores"
            className="p-1 rounded-lg border border-amber-500/40 bg-amber-950/80 hover:bg-amber-900/80 backdrop-blur-md text-amber-300 hover:text-amber-100 shadow-sm transition active:scale-95 touch-none select-none"
          >
            <Trophy className="w-3 h-3 text-amber-400" />
          </button>

          {/* Control Mode Toggle Button (PC vs Celular) (Shrunk) */}
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
            className={`px-1.5 py-0.5 rounded-lg border backdrop-blur-md shadow-sm transition active:scale-95 touch-none select-none flex items-center gap-0.5 text-[9px] font-bold ${
              controlMode === 'mobile'
                ? 'bg-emerald-600/80 border-emerald-400/60 text-white shadow-emerald-950/40'
                : 'bg-blue-600/80 border-blue-400/60 text-white shadow-blue-950/40'
            }`}
          >
            {controlMode === 'mobile' ? (
              <>
                <Smartphone className="w-3 h-3 text-emerald-200" />
                <span className="hidden sm:inline text-[9px]">CEL</span>
              </>
            ) : (
              <>
                <Monitor className="w-3 h-3 text-cyan-200" />
                <span className="hidden sm:inline text-[9px]">PC</span>
              </>
            )}
          </button>

          {/* Clothing / Wardrobe Button - Highlighted for Customization & Outfits */}
          <button
            id="hud-btn-outfits"
            onPointerDown={(e) => {
              e.stopPropagation();
              onOpenWardrobe?.();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onOpenWardrobe?.();
            }}
            aria-label="Armario y Ropa"
            title="Tienda de Ropa: Cambiar ropa, sombreros, zapatos, mochilas y cambiar de hombre a mujer con monedas"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-400/80 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-md shadow-purple-950/60 transition-all hover:scale-105 active:scale-95 touch-none select-none"
          >
            <Shirt className="w-3.5 h-3.5 text-yellow-300" />
            <span className="tracking-wider">ROPA</span>
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
            className={`p-1 rounded-lg border backdrop-blur-md shadow-sm transition active:scale-95 touch-none select-none ${
              isMusicOn
                ? 'bg-emerald-600/80 border-emerald-400/50 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {isMusicOn ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
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
            className="p-1 rounded-lg border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-sm transition active:scale-95 touch-none select-none"
          >
            <HelpCircle className="w-3 h-3" />
          </button>

          {/* Download Full App PWA Button */}
          {onOpenInstall && (
            <button
              id="hud-btn-download-pwa"
              onPointerDown={(e) => {
                e.stopPropagation();
                onOpenInstall();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenInstall();
              }}
              aria-label="Descargar Juego Completo"
              title="Descargar e instalar el juego completo en Celular o PC (PWA)"
              className="p-1 rounded-lg border border-amber-500/50 bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 hover:text-white shadow-sm transition active:scale-95 touch-none select-none"
            >
              <Download className="w-3 h-3" />
            </button>
          )}

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
            className="p-1 rounded-lg border border-slate-700/60 bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white shadow-sm transition active:scale-95 touch-none select-none"
          >
            <Settings className="w-3 h-3" />
          </button>

          {/* Fullscreen Button to Hide Mobile URL and Browser Bars */}
          {onToggleFullscreen && (
            <button
              id="hud-btn-fullscreen"
              onPointerDown={(e) => {
                e.stopPropagation();
                onToggleFullscreen();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen();
              }}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (Ocultar barra de URL)'}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa (Oculta la barra de URL y navegación)'}
              className={`p-1 rounded-lg border backdrop-blur-md shadow-sm transition active:scale-95 touch-none select-none ${
                isFullscreen
                  ? 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300'
                  : 'border-cyan-500/80 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300'
              }`}
            >
              {isFullscreen ? (
                <Minimize className="w-3 h-3" />
              ) : (
                <Maximize className="w-3 h-3 animate-pulse" />
              )}
            </button>
          )}
        </div>

      </header>

      {/* Interactive Mobile Prompt to Hide URL Bar */}
      {!isFullscreen && !hideFsBanner && onToggleFullscreen && (
        <div 
          id="hud-fullscreen-prompt"
          className="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/95 backdrop-blur-md border border-cyan-500/70 text-cyan-300 text-[10px] sm:text-xs font-bold shadow-xl shadow-black/80 animate-bounce pointer-events-auto"
        >
          <button
            onClick={() => {
              onToggleFullscreen();
              setHideFsBanner(true);
            }}
            className="flex items-center gap-1.5 hover:text-white transition active:scale-95"
          >
            <Maximize className="w-3.5 h-3.5 text-cyan-400" />
            <span>Toca para Pantalla Completa (Quitar barra de URL)</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setHideFsBanner(true);
            }}
            className="ml-1 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Cerrar aviso"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 1.05 ACTIVE WEATHER EFFECT ALERT PILL */}
      {weatherBadge.alert && currentDimension !== 'mayan_boss' && (
        <div 
          id="hud-weather-alert-banner"
          className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-15 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-[11px] font-semibold text-slate-200 shadow-xl animate-fade-in"
        >
          {weatherBadge.icon}
          <span>{weatherBadge.alert}</span>
        </div>
      )}

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

      {/* 2.1 CAMPFIRE SAFE ZONE BADGE */}
      {isNearCampfire && (
        <div className="absolute top-18 sm:top-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-pulse">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-950/90 via-amber-950/95 to-orange-950/90 border-2 border-amber-400/80 text-amber-200 text-xs font-black shadow-xl shadow-amber-500/20 backdrop-blur-md">
            <span className="text-base animate-bounce">🔥</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-black tracking-wide text-amber-300 uppercase">Zona Segura (Fogata)</span>
              <span className="text-[9px] text-amber-200/90 font-medium">Inmune a zombis • Curación activa (+1 HP)</span>
            </div>
          </div>
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
            <span>Entrar al Templo Maya (¡Entrada Libre!) [E]</span>
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
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 animate-fade-in z-30">
          <div className="bg-slate-900/90 text-amber-300 border border-amber-500/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5">
            <span>✨</span>
            <span>{lastToast}</span>
          </div>
        </div>
      )}

      {/* 5.1 Flight Active Badge */}
      {isFlying && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 z-30 animate-fade-in">
          <div className="bg-slate-950/90 text-sky-300 border border-sky-400 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
            <span className="text-base">🕊️</span>
            <span>MODO VUELO ACTIVO</span>
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

            {/* Creator Fly Mode Quick Button (Mobile) */}
            {isVip && (
              <button
                id="btn-action-fly-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement)?.blur();
                  onToggleFlight?.();
                }}
                className={`w-11 h-11 rounded-2xl border backdrop-blur-md flex items-center justify-center shadow-lg transition active:scale-90 touch-none select-none cursor-pointer ${
                  isFlying
                    ? 'bg-sky-500 border-sky-300 text-white shadow-sky-500/40'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Modo Vuelo"
              >
                <span className="text-xl">🕊️</span>
              </button>
            )}
          </div>

          {/* Big Jump or 3D Vertical Flight Buttons */}
          {isFlying ? (
            <div className="flex items-center gap-2">
              <button
                id="btn-action-fly-down"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(-1);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                onPointerCancel={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                className="w-16 h-20 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-900 active:from-slate-900 active:to-black border-2 border-slate-600/80 text-white font-black text-xs tracking-wider shadow-2xl flex flex-col items-center justify-center gap-0.5 active:scale-95 transition touch-none select-none"
                title="Descender en Vuelo"
              >
                <span className="text-xl">⬇️</span>
                <span>BAJAR</span>
              </button>

              <button
                id="btn-action-fly-up"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(1);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                onPointerCancel={(e) => {
                  e.stopPropagation();
                  onFlyVertical?.(0);
                }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 active:from-yellow-500 active:to-amber-600 border-2 border-yellow-200 text-slate-950 font-black text-sm tracking-wider shadow-2xl shadow-yellow-500/50 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition touch-none select-none animate-pulse"
                title="Ascender en Vuelo"
              >
                <span className="text-xl">⬆️</span>
                <span>SUBIR</span>
              </button>
            </div>
          ) : (
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
          )}
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
