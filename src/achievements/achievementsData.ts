export type AchievementCategory = 'all' | 'combat' | 'coins' | 'exploration' | 'arsenal';
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: 'combat' | 'coins' | 'exploration' | 'arsenal';
  badgeTier: BadgeTier;
  targetValue: number;
  rewardCoins: number;
  unit: string;
}

export interface PlayerAchievementStats {
  zombiesDefeated: number;
  lifetimeCoinsCollected: number;
  currentCoins: number;
  totalJumps: number;
  bossDefeatedCount: number;
  gummyBossDefeated?: boolean;
  hasGummyBoots?: boolean;
  gummyBounces?: number;
  visitedCandyLand: boolean;
  visitedMayanTemple: boolean;
  ownedSwordsCount: number;
  hasCustomizedOutfit: boolean;
  highestMultiplier: number;
  claimedAchievementIds: string[];
}

export const ACHIEVEMENTS_LIST: AchievementItem[] = [
  // --- COMBATE ---
  {
    id: 'zombies_10',
    title: 'Cazador Inicial',
    description: 'Derrota a 10 zombis en el valle para mantener el campamento seguro.',
    emoji: '⚔️',
    category: 'combat',
    badgeTier: 'bronze',
    targetValue: 10,
    rewardCoins: 250,
    unit: 'zombis',
  },
  {
    id: 'zombies_50',
    title: 'Exterminador de Zombis',
    description: 'Derrota a 50 zombis en batalla y demuestra tu maestría en el combate.',
    emoji: '🧟',
    category: 'combat',
    badgeTier: 'gold',
    targetValue: 50,
    rewardCoins: 1500,
    unit: 'zombis',
  },
  {
    id: 'zombies_100',
    title: 'Leyenda Anti-Muertos',
    description: 'Elimina a 100 zombis nocturnos y conviértete en el protector supremo.',
    emoji: '👑',
    category: 'combat',
    badgeTier: 'diamond',
    targetValue: 100,
    rewardCoins: 3500,
    unit: 'zombis',
  },
  {
    id: 'boss_mayan',
    title: 'Vencedor Maya',
    description: 'Derrota al colosal Rey Zombi Maya en su cripta ceremonial.',
    emoji: '🏛️',
    category: 'combat',
    badgeTier: 'diamond',
    targetValue: 1,
    rewardCoins: 3000,
    unit: 'derrota',
  },
  {
    id: 'boss_gummy',
    title: 'Rey del Castillo de Chocolate',
    description: 'Vence al colosal Gran Oso de Gomita en su sala del trono de chocolate.',
    emoji: '🍫',
    category: 'combat',
    badgeTier: 'diamond',
    targetValue: 1,
    rewardCoins: 5000,
    unit: 'derrota',
  },

  // --- MONEDAS ---
  {
    id: 'coins_100',
    title: 'Primeros Ahorros',
    description: 'Recoge 100 monedas doradas en tus recorridos.',
    emoji: '🪙',
    category: 'coins',
    badgeTier: 'bronze',
    targetValue: 100,
    rewardCoins: 200,
    unit: 'monedas',
  },
  {
    id: 'coins_500',
    title: 'Bolsa de Oro',
    description: 'Acumula un total de 500 monedas recogidas en el reino.',
    emoji: '💰',
    category: 'coins',
    badgeTier: 'silver',
    targetValue: 500,
    rewardCoins: 750,
    unit: 'monedas',
  },
  {
    id: 'coins_1000',
    title: 'Tesoro Milenario',
    description: 'Alcanza la impresionante cifra de 1,000 monedas totales recogidas.',
    emoji: '💎',
    category: 'coins',
    badgeTier: 'gold',
    targetValue: 1000,
    rewardCoins: 2500,
    unit: 'monedas',
  },
  {
    id: 'coins_5000',
    title: 'Magnate de la Fortuna',
    description: 'Alcanza 5,000 monedas totales acumuladas a lo largo de tu partida.',
    emoji: '🌟',
    category: 'coins',
    badgeTier: 'diamond',
    targetValue: 5000,
    rewardCoins: 10000,
    unit: 'monedas',
  },

  // --- EXPLORACIÓN Y HABILIDADES ---
  {
    id: 'world_candy',
    title: 'Dulce Paraíso',
    description: 'Cruza el portal interdimensional y viaja al Mundo de Caramelo.',
    emoji: '🍭',
    category: 'exploration',
    badgeTier: 'bronze',
    targetValue: 1,
    rewardCoins: 400,
    unit: 'viaje',
  },
  {
    id: 'world_mayan',
    title: 'Expedición Sagrada',
    description: 'Accede y adéntrate en la milenaria Cripta Maya.',
    emoji: '⛩️',
    category: 'exploration',
    badgeTier: 'silver',
    targetValue: 1,
    rewardCoins: 500,
    unit: 'entrada',
  },
  {
    id: 'jumps_50',
    title: 'Salto Ágil',
    description: 'Realiza 50 saltos entre colinas, rocas y plataformas flotantes.',
    emoji: '🦘',
    category: 'exploration',
    badgeTier: 'bronze',
    targetValue: 50,
    rewardCoins: 300,
    unit: 'saltos',
  },
  {
    id: 'jumps_150',
    title: 'Maestro del Parkour',
    description: 'Ejecuta 150 saltos precisos desafiando la gravedad.',
    emoji: '🏃',
    category: 'exploration',
    badgeTier: 'silver',
    targetValue: 150,
    rewardCoins: 1000,
    unit: 'saltos',
  },

  // --- ARSENAL Y ESTILO ---
  {
    id: 'swords_2',
    title: 'Coleccionista de Espadas',
    description: 'Adquiere y posee al menos 2 espadas diferentes en la tienda.',
    emoji: '🗡️',
    category: 'arsenal',
    badgeTier: 'silver',
    targetValue: 2,
    rewardCoins: 600,
    unit: 'espadas',
  },
  {
    id: 'swords_4',
    title: 'Armero Legendario',
    description: 'Consigue 4 o más espadas especiales y katanas legendarias.',
    emoji: '⚡',
    category: 'arsenal',
    badgeTier: 'gold',
    targetValue: 4,
    rewardCoins: 2000,
    unit: 'espadas',
  },
  {
    id: 'multiplier_x2',
    title: 'Impulso de Riqueza',
    description: 'Desbloquea o activa un multiplicador de monedas (x2 o superior).',
    emoji: '🔥',
    category: 'arsenal',
    badgeTier: 'silver',
    targetValue: 2,
    rewardCoins: 800,
    unit: 'multiplicador',
  },
  {
    id: 'outfit_custom',
    title: 'Estilo Personalizado',
    description: 'Elige un nuevo atuendo, sombrero o aspecto en el Armario de Ropa.',
    emoji: '👕',
    category: 'arsenal',
    badgeTier: 'bronze',
    targetValue: 1,
    rewardCoins: 500,
    unit: 'estilo',
  },
  {
    id: 'boots_gummy',
    title: 'Botas Saltarinas de Gomita',
    description: 'Adquiere y equipa las legendarias Botas de Gomita de Mundo Caramelo.',
    emoji: '👟',
    category: 'arsenal',
    badgeTier: 'gold',
    targetValue: 1,
    rewardCoins: 1200,
    unit: 'equipo',
  },
  {
    id: 'gummy_springs',
    title: 'Acróbata de Gomita',
    description: 'Rebota 15 veces en los trampolines y hongos elásticos de gomita.',
    emoji: '🍄',
    category: 'exploration',
    badgeTier: 'silver',
    targetValue: 15,
    rewardCoins: 600,
    unit: 'rebotes',
  },
];

/**
 * Returns current progress number for a given achievement based on player stats
 */
export function getAchievementCurrentValue(
  achievement: AchievementItem,
  stats: PlayerAchievementStats
): number {
  switch (achievement.id) {
    case 'zombies_10':
    case 'zombies_50':
    case 'zombies_100':
      return stats.zombiesDefeated;
    case 'boss_mayan':
      return stats.bossDefeatedCount;
    case 'boss_gummy':
      return stats.gummyBossDefeated ? 1 : 0;
    case 'boots_gummy':
      return stats.hasGummyBoots ? 1 : 0;
    case 'gummy_springs':
      return stats.gummyBounces || 0;
    case 'coins_100':
    case 'coins_500':
    case 'coins_1000':
    case 'coins_5000':
      return Math.max(stats.lifetimeCoinsCollected, stats.currentCoins);
    case 'world_candy':
      return stats.visitedCandyLand ? 1 : 0;
    case 'world_mayan':
      return stats.visitedMayanTemple ? 1 : 0;
    case 'jumps_50':
    case 'jumps_150':
      return stats.totalJumps;
    case 'swords_2':
    case 'swords_4':
      return stats.ownedSwordsCount;
    case 'multiplier_x2':
      return stats.highestMultiplier;
    case 'outfit_custom':
      return stats.hasCustomizedOutfit ? 1 : 0;
    default:
      return 0;
  }
}

/**
 * Calculate full status of an achievement
 */
export function getAchievementStatus(
  achievement: AchievementItem,
  stats: PlayerAchievementStats
): {
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  canClaim: boolean;
} {
  const currentValue = getAchievementCurrentValue(achievement, stats);
  const targetValue = achievement.targetValue;
  const percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
  const isUnlocked = currentValue >= targetValue;
  const isClaimed = stats.claimedAchievementIds.includes(achievement.id);
  const canClaim = isUnlocked && !isClaimed;

  return {
    currentValue: Math.min(currentValue, targetValue),
    targetValue,
    percentage,
    isUnlocked,
    isClaimed,
    canClaim,
  };
}

/**
 * Returns how many achievements are completed and ready to be claimed
 */
export function getUnclaimedAchievementsCount(stats: PlayerAchievementStats): number {
  return ACHIEVEMENTS_LIST.reduce((acc, ach) => {
    const status = getAchievementStatus(ach, stats);
    return status.canClaim ? acc + 1 : acc;
  }, 0);
}
