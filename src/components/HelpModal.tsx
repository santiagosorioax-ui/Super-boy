import React from 'react';
import { X, Gamepad2, Smartphone, Monitor, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        id="help-modal-card"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-amber-300">Cómo Jugar a SUPER BOY</h2>
          </div>
          <button
            id="help-btn-close"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* Objective */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">Objetivo de la Aventura & Tienda</span>
              <p className="text-slate-300 leading-relaxed">
                Explora el mundo 3D, recolecta monedas y gemas, y visita la <b>Tienda cerca del inicio</b> para comprar espadas épicas (Madera, Katana Neón, Mandoble de Fuego) y bebidas energéticas con efectos de súper velocidad, salto lunar y magneto de monedas.
              </p>
            </div>
          </div>

          {/* Night Zombies & 5-Hit System */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">🧟</span>
            <div>
              <span className="font-bold text-rose-300 block mb-0.5">Zombis Nocturnos & Sistema de Salud</span>
              <p className="text-slate-300 leading-relaxed">
                Los zombis solo salen de noche. Tienes <strong>5 puntos de vida (corazones)</strong>. Si un zombi te golpea 5 veces seguidas, caerás derrotado, perderás algunas monedas y podrás pulsar <strong>Reintentar</strong> para reaparecer de inmediato en la Plaza central.
              </p>
            </div>
          </div>

          {/* PC Controls */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2.5">
              <Monitor className="w-4 h-4 text-blue-400" />
              <span>Controles en Computadora (PC)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Moverse</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">W, A, S, D</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Saltar</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Espacio</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Abrir Tienda</span>
                <span className="font-bold text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Tecla E</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Atacar / Espada</span>
                <span className="font-bold text-rose-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Tecla R / Q</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Mirar / Cámara</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Ratón (Clic)</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Correr (Sprint)</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Shift</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Linterna</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Tecla F</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">1ª / 3ª Persona</span>
                <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">Tecla V</span>
              </div>
              <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-xl border border-sky-500/30 col-span-2">
                <span className="text-sky-300 font-medium">Volver al Inicio (Teletransporte)</span>
                <span className="font-bold text-sky-200 bg-sky-950 px-2 py-0.5 rounded text-[11px] border border-sky-500/40">Tecla H / B</span>
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-2.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Controles en Celular o Tablet</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
              <li><b>Joystick izquierdo:</b> Muévete en cualquier dirección.</li>
              <li><b>Lado derecho de la pantalla:</b> Arrastra con el dedo para girar la cámara.</li>
              <li><b>Botón SALTAR:</b> Salta o brinca sobre plataformas.</li>
              <li><b>Botón Tienda (Arriba):</b> Abre la tienda en cualquier momento o acércate a ella.</li>
              <li><b>Botón Espada:</b> Ataca cuando tengas una espada equipada.</li>
              <li><b>Botones Rápidos:</b> Activa la linterna 🔦, turbo ⚡ o cambia de cámara 👁️.</li>
            </ul>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs transition active:scale-95 shadow-md"
          >
            ¡Entendido, a jugar!
          </button>
        </div>
      </div>
    </div>
  );
};
