import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import { MayanBossState } from '../types';

interface GummyBossCallbacks {
  onBossStateUpdate?: (state: MayanBossState) => void;
  onPlayerDamage?: (amount: number, reason: string) => void;
  onAddCoins?: (amount: number) => void;
  onToast?: (message: string) => void;
  onBossDefeated?: () => void;
}

interface MiniGummy {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  color: string;
  hopTimer: number;
}

interface CandyBomb {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface GummyShockwave {
  mesh: THREE.Mesh;
  radius: number;
  maxRadius: number;
  speed: number;
  center: THREE.Vector3;
}

export class GummyBossSystem {
  private scene: THREE.Scene;
  private callbacks: GummyBossCallbacks;

  // Boss Stats
  public readonly maxHealth = 500; // Stronger than Mayan Boss (300)
  public health = 500;
  public isDefeated = false;
  public phase: 'intro' | 'attacking' | 'tired' | 'defeated' = 'intro';
  public phaseTimer = 3.0;
  public isInvulnerable = true;
  private hasSpawnedVictoryReward = false;

  // Arena Coordinates inside the Chocolate Castle
  public readonly arenaCenter: THREE.Vector3;
  public readonly arenaRadius = 18.0;

  // 3D Objects
  private bossGroup = new THREE.Group();
  private bossPos = new THREE.Vector3();
  private bossScale = 1.0;
  private jellyShieldMesh!: THREE.Mesh;
  private dizzyStarsGroup = new THREE.Group();
  private victoryChestMesh: THREE.Group | null = null;
  private lollipopHammerGroup = new THREE.Group();

  // Attack Timers & State
  private attackCycleTimer = 0;
  private attackSubPhase: 'slam' | 'candy_barrage' | 'minions' = 'slam';
  private attackIndex = 0;
  private isSlamming = false;
  private slamJumpY = 0;
  private slamPhase: 'rise' | 'fall' = 'rise';
  private hitFlashTimer = 0;

  // Projectiles & Minions
  private miniGummies: MiniGummy[] = [];
  private candyBombs: CandyBomb[] = [];
  private shockwaves: GummyShockwave[] = [];

  // Colliders for the Castle Arena
  private arenaColliders: THREE.Box3[] = [];

  constructor(scene: THREE.Scene, arenaCenter: THREE.Vector3, callbacks: GummyBossCallbacks) {
    this.scene = scene;
    this.arenaCenter = arenaCenter.clone();
    this.bossPos.copy(this.arenaCenter).add(new THREE.Vector3(0, 0, -4.5));
    this.callbacks = callbacks;

    this.buildGummyBossModel();
    this.buildArenaColliders();
    this.resetBoss();
  }

  // --- 1. BUILD GUMMY BEAR 3D MODEL ---
  private buildGummyBossModel() {
    this.bossGroup.position.copy(this.bossPos);

    // Gummy Translucent Materials
    const rubyGummyMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });

    const candyGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.3,
    });

    const sugarWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
    });

    // 1.1 Pear Torso & Jelly Belly
    const bodyGroup = new THREE.Group();
    const torsoGeom = new THREE.SphereGeometry(1.6, 24, 24);
    torsoGeom.scale(1.0, 1.25, 0.95);
    const torsoMesh = new THREE.Mesh(torsoGeom, rubyGummyMat);
    torsoMesh.position.y = 1.9;
    torsoMesh.castShadow = true;
    bodyGroup.add(torsoMesh);

    // Cute Sugar Crystal Belly Plate
    const bellyGeom = new THREE.SphereGeometry(1.1, 20, 20);
    bellyGeom.scale(0.9, 1.0, 0.45);
    const bellyMesh = new THREE.Mesh(bellyGeom, candyGoldMat);
    bellyMesh.position.set(0, 1.8, 0.85);
    bodyGroup.add(bellyMesh);

    // 1.2 Cute Gummy Bear Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.4, 0.1);

    const headGeom = new THREE.SphereGeometry(1.2, 24, 24);
    const headMesh = new THREE.Mesh(headGeom, rubyGummyMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Round Gummy Ears
    const earGeom = new THREE.SphereGeometry(0.55, 16, 16);
    earGeom.scale(1.0, 1.0, 0.4);
    const leftEar = new THREE.Mesh(earGeom, rubyGummyMat);
    leftEar.position.set(-1.0, 0.9, 0);
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(1.0, 0.9, 0);
    headGroup.add(rightEar);

    // Inner Ears (Gold Candy)
    const innerEarGeom = new THREE.SphereGeometry(0.3, 12, 12);
    innerEarGeom.scale(1.0, 1.0, 0.3);
    const leftInnerEar = new THREE.Mesh(innerEarGeom, candyGoldMat);
    leftInnerEar.position.set(-1.0, 0.9, 0.12);
    headGroup.add(leftInnerEar);

    const rightInnerEar = leftInnerEar.clone();
    rightInnerEar.position.set(1.0, 0.9, 0.12);
    headGroup.add(rightInnerEar);

    // Gummy Snout & Nose
    const snoutGeom = new THREE.SphereGeometry(0.52, 16, 16);
    snoutGeom.scale(1.0, 0.8, 0.7);
    const snout = new THREE.Mesh(snoutGeom, candyGoldMat);
    snout.position.set(0, -0.15, 0.95);
    headGroup.add(snout);

    // Dark Chocolate Nose
    const noseGeom = new THREE.SphereGeometry(0.2, 12, 12);
    const nose = new THREE.Mesh(noseGeom, new THREE.MeshStandardMaterial({ color: 0x3e1d09, roughness: 0.1 }));
    nose.position.set(0, -0.05, 1.32);
    headGroup.add(nose);

    // Sweet Glossy Eyes
    const eyeGeom = new THREE.SphereGeometry(0.18, 14, 14);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.42, 0.25, 1.05);
    headGroup.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.42, 0.25, 1.05);
    headGroup.add(rightEye);

    // Eye sparkles
    const sparkleGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftSparkle = new THREE.Mesh(sparkleGeom, sparkleMat);
    leftSparkle.position.set(-0.36, 0.31, 1.18);
    headGroup.add(leftSparkle);

    const rightSparkle = leftSparkle.clone();
    rightSparkle.position.set(0.48, 0.31, 1.18);
    headGroup.add(rightSparkle);

    // 1.3 Golden Spun-Sugar Crown
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 1.15, 0);

    const crownBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.65, 0.4, 16),
      candyGoldMat
    );
    crownGroup.add(crownBase);

    // Crown Spikes with jewels
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.55, 8),
        candyGoldMat
      );
      spike.position.set(Math.cos(angle) * 0.62, 0.45, Math.sin(angle) * 0.62);
      crownGroup.add(spike);

      // Jewel tip (ruby, emerald, sapphire)
      const jewelColors = [0xef4444, 0x10b981, 0x3b82f6, 0xa855f7, 0xf59e0b];
      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 10, 10),
        new THREE.MeshBasicMaterial({ color: jewelColors[i] })
      );
      jewel.position.set(Math.cos(angle) * 0.62, 0.72, Math.sin(angle) * 0.62);
      crownGroup.add(jewel);
    }
    headGroup.add(crownGroup);
    bodyGroup.add(headGroup);

    // 1.4 Chunky Gummy Arms & Paws
    const armGeom = new THREE.CapsuleGeometry(0.55, 1.3, 12, 16);
    const leftArm = new THREE.Mesh(armGeom, rubyGummyMat);
    leftArm.position.set(-1.8, 2.0, 0.2);
    leftArm.rotation.set(0.3, 0, 0.35);
    leftArm.castShadow = true;
    bodyGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, rubyGummyMat);
    rightArm.position.set(1.8, 2.0, 0.2);
    rightArm.rotation.set(-0.2, 0, -0.35);
    rightArm.castShadow = true;
    bodyGroup.add(rightArm);

    // 1.5 Colossal Spiral Lollipop Hammer in Right Hand
    this.lollipopHammerGroup = new THREE.Group();
    this.lollipopHammerGroup.position.set(2.4, 1.9, 0.5);
    this.lollipopHammerGroup.rotation.set(0.4, 0.2, -0.4);

    // Handle (Striped Sugar Cane)
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.8, 12),
      sugarWhiteMat
    );
    this.lollipopHammerGroup.add(handle);

    // Massive Lollipop Disc
    const discGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 24);
    discGeom.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(
      discGeom,
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        roughness: 0.2,
        emissive: 0xbe123c,
        emissiveIntensity: 0.4,
      })
    );
    discMesh.position.set(0, 1.8, 0);
    this.lollipopHammerGroup.add(discMesh);

    // Swirl Rings on the lollipop
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.1, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    ring1.position.set(0, 1.8, 0.26);
    this.lollipopHammerGroup.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.08, 10, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    ring2.position.set(0, 1.8, 0.26);
    this.lollipopHammerGroup.add(ring2);

    bodyGroup.add(this.lollipopHammerGroup);

    // 1.6 Chunky Gummy Legs & Feet
    const legGeom = new THREE.CylinderGeometry(0.65, 0.75, 1.2, 16);
    const leftLeg = new THREE.Mesh(legGeom, rubyGummyMat);
    leftLeg.position.set(-0.85, 0.6, 0.1);
    leftLeg.castShadow = true;
    bodyGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, rubyGummyMat);
    rightLeg.position.set(0.85, 0.6, 0.1);
    rightLeg.castShadow = true;
    bodyGroup.add(rightLeg);

    // Foot Paw pads
    const pawGeom = new THREE.BoxGeometry(0.9, 0.45, 1.2);
    const leftFoot = new THREE.Mesh(pawGeom, rubyGummyMat);
    leftFoot.position.set(-0.85, 0.25, 0.35);
    bodyGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(pawGeom, rubyGummyMat);
    rightFoot.position.set(0.85, 0.25, 0.35);
    bodyGroup.add(rightFoot);

    this.bossGroup.add(bodyGroup);

    // 1.7 Sparkling Translucent Jelly Shield (Invulnerable Phase)
    const shieldGeom = new THREE.SphereGeometry(3.6, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      wireframe: true,
    });
    this.jellyShieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.jellyShieldMesh.position.set(0, 2.2, 0);
    this.bossGroup.add(this.jellyShieldMesh);

    // 1.8 Dizzy Cartoon Stars (Tired Phase)
    this.dizzyStarsGroup.position.set(0, 4.8, 0);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.3),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      star.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      this.dizzyStarsGroup.add(star);
    }
    this.dizzyStarsGroup.visible = false;
    this.bossGroup.add(this.dizzyStarsGroup);

    this.scene.add(this.bossGroup);
  }

  // --- 2. ARENA BOUNDARY COLLIDERS ---
  private buildArenaColliders() {
    // Castle walls protect the arena
    const cx = this.arenaCenter.x;
    const cz = this.arenaCenter.z;
    const r = this.arenaRadius;

    // 4 invisible walls boxing the Throne Room Arena
    this.arenaColliders = [
      new THREE.Box3(new THREE.Vector3(cx - r - 2, 0, cz - r), new THREE.Vector3(cx - r, 15, cz + r)), // West
      new THREE.Box3(new THREE.Vector3(cx + r, 0, cz - r), new THREE.Vector3(cx + r + 2, 15, cz + r)), // East
      new THREE.Box3(new THREE.Vector3(cx - r, 0, cz + r), new THREE.Vector3(cx + r, 15, cz + r + 2)), // North (behind throne)
    ];
  }

  // --- 3. RESET BOSS STATE ---
  public resetBoss() {
    this.health = this.maxHealth;
    this.isDefeated = false;
    this.phase = 'intro';
    this.phaseTimer = 3.5;
    this.attackCycleTimer = 0;
    this.isInvulnerable = true;
    this.isSlamming = false;
    this.slamJumpY = 0;
    this.hasSpawnedVictoryReward = false;

    this.bossPos.copy(this.arenaCenter).add(new THREE.Vector3(0, 0, 3.5));
    this.bossGroup.position.copy(this.bossPos);
    this.bossGroup.scale.set(1, 1, 1);
    this.bossGroup.visible = true;
    this.jellyShieldMesh.visible = true;
    this.dizzyStarsGroup.visible = false;

    this.clearProjectiles();

    if (this.victoryChestMesh) {
      this.scene.remove(this.victoryChestMesh);
      this.victoryChestMesh = null;
    }

    this.emitState();
  }

  private clearProjectiles() {
    this.miniGummies.forEach((m) => this.scene.remove(m.mesh));
    this.miniGummies = [];

    this.candyBombs.forEach((b) => this.scene.remove(b.mesh));
    this.candyBombs = [];

    this.shockwaves.forEach((s) => this.scene.remove(s.mesh));
    this.shockwaves = [];
  }

  private emitState() {
    const isTired = this.phase === 'tired';
    const statusMessage = this.isDefeated
      ? '¡REY OSO DERROTADO!'
      : isTired
      ? `¡BAJÓN DE AZÚCAR! (${Math.ceil(this.phaseTimer)}s)`
      : this.phase === 'intro'
      ? '¡EL GRAN REY OSO DESPIERTA!'
      : this.health < 250
      ? '¡FURIA DE AZÚCAR! (INVULNERABLE)'
      : 'INVULNERABLE (ESQUIVA SUS DULCES ATAQUES)';

    this.callbacks.onBossStateUpdate?.({
      active: true,
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.phase,
      tiredTimeRemaining: isTired ? Math.max(0, this.phaseTimer) : 0,
      isInvulnerable: this.isInvulnerable,
      isTired,
      statusMessage,
      bossName: 'Gran Rey Oso de Gomita',
      bossIcon: '🐻👑',
      bossThemeColor: '#f43f5e',
      arenaName: 'Castillo de Chocolate',
    });
  }

  // --- 4. UPDATE LOOP ---
  public update(dt: number, playerPos: THREE.Vector3, currentDimension: string) {
    if (currentDimension !== 'candy') {
      return;
    }

    // Check distance to Chocolate Castle Arena
    const distToArena = playerPos.distanceTo(this.arenaCenter);
    const isPlayerInArena = distToArena < this.arenaRadius + 4.0;

    if (!isPlayerInArena && !this.isDefeated) {
      return; // Sleep when player is far away in the candy garden
    }

    const time = performance.now() * 0.001;

    // Animate Shield & Dizzy Stars
    if (this.jellyShieldMesh.visible) {
      this.jellyShieldMesh.rotation.y += 0.8 * dt;
      this.jellyShieldMesh.rotation.x = Math.sin(time * 2) * 0.15;
    }
    if (this.dizzyStarsGroup.visible) {
      this.dizzyStarsGroup.rotation.y += 3.5 * dt;
    }

    // Flash when damaged
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.bossGroup.position.x = this.bossPos.x + (Math.random() - 0.5) * 0.2;
    } else {
      this.bossGroup.position.x = this.bossPos.x;
    }

    // Animate active projectiles & minions
    this.updateProjectilesAndMinions(dt, playerPos);

    if (this.isDefeated) {
      return;
    }

    // --- STATE MACHINE ---
    if (this.phase === 'intro') {
      this.phaseTimer -= dt;
      // Wake up wobble
      const wobble = Math.sin(this.phaseTimer * 8) * 0.1;
      this.bossGroup.scale.set(1.0 + wobble, 1.0 - wobble, 1.0 + wobble);

      if (this.phaseTimer <= 0) {
        this.phase = 'attacking';
        this.phaseTimer = 13.0; // 13 seconds of sweet attacks
        this.isInvulnerable = true;
        this.jellyShieldMesh.visible = true;
        this.dizzyStarsGroup.visible = false;
        soundEngine.playGummyBossRoar();
        this.callbacks.onToast?.('👑🐻 ¡EL GRAN REY OSO DE GOMITA ATACA! ¡500 HP!');
        this.emitState();
      }
      return;
    }

    if (this.phase === 'attacking') {
      this.phaseTimer -= dt;
      this.attackCycleTimer += dt;

      // Face the player
      const toPlayer = playerPos.clone().sub(this.bossPos);
      toPlayer.y = 0;
      if (toPlayer.lengthSq() > 0.01) {
        const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
        this.bossGroup.rotation.y = THREE.MathUtils.lerp(this.bossGroup.rotation.y, targetAngle, dt * 2.5);
      }

      // Attack Sub-cycle every 3.5 seconds
      const cycleTime = this.health < 250 ? 2.8 : 3.6; // Faster during Sugar Rush!
      if (this.attackCycleTimer > cycleTime) {
        this.attackCycleTimer = 0;
        this.attackIndex = (this.attackIndex + 1) % 3;

        if (this.attackIndex === 0) {
          this.executeGummySlamAttack(playerPos);
        } else if (this.attackIndex === 1) {
          this.executeCandyBarrage(playerPos);
        } else {
          this.executeSpawnGummyMinions();
        }
      }

      // If slamming in the air
      if (this.isSlamming) {
        this.updateSlamAnimation(dt, playerPos);
      } else {
        // Idle gelatinous breathing wobble
        const breathe = Math.sin(time * 3) * 0.05;
        this.bossGroup.scale.set(1.0 + breathe, 1.0 - breathe, 1.0 + breathe);
      }

      // Transition to Tired / Sugar Crash Phase
      if (this.phaseTimer <= 0 && !this.isSlamming) {
        this.phase = 'tired';
        this.phaseTimer = 7.5; // 7.5 seconds vulnerable window!
        this.isInvulnerable = false;
        this.jellyShieldMesh.visible = false;
        this.dizzyStarsGroup.visible = true;
        this.bossGroup.position.y = 0;
        this.bossGroup.scale.set(1.15, 0.75, 1.15); // Sitting slouched

        soundEngine.playGummyBounceSound();
        this.callbacks.onToast?.('💫 ¡BAJÓN DE AZÚCAR! ¡El Rey Oso está exhausto y vulnerable! ¡ATACA!');
        this.emitState();
      }
      return;
    }

    if (this.phase === 'tired') {
      this.phaseTimer -= dt;

      // Dazed wobble
      this.bossGroup.rotation.z = Math.sin(time * 4) * 0.08;

      if (this.phaseTimer <= 0) {
        // Recover from Sugar Crash
        this.phase = 'attacking';
        this.phaseTimer = 12.0;
        this.isInvulnerable = true;
        this.jellyShieldMesh.visible = true;
        this.dizzyStarsGroup.visible = false;
        this.bossGroup.scale.set(1, 1, 1);
        this.bossGroup.rotation.z = 0;

        soundEngine.playGummyBossRoar();
        this.callbacks.onToast?.('⚡ ¡El Rey Oso se ha recuperado con más azúcar! ¡Esquiva!');
        this.emitState();
      }
      return;
    }
  }

  // --- 5. ATTACK EXECUTIONS ---

  // 5.1 Salto Sísmico Pegajoso (Gummy Slam)
  private executeGummySlamAttack(playerPos: THREE.Vector3) {
    this.isSlamming = true;
    this.slamPhase = 'rise';
    this.slamJumpY = 0;
    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('💥 ¡EL REY OSO VA A CAER CON UN SALTO SÍSMICO! ¡SALTA!');
  }

  private updateSlamAnimation(dt: number, playerPos: THREE.Vector3) {
    if (this.slamPhase === 'rise') {
      this.slamJumpY += dt * 14.0;
      this.bossGroup.position.y = this.slamJumpY;
      this.bossGroup.scale.set(0.85, 1.3, 0.85); // Stretched

      if (this.slamJumpY >= 6.5) {
        this.slamPhase = 'fall';
      }
    } else {
      this.slamJumpY -= dt * 26.0;
      this.bossGroup.position.y = Math.max(0, this.slamJumpY);

      if (this.slamJumpY <= 0) {
        this.isSlamming = false;
        this.bossGroup.position.y = 0;
        this.bossGroup.scale.set(1.4, 0.5, 1.4); // Squashed impact
        setTimeout(() => this.bossGroup.scale.set(1, 1, 1), 220);

        soundEngine.playGummyBounceSound();

        // Spawn Expanding Jelly Shockwave!
        this.spawnJellyShockwave();
      }
    }
  }

  private spawnJellyShockwave() {
    const ringGeom = new THREE.RingGeometry(0.5, 1.4, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const shockwaveMesh = new THREE.Mesh(ringGeom, ringMat);
    shockwaveMesh.position.copy(this.bossPos);
    shockwaveMesh.position.y = 0.15;
    this.scene.add(shockwaveMesh);

    this.shockwaves.push({
      mesh: shockwaveMesh,
      radius: 1.0,
      maxRadius: this.arenaRadius + 2.0,
      speed: 15.0,
      center: this.bossPos.clone(),
    });
  }

  // 5.2 Lluvia de Caramelos Explosivos (Candy Barrage)
  private executeCandyBarrage(playerPos: THREE.Vector3) {
    this.callbacks.onToast?.('🍬 ¡Lluvia de caramelos efervescentes!');
    soundEngine.playGummyBounceSound();

    // Launch 3 candy bombs toward player
    const count = this.health < 250 ? 5 : 3;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.isDefeated) return;
        this.spawnCandyBomb(playerPos);
      }, i * 350);
    }
  }

  private spawnCandyBomb(playerPos: THREE.Vector3) {
    const bombGroup = new THREE.Group();
    const bombGeom = new THREE.SphereGeometry(0.45, 14, 14);
    const colors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0xa855f7];
    const bombMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.1,
      emissive: 0x444444,
      emissiveIntensity: 0.8,
    });
    const bombMesh = new THREE.Mesh(bombGeom, bombMat);
    bombGroup.add(bombMesh);

    const startPos = this.bossPos.clone().add(new THREE.Vector3(0, 3.2, 0));
    bombGroup.position.copy(startPos);
    this.scene.add(bombGroup);

    // Parabolic velocity towards anticipated player pos
    const target = playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4));
    const toTarget = target.clone().sub(startPos);
    const flightTime = 1.2;
    const vel = new THREE.Vector3(
      toTarget.x / flightTime,
      6.0,
      toTarget.z / flightTime
    );

    this.candyBombs.push({
      mesh: bombGroup,
      pos: startPos,
      vel,
      life: 3.0,
    });
  }

  // 5.3 Invocar Mini-Ositos de Gomita (Gummy Minions)
  private executeSpawnGummyMinions() {
    if (this.miniGummies.length >= 4) return;
    this.callbacks.onToast?.('🐻 ¡El Rey invoca Mini-Ositos de Gomita!');

    const minionColors = ['#ef4444', '#10b981', '#06b6d4', '#f59e0b'];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const spawnPos = this.bossPos.clone().add(new THREE.Vector3(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5));
      this.spawnMiniGummy(spawnPos, minionColors[i % minionColors.length]);
    }
  }

  private spawnMiniGummy(pos: THREE.Vector3, hexColor: string) {
    const miniGroup = new THREE.Group();
    miniGroup.position.copy(pos);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hexColor),
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    // Body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 8, 12), mat);
    body.position.y = 0.5;
    miniGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), mat);
    head.position.y = 0.95;
    miniGroup.add(head);

    // Ears
    const ear1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), mat);
    ear1.position.set(-0.2, 1.15, 0);
    miniGroup.add(ear1);
    const ear2 = ear1.clone();
    ear2.position.set(0.2, 1.15, 0);
    miniGroup.add(ear2);

    this.scene.add(miniGroup);

    this.miniGummies.push({
      mesh: miniGroup,
      pos: pos.clone(),
      color: hexColor,
      hopTimer: Math.random() * 2,
    });
  }

  // --- 6. UPDATE PROJECTILES & MINIONS ---
  private updateProjectilesAndMinions(dt: number, playerPos: THREE.Vector3) {
    // 6.1 Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      const scale = sw.radius;
      sw.mesh.scale.set(scale, scale, scale);

      const ringMat = sw.mesh.material as THREE.MeshBasicMaterial;
      ringMat.opacity = Math.max(0, 1.0 - sw.radius / sw.maxRadius);

      // Collision check with player
      const distToPlayer = Math.hypot(playerPos.x - sw.center.x, playerPos.z - sw.center.z);
      if (Math.abs(distToPlayer - sw.radius) < 1.0 && playerPos.y < 0.9) {
        // Player got hit by shockwave!
        this.callbacks.onPlayerDamage?.(1, '¡Onda de Gelatina del Rey Oso!');
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
        continue;
      }

      if (sw.radius >= sw.maxRadius) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 6.2 Candy Bombs
    for (let i = this.candyBombs.length - 1; i >= 0; i--) {
      const b = this.candyBombs[i];
      b.vel.y -= 9.8 * dt; // Gravity
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
      b.mesh.rotation.x += 4.0 * dt;
      b.mesh.rotation.y += 3.0 * dt;

      // Hit Ground
      if (b.pos.y <= 0.3) {
        soundEngine.playCandyBombExplodeSound();

        // Damage check
        if (b.pos.distanceTo(playerPos) < 2.8 && playerPos.y < 2.0) {
          this.callbacks.onPlayerDamage?.(1, '¡Bomba de Caramelo Explosivo!');
        }

        this.scene.remove(b.mesh);
        this.candyBombs.splice(i, 1);
        continue;
      }

      b.life -= dt;
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.candyBombs.splice(i, 1);
      }
    }

    // 6.3 Mini Gummies
    for (let i = this.miniGummies.length - 1; i >= 0; i--) {
      const mg = this.miniGummies[i];
      mg.hopTimer += dt * 4.5;

      // Move toward player
      const toPlayer = playerPos.clone().sub(mg.pos);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 0.6) {
        toPlayer.normalize();
        mg.pos.addScaledVector(toPlayer, dt * 2.8);
      }

      const hopY = Math.abs(Math.sin(mg.hopTimer)) * 0.45;
      mg.mesh.position.set(mg.pos.x, mg.pos.y + hopY, mg.pos.z);
      mg.mesh.lookAt(playerPos.x, mg.pos.y + hopY, playerPos.z);

      // Hit player
      if (dist < 1.1 && playerPos.y < 1.2) {
        this.callbacks.onPlayerDamage?.(1, '¡Mordisco de Mini-Osito de Gomita!');
        soundEngine.playGummyBounceSound();
        this.scene.remove(mg.mesh);
        this.miniGummies.splice(i, 1);
      }
    }
  }

  // --- 7. SWORD HIT DETECTION & COMBAT ---
  public checkSwordHit(playerPos: THREE.Vector3, lookDir: THREE.Vector3, baseDamage: number): boolean {
    if (this.isDefeated) return false;

    // 1. Check hitting Mini Gummies first
    for (let i = this.miniGummies.length - 1; i >= 0; i--) {
      const mg = this.miniGummies[i];
      const toMini = mg.pos.clone().sub(playerPos);
      if (toMini.length() < 3.2) {
        const dot = lookDir.dot(toMini.clone().normalize());
        if (dot > 0.35) {
          soundEngine.playGummyBounceSound();
          this.scene.remove(mg.mesh);
          this.miniGummies.splice(i, 1);
          this.callbacks.onToast?.('💥 ¡Mini-Osito derrotado! +15 🪙');
          this.callbacks.onAddCoins?.(15);
          return true;
        }
      }
    }

    // 2. Check hitting the Boss
    const toBoss = this.bossPos.clone().add(new THREE.Vector3(0, 2.0, 0)).sub(playerPos);
    const dist = toBoss.length();

    if (dist < 7.5) {
      const dot = lookDir.dot(toBoss.clone().normalize());
      if (dot > 0.25) {
        if (this.isInvulnerable || this.phase !== 'tired') {
          // Deflected by jelly shield!
          soundEngine.playGummyBounceSound();
          this.callbacks.onToast?.('🛡️ ¡El escudo de gelatina es invulnerable! ¡Espera a su bajón de azúcar!');
          return false;
        } else {
          // HIT DURING SUGAR CRASH!
          const actualDamage = baseDamage * 25; // Scales with sword tier
          this.health = Math.max(0, this.health - actualDamage);
          this.hitFlashTimer = 0.25;
          soundEngine.playGummyBounceSound();

          if (this.health <= 0) {
            this.defeatBoss();
          } else {
            this.callbacks.onToast?.(`💥 ¡Corte dulce crítico al Rey Oso! Vida restante: ${this.health}/${this.maxHealth}`);
          }

          this.emitState();
          return true;
        }
      }
    }

    return false;
  }

  // --- 8. DEFEAT & VICTORY ---
  private defeatBoss() {
    this.isDefeated = true;
    this.phase = 'defeated';
    this.isInvulnerable = false;
    this.clearProjectiles();

    soundEngine.playBossVictoryFanfare();

    // Reward: 4,000 Coins!
    this.callbacks.onAddCoins?.(4000);
    this.callbacks.onToast?.('👑🏆 ¡HAS DERROTADO AL GRAN REY OSO DE GOMITA DEL CASTILLO DE CHOCOLATE! +4,000 🪙');
    this.callbacks.onBossDefeated?.();

    // Spawn Chocolate Victory Chest
    this.spawnChocolateVictoryChest();

    // Collapse animation
    this.bossGroup.scale.set(1.4, 0.2, 1.4);
    this.jellyShieldMesh.visible = false;
    this.dizzyStarsGroup.visible = false;
  }

  private spawnChocolateVictoryChest() {
    if (this.victoryChestMesh) return;

    const chestGroup = new THREE.Group();
    chestGroup.position.copy(this.bossPos);
    chestGroup.position.y = 0.4;

    // Dark Chocolate Chest with Golden Caramel Brackets
    const chocoMat = new THREE.MeshStandardMaterial({ color: 0x3e1d09, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    const baseGeom = new THREE.BoxGeometry(2.2, 1.1, 1.4);
    const baseMesh = new THREE.Mesh(baseGeom, chocoMat);
    baseMesh.castShadow = true;
    chestGroup.add(baseMesh);

    const lidGeom = new THREE.CylinderGeometry(0.7, 0.7, 2.2, 16, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeom, goldMat);
    lidMesh.position.y = 0.55;
    chestGroup.add(lidMesh);

    // Floating gem over chest
    const gemGeom = new THREE.OctahedronGeometry(0.5);
    const gemMesh = new THREE.Mesh(gemGeom, new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    gemMesh.position.y = 1.8;
    chestGroup.add(gemMesh);

    this.scene.add(chestGroup);
    this.victoryChestMesh = chestGroup;
  }

  public getColliders(): THREE.Box3[] {
    return this.arenaColliders;
  }

  public getSpawnPos(): THREE.Vector3 {
    return this.arenaCenter.clone().add(new THREE.Vector3(0, 0, -12.0));
  }
}
