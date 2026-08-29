import React, { useEffect, useState } from 'react';
import { Trophy, X, Medal, Flame, Zap, RefreshCw, UserCheck } from 'lucide-react';
import { getTopLeaderboard, LeaderboardRecord } from '../firebase/gameSync';
import { auth } from '../firebase/config';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentScore = 0,
}) => {
  const [leaders, setLeaders] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopLeaderboard(25);
      setLeaders(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('No se pudo cargar la tabla de clasificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScores();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUserId = auth.currentUser?.uid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative p-5 pb-4 bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
                Ranking Global
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                  Firebase
                </span>
              </h2>
              <p className="text-xs text-slate-400">Los mejores jugadores de Super Boy 3D</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchScores}
              disabled={loading}
              title="Recargar clasificación"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">Cargando puntuaciones en la nube...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-sm px-4">
              <p>{error}</p>
              <button
                onClick={fetchScores}
                className="mt-3 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Reintentar
              </button>
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-14 text-center text-slate-400 px-6">
              <Flame className="w-10 h-10 text-amber-400/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">¡Sé el primero en el Ranking!</p>
              <p className="text-xs text-slate-500 mt-1">Inicia sesión con Google para registrar tus puntuaciones en Firebase Firestore.</p>
            </div>
          ) : (
            leaders.map((entry, index) => {
              const isCurrentUser = currentUserId === entry.userId;
              let medalColor = 'bg-slate-800 text-slate-400 border-slate-700';
              if (index === 0) medalColor = 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30 font-black';
              else if (index === 1) medalColor = 'bg-slate-200 text-slate-900 border-white shadow-md font-black';
              else if (index === 2) medalColor = 'bg-amber-700 text-amber-100 border-amber-600 font-black';

              return (
                <div
                  key={entry.userId || index}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs border ${medalColor}`}>
                      {index + 1}
                    </div>

                    {entry.photoURL ? (
                      <img
                        src={entry.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full border border-amber-400/40 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-amber-300">
                        {entry.displayName?.charAt(0) || 'P'}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white truncate max-w-[140px] sm:max-w-[180px]">
                          {entry.displayName || 'Jugador'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40">
                            TÚ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>💰 {entry.coins?.toLocaleString() || 0}</span>
                        <span>•</span>
                        <span>🧟 {entry.zombiesDefeated || 0} zombis</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right pl-2">
                    <div className="text-base font-black text-amber-300 tracking-tight flex items-center justify-end gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {entry.bestScore.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">puntos</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Sincronización en la nube con Firestore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
