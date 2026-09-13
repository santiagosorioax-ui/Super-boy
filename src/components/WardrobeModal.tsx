import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, Check, Lock, Sparkles, Shirt, ShoppingBag } from 'lucide-react';
import { CharacterGender, ClothingCategory, ClothingItem, PlayerCustomization } from '../types';
import { CLOTHING_CATEGORIES, CLOTHING_CATALOG } from '../data/clothingCatalog';
import { WardrobePreview3D } from './WardrobePreview3D';
import { soundEngine } from '../audio/soundEngine';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  customization: PlayerCustomization;
  onUpdateCustomization: (newCustomization: PlayerCustomization) => void;
  onSpendCoins: (amount: number) => boolean;
  onToast?: (message: string) => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  isOpen,
  onClose,
  coins,
  customization,
  onUpdateCustomization,
  onSpendCoins,
  onToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory>('hat');

  if (!isOpen) return null;

  // Filter items for currently selected category
  const categoryItems = CLOTHING_CATALOG.filter((item) => item.category === selectedCategory);

  // Helper to check if item is owned
  const isOwned = (itemId: string) => {
    return customization.ownedItemIds.includes(itemId);
  };

  // Helper to check if item is equipped
  const isEquipped = (category: ClothingCategory, itemId: string) => {
    switch (category) {
      case 'hat':
        return customization.equipped.hatId === itemId;
      case 'shirt':
        return customization.equipped.shirtId === itemId;
      case 'pants':
        return customization.equipped.pantsId === itemId;
      case 'shoes':
        return customization.equipped.shoesId === itemId;
      case 'backpack':
        return customization.equipped.backpackId === itemId;
    }
  };

  // Gender Switch Handler
  const handleGenderChange = (gender: CharacterGender) => {
    if (customization.gender === gender) return;

    soundEngine.playFlashlightClick();
    const updated: PlayerCustomization = {
      ...customization,
      gender,
    };
    onUpdateCustomization(updated);
    onToast?.(gender === 'girl' ? '¡Personaje cambiado a Super Girl! 👧' : '¡Personaje cambiado a Super Boy! 👦');
  };

  // Equip Item Handler
  const handleEquip = (item: ClothingItem) => {
    soundEngine.playFlashlightClick();

    const newEquipped = { ...customization.equipped };
    switch (item.category) {
      case 'hat':
        newEquipped.hatId = item.id;
        break;
      case 'shirt':
        newEquipped.shirtId = item.id;
        break;
      case 'pants':
        newEquipped.pantsId = item.id;
        break;
      case 'shoes':
        newEquipped.shoesId = item.id;
        break;
      case 'backpack':
        newEquipped.backpackId = item.id;
        break;
    }

    const updated: PlayerCustomization = {
      ...customization,
      equipped: newEquipped,
    };
    onUpdateCustomization(updated);
    onToast?.(`¡Equipado: ${item.name}!`);
  };

  // Purchase Item Handler
  const handleBuy = (item: ClothingItem) => {
    if (coins < item.price) {
      soundEngine.playShopBuyFail();
      onToast?.(`¡No tienes suficientes monedas! Necesitas ${item.price - coins} monedas más.`);
      return;
    }

    // Deduct coins
    const success = onSpendCoins(item.price);
    if (!success) {
      soundEngine.playShopBuyFail();
      onToast?.('Error al procesar la compra de monedas.');
      return;
    }

    soundEngine.playBuySound();

    // Automatically own and equip the bought item
    const newOwned = [...customization.ownedItemIds, item.id];
    const newEquipped = { ...customization.equipped };
    switch (item.category) {
      case 'hat':
        newEquipped.hatId = item.id;
        break;
      case 'shirt':
        newEquipped.shirtId = item.id;
        break;
      case 'pants':
        newEquipped.pantsId = item.id;
        break;
      case 'shoes':
        newEquipped.shoesId = item.id;
        break;
      case 'backpack':
        newEquipped.backpackId = item.id;
        break;
    }

    const updated: PlayerCustomization = {
      ...customization,
      ownedItemIds: newOwned,
      equipped: newEquipped,
    };

    onUpdateCustomization(updated);
    onToast?.(`🎉 ¡Compraste y equipaste ${item.name} por ${item.price} monedas!`);
  };

  // Get current equipped names for showcase
  const currentHat = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.hatId)?.name || 'Gorra Roja';
  const currentShirt = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.shirtId)?.name || 'Chaqueta Roja';
  const currentPants = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.pantsId)?.name || 'Jeans Denim';
  const currentShoes = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.shoesId)?.name || 'Zapatillas Rojas';
  const currentBackpack = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.backpackId)?.name || 'Mochila Verde';

  return (
    <AnimatePresence>
      <div 
        id="wardrobe-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          id="wardrobe-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden"
        >
          {/* 1. MODAL HEADER */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-slate-950/70 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                  <span>Armario & Tienda de Ropa</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    Moda 3D
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Personaliza a tu personaje y compra prendas exclusivas con tus monedas.
                </p>
              </div>
            </div>

            {/* Coins Badge & Close Button */}
            <div className="flex items-center gap-3">
              {/* Player Coins Display */}
              <div 
                id="wardrobe-coins-counter"
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 shadow-inner"
                title="Tus monedas para comprar ropa"
              >
                <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-black text-amber-300 leading-none">
                    {coins}
                  </span>
                  <span className="text-[10px] text-amber-400/80 uppercase font-semibold">
                    monedas
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playFlashlightClick();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95"
                title="Cerrar Armario"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. GENDER TOGGLE BAR */}
          <div className="px-5 sm:px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Género del Personaje:
              </span>
              <div className="inline-flex p-1 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                {/* Hombre (Super Boy) */}
                <button
                  type="button"
                  onClick={() => handleGenderChange('boy')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
                    customization.gender === 'boy'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">👦</span>
                  <span>Hombre (Super Boy)</span>
                </button>

                {/* Mujer (Super Girl) */}
                <button
                  type="button"
                  onClick={() => handleGenderChange('girl')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all ${
                    customization.gender === 'girl'
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">👧</span>
                  <span>Mujer (Super Girl)</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Puedes cambiar de género en cualquier momento sin costo</span>
            </div>
          </div>

          {/* 3. MAIN BODY: 2 COLUMNS */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-6 overflow-y-auto">
            {/* LEFT COLUMN: 3D CHARACTER PREVIEW (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <WardrobePreview3D customization={customization} />

              {/* Equipped Items Summary List */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex justify-between">
                  <span>Equipamiento Actual</span>
                  <span className="text-amber-400 font-semibold">{customization.gender === 'boy' ? 'Super Boy' : 'Super Girl'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                    🧢 <span className="text-slate-400">Gorra:</span> <strong className="text-white">{currentHat}</strong>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                    👕 <span className="text-slate-400">Camisa:</span> <strong className="text-white">{currentShirt}</strong>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                    👖 <span className="text-slate-400">Pantalón:</span> <strong className="text-white">{currentPants}</strong>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                    👟 <span className="text-slate-400">Zapatos:</span> <strong className="text-white">{currentShoes}</strong>
                  </div>
                  <div className="col-span-2 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 truncate">
                    🎒 <span className="text-slate-400">Mochila:</span> <strong className="text-white">{currentBackpack}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: CATEGORY TABS & CLOTHING ITEMS GRID (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-3 min-h-0">
              {/* Category Nav Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
                {CLOTHING_CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playFlashlightClick();
                        setSelectedCategory(cat.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                          : 'bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Items Grid for Current Category */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[480px]">
                {categoryItems.map((item) => {
                  const owned = isOwned(item.id);
                  const equipped = isEquipped(item.category, item.id);
                  const canAfford = coins >= item.price;

                  return (
                    <div
                      key={item.id}
                      id={`wardrobe-item-${item.id}`}
                      className={`relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                        equipped
                          ? 'bg-emerald-950/40 border-emerald-500/70 shadow-lg shadow-emerald-500/10'
                          : owned
                          ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80'
                      }`}
                    >
                      {/* Left: Swatch & Info */}
                      <div className="flex items-center gap-3">
                        {/* Icon & Color Badge */}
                        <div
                          className="relative flex items-center justify-center w-12 h-12 rounded-2xl border shadow-md text-xl"
                          style={{
                            backgroundColor: `${item.previewColor}25`,
                            borderColor: `${item.previewColor}70`,
                          }}
                        >
                          <span>{item.icon}</span>

                          {/* Rarity Ring */}
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-900"
                            style={{ backgroundColor: item.previewColor }}
                            title={`Color primario: ${item.previewColor}`}
                          />
                        </div>

                        {/* Title & Lore */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">
                              {item.name}
                            </h4>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-extrabold text-[9px] uppercase tracking-wider">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 max-w-xs sm:max-w-md leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price & Action Button */}
                      <div className="flex items-center gap-2.5 ml-2">
                        {/* If equipped */}
                        {equipped ? (
                          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs shadow">
                            <Check className="w-3.5 h-3.5" />
                            <span>Equipado</span>
                          </div>
                        ) : owned ? (
                          /* Owned -> Equip button */
                          <button
                            type="button"
                            onClick={() => handleEquip(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition active:scale-95"
                          >
                            Equipar
                          </button>
                        ) : (
                          /* Not owned -> Buy button with coins */
                          <button
                            type="button"
                            onClick={() => handleBuy(item)}
                            disabled={!canAfford}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md transition ${
                              canAfford
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 active:scale-95 shadow-amber-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              canAfford
                                ? `Comprar ${item.name} por ${item.price} monedas`
                                : `Te faltan ${item.price - coins} monedas`
                            }
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{item.price} monedas</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
