export type WorldDimension = 'main' | 'candy' | 'mayan_boss';

export interface MayanBossState {
  active: boolean;
  health: number;
  maxHealth: number;
  phase: 'intro' | 'attacking' | 'tired' | 'defeated';
  tiredTimeRemaining: number;
  isInvulnerable: boolean;
  isTired?: boolean;
  statusMessage?: string;
  bossName?: string;
  bossIcon?: string;
  bossThemeColor?: string;
  arenaName?: string;
}

export type ControlDevice = 'pc' | 'mobile';

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
  controlMode?: ControlDevice;
}

export type ItemCategory = 'sword' | 'drink' | 'boots' | 'upgrade' | 'multiplier';

export interface ShopItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  world?: WorldDimension;
  // Stats & Buffs
  durationSec?: number;
  speedMultiplier?: number;
  jumpMultiplier?: number;
  magnetRadius?: number;
  damage?: number;
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

export interface UserProfile {
  email: string;
  username: string;
  role: 'admin_unlimited' | 'standard' | 'user';
  isUnlimited: boolean;
  infiniteCoins: boolean;
  isGodMode: boolean; // Invincible to zombie & boss hits
  superSpeed: boolean; // +100% base speed
  superJump: boolean; // +100% jump height
  superMagnet: boolean; // 50m coin magnet
  freeTemplePass: boolean; // Free entry to Mayan Temple
  flyMode: boolean; // 🕊️ Modo Vuelo y Noclip (atravesar paredes y super velocidad)
}

export interface PlayerInventory {
  coins: number;
  health: number; // 0 to 5 (5 consecutive zombie hits kill the player)
  maxHealth: number; // 5
  ownedSwordIds: string[];
  equippedSwordId: string | null;
  hasGummyBoots?: boolean;
  equippedBootsId?: string | null;
  activeBuffs: PlayerBuffs;
  playerMultiplier: number;
  unlockedMultipliers: number[];
  isGodMode?: boolean;
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

export type WeatherType = 'clear' | 'rain' | 'fog' | 'wind';

export interface WeatherState {
  type: WeatherType;
  displayName: string;
  description: string;
  durationRemaining: number;
  totalDuration: number;
  windDirection: { x: number; z: number }; // normalized vector
  windSpeed: number; // m/s
  rainIntensity: number; // 0 to 1
  fogDensity: number; // density multiplier
  isSlippery: boolean;
}

// --- CHARACTER WARDROBE & CUSTOMIZATION ---
export type CharacterGender = 'boy' | 'girl';

export type ClothingCategory = 'hat' | 'shirt' | 'pants' | 'shoes' | 'backpack';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  price: number; // In coins (0 = free / default)
  description: string;
  icon: string;
  previewColor: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  badge?: string;
  // Visual properties for 3D engine
  modelStyle?: string;
  primaryColor?: number;
  secondaryColor?: number;
  accentColor?: number;
}

export interface EquippedClothing {
  hatId: string;
  shirtId: string;
  pantsId: string;
  shoesId: string;
  backpackId: string;
}

export interface PlayerCustomization {
  gender: CharacterGender;
  equipped: EquippedClothing;
  ownedItemIds: string[];
}

export type AchievementCategory = 'all' | 'combat' | 'collection' | 'exploration' | 'bosses';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'combat' | 'collection' | 'exploration' | 'bosses';
  target: number;
  current: number;
  rewardCoins: number;
  isUnlocked: boolean;
  isClaimed: boolean;
}


