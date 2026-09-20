import hero2dZombies from './images/hero_2d_zombies_1789269325162.jpg';
import hero2dParkour from './images/hero_2d_parkour_1789269340434.jpg';
import hero2dMayan from './images/hero_2d_mayan_1789269353262.jpg';
import hero2dCandyland from './images/hero_2d_candyland_1789269369287.jpg';
import hero2dTreasure from './images/hero_2d_treasure_1789269381268.jpg';
import hero2dFlight from './images/hero_2d_flight_1789269392039.jpg';
import hero2dGummyBoss from './images/hero_2d_gummy_boss_1789269790220.jpg';
import hero2dPortal from './images/hero_2d_portal_1789269809966.jpg';
import hero2dCampfire from './images/hero_2d_campfire_1789269821849.jpg';
import hero2dCloudCastle from './images/hero_2d_cloud_castle_1789269832586.jpg';
import { WorldDimension } from '../types';

export type TransitionTarget = WorldDimension | 'game_start' | 'structure';

export interface CartoonSlide {
  id: string;
  imageUrl: string;
  category: 'zombies' | 'parkour' | 'mayan' | 'candy' | 'treasure' | 'flight' | 'portal' | 'campfire' | 'castle';
  tip: string;
}

export const CARTOON_SLIDES: CartoonSlide[] = [
  {
    id: 'zombies',
    imageUrl: hero2dZombies,
    category: 'zombies',
    tip: '⚔️ Al anochecer los zombis emergen en el valle. Ataca manteniendo distancia y salta hacia atrás para esquivar sus zarpazos.',
  },
  {
    id: 'parkour',
    imageUrl: hero2dParkour,
    category: 'parkour',
    tip: '🏃 Activa el sprint (Shift o botón táctil) antes de despegar de una plataforma para alcanzar las islas flotantes más lejanas.',
  },
  {
    id: 'mayan',
    imageUrl: hero2dMayan,
    category: 'mayan',
    tip: '🏛️ El Rey Zombi Maya lanza ondas sísmicas. ¡Salta para esquivarlas y asesta golpes críticos cuando quede aturdido!',
  },
  {
    id: 'candyland',
    imageUrl: hero2dCandyland,
    category: 'candy',
    tip: '🍭 En el Mundo Caramelo, las donas glaseadas y gelatinas actúan como súper trampolines que te lanzan al cielo.',
  },
  {
    id: 'treasure',
    imageUrl: hero2dTreasure,
    category: 'treasure',
    tip: '💎 Las estrellas doradas y diamantes gigantes otorgan miles de monedas multiplicadas por tu multiplicador activo.',
  },
  {
    id: 'flight',
    imageUrl: hero2dFlight,
    category: 'flight',
    tip: '✨ En el modo de vuelo, pulsa Subir o Bajar para explorar ruinas flotantes y templos ocultos en el firmamento.',
  },
  {
    id: 'gummy_boss',
    imageUrl: hero2dGummyBoss,
    category: 'candy',
    tip: '🍬 ¡Cuidado con el Gran Monstruo Gominola! Es inmune por el frente; rodéalo para atacar sus puntos débiles.',
  },
  {
    id: 'portal',
    imageUrl: hero2dPortal,
    category: 'portal',
    tip: '🌀 Cruza los portales dimensionales de energía para viajar al instante entre el Valle, Mundo Caramelo y la Cripta Maya.',
  },
  {
    id: 'campfire',
    imageUrl: hero2dCampfire,
    category: 'campfire',
    tip: '🔥 En la fogata de la aldea puedes descansar, reponer energía y prepararte antes de que caiga la noche.',
  },
  {
    id: 'castle',
    imageUrl: hero2dCloudCastle,
    category: 'castle',
    tip: '🏰 Sigue el radar y la brújula para hallar la entrada secreta al Gran Castillo Celestial y sus cofres míticos.',
  },
  {
    id: 'structure_shop',
    imageUrl: hero2dTreasure,
    category: 'treasure',
    tip: '🏪 En las tiendas y estructuras del reino puedes adquirir espadas legendarias, pociones místicas y multiplicadores de gemas.',
  },
];

/**
 * Returns an ordered array of slides starting from the most relevant to the target
 */
export function getSlidesForTarget(target?: TransitionTarget): CartoonSlide[] {
  let initialIndex = 0;
  if (target === 'structure') {
    initialIndex = 10; // Structure & Shop
  } else if (target === 'mayan_boss') {
    initialIndex = 2; // Mayan
  } else if (target === 'choco_temple') {
    initialIndex = 6; // Gummy Boss inside Templo Choco
  } else if (target === 'candy') {
    initialIndex = 3; // Candyland
  } else if (target === 'main') {
    initialIndex = 1; // Parkour
  } else {
    // Random initial slide for game start
    initialIndex = Math.floor(Math.random() * CARTOON_SLIDES.length);
  }

  // Rotate slides so the primary target is first, followed by the rest
  const rotated = [
    ...CARTOON_SLIDES.slice(initialIndex),
    ...CARTOON_SLIDES.slice(0, initialIndex),
  ];
  return rotated;
}
