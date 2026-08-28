export type WorldDimension = 'main' | 'candy' | 'mayan_boss';

export interface MayanBossState {
  active: boolean;
  health: number;
  maxHealth: number;
  phase: 'intro' | 'attacking' | 'tired' | 'defeated';
  tiredTimeRemaining: number;
  isInvulnerable: boolean;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  ambientVolume?: number;
  mouseSensitivity: number;
  fov: number;
  cycleSpeed: 'normal' | 'fast' | 'slow' | 'freeze_day' | 'freeze_night';
  showCompass: boolean;
  showFps: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  viewMode: 'first_person' | 'third_person';
}

export type ItemCategory = 'sword' | 'drink' | 'upgrade' | 'multiplier';

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

export interface MultiplierTier {
  multiplier: number;
  name: string;
  price: number;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  world?: WorldDimension;
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
  health: number; // 0 to 5 (5 consecutive zombie hits kill the player)
  maxHealth: number; // 5
  ownedSwordIds: string[];
  equippedSwordId: string | null;
  activeBuffs: PlayerBuffs;
  playerMultiplier: number;
  unlockedMultipliers: number[];
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

