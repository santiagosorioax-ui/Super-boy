import React, { useState } from 'react';
import { X, ShoppingBag, Zap, Shield, Sparkles, Check, Flame, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { ShopItem, PlayerInventory, PlayerBuffs } from '../types';
import { SHOP_ITEMS } from '../game/shopCatalog';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PlayerInventory;
  currentDimension?: string;
  onBuyItem: (item: ShopItem) => void;
  onEquipSword: (swordId: string | null) => void;
  onEquipBoots?: (bootsId: string | null) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  inventory,
  currentDimension = 'main',
  onBuyItem,
  onEquipSword,
  onEquipBoots,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sword' | 'boots' | 'drink'>('all');
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  if (!isOpen) return null;

  const isCandyWorld = currentDimension === 'candy';

  const filteredItems = SHOP_ITEMS.filter((item) => {
    // If filtering by dimension preference:
    // In candy world, prioritize candy items, but show all drinks
    if (activeTab !== 'all' && item.category !== activeTab) {
      return false;
    }
    return true;
  });

  const isSwordOwned = (id: string) => inventory.ownedSwordIds.includes(id);
  const isSwordEquipped = (id: string) => inventory.equippedSwordId === id;
  const isBootsOwned = (id: string) => (id === 'gummy_boots' ? !!inventory.hasGummyBoots : false);
  const isBootsEquipped = (id: string) => inventory.equippedBootsId === id;

  const hasActiveBuffs =
    inventory.activeBuffs.speedTimeRemaining > 0 ||
    inventory.activeBuffs.jumpTimeRemaining > 0 ||
    inventory.activeBuffs.magnetTimeRemaining > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        id="shop-modal-container"
        className="relative w-full max-w-2xl max-h-[92vh] bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-950/40 text-slate-100 flex flex-col overflow-hidden"
      >
        {/* Header with shop keeper avatar & coin counter */}
        <div className={`p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between ${
          isCandyWorld
            ? 'bg-gradient-to-r from-pink-950/60 via-slate-900 to-rose-950/60'
            : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
              isCandyWorld
                ? 'bg-pink-500/20 border border-pink-400/40 shadow-pink-500/20'
                : 'bg-amber-500/20 border border-amber-400/40 shadow-amber-500/20'
            }`}>
              {isCandyWorld ? '🍬' : '🏪'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg sm:text-xl font-bold bg-clip-text text-transparent ${
                  isCandyWorld
                    ? 'bg-gradient-to-r from-pink-200 via-rose-300 to-yellow-200'
                    : 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400'
                }`}>
                  {isCandyWorld ? 'Tienda de Dulces & Botas' : 'Tienda de Santi'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                  isCandyWorld
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isCandyWorld ? '🍭 Reino de Azúcar' : 'Plaza Central'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isCandyWorld
                  ? '¡Espadas de caramelo legendarias, botas de gomita súper saltarinas y pociones dulces!'
                  : '¡Usa tus monedas para equiparte espadas y tomar bebidas energéticas!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coins Balance */}
            <div
              id="shop-coin-balance"
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 shadow-inner text-amber-300"
            >
              <span className="text-lg">🪙</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-amber-200/70 font-semibold leading-none">MONEDAS</span>
                <span className="text-base sm:text-lg font-black tracking-tight leading-tight">{inventory.coins}</span>
              </div>
            </div>

            <button
              id="shop-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Buffs Notification Bar if any */}
        {hasActiveBuffs && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-950/60 to-purple-950/60 border-b border-indigo-500/20 flex items-center gap-3 overflow-x-auto text-xs">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Efectos Activos:
            </span>
            {inventory.activeBuffs.speedTimeRemaining > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center gap-1 shrink-0">
                ⚡ Súper Velocidad: {Math.ceil(inventory.activeBuffs.speedTimeRemaining)}s
              </span>
            )}
            {inventory.activeBuffs.jumpTimeRemaining > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center gap-1 shrink-0">
                🦘 Salto Lunar: {Math.ceil(inventory.activeBuffs.jumpTimeRemaining)}s
              </span>
            )}
            {inventory.activeBuffs.magnetTimeRemaining > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 flex items-center gap-1 shrink-0">
                🧲 Magneto: {Math.ceil(inventory.activeBuffs.magnetTimeRemaining)}s
              </span>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({filteredItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sword')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'sword'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🗡️ Espadas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('boots')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'boots'
                  ? 'bg-pink-500 text-slate-950 shadow-md shadow-pink-500/30 font-bold'
                  : 'text-pink-400 hover:text-pink-300'
              }`}
            >
              👟 Botas de Gomita
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drink')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'drink'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🥤 Bebidas Energéticas
            </button>
          </div>

          <div className="flex items-center gap-2">
            {inventory.equippedBootsId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-pink-950/50 border border-pink-500/40 text-xs">
                <span className="text-pink-400">Botas:</span>
                <span className="text-pink-200 font-bold">Gomita (+120% Salto)</span>
                <button
                  type="button"
                  onClick={() => onEquipBoots?.(null)}
                  className="ml-1 text-[10px] text-rose-400 hover:text-rose-300 underline"
                >
                  Quitar
                </button>
              </div>
            )}

            {inventory.equippedSwordId && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                <span className="text-slate-400">Espada:</span>
                <span className="text-amber-300 font-bold">
                  {SHOP_ITEMS.find((s) => s.id === inventory.equippedSwordId)?.name || 'Ninguna'}
                </span>
                <button
                  type="button"
                  onClick={() => onEquipSword(null)}
                  className="ml-1 text-[10px] text-rose-400 hover:text-rose-300 underline"
                >
                  Desequipar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const owned = (item.category === 'sword' && isSwordOwned(item.id)) || (item.category === 'boots' && isBootsOwned(item.id));
              const equipped = (item.category === 'sword' && isSwordEquipped(item.id)) || (item.category === 'boots' && isBootsEquipped(item.id));
              const canAfford = inventory.coins >= item.price;

              return (
                <div
                  key={item.id}
                  id={`shop-item-${item.id}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    equipped
                      ? 'bg-gradient-to-br from-amber-950/40 via-slate-800/90 to-slate-900 border-amber-400/60 shadow-lg shadow-amber-500/10'
                      : owned
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 border border-slate-700/60 text-amber-300">
                      {item.badge}
                    </span>
                  )}

                  {/* Top info */}
                  <div className="flex gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md border"
                      style={{
                        backgroundColor: `${item.color}22`,
                        borderColor: `${item.color}66`,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="space-y-1 pr-12">
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/70 flex items-center justify-between">
                    {/* Price or status */}
                    <div className="flex items-center gap-1.5">
                      {owned ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> En tu mochila
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-300 font-black text-sm">
                          <span>🪙</span>
                          <span>{item.price}</span>
                          <span className="text-[10px] font-normal text-slate-400">monedas</span>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    {item.category === 'sword' ? (
                      owned ? (
                        equipped ? (
                          <button
                            type="button"
                            onClick={() => onEquipSword(null)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold flex items-center gap-1 hover:bg-amber-500/30 transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Equipado
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEquipSword(item.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/40 transition"
                          >
                            Equipar
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => onBuyItem(item)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Comprar
                        </button>
                      )
                    ) : item.category === 'boots' ? (
                      owned ? (
                        equipped ? (
                          <button
                            type="button"
                            onClick={() => onEquipBoots?.(null)}
                            className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 border border-pink-400 text-pink-300 text-xs font-bold flex items-center gap-1 hover:bg-pink-500/30 transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Equipadas
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEquipBoots?.(item.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-900/40 transition"
                          >
                            Equipar Botas
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => onBuyItem(item)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-pink-500 hover:bg-pink-400 text-slate-950 shadow-md shadow-pink-500/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Comprar
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => onBuyItem(item)}
                        disabled={!canAfford}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <span>🥤 Beber Ahora</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info tip */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>💡</span>
          <span>
            {isCandyWorld
              ? '¡Las Botas de Gomita te permiten rebotar súper alto en trampolines y saltar montañas de caramelo!'
              : 'Las bebidas energéticas tienen efectos temporales acumulables. Las espadas y botas se quedan guardadas para siempre.'}
          </span>
        </div>
      </div>
    </div>
  );
};
