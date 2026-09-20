/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GameWorld } from './game/GameWorld';
import { soundEngine } from './audio/soundEngine';
import { CoinData, GameSettings, TimeState, PlayerInventory, ShopItem, WorldDimension, MayanBossState, MultiplierTier, ControlDevice, UserProfile, WeatherState, WeatherType } from './types';
import { HUD } from './components/HUD';
import { SettingsModal } from './components/SettingsModal';
import { VictoryModal } from './components/VictoryModal';
import { HelpModal } from './components/HelpModal';
import { ShopModal } from './components/ShopModal';
import { MultiplierShopModal } from './components/MultiplierShopModal';
import { DeathModal } from './components/DeathModal';
import { StartScreen } from './components/StartScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import { VipProfileModal } from './components/VipProfileModal';
import { WardrobeModal } from './components/WardrobeModal';
import { InstallPromptModal } from './components/InstallPromptModal';
import { AchievementsModal } from './components/AchievementsModal';
import {
  ACHIEVEMENTS_LIST,
  PlayerAchievementStats,
  getAchievementStatus,
  getUnclaimedAchievementsCount,
} from './achievements/achievementsData';
import { DEFAULT_CUSTOMIZATION } from './data/clothingCatalog';
import { PlayerCustomization } from './types';
import { auth, googleProvider } from './firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { saveUserProgress, loadUserProgress } from './firebase/gameSync';

const VIP_GMAIL = 'santiagosorioax@gmail.com';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<GameWorld | null>(null);

  // Firebase Auth user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  // STRICT VIP CHECK: ONLY santiagosorioax@gmail.com is VIP!
  // Any non-logged-in guest or any account that is not santiagosorioax@gmail.com is strictly mortal.
  const isVip = Boolean(currentUser && currentUser.email?.toLowerCase() === VIP_GMAIL.toLowerCase());

  const [vipProfile, setVipProfile] = useState<UserProfile>({
    email: '',
    username: 'Jugador',
    role: 'standard',
    isUnlimited: false,
    infiniteCoins: false,
    isGodMode: false,
    superSpeed: false,
    superJump: false,
    superMagnet: false,
    freeTemplePass: false,
    flyMode: false,
  });

  const [isFlying, setIsFlying] = useState(false);
  const [isWorldReady, setIsWorldReady] = useState(false);

  // Loading screen state for game start and world/structure transitions
  const [loadingState, setLoadingState] = useState<{
    isOpen: boolean;
    target?: WorldDimension | 'game_start' | 'structure';
    title?: string;
    subtitle?: string;
    durationMs?: number;
    onComplete?: () => void;
  }>({
    isOpen: false,
    target: 'game_start',
  });

  // Game state & Device Mode
  const isMobileDevice = typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
  const [controlMode, setControlMode] = useState<ControlDevice>(isMobileDevice ? 'mobile' : 'pc');
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(27);
  const [combo, setCombo] = useState(0);
  const [fps, setFps] = useState(60);
  const [timeState, setTimeState] = useState<TimeState>({
    time: 8.5,
    period: 'day',
    formattedTime: '08:30',
    sunHeight: 0.8,
  });
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [viewMode, setViewMode] = useState<'first_person' | 'third_person'>('first_person');
  const [isSprinting, setIsSprinting] = useState(false);
  const [radar, setRadar] = useState<{ angleDeg: number; distance: number } | null>(null);
  const [lastToast, setLastToast] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [devicePlatform, setDevicePlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // Listen for PWA beforeinstallprompt & appinstalled
  useEffect(() => {
    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setDevicePlatform('ios');
    } else if (/android/.test(ua)) {
      setDevicePlatform('android');
    } else {
      setDevicePlatform('desktop');
    }

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showToast('🎉 ¡Super Boy 3D instalado exitosamente!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        showToast('🚀 Instalando Super Boy 3D en tu pantalla...');
      }
      setDeferredPrompt(null);
    } else {
      setIsInstallModalOpen(true);
    }
  }, [deferredPrompt]);

  // Monitor browser fullscreen change events to update state
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  // Shop & Inventory State - Standard Fair Progression
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isNearShop, setIsNearShop] = useState(false);
  const [isMultiplierShopOpen, setIsMultiplierShopOpen] = useState(false);
  const [isNearMultiplierShop, setIsNearMultiplierShop] = useState(false);
  const [isNearTemple, setIsNearTemple] = useState(false);
  const [isNearCandyPortal, setIsNearCandyPortal] = useState(false);
  const [isNearCampfire, setIsNearCampfire] = useState(false);
  const [templeCost, setTempleCost] = useState(500);
  const [bossState, setBossState] = useState<MayanBossState | null>(null);
  const [weatherState, setWeatherState] = useState<WeatherState | null>(null);
  const [inventory, setInventory] = useState<PlayerInventory>({
    coins: 0,
    health: 5,
    maxHealth: 5,
    ownedSwordIds: [],
    equippedSwordId: null,
    playerMultiplier: 1,
    unlockedMultipliers: [1],
    isGodMode: false,
    activeBuffs: {
      speedTimeRemaining: 0,
      jumpTimeRemaining: 0,
      magnetTimeRemaining: 0,
      speedMultiplier: 1.0,
      jumpMultiplier: 1.0,
      magnetRadius: 10.0,
    },
  });

  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;

  // Clothing & Avatar Customization
  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem('superboy_customization');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CUSTOMIZATION;
  });
  const customizationRef = useRef(customization);
  customizationRef.current = customization;
  const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [coinsLostOnDeath, setCoinsLostOnDeath] = useState(0);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  // Achievements & Milestone Tracking
  const [claimedAchievementIds, setClaimedAchievementIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('superboy_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.claimed)) return parsed.claimed;
      }
    } catch (e) {}
    return [];
  });
  const [lifetimeCoinsCollected, setLifetimeCoinsCollected] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('superboy_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.lifetimeCoins === 'number') return parsed.lifetimeCoins;
      }
    } catch (e) {}
    return 0;
  });
  const [totalJumps, setTotalJumps] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('superboy_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.totalJumps === 'number') return parsed.totalJumps;
      }
    } catch (e) {}
    return 0;
  });
  const [bossDefeatedCount, setBossDefeatedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('superboy_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.bossDefeatedCount === 'number') return parsed.bossDefeatedCount;
      }
    } catch (e) {}
    return 0;
  });
  const [visitedCandyLand, setVisitedCandyLand] = useState(false);
  const [visitedMayanTemple, setVisitedMayanTemple] = useState(false);
  const [gummyBossDefeated, setGummyBossDefeated] = useState(false);
  const [gummyBouncesCount, setGummyBouncesCount] = useState(0);
  const [hasCustomizedOutfit, setHasCustomizedOutfit] = useState(() => {
    try {
      return Boolean(localStorage.getItem('superboy_customization'));
    } catch (e) {
      return false;
    }
  });

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 0.4,
    sfxVolume: 0.7,
    ambientVolume: 0.5,
    mouseSensitivity: 1.5,
    fov: 100,
    cycleSpeed: 'normal',
    showCompass: true,
    viewMode: 'first_person',
    graphicsQuality: isMobileDevice ? 'medium' : 'high',
    showFps: false,
    controlMode: isMobileDevice ? 'mobile' : 'pc',
  });

  const [currentDimension, setCurrentDimension] = useState<WorldDimension>('main');
  const [zombiesDefeated, setZombiesDefeated] = useState(0);

  // Touch joystick tracking
  const [joyStickPos, setJoyStickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const joyTouchIdRef = useRef<number | null>(null);
  const joyCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch look tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lookPrevPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const showToast = useCallback((msg: string) => {
    setLastToast(msg);
    setTimeout(() => {
      setLastToast((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Fullscreen toggle handler: hides the mobile Chrome browser URL bar and tabs
  const handleToggleFullscreen = useCallback(() => {
    const doc = document as any;
    const isFs = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (isFs) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    } else {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
      showToast('🖥️ Pantalla Completa: Barra de URL oculta');
    }
  }, [showToast]);

  // Apply Perks for Santiago (santiagosorioax@gmail.com)
  const applyVipPerks = useCallback(() => {
    setVipProfile({
      email: VIP_GMAIL,
      username: 'Santiago',
      role: 'admin_unlimited',
      isUnlimited: true,
      infiniteCoins: true,
      isGodMode: true,
      superSpeed: true,
      superJump: true,
      superMagnet: true,
      freeTemplePass: true,
      flyMode: false,
    });
    setInventory((prev) => ({
      ...prev,
      coins: 999999999,
      health: 5,
      maxHealth: 5,
      ownedSwordIds: ['wood_sword', 'neon_katana', 'fire_greatsword', 'god_blade'],
      equippedSwordId: 'god_blade',
      playerMultiplier: 1000,
      unlockedMultipliers: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
      isGodMode: true,
    }));
    if (worldRef.current) {
      worldRef.current.setVip(true);
      worldRef.current.setUnlimitedPowers({
        isGodMode: true,
        superSpeed: true,
        superJump: true,
        superMagnet: true,
        freeTemplePass: true,
      });
      worldRef.current.setEquippedSword('god_blade');
    }
    showToast('✨ Bienvenido Santiago');
  }, [showToast]);

  // Listen to Firebase Auth State Changes & Load User Save Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      const isUserVip = Boolean(user && user.email?.toLowerCase() === VIP_GMAIL.toLowerCase());
      if (worldRef.current) {
        worldRef.current.setVip(isUserVip);
      }
      if (user) {
        if (isUserVip) {
          applyVipPerks();
          return;
        }

        // NON-VIP USER: Strip all VIP, god mode, and unlimited powers immediately
        if (worldRef.current) {
          worldRef.current.setVip(false);
          worldRef.current.setUnlimitedPowers({
            isGodMode: false,
            superSpeed: false,
            superJump: false,
            superMagnet: false,
            freeTemplePass: false,
            flyMode: false,
          });
        }
        setVipProfile({
          email: user.email || '',
          username: user.displayName || 'Jugador',
          role: 'standard',
          isUnlimited: false,
          infiniteCoins: false,
          isGodMode: false,
          superSpeed: false,
          superJump: false,
          superMagnet: false,
          freeTemplePass: false,
          flyMode: false,
        });

        try {
          const saved = await loadUserProgress(user.uid);
          if (saved) {
            setBestScore(saved.bestScore || 0);
            // Protect against corrupted/previous test saves:
            // Non-VIP players cannot have 999M coins, god_blade, or 1000x multiplier
            const cleanCoins = (typeof saved.coins === 'number' && saved.coins < 900000000) ? Math.max(0, saved.coins) : 0;
            const cleanSwords = (saved.ownedSwordIds || []).filter((id) => id !== 'god_blade');
            const cleanEquipped = saved.equippedSwordId === 'god_blade' ? null : saved.equippedSwordId;
            const cleanMultiplier = (saved.playerMultiplier && saved.playerMultiplier <= 100) ? saved.playerMultiplier : 1;
            const cleanUnlocked = (saved.unlockedMultipliers || [1]).filter((m) => m <= 100);

            setInventory({
              coins: cleanCoins,
              health: 5,
              maxHealth: 5,
              equippedSwordId: cleanEquipped ?? null,
              ownedSwordIds: cleanSwords,
              playerMultiplier: cleanMultiplier,
              unlockedMultipliers: cleanUnlocked.length ? cleanUnlocked : [1],
              isGodMode: false,
              activeBuffs: {
                speedTimeRemaining: 0,
                jumpTimeRemaining: 0,
                magnetTimeRemaining: 0,
                speedMultiplier: 1.0,
                jumpMultiplier: 1.0,
                magnetRadius: 10.0,
              },
            });
            if (cleanEquipped && worldRef.current) {
              worldRef.current.setEquippedSword(cleanEquipped);
            } else if (worldRef.current) {
              worldRef.current.setEquippedSword(null);
            }
            if (saved.zombiesDefeated) {
              setZombiesDefeated(saved.zombiesDefeated);
            }
            if (Array.isArray(saved.claimedAchievementIds)) {
              setClaimedAchievementIds(saved.claimedAchievementIds);
            }
            if (typeof saved.lifetimeCoinsCollected === 'number') {
              setLifetimeCoinsCollected(saved.lifetimeCoinsCollected);
            } else if (cleanCoins > 0) {
              setLifetimeCoinsCollected(cleanCoins);
            }
            if (typeof saved.totalJumps === 'number') {
              setTotalJumps(saved.totalJumps);
            }
            if (typeof saved.bossDefeatedCount === 'number') {
              setBossDefeatedCount(saved.bossDefeatedCount);
            }
            if (saved.customization) {
              setCustomization(saved.customization);
              if (worldRef.current) {
                worldRef.current.setCustomization(saved.customization);
              }
            }
            showToast(`☁️ Sesión de ${user.displayName?.split(' ')[0] || user.email} iniciada (${cleanCoins} monedas)`);
          } else {
            // New mortal player
            setInventory({
              coins: 0,
              health: 5,
              maxHealth: 5,
              ownedSwordIds: [],
              equippedSwordId: null,
              playerMultiplier: 1,
              unlockedMultipliers: [1],
              isGodMode: false,
              activeBuffs: {
                speedTimeRemaining: 0,
                jumpTimeRemaining: 0,
                magnetTimeRemaining: 0,
                speedMultiplier: 1.0,
                jumpMultiplier: 1.0,
                magnetRadius: 10.0,
              },
            });
            if (worldRef.current) {
              worldRef.current.setEquippedSword(null);
            }
            showToast(`☁️ Bienvenido ${user.displayName?.split(' ')[0] || 'Jugador'} a Super Boy`);
          }
        } catch (err) {
          console.error('Error loading save data:', err);
        }
      } else {
        // Logged out / Guest: Reset to fresh mortal state
        if (worldRef.current) {
          worldRef.current.setVip(false);
          worldRef.current.setUnlimitedPowers({
            isGodMode: false,
            superSpeed: false,
            superJump: false,
            superMagnet: false,
            freeTemplePass: false,
            flyMode: false,
          });
        }
        setVipProfile({
          email: '',
          username: 'Jugador',
          role: 'standard',
          isUnlimited: false,
          infiniteCoins: false,
          isGodMode: false,
          superSpeed: false,
          superJump: false,
          superMagnet: false,
          freeTemplePass: false,
          flyMode: false,
        });
        setInventory({
          coins: 0,
          health: 5,
          maxHealth: 5,
          ownedSwordIds: [],
          equippedSwordId: null,
          playerMultiplier: 1,
          unlockedMultipliers: [1],
          isGodMode: false,
          activeBuffs: {
            speedTimeRemaining: 0,
            jumpTimeRemaining: 0,
            magnetTimeRemaining: 0,
            speedMultiplier: 1.0,
            jumpMultiplier: 1.0,
            magnetRadius: 10.0,
          },
        });
      }
    });

    return () => unsubscribe();
  }, [applyVipPerks, showToast]);

  // Clothing & Customization Handlers
  const handleSpendCoins = useCallback((amount: number): boolean => {
    if (inventoryRef.current.coins >= amount) {
      setInventory((prev) => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  }, []);

  const handleUpdateCustomization = useCallback((newCust: PlayerCustomization) => {
    setCustomization(newCust);
    try {
      localStorage.setItem('superboy_customization', JSON.stringify(newCust));
      setHasCustomizedOutfit(true);
    } catch (e) {}
    if (worldRef.current) {
      worldRef.current.setCustomization(newCust);
    }
  }, []);

  // Handle Google Sign In
  const handleSignInGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`👋 ¡Bienvenido ${result.user.displayName || 'Super Boy'}!`);
    } catch (err) {
      console.error('Sign In Error:', err);
      showToast('❌ No se pudo iniciar sesión con Google');
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast('👋 Sesión cerrada');
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  // Build aggregate achievement stats for real-time evaluations
  const achievementStats: PlayerAchievementStats = useMemo(() => ({
    zombiesDefeated,
    lifetimeCoinsCollected: Math.max(lifetimeCoinsCollected, inventory.coins),
    currentCoins: inventory.coins,
    totalJumps,
    bossDefeatedCount,
    gummyBossDefeated,
    hasGummyBoots: Boolean(inventory.hasGummyBoots || inventory.equippedBootsId === 'gummy_boots'),
    gummyBounces: gummyBouncesCount,
    visitedCandyLand,
    visitedMayanTemple,
    ownedSwordsCount: inventory.ownedSwordIds.length,
    hasCustomizedOutfit,
    highestMultiplier: Math.max(inventory.playerMultiplier, ...(inventory.unlockedMultipliers || [1])),
    claimedAchievementIds,
  }), [
    zombiesDefeated,
    lifetimeCoinsCollected,
    inventory.coins,
    inventory.hasGummyBoots,
    inventory.equippedBootsId,
    totalJumps,
    bossDefeatedCount,
    gummyBossDefeated,
    gummyBouncesCount,
    visitedCandyLand,
    visitedMayanTemple,
    inventory.ownedSwordIds.length,
    hasCustomizedOutfit,
    inventory.playerMultiplier,
    inventory.unlockedMultipliers,
    claimedAchievementIds,
  ]);

  const unclaimedAchievementsCount = useMemo(() => {
    return getUnclaimedAchievementsCount(achievementStats);
  }, [achievementStats]);

  // Persist achievements stats locally
  useEffect(() => {
    try {
      localStorage.setItem(
        'superboy_achievements',
        JSON.stringify({
          claimed: claimedAchievementIds,
          lifetimeCoins: Math.max(lifetimeCoinsCollected, inventory.coins),
          totalJumps,
          bossDefeatedCount,
        })
      );
    } catch (e) {}
  }, [claimedAchievementIds, lifetimeCoinsCollected, inventory.coins, totalJumps, bossDefeatedCount]);

  // Milestone Notification System: Detect when a milestone is newly unlocked
  const previousUnlockedIdsRef = useRef<Set<string>>(new Set());
  const isInitialAchievementCheck = useRef(true);

  useEffect(() => {
    const currentlyUnlocked = new Set<string>();
    ACHIEVEMENTS_LIST.forEach((ach) => {
      const status = getAchievementStatus(ach, achievementStats);
      if (status.isUnlocked) {
        currentlyUnlocked.add(ach.id);
        if (!isInitialAchievementCheck.current && !previousUnlockedIdsRef.current.has(ach.id)) {
          soundEngine.playVictoryFanfare();
          showToast(`🏅 ¡Hito Alcanzado: "${ach.title}"! Reclama +${ach.rewardCoins.toLocaleString()} 🪙 en LOGROS`);
        }
      }
    });

    previousUnlockedIdsRef.current = currentlyUnlocked;
    if (isInitialAchievementCheck.current) {
      isInitialAchievementCheck.current = false;
    }
  }, [achievementStats, showToast]);

  // Claim single achievement reward
  const handleClaimAchievementReward = useCallback((achievementId: string, rewardCoins: number) => {
    const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
    setClaimedAchievementIds((prev) => {
      if (prev.includes(achievementId)) return prev;
      return [...prev, achievementId];
    });

    setInventory((prev) => ({
      ...prev,
      coins: prev.coins + rewardCoins,
    }));
    setScore((prev) => prev + rewardCoins);
    showToast(`🎁 ¡Reclamaste +${rewardCoins.toLocaleString()} 🪙 por "${ach?.title || 'Logro'}"!`);
  }, [showToast]);

  // Claim all available achievement rewards at once
  const handleClaimAllAchievements = useCallback((claimList: { id: string; rewardCoins: number }[]) => {
    const totalReward = claimList.reduce((acc, c) => acc + c.rewardCoins, 0);
    const newIds = claimList.map((c) => c.id);

    setClaimedAchievementIds((prev) => {
      const merged = new Set([...prev, ...newIds]);
      return Array.from(merged);
    });

    setInventory((prev) => ({
      ...prev,
      coins: prev.coins + totalReward,
    }));
    setScore((prev) => prev + totalReward);
    showToast(`🎁 ¡Reclamaste un total de +${totalReward.toLocaleString()} 🪙 por ${claimList.length} logros!`);
  }, [showToast]);

  // Cloud Auto-Save Debounce whenever stats change
  useEffect(() => {
    if (currentUser) {
      const timeout = setTimeout(() => {
        saveUserProgress(bestScore, inventory, zombiesDefeated, customization, {
          claimedAchievementIds,
          lifetimeCoinsCollected: Math.max(lifetimeCoinsCollected, inventory.coins),
          totalJumps,
          bossDefeatedCount,
        }).catch((err) => {
          console.warn('Auto-save error:', err);
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [currentUser, bestScore, inventory.coins, inventory.equippedSwordId, inventory.playerMultiplier, zombiesDefeated, customization, claimedAchievementIds, lifetimeCoinsCollected, totalJumps, bossDefeatedCount]);

  // Enter structure with 5-second loading screen
  const handleOpenShop = useCallback(() => {
    setLoadingState({
      isOpen: true,
      target: 'structure',
      durationMs: 5000, // 5 segundos al entrar a una estructura
      title: '🗡️ TIENDA DE ESPADAS (5s)',
      subtitle: 'Entrando a la herrería mística...',
      onComplete: () => {
        setIsShopOpen(true);
      },
    });
  }, []);

  const handleOpenMultiplierShop = useCallback(() => {
    setLoadingState({
      isOpen: true,
      target: 'structure',
      durationMs: 5000, // 5 segundos al entrar a una estructura
      title: '⚡ TIENDA DE MULTIPLICADORES (5s)',
      subtitle: 'Entrando al santuario de multiplicadores...',
      onComplete: () => {
        setIsMultiplierShopOpen(true);
      },
    });
  }, []);

  // Initialize Game World
  useEffect(() => {
    if (!containerRef.current) return;

    const world = new GameWorld(containerRef.current, {
      onCoinCollected: (coin: CoinData, remaining: number, total: number, currentCombo: number) => {
        const mult = inventoryRef.current.playerMultiplier || 1;
        const pointsEarned = coin.value * mult * Math.max(1, currentCombo);
        setScore((prev) => prev + pointsEarned);
        setCollectedCoins(total - remaining);
        setTotalCoins(total);
        setCombo(currentCombo);
        setLifetimeCoinsCollected((prev) => prev + pointsEarned);

        setInventory((prev) => ({
          ...prev,
          coins: prev.coins + pointsEarned,
        }));

        const typeName = coin.type === 'star' ? '¡Gran Estrella!' : coin.type === 'gem' ? '¡Diamante!' : '¡Moneda!';
        const multLabel = mult > 1 ? ` (${mult}x)` : '';
        showToast(`+${pointsEarned}${multLabel} ${typeName}`);
      },
      onTimeUpdate: (newTimeState: TimeState) => {
        setTimeState(newTimeState);
        soundEngine.setNightMood(newTimeState.period === 'night' || newTimeState.period === 'sunset');
      },
      onWeatherUpdate: (newWeather: WeatherState) => {
        setWeatherState(newWeather);
      },
      onJump: () => {
        setTotalJumps((prev) => prev + 1);
      },
      onSpring: () => {
        setTotalJumps((prev) => prev + 1);
        setGummyBouncesCount((prev) => prev + 1);
        showToast('🚀 ¡Súper Salto de Trampolín de Gomita!');
      },
      onFpsUpdate: (newFps: number) => {
        setFps(newFps);
      },
      onNearShop: (near: boolean) => {
        setIsNearShop(near);
      },
      onOpenShop: () => {
        handleOpenShop();
      },
      onNearMultiplierShop: (near: boolean) => {
        setIsNearMultiplierShop(near);
      },
      onOpenMultiplierShop: () => {
        handleOpenMultiplierShop();
      },
      onNearTemple: (near: boolean, cost: number) => {
        setIsNearTemple(near);
        setTempleCost(cost);
      },
      onNearCandyPortal: (near: boolean) => {
        setIsNearCandyPortal(near);
      },
      onNearCampfire: (near: boolean) => {
        setIsNearCampfire(near);
      },
      onSpendCoins: (amount: number) => {
        if (inventoryRef.current.coins >= amount) {
          setInventory((prev) => ({ ...prev, coins: prev.coins - amount }));
          return true;
        }
        return false;
      },
      onAddCoins: (amount: number) => {
        setScore((prev) => prev + amount);
        setInventory((prev) => ({ ...prev, coins: prev.coins + amount }));
        setLifetimeCoinsCollected((prev) => prev + amount);
      },
      onBossStateUpdate: (state: MayanBossState) => {
        setBossState(state);
        if (state.phase === 'defeated') {
          setBossDefeatedCount((prev) => Math.max(1, prev + 1));
          if (state.bossName?.toLowerCase().includes('gomita') || state.bossName?.toLowerCase().includes('oso')) {
            setGummyBossDefeated(true);
          }
        }
      },
      onToast: (msg: string) => {
        showToast(msg);
      },
      onBuffsUpdate: (buffs) => {
        setInventory((prev) => ({
          ...prev,
          activeBuffs: {
            ...prev.activeBuffs,
            speedTimeRemaining: buffs.speedTimeRemaining,
            jumpTimeRemaining: buffs.jumpTimeRemaining,
            magnetTimeRemaining: buffs.magnetTimeRemaining,
          },
        }));
      },
      onWorldChange: (newWorld) => {
        setCurrentDimension(newWorld);
        soundEngine.setDimension(newWorld);
        if (newWorld === 'candy') {
          setVisitedCandyLand(true);
        } else if (newWorld === 'mayan_boss') {
          setVisitedMayanTemple(true);
        }

        setLoadingState({
          isOpen: true,
          target: newWorld,
          durationMs: 10000, // 10 segundos al entrar a un mundo
          title:
            newWorld === 'candy'
              ? '🍭 VIAJANDO AL MUNDO CARAMELO (10s)'
              : newWorld === 'choco_temple'
              ? '🍫 ENTRANDO AL TEMPLO CHOCO (10s)'
              : newWorld === 'mayan_boss'
              ? '🏛️ ENTRANDO AL TEMPLO MAYA (10s)'
              : '🌿 REGRESANDO AL VALLE PRINCIPAL (10s)',
          subtitle:
            newWorld === 'candy'
              ? 'Cargando islas flotantes de caramelo y fogatas dulces...'
              : newWorld === 'choco_temple'
              ? 'Cargando Arena de Chocolate y Despertando al Gran Oso Gomita...'
              : newWorld === 'mayan_boss'
              ? 'Cargando la Cripta Maya y Altar del Rey Zombi...'
              : 'Cargando el valle principal, aldea y colinas...',
          onComplete: () => {
            if (newWorld === 'candy') {
              showToast('🍭 ¡Bienvenido al Mundo de Caramelo!');
            } else if (newWorld === 'choco_temple') {
              showToast('🍫 ¡Entraste al Templo Choco! ¡Vence al Gran Oso Gomita!');
            } else if (newWorld === 'mayan_boss') {
              showToast('🏛️ ¡Entraste a la Cripta Maya! ¡Derrota al Rey Zombi!');
            } else {
              showToast('🌿 Regresaste al Valle Principal');
            }
          },
        });
      },
      onZombieDefeated: (points, remaining) => {
        setScore((prev) => prev + points);
        setZombiesDefeated((prev) => prev + 1);
        setInventory((prev) => ({ ...prev, coins: prev.coins + points }));
        showToast(`⚔️ ¡Zombi derrotado! +${points} monedas`);
      },
      onPlayerHurt: (message) => {
        showToast(`💥 ${message}`);
      },
      onPlayerHealthUpdate: (health, maxHealth) => {
        setInventory((prev) => ({ ...prev, health, maxHealth }));
      },
      onPlayerDied: () => {
        const currentCoins = inventoryRef.current.coins;
        const lost = currentCoins > 0 ? Math.max(1, Math.floor(currentCoins * 0.25)) : 0;
        setCoinsLostOnDeath(lost);
        setIsDeathModalOpen(true);
      },
      onVictory: () => {
        setIsVictoryOpen(true);
      },
      onFlightChange: (flying: boolean) => {
        setIsFlying(flying);
        setVipProfile((prev) => ({ ...prev, flyMode: flying }));
      },
      onWorldReady: () => {
        setIsWorldReady(true);
      },
    });

    worldRef.current = world;
    world.setCustomization(customizationRef.current);
    world.setVip(isVip);
    world.setUnlimitedPowers({
      isGodMode: isVip,
      superSpeed: isVip,
      superJump: isVip,
      superMagnet: isVip,
      freeTemplePass: isVip,
      flyMode: false,
    });
    if (inventoryRef.current.equippedSwordId) {
      world.setEquippedSword(inventoryRef.current.equippedSwordId);
    }
    if (inventoryRef.current.equippedBootsId) {
      world.setEquippedBoots(inventoryRef.current.equippedBootsId);
    }
    if (settingsRef.current.graphicsQuality) {
      world.setGraphicsQuality(settingsRef.current.graphicsQuality);
    }
    if (settingsRef.current.fov) {
      world.setFov(settingsRef.current.fov);
    }
    world.setSensitivity(settingsRef.current.mouseSensitivity);
    world.start();

    // Radar interval (update compass every 200ms)
    const radarInterval = window.setInterval(() => {
      if (worldRef.current && settingsRef.current.showCompass) {
        const rad = worldRef.current.getNearestCoinDirection();
        setRadar(rad);
      }
    }, 200);

    // Timer interval
    const timeInterval = window.setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    // User first interaction listener to allow audio playback if autoplay was restricted
    const onFirstInteract = () => {
      soundEngine.init();
      soundEngine.resume();
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
    };
    window.addEventListener('pointerdown', onFirstInteract);
    window.addEventListener('keydown', onFirstInteract);

    return () => {
      clearInterval(radarInterval);
      clearInterval(timeInterval);
      window.removeEventListener('pointerdown', onFirstInteract);
      window.removeEventListener('keydown', onFirstInteract);
      soundEngine.stopMusic();
      soundEngine.stopAmbient();
      world.destroy();
    };
  }, [showToast]);

  // Update best score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
    }
  }, [score, bestScore]);

  // Handle Play Game from Title Screen (with selected or detected control mode)
  const handlePlayGame = useCallback((chosenMode?: ControlDevice) => {
    const activeMode: ControlDevice = chosenMode || controlMode;
    setControlMode(activeMode);
    setSettings((prev) => ({ ...prev, controlMode: activeMode }));

    soundEngine.init();
    soundEngine.resume();
    soundEngine.playGameStartSound();
    soundEngine.startAmbient();
    if (isMusicOn) {
      soundEngine.startMusic();
    }

    // Try to trigger fullscreen on mobile to hide Chrome URL bar
    if (activeMode === 'mobile') {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    }

    setLoadingState({
      isOpen: true,
      target: 'game_start',
      durationMs: 15000, // 15 segundos al iniciar el juego
      title: '⚔️ INICIANDO SUPER BOY 3D (15s)',
      subtitle:
        activeMode === 'mobile'
          ? 'Preparando controles táctiles y mundo...'
          : 'Preparando teclado, ratón y mundo...',
      onComplete: () => {
        setIsPlaying(true);
        setIsWorldReady(true);
        window.focus();
        containerRef.current?.focus();
        showToast(
          activeMode === 'mobile'
            ? '📱 Modo Celular Iniciado: Botones y Joystick Táctiles Activos'
            : '💻 Modo PC Iniciado: ¡Usa WASD o Flechas para moverte!'
        );
      },
    });
  }, [controlMode, isMusicOn, showToast]);

  // Handle Quick Toggle of Control Mode (PC vs Celular) during gameplay
  const handleToggleControlMode = useCallback(() => {
    const nextMode: ControlDevice = controlMode === 'pc' ? 'mobile' : 'pc';
    setControlMode(nextMode);
    setSettings((prev) => ({ ...prev, controlMode: nextMode }));
    showToast(
      nextMode === 'mobile'
        ? '📱 Modo Celular Activado (Botones Táctiles en Pantalla)'
        : '💻 Modo PC Activado (Teclado y Ratón: WASD)'
    );
  }, [controlMode, showToast]);

  // Keyboard shortcut (Enter / Space / WASD / Flechas) to start game while in Start Screen
  useEffect(() => {
    if (isPlaying) return;
    const onStartKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if any modal is open
      if (isSettingsOpen || isHelpOpen || isShopOpen || isVictoryOpen || isWardrobeOpen) return;
      const startCodes = [
        'Enter', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyZ', 'KeyQ',
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
      ];
      if (
        startCodes.includes(e.code) ||
        e.key === 'Enter' ||
        e.key === ' ' ||
        ['w', 'a', 's', 'd', 'z', 'q', 'W', 'A', 'S', 'D', 'Z', 'Q'].includes(e.key)
      ) {
        handlePlayGame();
      }
    };
    window.addEventListener('keydown', onStartKeyDown);
    return () => window.removeEventListener('keydown', onStartKeyDown);
  }, [isPlaying, isSettingsOpen, isHelpOpen, isShopOpen, isVictoryOpen, isWardrobeOpen, handlePlayGame]);

  // Secret Creator Hotkey (F2 or K) for Santiago
  useEffect(() => {
    const handleCreatorKeyDown = (e: KeyboardEvent) => {
      if (!isVip) return;
      if (e.code === 'F2' || (e.code === 'KeyK' && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase()))) {
        e.preventDefault();
        setIsVipModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleCreatorKeyDown);
    return () => window.removeEventListener('keydown', handleCreatorKeyDown);
  }, [isVip]);

  // Handle Music Toggle
  const handleToggleMusic = () => {
    const playing = soundEngine.toggleMusic();
    setIsMusicOn(playing);
    if (playing) {
      showToast('🎵 Música de Aventura Activada');
    }
  };

  // Handle Flashlight Toggle
  const handleToggleFlashlight = () => {
    if (worldRef.current) {
      const state = worldRef.current.toggleFlashlight();
      setIsFlashlightOn(state);
      showToast(state ? '🔦 Linterna Encendida' : 'Linterna Apagada');
    }
  };

  // Handle Camera Mode Toggle
  const handleToggleViewMode = () => {
    if (worldRef.current) {
      const mode = worldRef.current.toggleViewMode();
      setViewMode(mode);
      showToast(mode === 'third_person' ? '👁️ Tercera Persona' : '👁️ Primera Persona');
    }
  };

  // Handle Jump
  const handleJump = () => {
    if (worldRef.current) {
      worldRef.current.jump();
    }
  };

  // Handle Flight Mode
  const handleToggleFlight = () => {
    if (!isVip) return;
    if (worldRef.current) {
      worldRef.current.toggleFlight();
    }
  };

  const handleFlyVertical = (dir: -1 | 0 | 1) => {
    if (!isVip) return;
    if (worldRef.current) {
      worldRef.current.setFlyVertical(dir);
    }
  };

  // Handle Sprint
  const handleToggleSprint = (sprint: boolean) => {
    setIsSprinting(sprint);
    if (worldRef.current) {
      worldRef.current.setSprinting(sprint);
    }
  };

  // Handle Sword Swing
  const handleSwingSword = () => {
    if (worldRef.current) {
      worldRef.current.swingSword();
    }
  };

  // Handle Buy Item in Shop
  const handleBuyItem = (item: ShopItem) => {
    if (inventory.coins < item.price) {
      soundEngine.playShopBuyFail();
      showToast('❌ ¡No tienes suficientes monedas!');
      return;
    }

    soundEngine.playShopBuySuccess();

    if (item.category === 'sword') {
      setInventory((prev) => ({
        ...prev,
        coins: prev.coins - item.price,
        ownedSwordIds: prev.ownedSwordIds.includes(item.id) ? prev.ownedSwordIds : [...prev.ownedSwordIds, item.id],
        equippedSwordId: item.id,
      }));

      if (worldRef.current) {
        worldRef.current.setEquippedSword(item.id);
      }
      showToast(`🗡️ ¡${item.name} Comprada y Equipada!`);
    } else if (item.category === 'drink') {
      const duration = item.durationSec || 30;

      if (item.speedMultiplier && worldRef.current) {
        worldRef.current.applyBuff('speed', duration, item.speedMultiplier);
      }
      if (item.jumpMultiplier && worldRef.current) {
        worldRef.current.applyBuff('jump', duration, item.jumpMultiplier);
      }
      if (item.magnetRadius && worldRef.current) {
        worldRef.current.applyBuff('magnet', duration, item.magnetRadius);
      }

      setInventory((prev) => ({
        ...prev,
        coins: prev.coins - item.price,
        activeBuffs: {
          ...prev.activeBuffs,
          speedTimeRemaining: item.speedMultiplier
            ? Math.max(prev.activeBuffs.speedTimeRemaining, duration)
            : prev.activeBuffs.speedTimeRemaining,
          jumpTimeRemaining: item.jumpMultiplier
            ? Math.max(prev.activeBuffs.jumpTimeRemaining, duration)
            : prev.activeBuffs.jumpTimeRemaining,
          magnetTimeRemaining: item.magnetRadius
            ? Math.max(prev.activeBuffs.magnetTimeRemaining, duration)
            : prev.activeBuffs.magnetTimeRemaining,
        },
      }));

      showToast(`🥤 ¡${item.name} Bebida! (+Efecto Activo)`);
    } else if (item.category === 'boots') {
      setInventory((prev) => ({
        ...prev,
        coins: prev.coins - item.price,
        hasGummyBoots: true,
        equippedBootsId: item.id,
      }));

      if (worldRef.current) {
        worldRef.current.setEquippedBoots(item.id);
      }
      showToast(`👟 ¡${item.name} Compradas y Equipadas! (+120% Salto)`);
    }
  };

  // Handle Equip/Unequip Sword
  const handleEquipSword = (swordId: string | null) => {
    setInventory((prev) => ({
      ...prev,
      equippedSwordId: swordId,
    }));
    if (worldRef.current) {
      worldRef.current.setEquippedSword(swordId);
    }
    showToast(swordId ? '🗡️ Espada equipada' : '🗡️ Espada desequipada');
  };

  // Handle Equip/Unequip Boots
  const handleEquipBoots = (bootsId: string | null) => {
    setInventory((prev) => ({
      ...prev,
      equippedBootsId: bootsId,
    }));
    if (worldRef.current) {
      worldRef.current.setEquippedBoots(bootsId);
    }
    showToast(bootsId ? '👟 Botas de Gomita equipadas (+120% Salto)' : '👟 Botas de Gomita desequipadas');
  };

  // Handle Buy Multiplier Tier
  const handleBuyMultiplier = (tier: MultiplierTier) => {
    if (tier.world === 'candy' && currentDimension !== 'candy') {
      soundEngine.playShopBuyFail();
      showToast('🔒 ¡Debes cruzar el Portal al Mundo de Caramelo para comprar este multiplicador!');
      return;
    }

    if (inventory.coins < tier.price) {
      soundEngine.playShopBuyFail();
      showToast('❌ ¡No tienes suficientes monedas para este multiplicador!');
      return;
    }

    soundEngine.playShopBuySuccess();
    setInventory((prev) => ({
      ...prev,
      coins: prev.coins - tier.price,
      unlockedMultipliers: prev.unlockedMultipliers.includes(tier.multiplier)
        ? prev.unlockedMultipliers
        : [...prev.unlockedMultipliers, tier.multiplier],
      playerMultiplier: tier.multiplier,
    }));
    showToast(`✨ ¡Multiplicador ${tier.multiplier}x comprado y activado!`);
  };

  // Handle Equip/Select Multiplier Tier
  const handleEquipMultiplier = (mult: number) => {
    setInventory((prev) => ({
      ...prev,
      playerMultiplier: mult,
    }));
    soundEngine.playEquipSound();
    showToast(`⚡ Multiplicador ${mult}x activado`);
  };

  // Action Handlers for Santiago (santiagosorioax@gmail.com)
  const handleUpdateVipProfile = (updated: UserProfile) => {
    if (!isVip) return;
    setVipProfile(updated);
    if (worldRef.current) {
      worldRef.current.setUnlimitedPowers({
        isGodMode: updated.isGodMode,
        superSpeed: updated.superSpeed,
        superJump: updated.superJump,
        superMagnet: updated.superMagnet,
        freeTemplePass: updated.freeTemplePass,
        flyMode: updated.flyMode,
      });
    }
    showToast('✨ Parámetros actualizados');
  };

  const handleRefillInfiniteCoins = () => {
    if (!isVip) return;
    setInventory((prev) => ({
      ...prev,
      coins: 999999999,
    }));
    soundEngine.playCoinSound();
    showToast('🪙 +999,999,999 Monedas');
  };

  const handleUnlockAllSwords = () => {
    if (!isVip) return;
    setInventory((prev) => ({
      ...prev,
      ownedSwordIds: ['wood_sword', 'neon_katana', 'fire_greatsword', 'god_blade'],
      equippedSwordId: 'god_blade',
    }));
    if (worldRef.current) {
      worldRef.current.setEquippedSword('god_blade');
    }
    soundEngine.playEquipSound();
    showToast('🗡️ ¡Espada Divina equipada!');
  };

  const handleUnlockAllMultipliers = () => {
    if (!isVip) return;
    setInventory((prev) => ({
      ...prev,
      unlockedMultipliers: [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000],
      playerMultiplier: 1000,
    }));
    soundEngine.playShopBuySuccess();
    showToast('⚡ ¡Multiplicador 1000x activado!');
  };

  const handleTeleportTo = (dest: 'spawn' | 'shop' | 'multiplier_shop' | 'candy_portal' | 'mayan_temple' | 'boss_arena') => {
    if (!isVip) return;
    setIsVipModalOpen(false);
    if (!worldRef.current) return;

    if (dest === 'shop' || dest === 'multiplier_shop') {
      setLoadingState({
        isOpen: true,
        target: 'structure',
        durationMs: 5000, // 5 segundos al entrar a una estructura
        title: dest === 'shop' ? '🗡️ VIAJANDO A LA TIENDA DE ESPADAS (5s)' : '⚡ VIAJANDO A MULTIPLICADORES (5s)',
        subtitle: 'Teletransportándote a la estructura comercial...',
        onComplete: () => {
          worldRef.current?.teleportTo(dest);
          showToast(dest === 'shop' ? '🗡️ Llegaste a la Tienda de Espadas' : '⚡ Llegaste a la Tienda de Multiplicadores');
        },
      });
      return;
    }

    worldRef.current.teleportTo(dest);
    if (dest === 'candy_portal') {
      showToast('🍭 ¡Teletransportado al Mundo Caramelo!');
    } else if (dest === 'mayan_temple' || dest === 'boss_arena') {
      showToast('🏛️ ¡Teletransportado al Templo Maya (Rey Zombi)!');
    } else {
      showToast(`🌀 Teletransportado a ${dest}`);
    }
  };

  // Handle Settings Update
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (newSettings.musicVolume !== undefined) {
      soundEngine.setMusicVolume(newSettings.musicVolume);
    }
    if (newSettings.sfxVolume !== undefined) {
      soundEngine.setSfxVolume(newSettings.sfxVolume);
    }
    if (newSettings.ambientVolume !== undefined) {
      soundEngine.setAmbientVolume(newSettings.ambientVolume);
    }
    if (newSettings.cycleSpeed !== undefined && worldRef.current) {
      worldRef.current.setCycleSpeed(newSettings.cycleSpeed);
    }
    if (newSettings.mouseSensitivity !== undefined && worldRef.current) {
      worldRef.current.setMouseSensitivity(newSettings.mouseSensitivity);
    }
    if (newSettings.fov !== undefined && worldRef.current) {
      worldRef.current.setFov(newSettings.fov);
    }
    if (newSettings.controlMode !== undefined) {
      setControlMode(newSettings.controlMode);
    }
    if (newSettings.graphicsQuality !== undefined && worldRef.current) {
      worldRef.current.setGraphicsQuality(newSettings.graphicsQuality);
    }
  };

  // Handle Reset Game
  const handleResetGame = () => {
    if (worldRef.current) {
      worldRef.current.resetAllCoins();
      setScore(0);
      setCollectedCoins(0);
      setCombo(0);
      setTimeElapsed(0);
      showToast('🔄 ¡Juego y monedas reiniciados!');
    }
  };

  // Handle Teleport / Return to Spawn
  const handleReturnToSpawn = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.teleportToSpawn();
      showToast('🏠 ¡Teletransportado al Inicio!');
    }
  }, [showToast]);

  // Handle Death Retry & Respawn
  const handleRetryRespawn = useCallback(() => {
    const lost = coinsLostOnDeath;
    setInventory((prev) => ({
      ...prev,
      coins: Math.max(0, prev.coins - lost),
      health: 5,
    }));
    if (worldRef.current) {
      worldRef.current.respawnPlayer();
    }
    setIsDeathModalOpen(false);
    if (lost > 0) {
      showToast(`💀 ¡Has revivido en la Plaza! Perdiste ${lost} monedas.`);
    } else {
      showToast('💀 ¡Has revivido en la Plaza con salud completa!');
    }
  }, [coinsLostOnDeath, showToast]);

  // --- TOUCH JOYSTICK EVENTS ---
  const handleJoyTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joyTouchIdRef.current === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      joyTouchIdRef.current = touch.identifier;
      const target = e.currentTarget.getBoundingClientRect();
      joyCenterRef.current = {
        x: target.left + target.width / 2,
        y: target.top + target.height / 2,
      };
      updateJoystickPos(touch.clientX, touch.clientY);
    }
  };

  const handleJoyTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joyTouchIdRef.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoyTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchIdRef.current) {
        joyTouchIdRef.current = null;
        setJoyStickPos({ x: 0, y: 0 });
        if (worldRef.current) {
          worldRef.current.setJoystickInput(0, 0);
        }
        break;
      }
    }
  };

  const updateJoystickPos = (clientX: number, clientY: number) => {
    const maxRadius = 45;
    const dx = clientX - joyCenterRef.current.x;
    const dy = clientY - joyCenterRef.current.y;
    const len = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;
    if (len > maxRadius) {
      clampedX = (dx / len) * maxRadius;
      clampedY = (dy / len) * maxRadius;
    }

    setJoyStickPos({ x: clampedX, y: clampedY });

    if (worldRef.current) {
      // Normalize -1 to 1
      worldRef.current.setJoystickInput(clampedX / maxRadius, clampedY / maxRadius);
    }
  };

  // --- TOUCH LOOK (CAMERA) EVENTS ---
  const handleLookTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier !== joyTouchIdRef.current && lookTouchIdRef.current === null) {
        lookTouchIdRef.current = touch.identifier;
        lookPrevPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const deltaX = touch.clientX - lookPrevPosRef.current.x;
        const deltaY = touch.clientY - lookPrevPosRef.current.y;

        if (worldRef.current) {
          worldRef.current.rotateCameraByTouch(deltaX, deltaY);
        }

        lookPrevPosRef.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  return (
    <div id="game-root" className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={containerRef} 
        id="three-canvas-container" 
        tabIndex={0}
        onClick={() => {
          containerRef.current?.focus();
          window.focus();
        }}
        onPointerDown={() => {
          containerRef.current?.focus();
          window.focus();
        }}
        className="w-full h-full cursor-crosshair touch-none outline-none focus:outline-none"
      />

      {/* Title / Start Screen for SUPER BOY */}
      {!isPlaying && (
        <StartScreen
          onPlay={handlePlayGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          isVip={isVip}
          onOpenVipProfile={() => setIsVipModalOpen(true)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isMusicOn={isMusicOn}
          onToggleMusic={handleToggleMusic}
          bestScore={bestScore}
          currentUser={currentUser}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          onOpenWardrobe={() => setIsWardrobeOpen(true)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenInstall={handleInstallApp}
          isInstalled={isInstalled}
          unclaimedAchievementsCount={unclaimedAchievementsCount}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
        />
      )}

      {/* Heads-Up Display & Controls (Active during gameplay) */}
      {isPlaying && (
        <HUD
          score={score}
          collectedCoins={collectedCoins}
          totalCoins={totalCoins}
          timeState={timeState}
          weatherState={weatherState}
          onSelectWeather={(type) => worldRef.current?.setWeather(type)}
          combo={combo}
          fps={fps}
          showFps={settings.showFps}
          isMusicOn={isMusicOn}
          isFlashlightOn={isFlashlightOn}
          viewMode={viewMode}
          isSprinting={isSprinting}
          controlMode={controlMode}
          onToggleControlMode={handleToggleControlMode}
          radar={settings.showCompass ? radar : null}
          isNearShop={isNearShop}
          isNearMultiplierShop={isNearMultiplierShop}
          isNearTemple={isNearTemple}
          isNearCandyPortal={isNearCandyPortal}
          isNearCampfire={isNearCampfire}
          templeCost={templeCost}
          onEnterTemple={() => worldRef.current?.tryEnterMayanTemple()}
          onEnterCandyWorld={() => worldRef.current?.tryEnterCandyWorld()}
          bossState={bossState}
          inventory={inventory}
          currentDimension={currentDimension}
          zombiesDefeated={zombiesDefeated}
          currentUser={currentUser}
          isVip={isVip}
          isFlying={isFlying}
          onToggleFlight={handleToggleFlight}
          onFlyVertical={handleFlyVertical}
          onOpenVipProfile={() => setIsVipModalOpen(true)}
          onSignInGoogle={handleSignInGoogle}
          onSignOut={handleSignOut}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenWardrobe={() => setIsWardrobeOpen(true)}
          unclaimedAchievementsCount={unclaimedAchievementsCount}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          onToggleMusic={handleToggleMusic}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleViewMode={handleToggleViewMode}
          onJump={handleJump}
          onToggleSprint={handleToggleSprint}
          onSwingSword={handleSwingSword}
          onOpenShop={handleOpenShop}
          onOpenMultiplierShop={handleOpenMultiplierShop}
          onReturnToSpawn={handleReturnToSpawn}
          onTeleportToTemple={() => handleTeleportTo('mayan_temple')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onJoyTouchStart={handleJoyTouchStart}
          onJoyTouchMove={handleJoyTouchMove}
          onJoyTouchEnd={handleJoyTouchEnd}
          joyStickPos={joyStickPos}
          onLookTouchStart={handleLookTouchStart}
          onLookTouchMove={handleLookTouchMove}
          onLookTouchEnd={handleLookTouchEnd}
          lastToast={lastToast}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenInstall={handleInstallApp}
          isInstalled={isInstalled}
        />
      )}

      {/* VIP Profile & God Mode Modal for Santiago */}
      <VipProfileModal
        isOpen={isVipModalOpen}
        onClose={() => setIsVipModalOpen(false)}
        user={vipProfile}
        inventory={inventory}
        currentWeather={weatherState?.type}
        onSetWeather={(type) => worldRef.current?.setWeather(type)}
        onUpdateUser={handleUpdateVipProfile}
        onRefillInfiniteCoins={handleRefillInfiniteCoins}
        onUnlockAllSwords={handleUnlockAllSwords}
        onUnlockAllMultipliers={handleUnlockAllMultipliers}
        onTeleportTo={handleTeleportTo}
      />

      {/* Leaderboard Modal (Powered by Firebase Firestore) */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentScore={score}
      />

      {/* Achievements / Medals Modal */}
      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        stats={achievementStats}
        onClaimReward={handleClaimAchievementReward}
        onClaimAllRewards={handleClaimAllAchievements}
      />

      {/* Wardrobe & Character Clothing Customization Modal */}
      <WardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        coins={inventory.coins}
        customization={customization}
        onSpendCoins={handleSpendCoins}
        onUpdateCustomization={handleUpdateCustomization}
      />

      {/* Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={inventory}
        currentDimension={currentDimension}
        onBuyItem={handleBuyItem}
        onEquipSword={handleEquipSword}
        onEquipBoots={handleEquipBoots}
      />

      {/* Multiplier Shop Modal */}
      <MultiplierShopModal
        isOpen={isMultiplierShopOpen}
        onClose={() => setIsMultiplierShopOpen(false)}
        inventory={inventory}
        currentDimension={currentDimension}
        onBuyMultiplier={handleBuyMultiplier}
        onEquipMultiplier={handleEquipMultiplier}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetGame={handleResetGame}
        onReturnToTitle={() => setIsPlaying(false)}
        isVip={isVip}
        onOpenCreatorConsole={() => setIsVipModalOpen(true)}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        score={score}
        totalCoins={totalCoins}
        timeElapsedSeconds={timeElapsed}
        onRestart={handleResetGame}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Death / Game Over Modal with Reintentar button */}
      <DeathModal
        isOpen={isDeathModalOpen}
        coinsLost={coinsLostOnDeath}
        remainingCoins={Math.max(0, inventory.coins - coinsLostOnDeath)}
        onRetry={handleRetryRespawn}
      />

      {/* Install Prompt Modal for PWA (Mobile & Desktop) */}
      <InstallPromptModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={handleInstallApp}
        canNativeInstall={Boolean(deferredPrompt)}
        platform={devicePlatform}
      />

      {/* Cartoon Loading Screen for Game Start & World/Structure Transitions */}
      <LoadingScreen
        isOpen={loadingState.isOpen}
        target={loadingState.target}
        title={loadingState.title}
        subtitle={loadingState.subtitle}
        isWorldReady={isWorldReady}
        durationMs={loadingState.durationMs}
        onFinish={() => {
          setLoadingState((prev) => ({ ...prev, isOpen: false }));
          loadingState.onComplete?.();
        }}
      />
    </div>
  );
}
