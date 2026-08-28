import { MultiplierTier, WorldDimension } from '../types';

// Multiplicadores del Mundo 1 (Valle Principal): 1x a 6x
export const VALLEY_MULTIPLIER_TIERS: MultiplierTier[] = [
  {
    multiplier: 1,
    name: 'Multiplicador Estándar 1x',
    price: 0,
    description: 'Valor base: cada moneda vale 1 punto y cada diamante vale 5 puntos.',
    icon: '🪙',
    color: '#94a3b8',
    badge: 'Base / Gratis',
    world: 'main',
  },
  {
    multiplier: 2,
    name: 'Doble Fortuna 2x',
    price: 30,
    description: '¡Duplica tus ganancias! Cada moneda vale 2 y cada diamante vale 10 monedas.',
    icon: '⚡',
    color: '#38bdf8',
    badge: '2x Ganancias',
    world: 'main',
  },
  {
    multiplier: 3,
    name: 'Triple Riqueza 3x',
    price: 80,
    description: '¡Triplica la recolección! Cada moneda vale 3 y cada diamante vale 15 monedas.',
    icon: '🔥',
    color: '#f59e0b',
    badge: '3x Ganancias',
    world: 'main',
  },
  {
    multiplier: 4,
    name: 'Cuádruple Diamante 4x',
    price: 180,
    description: '¡Cuadriplica tus tesoros! Cada moneda vale 4 y cada diamante vale 20 monedas.',
    icon: '💎',
    color: '#a855f7',
    badge: '4x Ganancias',
    world: 'main',
  },
  {
    multiplier: 5,
    name: 'Quíntuple Corona 5x',
    price: 350,
    description: '¡Poder financiero masivo! Cada moneda vale 5 y cada diamante vale 25 monedas.',
    icon: '👑',
    color: '#ec4899',
    badge: '5x Ganancias',
    world: 'main',
  },
  {
    multiplier: 6,
    name: 'Sextuplicador Supremo 6x',
    price: 600,
    description: '¡El máximo multiplicador del Valle! Cada moneda vale 6 y cada diamante vale 30 monedas.',
    icon: '🌟',
    color: '#10b981',
    badge: '6x Valle MAX',
    world: 'main',
  },
];

// Multiplicadores del Mundo 2 (Mundo de Caramelo): 7x a 12x
export const CANDY_MULTIPLIER_TIERS: MultiplierTier[] = [
  {
    multiplier: 7,
    name: 'Siete Estrellas de Caramelo 7x',
    price: 1000,
    description: '¡Sabor estelar! Cada moneda vale 7 y cada diamante vale 35 monedas.',
    icon: '🍬',
    color: '#f43f5e',
    badge: '7x Dulce',
    world: 'candy',
  },
  {
    multiplier: 8,
    name: 'Octágono de Azúcar Cósmico 8x',
    price: 1600,
    description: '¡Poder azucarado de alta frecuencia! Cada moneda vale 8 y cada diamante vale 40 monedas.',
    icon: '🍭',
    color: '#fb7185',
    badge: '8x Cósmico',
    world: 'candy',
  },
  {
    multiplier: 9,
    name: 'Nueve Vidas de Piruleta 9x',
    price: 2400,
    description: '¡La mística espiral dulce! Cada moneda vale 9 y cada diamante vale 45 monedas.',
    icon: '🌀',
    color: '#e879f9',
    badge: '9x Legendario',
    world: 'candy',
  },
  {
    multiplier: 10,
    name: 'Decágono Galáctico Dulce 10x',
    price: 3500,
    description: '¡Multiplicador titánico x10! Cada moneda vale 10 y cada diamante vale 50 monedas.',
    icon: '✨',
    color: '#c084fc',
    badge: '10x Galáctico',
    world: 'candy',
  },
  {
    multiplier: 11,
    name: 'Onda Mística de Malvavisco 11x',
    price: 5000,
    description: '¡Suavidad astral y riqueza desmedida! Cada moneda vale 11 y cada diamante vale 55 monedas.',
    icon: '🧁',
    color: '#38bdf8',
    badge: '11x Místico',
    world: 'candy',
  },
  {
    multiplier: 12,
    name: 'Emperador Infinito de Dulce 12x',
    price: 7500,
    description: '¡La cúspide suprema de todo el multiverso! Cada moneda vale 12 y cada diamante vale 60 monedas.',
    icon: '👑',
    color: '#facc15',
    badge: '12x SUPREMO',
    world: 'candy',
  },
];

export const ALL_MULTIPLIER_TIERS: MultiplierTier[] = [
  ...VALLEY_MULTIPLIER_TIERS,
  ...CANDY_MULTIPLIER_TIERS,
];

export const MULTIPLIER_TIERS = ALL_MULTIPLIER_TIERS;

export function getMultipliersForWorld(world: WorldDimension = 'main'): MultiplierTier[] {
  return world === 'candy' ? CANDY_MULTIPLIER_TIERS : VALLEY_MULTIPLIER_TIERS;
}

