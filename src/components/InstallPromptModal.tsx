import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone, Monitor, CheckCircle2, Share, PlusSquare, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

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
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleDownloadAndInstallHTML = async () => {
    setDownloading(true);
    setStatusMessage('Iniciando instalación y descargando archivo...');

    // 1. Invocar el prompt de instalación nativo si está disponible
    try {
      onInstall();
    } catch (e) {
      console.warn('onInstall error:', e);
    }

    // 2. Si estamos dentro del iframe de previsualización, abrir la app en pestaña propia
    // donde Chrome, Android y Safari activan 100% el instalador nativo
    if (isInIframe) {
      setTimeout(() => {
        window.open(window.location.href, '_blank');
      }, 300);
    }

    // 3. Descarga garantizada mediante Blob para que no falle por restricciones del navegador
    try {
      const response = await fetch('/juego_santi_completo.html');
      if (response.ok) {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'SuperBoy3D_JuegoCompleto.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        setStatusMessage('✅ ¡Descarga completada y listo para instalar!');
      } else {
        window.open('/juego_santi_completo.html', '_blank');
        setStatusMessage('✅ Abriendo archivo para instalar...');
      }
    } catch (err) {
      window.open('/juego_santi_completo.html', '_blank');
      setStatusMessage('✅ Abriendo juego completo...');
    } finally {
      setTimeout(() => {
        setDownloading(false);
      }, 2500);
    }
  };

  const handleOpenStandaloneTab = () => {
    window.open(window.location.href, '_blank');
  };

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
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner overflow-hidden p-1">
                <img src="/icon.svg" alt="Espada Legendaria - Super Boy 3D" className="w-full h-full object-contain drop-shadow" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  Instalar / Descargar App
                </h3>
                <p className="text-xs text-amber-300/90 font-medium">
                  Directo en tu Celular o PC sin navegador
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
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
                <span className="text-xs font-semibold text-slate-200">Icono en tu pantalla</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-200">100% Pantalla completa</span>
              </div>
            </div>

            {/* Main Action Button: Descargar HTML e Instalar */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-800/80 border-2 border-amber-400/60 text-center space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Opción Recomendada
              </div>

              <button
                type="button"
                id="btn-download-html-and-install"
                onClick={handleDownloadAndInstallHTML}
                disabled={downloading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm uppercase tracking-wide shadow-xl shadow-amber-950/40 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <Download className={`w-5 h-5 ${downloading ? 'animate-spin' : 'animate-bounce'}`} />
                <span>{downloading ? 'Instalando...' : 'Descargar HTML e Instalar'}</span>
              </button>

              {statusMessage ? (
                <p className="text-xs text-amber-300 font-semibold animate-pulse">
                  {statusMessage}
                </p>
              ) : (
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Al pulsar este botón se activa el instalador en tu dispositivo y se descarga el archivo autónomo listo para funcionar sin conexión.
                </p>
              )}
            </div>

            {/* If inside iframe, show button to open direct full window */}
            {isInIframe && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-2">
                <div className="text-left">
                  <span className="block text-xs font-bold text-indigo-200">¿Estás en la vista previa?</span>
                  <span className="block text-[10px] text-indigo-300/80">Abre en pestaña independiente para permitir la instalación de Chrome/Safari</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenStandaloneTab}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir</span>
                </button>
              </div>
            )}

            {/* Platform Instructions */}
            {canNativeInstall ? (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <button
                  type="button"
                  id="btn-confirm-native-install"
                  onClick={() => {
                    onInstall();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalación Rápida de Chrome</span>
                </button>
              </div>
            ) : platform === 'ios' ? (
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" /> En iPhone / iPad (Safari):
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toca <strong className="text-white inline-flex items-center gap-1 px-1 py-0.5 rounded bg-slate-700"><Share className="w-3 h-3 text-blue-400" /> Compartir</strong> ➔ luego <strong className="text-white inline-flex items-center gap-1 px-1 py-0.5 rounded bg-slate-700"><PlusSquare className="w-3 h-3 text-amber-400" /> Agregar a pantalla de inicio</strong>.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-2">
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" /> En PC (Chrome / Edge):
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Haz clic en el icono de instalación <strong className="text-amber-300 font-semibold">(⊕)</strong> en la barra de direcciones del navegador o en el menú ⋮ ➔ "Instalar".
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
