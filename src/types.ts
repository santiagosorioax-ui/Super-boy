export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  fov: number;
  cycleSpeed: 'normal' | 'fast' | 'slow' | 'freeze_day' | 'freeze_night';
  showCompass: boolean;
  showFps: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  viewMode: 'first_person' | 'third_person';
}

export type ItemCategory = 'sword' | 'drink' | 'upgrade';

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  // Stats & Buffs
  durationSec?: number;
  speedMultiplier?: number;
  jumpMultiplier?: number;
  magnetRadius?: number;
}

export interface PlayerBuffs {
  speedTimeRemaining: number;
  jumpTimeRemaining: number;
  magnetTimeRemaining: number;
  speedMultiplier: number;
  jumpMultiplier: number;
  magnetRadius: number;
}

export interface PlayerInventory {
  coins: number;
  ownedSwordIds: string[];
  equippedSwordId: string | null;
  activeBuffs: PlayerBuffs;
}

export interface CoinData {
  id: number;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  value: number;
  type: 'gold' | 'gem' | 'star';
}

export interface GameStats {
  score: number;
  totalCoins: number;
  collectedCoins: number;
  timeElapsed: number;
  gameStarted: boolean;
  gameWon: boolean;
  jumpsCount: number;
}

export interface TimeState {
  time: number; // 0 to 24 (hours)
  period: 'dawn' | 'day' | 'sunset' | 'night';
  formattedTime: string;
  sunHeight: number;
}

