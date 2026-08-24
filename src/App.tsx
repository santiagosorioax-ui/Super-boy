/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameWorld } from './game/GameWorld';
import { soundEngine } from './audio/soundEngine';
import { CoinData, GameSettings, TimeState, PlayerInventory, ShopItem } from './types';
import { HUD } from './components/HUD';
import { SettingsModal } from './components/SettingsModal';
import { VictoryModal } from './components/VictoryModal';
import { HelpModal } from './components/HelpModal';
import { ShopModal } from './components/ShopModal';
import { StartScreen } from './components/StartScreen';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<GameWorld | null>(null);

  // Game state
  const isMobile = typeof window !== 'undefined' && (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
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

  // Shop & Inventory State
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isNearShop, setIsNearShop] = useState(false);
  const [inventory, setInventory] = useState<PlayerInventory>({
    coins: 0,
    ownedSwordIds: [],
    equippedSwordId: null,
    activeBuffs: {
      speedTimeRemaining: 0,
      jumpTimeRemaining: 0,
      magnetTimeRemaining: 0,
      speedMultiplier: 1.0,
      jumpMultiplier: 1.0,
      magnetRadius: 10.0,
    },
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 0.4,
    sfxVolume: 0.7,
    mouseSensitivity: 1.0,
    fov: 85,
    cycleSpeed: 'normal',
    showCompass: true,
    viewMode: 'first_person',
    graphicsQuality: isMobile ? 'medium' : 'high',
    showFps: false,
  });

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
    }, 2400);
  }, []);

  // Initialize Game World
  useEffect(() => {
    if (!containerRef.current) return;

    const world = new GameWorld(containerRef.current, {
      onCoinCollected: (coin: CoinData, remaining: number, total: number, currentCombo: number) => {
        const pointsEarned = coin.value * Math.max(1, currentCombo);
        setScore((prev) => prev + pointsEarned);
        setCollectedCoins(total - remaining);
        setTotalCoins(total);
        setCombo(currentCombo);

        setInventory((prev) => ({
          ...prev,
          coins: prev.coins + pointsEarned,
        }));

        const typeName = coin.type === 'star' ? '¡Gran Estrella!' : coin.type === 'gem' ? '¡Gema Cian!' : '¡Moneda de Oro!';
        showToast(`+${pointsEarned} ${typeName}`);
      },
      onTimeUpdate: (newTimeState: TimeState) => {
        setTimeState(newTimeState);
      },
      onJump: () => {
        // Jump triggered
      },
      onSpring: () => {
        showToast('🚀 ¡Súper Salto de Trampolín!');
      },
      onFpsUpdate: (newFps: number) => {
        setFps(newFps);
      },
      onNearShop: (near: boolean) => {
        setIsNearShop(near);
      },
      onOpenShop: () => {
        setIsShopOpen(true);
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
      onVictory: () => {
        setIsVictoryOpen(true);
      },
    });

    worldRef.current = world;
    if (settingsRef.current.graphicsQuality) {
      world.setGraphicsQuality(settingsRef.current.graphicsQuality);
    }
    if (settingsRef.current.fov) {
      world.setFov(settingsRef.current.fov);
    }
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
      world.destroy();
    };
  }, [showToast]);

  // Update best score
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
    }
  }, [score, bestScore]);

  // Handle Play Game from Title Screen
  const handlePlayGame = useCallback(() => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.playGameStartSound();
    if (isMusicOn) {
      soundEngine.startMusic();
    }
    setIsPlaying(true);
    showToast('🚀 ¡A jugar SUPER BOY!');
  }, [isMusicOn, showToast]);

  // Keyboard shortcut (Enter / Space) to start game while in Start Screen
  useEffect(() => {
    if (isPlaying) return;
    const onStartKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if a modal is open
      if (isSettingsOpen || isHelpOpen || isShopOpen || isVictoryOpen) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handlePlayGame();
      }
    };
    window.addEventListener('keydown', onStartKeyDown);
    return () => window.removeEventListener('keydown', onStartKeyDown);
  }, [isPlaying, isSettingsOpen, isHelpOpen, isShopOpen, isVictoryOpen, handlePlayGame]);

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
        ownedSwordIds: [...prev.ownedSwordIds, item.id],
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
    if (newSettings.cycleSpeed !== undefined && worldRef.current) {
      worldRef.current.setCycleSpeed(newSettings.cycleSpeed);
    }
    if (newSettings.mouseSensitivity !== undefined && worldRef.current) {
      worldRef.current.setMouseSensitivity(newSettings.mouseSensitivity);
    }
    if (newSettings.fov !== undefined && worldRef.current) {
      worldRef.current.setFov(newSettings.fov);
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
        className="w-full h-full cursor-crosshair touch-none"
      />

      {/* Title / Start Screen for SUPER BOY */}
      {!isPlaying && (
        <StartScreen
          onPlay={handlePlayGame}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          isMusicOn={isMusicOn}
          onToggleMusic={handleToggleMusic}
          bestScore={bestScore}
        />
      )}

      {/* Heads-Up Display & Controls (Active during gameplay) */}
      {isPlaying && (
        <HUD
          score={score}
          collectedCoins={collectedCoins}
          totalCoins={totalCoins}
          timeState={timeState}
          combo={combo}
          fps={fps}
          showFps={settings.showFps}
          isMusicOn={isMusicOn}
          isFlashlightOn={isFlashlightOn}
          viewMode={viewMode}
          isSprinting={isSprinting}
          radar={settings.showCompass ? radar : null}
          isNearShop={isNearShop}
          inventory={inventory}
          onToggleMusic={handleToggleMusic}
          onToggleFlashlight={handleToggleFlashlight}
          onToggleViewMode={handleToggleViewMode}
          onJump={handleJump}
          onToggleSprint={handleToggleSprint}
          onSwingSword={handleSwingSword}
          onOpenShop={() => setIsShopOpen(true)}
          onReturnToSpawn={handleReturnToSpawn}
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
        />
      )}

      {/* Shop Modal */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={inventory}
        onBuyItem={handleBuyItem}
        onEquipSword={handleEquipSword}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetGame={handleResetGame}
        onReturnToTitle={() => setIsPlaying(false)}
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
    </div>
  );
}
