import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Monitor, CheckCircle2, Share, PlusSquare, ArrowRight } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  canNativeInstall: boolean;
  platform: 'ios' | 'android' | 'desktop';
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  canNativeInstall,
  platform,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-amber-600/30 via-slate-900 to-indigo-600/30 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  Descargar Juego Completo
                </h3>
                <p className="text-xs text-amber-300/90 font-medium">
                  Instalar directamente en Celular o PC (PWA)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 text-sm">
            {/* Highlights */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Sin barra de navegación</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Icono en tu pantalla</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">Carga ultra rápida</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">100% Pantalla Completa</span>
              </div>
            </div>

            {/* Platform Instructions */}
            {canNativeInstall ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <p className="text-xs text-emerald-200 font-medium">
                  Tu navegador permite la instalación automática con 1 solo clic:
                </p>
                <button
                  type="button"
                  id="btn-confirm-native-install"
                  onClick={() => {
                    onInstall();
                    onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-emerald-900/40 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Ahora</span>
                </button>
              </div>
            ) : platform === 'ios' ? (
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-indigo-500/30 space-y-3">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> Cómo instalar en iPhone / iPad (Safari):
                </p>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Toca el botón <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 font-semibold"><Share className="w-3.5 h-3.5 text-blue-400" /> Compartir</strong> abajo en Safari.
                  </li>
                  <li>
                    Desliza hacia abajo y pulsa <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-700 font-semibold"><PlusSquare className="w-3.5 h-3.5 text-amber-400" /> Agregar a pantalla de inicio</strong>.
                  </li>
                  <li>
                    Toca <strong className="text-emerald-400 font-bold">Agregar</strong> arriba a la derecha. ¡Listo!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-indigo-500/30 space-y-3">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" /> Cómo instalar en Chrome / Edge:
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Haz clic en el icono de instalación <strong className="text-amber-300 font-semibold">(⊕ o 💻)</strong> en el extremo derecho de tu barra de direcciones URL, o abre el menú de tres puntos (⋮) y selecciona <strong className="text-white font-semibold">"Instalar Super Boy 3D"</strong>.
                </p>
              </div>
            )}

            {/* Offline single file alternative option */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>¿Quieres el archivo HTML autónomo?</span>
              <a
                href="/juego_santi_completo.html"
                download="SuperBoy3D_JuegoCompleto.html"
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
              >
                Descargar HTML <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
