import React from 'react';
import { X, Volume2, Sun, Moon, RotateCcw, Compass, Sliders, Eye, Gauge, Zap, Home, Monitor, Smartphone, Gamepad2 } from 'lucide-react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetGame: () => void;
  onReturnToTitle?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetGame,
  onReturnToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        id="settings-modal-card"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold">Ajustes del Juego</h2>
          </div>
          <button
            id="settings-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="space-y-5 py-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {/* 0. Modo de Control (PC vs Celular) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                Modo de Juego / Controles
              </span>
              <span className="text-[10px] text-cyan-400 font-normal">
                {settings.controlMode === 'mobile' ? 'Botones táctiles activos' : 'Teclado y ratón'}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="settings-btn-mode-pc"
                onClick={() => onUpdateSettings({ controlMode: 'pc' })}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                  settings.controlMode === 'pc'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Monitor className="w-4 h-4 text-cyan-300" />
                <span>Jugar en PC</span>
              </button>
              <button
                type="button"
                id="settings-btn-mode-mobile"
                onClick={() => onUpdateSettings({ controlMode: 'mobile' })}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition ${
                  settings.controlMode === 'mobile'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-300" />
                <span>Jugar en Celular</span>
              </button>
            </div>
          </div>
          {/* 1. Mobile Performance & Graphics Quality */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Rendimiento Móvil / Gráficos
              </span>
              <span className="text-[10px] text-amber-400/80 font-normal">Para celular</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ graphicsQuality: 'low' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-0.5 transition ${
                  settings.graphicsQuality === 'low'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Rápido (Bajo)</span>
                <span className="text-[10px] opacity-75">Max FPS</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ graphicsQuality: 'medium' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-0.5 transition ${
                  settings.graphicsQuality === 'medium'
                    ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Equilibrado</span>
                <span className="text-[10px] opacity-75">Recomendado</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ graphicsQuality: 'high' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-0.5 transition ${
                  settings.graphicsQuality === 'high'
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Alto</span>
                <span className="text-[10px] opacity-75">Sombras PCF</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Mostrar Contador FPS
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ showFps: !settings.showFps })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showFps ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.showFps ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 2. Day / Night Cycle */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Ciclo Día y Noche
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleSpeed: 'normal' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  settings.cycleSpeed === 'normal'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Normal (2.5m)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleSpeed: 'fast' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  settings.cycleSpeed === 'fast'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Rápido (40s)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleSpeed: 'slow' })}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                  settings.cycleSpeed === 'slow'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Lento (8m)
              </button>
            </div>
            {/* Freeze Day/Night Options */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleSpeed: 'freeze_day' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                  settings.cycleSpeed === 'freeze_day'
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Siempre Día
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ cycleSpeed: 'freeze_night' })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                  settings.cycleSpeed === 'freeze_night'
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Siempre Noche
              </button>
            </div>
          </div>

          {/* 3. Audio Volumes */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              Audio y Música
            </label>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Música de Aventura</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Efectos de Sonido (SFX)</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Sonido Ambiental (Bosque / Magia)</span>
                <span>{Math.round((settings.ambientVolume ?? 0.5) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ambientVolume ?? 0.5}
                onChange={(e) => onUpdateSettings({ ambientVolume: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </div>

          {/* 4. Controls & View */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              Cámara y Jugabilidad
            </label>

            {/* Field of View (FOV) Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Campo de Visión (FOV)</span>
                <span className="font-semibold text-indigo-400">
                  {settings.fov || 100}° { (settings.fov || 100) >= 100 ? '(Óptimo / Ultra Amplio)' : (settings.fov || 100) >= 85 ? '(Panorámico)' : '(Estándar)' }
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="115"
                step="1"
                value={settings.fov || 100}
                onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>70° Cerrado</span>
                <span>100° Óptimo</span>
                <span>115° Máximo</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>Sensibilidad de Cámara (Giro táctil / Ratón)</span>
                <span className="font-semibold text-indigo-400">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0.5x Suave</span>
                <span>1.5x Rápido</span>
                <span>3.0x Ultra</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Brújula / Radar de Monedas
              </span>
              <button
                type="button"
                onClick={() => onUpdateSettings({ showCompass: !settings.showCompass })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.showCompass ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.showCompass ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Reset and Return to Title Buttons */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            {onReturnToTitle && (
              <button
                type="button"
                id="settings-btn-title-screen"
                onClick={() => {
                  onReturnToTitle();
                  onClose();
                }}
                className="w-full py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
              >
                <Home className="w-4 h-4 text-amber-400" />
                Pantalla de Inicio (SUPER BOY)
              </button>
            )}

            <button
              type="button"
              id="settings-btn-reset"
              onClick={() => {
                onResetGame();
                onClose();
              }}
              className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar Monedas y Partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
