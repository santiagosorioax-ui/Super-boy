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

interface MiniGummyBear {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  colorHex: number;
  colorName: string;
  isAlive: boolean;
  hopTimer: number;
  attackCooldown: number;
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

  // Boss Stats (Requested 1000 HP)
  public readonly maxHealth = 1000;
  public health = 1000;
  public isDefeated = false;
  public phase: 'intro' | 'attacking' | 'tired' | 'defeated' = 'intro';
  public phaseTimer = 3.0;
  public isInvulnerable = true;
  private isMelted = false;

  // Arena Coordinates inside Templo Choco
  public readonly arenaCenter: THREE.Vector3;
  public readonly arenaRadius = 17.0;

  // 3D Objects
  private bossGroup = new THREE.Group();
  private bossPos = new THREE.Vector3();
  private normalModelGroup = new THREE.Group();
  private meltedPuddleGroup = new THREE.Group();
  private jellyShieldMesh!: THREE.Mesh;
  private dizzyStarsGroup = new THREE.Group();
  private victoryChestMesh: THREE.Group | null = null;
  private lollipopHammerGroup = new THREE.Group();

  // Attack Timers & State
  private attackCycleTimer = 0;
  private attackIndex = 0;
  private isSlamming = false;
  private slamJumpY = 0;
  private slamPhase: 'rise' | 'fall' = 'rise';
  private isRolling = false;
  private rollDir = new THREE.Vector3();
  private rollTimer = 0;
  private isDivided = false;
  private splitTimer = 0;
  private hitFlashTimer = 0;

  // Entities & Projectiles
  private miniBears: MiniGummyBear[] = [];
  private candyBombs: CandyBomb[] = [];
  private shockwaves: GummyShockwave[] = [];
  private nextMiniId = 1;

  // Colliders for Templo Choco Arena
  private arenaColliders: THREE.Box3[] = [];

  constructor(scene: THREE.Scene, arenaCenter: THREE.Vector3, callbacks: GummyBossCallbacks) {
    this.scene = scene;
    this.arenaCenter = arenaCenter.clone();
    this.bossPos.copy(this.arenaCenter).add(new THREE.Vector3(0, 0, -5.5));
    this.callbacks = callbacks;

    this.buildGummyBossModel();
    this.buildMeltedPuddleModel();
    this.buildArenaColliders();
    this.resetBoss();
  }

  // --- 1. BUILD NORMAL GUMMY BEAR 3D MODEL ---
  private buildGummyBossModel() {
    this.bossGroup.position.copy(this.bossPos);

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

    // Cute Muzzle & Nose
    const muzzleGeom = new THREE.SphereGeometry(0.5, 16, 16);
    muzzleGeom.scale(1.1, 0.8, 0.7);
    const muzzle = new THREE.Mesh(muzzleGeom, candyGoldMat);
    muzzle.position.set(0, -0.15, 0.95);
    headGroup.add(muzzle);

    const noseGeom = new THREE.SphereGeometry(0.18, 12, 12);
    const nose = new THREE.Mesh(noseGeom, new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.1 }));
    nose.position.set(0, 0.05, 1.32);
    headGroup.add(nose);

    // Big Shiny Gummy Eyes
    const eyeGeom = new THREE.SphereGeometry(0.22, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.42, 0.25, 0.95);
    headGroup.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.42, 0.25, 0.95);
    headGroup.add(rightEye);

    // Eye Highlights (Sugar Glaze)
    const hlGeom = new THREE.SphereGeometry(0.07, 8, 8);
    const leftHl = new THREE.Mesh(hlGeom, sugarWhiteMat);
    leftHl.position.set(-0.36, 0.32, 1.14);
    headGroup.add(leftHl);

    const rightHl = leftHl.clone();
    rightHl.position.set(0.48, 0.32, 1.14);
    headGroup.add(rightHl);

    // 1.3 Golden Royal Candy Crown
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

    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 3.8, 12),
      sugarWhiteMat
    );
    this.lollipopHammerGroup.add(handle);

    const discGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 24);
    discGeom.rotateX(Math.PI / 2);
    const discMesh = new THREE.Mesh(
      discGeom,
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
    );
    discMesh.position.set(0, 1.4, 0);
    this.lollipopHammerGroup.add(discMesh);

    const swirlGeom = new THREE.TorusGeometry(0.7, 0.09, 8, 24);
    const swirlMesh = new THREE.Mesh(swirlGeom, sugarWhiteMat);
    swirlMesh.position.set(0, 1.4, 0.26);
    this.lollipopHammerGroup.add(swirlMesh);

    bodyGroup.add(this.lollipopHammerGroup);

    // 1.6 Stubby Gummy Feet
    const legGeom = new THREE.CapsuleGeometry(0.65, 0.9, 12, 16);
    const leftLeg = new THREE.Mesh(legGeom, rubyGummyMat);
    leftLeg.position.set(-0.9, 0.6, 0.1);
    leftLeg.castShadow = true;
    bodyGroup.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.set(0.9, 0.6, 0.1);
    rightLeg.castShadow = true;
    bodyGroup.add(rightLeg);

    this.normalModelGroup.add(bodyGroup);

    // 1.7 Translucent Hardened Sugar Shield
    const shieldGeom = new THREE.SphereGeometry(3.2, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xef4444,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      wireframe: false,
    });
    this.jellyShieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.jellyShieldMesh.position.set(0, 2.2, 0);
    this.normalModelGroup.add(this.jellyShieldMesh);

    this.bossGroup.add(this.normalModelGroup);

    // Dizzy Stars around Head (When Melted or Stunned)
    this.dizzyStarsGroup.position.set(0, 4.4, 0);
    for (let s = 0; s < 4; s++) {
      const starGeom = new THREE.OctahedronGeometry(0.28);
      const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const star = new THREE.Mesh(starGeom, starMat);
      const angle = (s / 4) * Math.PI * 2;
      star.position.set(Math.cos(angle) * 1.5, 0, Math.sin(angle) * 1.5);
      this.dizzyStarsGroup.add(star);
    }
    this.dizzyStarsGroup.visible = false;
    this.bossGroup.add(this.dizzyStarsGroup);

    this.scene.add(this.bossGroup);
  }

  // --- 2. BUILD MELTED PUDDLE 3D MODEL (When Boss Melts) ---
  private buildMeltedPuddleModel() {
    this.meltedPuddleGroup.position.set(0, 0.05, 0);

    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.9,
    });

    // Melted Jelly Pool Disc
    const poolGeom = new THREE.CylinderGeometry(3.4, 3.8, 0.3, 32);
    const poolMesh = new THREE.Mesh(poolGeom, puddleMat);
    poolMesh.position.y = 0.15;
    poolMesh.receiveShadow = true;
    this.meltedPuddleGroup.add(poolMesh);

    // Dripping Bubbles in the puddle
    for (let b = 0; b < 6; b++) {
      const bubbleGeom = new THREE.SphereGeometry(0.45, 12, 12);
      bubbleGeom.scale(1.0, 0.6, 1.0);
      const bubble = new THREE.Mesh(bubbleGeom, puddleMat);
      const bAngle = (b / 6) * Math.PI * 2;
      const bRad = 1.2 + (b % 3) * 0.7;
      bubble.position.set(Math.cos(bAngle) * bRad, 0.25, Math.sin(bAngle) * bRad);
      this.meltedPuddleGroup.add(bubble);
    }

    // Melty Bear Face on the floor (flat eyes and ears)
    const flatEarGeom = new THREE.CylinderGeometry(0.7, 0.7, 0.15, 16);
    const flatLeftEar = new THREE.Mesh(flatEarGeom, puddleMat);
    flatLeftEar.position.set(-1.8, 0.2, -1.2);
    this.meltedPuddleGroup.add(flatLeftEar);

    const flatRightEar = flatLeftEar.clone();
    flatRightEar.position.set(1.8, 0.2, -1.2);
    this.meltedPuddleGroup.add(flatRightEar);

    // Swirling Dizzy Spiral Eyes in puddle
    for (let side of [-0.9, 0.9]) {
      const spiralRingGeom = new THREE.TorusGeometry(0.35, 0.08, 8, 16);
      spiralRingGeom.rotateX(Math.PI / 2);
      const spiralMesh = new THREE.Mesh(
        spiralRingGeom,
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      spiralMesh.position.set(side, 0.32, 0.2);
      this.meltedPuddleGroup.add(spiralMesh);
    }

    // Melted Lollipop Hammer lying in the puddle
    const flatHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    flatHandle.rotation.z = Math.PI / 2;
    flatHandle.position.set(2.0, 0.2, 1.0);
    this.meltedPuddleGroup.add(flatHandle);

    const flatDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
    );
    flatDisc.position.set(3.6, 0.22, 1.0);
    this.meltedPuddleGroup.add(flatDisc);

    this.meltedPuddleGroup.visible = false;
    this.bossGroup.add(this.meltedPuddleGroup);
  }

  // --- 3. ARENA COLLIDERS FOR TEMPLO CHOCO ---
  private buildArenaColliders() {
    this.arenaColliders = [];
    const r = this.arenaRadius;
    const cx = this.arenaCenter.x;
    const cz = this.arenaCenter.z;
    const wallHeight = 10.0;

    // 4 enclosing boundaries
    this.arenaColliders.push(
      new THREE.Box3(
        new THREE.Vector3(cx - r - 2, 0, cz - r - 2),
        new THREE.Vector3(cx - r, wallHeight, cz + r + 2)
      ),
      new THREE.Box3(
        new THREE.Vector3(cx + r, 0, cz - r - 2),
        new THREE.Vector3(cx + r + 2, wallHeight, cz + r + 2)
      ),
      new THREE.Box3(
        new THREE.Vector3(cx - r - 2, 0, cz - r - 2),
        new THREE.Vector3(cx + r + 2, wallHeight, cz - r)
      ),
      new THREE.Box3(
        new THREE.Vector3(cx - r - 2, 0, cz + r),
        new THREE.Vector3(cx + r + 2, wallHeight, cz + r + 2)
      )
    );
  }

  public resetBoss() {
    this.health = this.maxHealth;
    this.isDefeated = false;
    this.phase = 'intro';
    this.phaseTimer = 3.0;
    this.isInvulnerable = true;
    this.isMelted = false;
    this.attackCycleTimer = 0;
    this.attackIndex = 0;
    this.isSlamming = false;
    this.isRolling = false;
    this.isDivided = false;

    this.bossPos.copy(this.arenaCenter).add(new THREE.Vector3(0, 0, -5.5));
    this.bossGroup.position.copy(this.bossPos);
    this.bossGroup.scale.set(1, 1, 1);
    this.bossGroup.rotation.set(0, 0, 0);

    this.normalModelGroup.visible = true;
    this.meltedPuddleGroup.visible = false;
    this.jellyShieldMesh.visible = false;
    this.dizzyStarsGroup.visible = false;

    this.clearProjectilesAndMinis();

    if (this.victoryChestMesh) {
      this.scene.remove(this.victoryChestMesh);
      this.victoryChestMesh = null;
    }

    this.emitState();
  }

  private clearProjectilesAndMinis() {
    this.miniBears.forEach((m) => this.scene.remove(m.mesh));
    this.miniBears = [];

    this.candyBombs.forEach((b) => this.scene.remove(b.mesh));
    this.candyBombs = [];

    this.shockwaves.forEach((s) => this.scene.remove(s.mesh));
    this.shockwaves = [];
  }

  private emitState() {
    const statusMessage = this.isDefeated
      ? '¡REY OSO DERROTADO!'
      : this.isMelted
      ? `¡OSO DERRETIDO! (¡ATÁCALO AHORA! ${Math.ceil(this.phaseTimer)}s)`
      : this.isDivided
      ? '¡DIVIDIDO EN MINIS! (¡SOBREVIVE O DESTRÚYELOS!)'
      : this.phase === 'intro'
      ? '¡EL GRAN OSO DE GOMITA DESPIERTA!'
      : this.health < 400
      ? '¡FURIA DE AZÚCAR! (ARMADURA DURA)'
      : 'INVULNERABLE (ESPERA A QUE SE DERRITA)';

    this.callbacks.onBossStateUpdate?.({
      active: true,
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.isMelted ? 'tired' : this.phase,
      tiredTimeRemaining: this.isMelted ? Math.max(0, this.phaseTimer) : 0,
      isInvulnerable: this.isInvulnerable,
      isTired: this.isMelted,
      statusMessage,
      bossName: 'Gran Rey Oso de Gomita',
      bossIcon: '🧸🍬',
      bossThemeColor: '#ef4444',
      arenaName: 'Templo Choco',
    });
  }

  // --- 4. UPDATE LOOP ---
  public update(dt: number, playerPos: THREE.Vector3, currentDimension: string) {
    // Only active when player is in Templo Choco!
    if (currentDimension !== 'choco_temple') {
      return;
    }

    const distToArena = playerPos.distanceTo(this.arenaCenter);
    const isPlayerInArena = distToArena < this.arenaRadius + 6.0;

    if (!isPlayerInArena && !this.isDefeated) {
      return;
    }

    const time = performance.now() * 0.001;

    // Animate Shield & Dizzy Stars
    if (this.jellyShieldMesh.visible) {
      this.jellyShieldMesh.rotation.y += 1.2 * dt;
      this.jellyShieldMesh.rotation.x = Math.sin(time * 2.5) * 0.2;
    }
    if (this.dizzyStarsGroup.visible) {
      this.dizzyStarsGroup.rotation.y += 4.0 * dt;
    }

    // Flash when damaged
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.bossGroup.position.x = this.bossPos.x + (Math.random() - 0.5) * 0.25;
    } else {
      this.bossGroup.position.x = this.bossPos.x;
    }

    // Update active projectiles, shockwaves and mini bears
    this.updateProjectilesAndMinis(dt, playerPos);

    if (this.isDefeated) {
      return;
    }

    // --- STATE MACHINE ---
    if (this.phase === 'intro') {
      this.phaseTimer -= dt;
      const wobble = Math.sin(this.phaseTimer * 10) * 0.12;
      this.bossGroup.scale.set(1.0 + wobble, 1.0 - wobble, 1.0 + wobble);

      if (this.phaseTimer <= 0) {
        this.phase = 'attacking';
        this.phaseTimer = 16.0;
        this.isInvulnerable = true;
        this.jellyShieldMesh.visible = true;
        this.dizzyStarsGroup.visible = false;
        soundEngine.playGummyBossRoar();
        this.callbacks.onToast?.('🧸👑 ¡EL GRAN REY OSO DE GOMITA ENFURECE! ¡1000 HP!');
        this.emitState();
      }
      return;
    }

    // --- ATTACKING PHASE ---
    if (this.phase === 'attacking') {
      this.phaseTimer -= dt;
      this.attackCycleTimer += dt;

      // Rotate to face player if not rolling or divided
      if (!this.isRolling && !this.isDivided) {
        const toPlayer = playerPos.clone().sub(this.bossPos);
        toPlayer.y = 0;
        if (toPlayer.lengthSq() > 0.01) {
          const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
          this.bossGroup.rotation.y = THREE.MathUtils.lerp(this.bossGroup.rotation.y, targetAngle, dt * 3.0);
        }
      }

      // Attack Sub-cycle every 3.8s (or 2.8s when enraged)
      const cycleTime = this.health < 400 ? 2.8 : 3.8;
      if (this.attackCycleTimer > cycleTime && !this.isSlamming && !this.isRolling && !this.isDivided) {
        this.attackCycleTimer = 0;
        this.attackIndex = (this.attackIndex + 1) % 4;

        if (this.attackIndex === 0) {
          this.executeGummySlamAttack(playerPos);
        } else if (this.attackIndex === 1) {
          this.executeCandyBarrage(playerPos);
        } else if (this.attackIndex === 2) {
          this.executeGummyRoll(playerPos);
        } else {
          // Division Attack!
          this.executeSplitMinis();
        }
      }

      // Slam animation
      if (this.isSlamming) {
        this.updateSlamAnimation(dt, playerPos);
      } else if (this.isRolling) {
        this.updateRollAnimation(dt, playerPos);
      } else if (this.isDivided) {
        this.updateDivisionPhase(dt, playerPos);
      } else {
        // Idle breathing wobble
        const breathe = Math.sin(time * 3.5) * 0.06;
        this.bossGroup.scale.set(1.0 + breathe, 1.0 - breathe, 1.0 + breathe);
      }

      // Transition to Melted State after attack period expires
      if (this.phaseTimer <= 0 && !this.isSlamming && !this.isRolling && !this.isDivided) {
        this.enterMeltedState(7.0);
      }
      return;
    }

    // --- MELTED / TIRED PHASE (VULNERABLE!) ---
    if (this.phase === 'tired' || this.isMelted) {
      this.phaseTimer -= dt;

      // Melted puddle bubbling effect
      const bubbleWobble = Math.sin(time * 6) * 0.05;
      this.meltedPuddleGroup.scale.set(1.0 + bubbleWobble, 1.0, 1.0 + bubbleWobble);

      if (this.phaseTimer <= 0) {
        // Solidify back to full bear!
        this.exitMeltedState();
      }
    }
  }

  // --- 5. MELTED PHASE LOGIC (Key Request: Only vulnerable when melted) ---
  public enterMeltedState(duration = 7.0) {
    this.phase = 'tired';
    this.isMelted = true;
    this.phaseTimer = duration;
    this.isInvulnerable = false; // VULNERABLE!
    this.isDivided = false;
    this.isRolling = false;
    this.isSlamming = false;

    // Switch 3D models: Hide normal bear, show bubbling melted puddle
    this.normalModelGroup.visible = false;
    this.meltedPuddleGroup.visible = true;
    this.jellyShieldMesh.visible = false;
    this.dizzyStarsGroup.visible = true;
    this.dizzyStarsGroup.position.set(0, 1.2, 0);

    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('🫠 ¡EL OSO SE HA DERRETIDO! ¡ES TOTALMENTE VULNERABLE, ATÁCALO AHORA!');
    this.emitState();
  }

  private exitMeltedState() {
    this.phase = 'attacking';
    this.isMelted = false;
    this.phaseTimer = 14.0;
    this.isInvulnerable = true; // Hardened candy shield is back!

    // Restore normal model
    this.normalModelGroup.visible = true;
    this.meltedPuddleGroup.visible = false;
    this.jellyShieldMesh.visible = true;
    this.dizzyStarsGroup.visible = false;
    this.bossGroup.scale.set(1, 1, 1);
    this.bossGroup.position.y = 0;

    soundEngine.playGummyBossRoar();
    this.callbacks.onToast?.('🍬 ¡El Oso Gomita se ha solidificado de nuevo! ¡Armadura de caramelo activa!');
    this.emitState();
  }

  // --- 6. HABILIDAD: DIVISIÓN EN VARIOS OSOS DE GOMITA ---
  private executeSplitMinis() {
    this.isDivided = true;
    this.splitTimer = 8.0;

    // Hide the main boss model during division
    this.normalModelGroup.visible = false;
    this.jellyShieldMesh.visible = false;

    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('🧸✨ ¡EL OSO GOMITA SE HA DIVIDIDO EN 5 MINIS! ¡DEFIÉNDETE!');

    // Spawn 5 colorful Mini Gummy Bears
    const colors = [
      { hex: 0xef4444, name: 'Rojo Fresa' },
      { hex: 0x10b981, name: 'Verde Manzana' },
      { hex: 0x3b82f6, name: 'Azul Mora' },
      { hex: 0xfacc15, name: 'Amarillo Limón' },
      { hex: 0xf97316, name: 'Naranja Cítrico' },
    ];

    colors.forEach((c, idx) => {
      const angle = (idx / colors.length) * Math.PI * 2;
      const spawnOffset = new THREE.Vector3(Math.cos(angle) * 3.5, 0, Math.sin(angle) * 3.5);
      const spawnPos = this.bossPos.clone().add(spawnOffset);

      const miniGroup = this.buildMiniBearMesh(c.hex);
      miniGroup.position.copy(spawnPos);
      this.scene.add(miniGroup);

      this.miniBears.push({
        id: this.nextMiniId++,
        mesh: miniGroup,
        pos: spawnPos,
        vel: new THREE.Vector3(),
        colorHex: c.hex,
        colorName: c.name,
        isAlive: true,
        hopTimer: Math.random() * 2,
        attackCooldown: 0.5,
      });
    });

    this.emitState();
  }

  private buildMiniBearMesh(colorHex: number): THREE.Group {
    const group = new THREE.Group();

    const miniMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });

    // Body
    const bodyGeom = new THREE.SphereGeometry(0.55, 14, 14);
    bodyGeom.scale(1.0, 1.25, 0.9);
    const body = new THREE.Mesh(bodyGeom, miniMat);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeom = new THREE.SphereGeometry(0.42, 14, 14);
    const head = new THREE.Mesh(headGeom, miniMat);
    head.position.set(0, 1.25, 0.05);
    head.castShadow = true;
    group.add(head);

    // Round Ears
    for (let side of [-0.35, 0.35]) {
      const earGeom = new THREE.SphereGeometry(0.2, 10, 10);
      const ear = new THREE.Mesh(earGeom, miniMat);
      ear.position.set(side, 1.55, 0.05);
      group.add(ear);
    }

    // Little Eyes
    for (let side of [-0.15, 0.15]) {
      const eyeGeom = new THREE.SphereGeometry(0.07, 8, 8);
      const eye = new THREE.Mesh(eyeGeom, new THREE.MeshBasicMaterial({ color: 0x000000 }));
      eye.position.set(side, 1.3, 0.38);
      group.add(eye);
    }

    // Little Legs
    for (let side of [-0.28, 0.28]) {
      const legGeom = new THREE.SphereGeometry(0.22, 8, 8);
      const leg = new THREE.Mesh(legGeom, miniMat);
      leg.position.set(side, 0.22, 0);
      group.add(leg);
    }

    return group;
  }

  private updateDivisionPhase(dt: number, playerPos: THREE.Vector3) {
    this.splitTimer -= dt;

    // Check if all mini bears were eliminated or timer expired
    const aliveMinis = this.miniBears.filter((m) => m.isAlive);

    if (this.splitTimer <= 0 || aliveMinis.length === 0) {
      // Reassemble! Mini bears run to center and fuse into Big Bear
      this.reuniteBears();
    }
  }

  private reuniteBears() {
    this.isDivided = false;
    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('🌟 ¡Los mini osos se han reunido y fusionado! ¡El Oso se sobrecalentó y se derrite!');

    // Remove mini meshes
    this.miniBears.forEach((m) => this.scene.remove(m.mesh));
    this.miniBears = [];

    // Right after reuniting, the huge sugar surge makes the Boss MELT!
    this.bossPos.copy(this.arenaCenter);
    this.bossGroup.position.copy(this.bossPos);
    this.enterMeltedState(7.5);
  }

  // --- 7. MORE BOSS ABILITIES ---

  // 7.1 Gummy Mega Slam (Salto Sísmico)
  private executeGummySlamAttack(playerPos: THREE.Vector3) {
    this.isSlamming = true;
    this.slamPhase = 'rise';
    this.slamJumpY = 0;
    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('💥 ¡EL GRAN OSO SALTA AL CIELO! ¡PREPÁRATE PARA SALTAR!');
  }

  private updateSlamAnimation(dt: number, playerPos: THREE.Vector3) {
    if (this.slamPhase === 'rise') {
      this.slamJumpY += dt * 16.0;
      this.bossGroup.position.y = this.slamJumpY;
      this.bossGroup.scale.set(0.85, 1.35, 0.85);

      if (this.slamJumpY >= 8.0) {
        this.slamPhase = 'fall';
      }
    } else {
      this.slamJumpY -= dt * 28.0;
      this.bossGroup.position.y = Math.max(0, this.slamJumpY);

      if (this.slamJumpY <= 0) {
        this.isSlamming = false;
        this.bossGroup.position.y = 0;
        this.bossGroup.scale.set(1.5, 0.45, 1.5);
        setTimeout(() => this.bossGroup.scale.set(1, 1, 1), 250);

        soundEngine.playGummyBounceSound();
        this.spawnJellyShockwave();
      }
    }
  }

  private spawnJellyShockwave() {
    const ringGeom = new THREE.RingGeometry(0.5, 1.5, 32);
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
      speed: 16.0,
      center: this.bossPos.clone(),
    });
  }

  // 7.2 Lluvia de Bombas de Caramelo (Sugar Bomb Barrage)
  private executeCandyBarrage(playerPos: THREE.Vector3) {
    this.callbacks.onToast?.('🍬 ¡Lluvia de bombas de caramelo efervescentes!');
    soundEngine.playGummyBounceSound();

    const count = this.health < 400 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.isDefeated) return;
        this.spawnCandyBomb(playerPos);
      }, i * 320);
    }
  }

  private spawnCandyBomb(playerPos: THREE.Vector3) {
    const bombGroup = new THREE.Group();
    const bombGeom = new THREE.SphereGeometry(0.48, 14, 14);
    const colors = [0xef4444, 0x10b981, 0x3b82f6, 0xf59e0b, 0xa855f7];
    const bombMat = new THREE.MeshStandardMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      roughness: 0.1,
      emissive: 0x444444,
      emissiveIntensity: 0.8,
    });
    const bombMesh = new THREE.Mesh(bombGeom, bombMat);
    bombGroup.add(bombMesh);

    // Fuse on top
    const fuseGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
    const fuseMesh = new THREE.Mesh(fuseGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    fuseMesh.position.y = 0.55;
    bombGroup.add(fuseMesh);

    bombGroup.position.copy(this.bossPos);
    bombGroup.position.y = 3.5;
    this.scene.add(bombGroup);

    // Parabolic velocity towards player with spread
    const target = playerPos.clone().add(
      new THREE.Vector3((Math.random() - 0.5) * 4.0, 0, (Math.random() - 0.5) * 4.0)
    );
    const toTarget = target.clone().sub(bombGroup.position);
    const vel = toTarget.clone().normalize().multiplyScalar(13.0);
    vel.y = 8.5;

    this.candyBombs.push({
      mesh: bombGroup,
      pos: bombGroup.position,
      vel,
      life: 3.0,
    });
  }

  // 7.3 Embestida Rodante (Gummy Roll)
  private executeGummyRoll(playerPos: THREE.Vector3) {
    this.isRolling = true;
    this.rollTimer = 2.8;

    const toPlayer = playerPos.clone().sub(this.bossPos);
    toPlayer.y = 0;
    this.rollDir.copy(toPlayer.normalize());

    soundEngine.playGummyBounceSound();
    this.callbacks.onToast?.('🌀 ¡EL OSO GOMITA RUEDA A TODA VELOCIDAD! ¡APÁRTATE!');
    this.bossGroup.scale.set(1.1, 1.1, 1.1);
  }

  private updateRollAnimation(dt: number, playerPos: THREE.Vector3) {
    this.rollTimer -= dt;

    // Roll forward
    const rollSpeed = 16.0;
    this.bossPos.addScaledVector(this.rollDir, rollSpeed * dt);
    this.bossGroup.position.copy(this.bossPos);

    // Fast tumbling rotation
    this.bossGroup.rotation.x += 12.0 * dt;

    // Check collision with player
    const dist = this.bossPos.distanceTo(playerPos);
    if (dist < 3.2) {
      this.callbacks.onPlayerDamage?.(15, '¡Aplastado por la embestida del Oso Gomita!');
      soundEngine.playGummyBounceSound();
    }

    // Clamp to arena bounds and bounce
    const distFromCenter = Math.hypot(
      this.bossPos.x - this.arenaCenter.x,
      this.bossPos.z - this.arenaCenter.z
    );
    if (distFromCenter > this.arenaRadius - 2.5) {
      this.rollDir.negate();
      soundEngine.playGummyBounceSound();
    }

    if (this.rollTimer <= 0) {
      this.isRolling = false;
      this.bossGroup.rotation.set(0, 0, 0);
      this.bossGroup.scale.set(1, 1, 1);
    }
  }

  // --- 8. PROJECTILE & MINIS UPDATE LOOP ---
  private updateProjectilesAndMinis(dt: number, playerPos: THREE.Vector3) {
    // 8.1 Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;
      sw.mesh.scale.set(sw.radius, sw.radius, 1);

      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - sw.radius / sw.maxRadius);

      // Check damage to player if player on floor
      const dist = Math.hypot(playerPos.x - sw.center.x, playerPos.z - sw.center.z);
      if (Math.abs(dist - sw.radius) < 1.4 && playerPos.y < 1.2) {
        this.callbacks.onPlayerDamage?.(12, '¡Onda de choque de caramelo caliente!');
      }

      if (sw.radius >= sw.maxRadius) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 8.2 Candy Bombs
    for (let i = this.candyBombs.length - 1; i >= 0; i--) {
      const b = this.candyBombs[i];
      b.vel.y -= 19.8 * dt; // Gravity
      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);
      b.mesh.rotation.x += 4.0 * dt;

      // Explode on ground
      if (b.pos.y <= 0.4 || b.life <= 0) {
        const dist = b.pos.distanceTo(playerPos);
        if (dist < 4.5) {
          this.callbacks.onPlayerDamage?.(10, '¡Explosión de bomba de caramelo!');
        }
        soundEngine.playGummyBounceSound();
        this.scene.remove(b.mesh);
        this.candyBombs.splice(i, 1);
      }
    }

    // 8.3 Mini Gummy Bears (Division mode)
    for (let i = this.miniBears.length - 1; i >= 0; i--) {
      const mini = this.miniBears[i];
      if (!mini.isAlive) continue;

      mini.hopTimer += dt * 8.0;
      mini.attackCooldown -= dt;

      // Chase player
      const toPlayer = playerPos.clone().sub(mini.pos);
      toPlayer.y = 0;
      const dist = toPlayer.length();

      if (dist > 1.2) {
        toPlayer.normalize();
        const miniSpeed = 7.5;
        mini.pos.addScaledVector(toPlayer, miniSpeed * dt);
        mini.mesh.position.copy(mini.pos);
        mini.mesh.position.y = Math.abs(Math.sin(mini.hopTimer)) * 0.55;

        // Face player
        const angle = Math.atan2(toPlayer.x, toPlayer.z);
        mini.mesh.rotation.y = angle;
      } else {
        // Nibble player
        if (mini.attackCooldown <= 0) {
          mini.attackCooldown = 1.2;
          this.callbacks.onPlayerDamage?.(4, `¡Mordisco de mini oso de gomita (${mini.colorName})!`);
          soundEngine.playGummyBounceSound();
        }
      }
    }
  }

  // --- 9. SWORD HIT & DAMAGE RESOLUTION ---
  public checkSwordHit(playerPos: THREE.Vector3, lookDir: THREE.Vector3, baseDamage: number): boolean {
    return this.hitWithSword(playerPos, lookDir, baseDamage);
  }

  public hitWithSword(playerPos: THREE.Vector3, lookDir: THREE.Vector3, baseDamage: number): boolean {
    if (this.isDefeated) return false;

    // 1. Check hitting active Mini Gummy Bears
    if (this.isDivided && this.miniBears.length > 0) {
      for (let i = 0; i < this.miniBears.length; i++) {
        const mini = this.miniBears[i];
        if (!mini.isAlive) continue;

        const toMini = mini.pos.clone().sub(playerPos);
        const dist = toMini.length();
        if (dist < 4.0) {
          const dot = lookDir.dot(toMini.clone().normalize());
          if (dot > 0.3) {
            // Hit mini bear!
            mini.isAlive = false;
            this.scene.remove(mini.mesh);
            soundEngine.playGummyBounceSound();
            this.callbacks.onToast?.(`💥 ¡Destruiste al Mini Oso (${mini.colorName})! +25 🪙`);
            this.callbacks.onAddCoins?.(25);
            return true;
          }
        }
      }
    }

    // 2. Check hitting the Boss
    const toBoss = this.bossPos.clone().add(new THREE.Vector3(0, 1.5, 0)).sub(playerPos);
    const dist = toBoss.length();

    if (dist < 7.5) {
      const dot = lookDir.dot(toBoss.clone().normalize());
      if (dot > 0.2) {
        // MUST BE MELTED TO TAKE DAMAGE!
        if (this.isInvulnerable || (!this.isMelted && this.phase !== 'tired')) {
          soundEngine.playGummyBounceSound();
          this.callbacks.onToast?.('🛡️ ¡Armadura de caramelo duro! ¡Espera a que el oso se derrita para pegarle!');
          return false;
        } else {
          // HIT WHILE MELTED!
          const actualDamage = baseDamage * 25; // Massive damage opportunity
          this.health = Math.max(0, this.health - actualDamage);
          this.hitFlashTimer = 0.25;
          soundEngine.playGummyBounceSound();

          if (this.health <= 0) {
            this.defeatBoss();
          } else {
            this.callbacks.onToast?.(`💥 ¡Golpe crítico a la gomita derretida! Vida: ${this.health}/${this.maxHealth}`);
          }

          this.emitState();
          return true;
        }
      }
    }

    return false;
  }

  // --- 10. DEFEAT & VICTORY ---
  private defeatBoss() {
    this.isDefeated = true;
    this.phase = 'defeated';
    this.isInvulnerable = false;
    this.clearProjectilesAndMinis();

    soundEngine.playBossVictoryFanfare();

    // Reward: 5,000 Coins!
    this.callbacks.onAddCoins?.(5000);
    this.callbacks.onToast?.('🧸🏆 ¡HAS DERROTADO AL GRAN REY OSO DE GOMITA EN EL TEMPLO CHOCO! +5,000 🪙');
    this.callbacks.onBossDefeated?.();

    // Spawn Chocolate Victory Chest
    this.spawnChocolateVictoryChest();

    this.normalModelGroup.visible = false;
    this.meltedPuddleGroup.visible = true;
    this.jellyShieldMesh.visible = false;
    this.dizzyStarsGroup.visible = false;
  }

  private spawnChocolateVictoryChest() {
    if (this.victoryChestMesh) return;

    const chestGroup = new THREE.Group();
    chestGroup.position.copy(this.bossPos);
    chestGroup.position.y = 0.4;

    const chocoMat = new THREE.MeshStandardMaterial({ color: 0x3e1d09, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    const baseGeom = new THREE.BoxGeometry(2.4, 1.2, 1.5);
    const baseMesh = new THREE.Mesh(baseGeom, chocoMat);
    baseMesh.castShadow = true;
    chestGroup.add(baseMesh);

    const lidGeom = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 16, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeom, goldMat);
    lidMesh.position.y = 0.6;
    chestGroup.add(lidMesh);

    const gemGeom = new THREE.OctahedronGeometry(0.55);
    const gemMesh = new THREE.Mesh(gemGeom, new THREE.MeshBasicMaterial({ color: 0xec4899 }));
    gemMesh.position.y = 2.0;
    chestGroup.add(gemMesh);

    this.scene.add(chestGroup);
    this.victoryChestMesh = chestGroup;
  }

  public getColliders(): THREE.Box3[] {
    return this.arenaColliders;
  }

  public getSpawnPos(): THREE.Vector3 {
    return this.arenaCenter.clone().add(new THREE.Vector3(0, 0, 11.0));
  }
}
