import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import { MayanBossState } from '../types';
import { MayanTempleInteriorBuilder, MayanTempleInteriorElements } from './MayanTempleInteriorBuilder';

export interface MiniZombieEntity {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  health: number;
  isDead: boolean;
  walkCycle: number;
}

export interface BossFireball {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  age: number;
  maxAge: number;
  light: THREE.PointLight;
}

export interface ShockwaveRing {
  mesh: THREE.Mesh;
  radius: number;
  maxRadius: number;
  speed: number;
  center: THREE.Vector3;
  hasHitPlayer: boolean;
}

export class MayanBossSystem {
  private scene: THREE.Scene;
  private originX = -700;
  private originZ = -700;
  private arenaGroup = new THREE.Group();
  private interiorElements: MayanTempleInteriorElements | null = null;

  // Boss Model
  private bossGroup = new THREE.Group();
  private bossLimbs: {
    head: THREE.Group;
    torso: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    shieldMesh: THREE.Mesh;
    auraMesh: THREE.Mesh;
  } | null = null;

  // Boss Stats & State
  private maxHealth = 300;
  private health = 300;
  private phase: MayanBossState['phase'] = 'intro';
  private phaseTimer = 3.0; // 3s intro
  private tiredDuration = 6.5;
  private attackDuration = 13.0;
  private attackCycleTimer = 2.0;
  private attackIndex = 0;
  private isInvulnerable = true;
  private hitFlashTimer = 0;
  private isDefeated = false;
  private bossWalkCycle = 0;
  private bossPos = new THREE.Vector3(-700, 0, -706);

  // Attack Entities
  private miniZombies: MiniZombieEntity[] = [];
  private fireballs: BossFireball[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private nextMiniId = 1;

  // Colliders for Arena
  private colliders: THREE.Box3[] = [];
  private platforms: { box: THREE.Box3; topY: number }[] = [];

  // Victory Chest & Return Portal
  private exitPortalMesh: THREE.Group | null = null;
  private exitPortalRing: THREE.Mesh | null = null;
  private victoryChestMesh: THREE.Group | null = null;
  private hasSpawnedVictoryReward = false;

  // Callbacks
  private onBossStateUpdate?: (state: MayanBossState) => void;
  private onAddCoins?: (amount: number) => void;
  private onPlayerHurt?: (message: string) => void;
  private onToast?: (message: string) => void;

  constructor(
    scene: THREE.Scene,
    callbacks: {
      onBossStateUpdate?: (state: MayanBossState) => void;
      onAddCoins?: (amount: number) => void;
      onPlayerHurt?: (message: string) => void;
      onToast?: (message: string) => void;
    }
  ) {
    this.scene = scene;
    this.onBossStateUpdate = callbacks.onBossStateUpdate;
    this.onAddCoins = callbacks.onAddCoins;
    this.onPlayerHurt = callbacks.onPlayerHurt;
    this.onToast = callbacks.onToast;

    this.buildArena();
    this.buildBoss();
    this.resetBoss();
  }

  public getColliders(): THREE.Box3[] {
    return this.colliders;
  }

  public getPlatforms(): { box: THREE.Box3; topY: number }[] {
    return this.platforms;
  }

  public getSpawnPos(): THREE.Vector3 {
    return this.interiorElements
      ? this.interiorElements.spawnPos.clone()
      : new THREE.Vector3(this.originX, 1.2, this.originZ + 22.0);
  }

  public getExitPortalPos(): THREE.Vector3 {
    return this.interiorElements
      ? this.interiorElements.exitPortalPos.clone()
      : new THREE.Vector3(this.originX, 1.2, this.originZ + 27.5);
  }

  // --- 1. BUILD DEDICATED MAYAN TEMPLE INTERIOR STRUCTURE ---
  private buildArena() {
    this.interiorElements = MayanTempleInteriorBuilder.build(
      this.scene,
      this.originX,
      0,
      this.originZ
    );
    this.arenaGroup = this.interiorElements.group;
    this.colliders = this.interiorElements.colliders;
    this.platforms = this.interiorElements.platforms;
    this.exitPortalRing = this.interiorElements.exitPortalRing;
    this.bossPos.copy(this.interiorElements.bossStartPos);
  }

  // --- 2. BUILD GIANT MAYAN ZOMBIE BOSS ---
  private buildBoss() {
    this.bossGroup = new THREE.Group();
    this.bossGroup.position.copy(this.bossPos);
    this.bossGroup.scale.set(3.6, 3.6, 3.6); // Colossal 3.6x Mayan Zombie King!

    // Boss Materials
    const bossSkinMat = new THREE.MeshStandardMaterial({
      color: 0x3f6212, // Dark ancient decayed zombie green
      roughness: 0.8,
      metalness: 0.1,
    });
    const darkSkinMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.9,
    });
    const goldArmorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.25,
    });
    const jadeOrnamentMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x047857,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    });
    const featherQuetzalMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.5,
    });
    const featherGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
    });
    const eyeGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const loinclothMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Crimson royal Mayan cloth
      roughness: 0.7,
    });

    // 1. Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.85, 0);

    const chestGeom = new THREE.BoxGeometry(0.65, 0.75, 0.42);
    const chest = new THREE.Mesh(chestGeom, darkSkinMat);
    chest.position.set(0, 0.32, 0);
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Golden Mayan Breastplate Pectoral
    const pectoralGeom = new THREE.BoxGeometry(0.55, 0.5, 0.08);
    const pectoral = new THREE.Mesh(pectoralGeom, goldArmorMat);
    pectoral.position.set(0, 0.36, 0.22);
    torsoGroup.add(pectoral);

    // Central Jade Gem in Breastplate
    const gemGeom = new THREE.OctahedronGeometry(0.14, 0);
    const gem = new THREE.Mesh(gemGeom, jadeOrnamentMat);
    gem.position.set(0, 0.36, 0.28);
    torsoGroup.add(gem);

    // Royal Crimson Loincloth
    const loinclothGeom = new THREE.BoxGeometry(0.48, 0.45, 0.35);
    const loincloth = new THREE.Mesh(loinclothGeom, loinclothMat);
    loincloth.position.set(0, -0.15, 0);
    torsoGroup.add(loincloth);

    this.bossGroup.add(torsoGroup);

    // 2. Head & Royal Mayan Feather Crown (Penacho de Kukulkán)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65, 0);

    const headGeom = new THREE.BoxGeometry(0.52, 0.54, 0.52);
    const head = new THREE.Mesh(headGeom, bossSkinMat);
    head.position.set(0, 0.25, 0);
    head.castShadow = true;
    headGroup.add(head);

    // Glowing Demonic Red Eyes
    const eyeGeom = new THREE.BoxGeometry(0.11, 0.09, 0.06);
    const leftEye = new THREE.Mesh(eyeGeom, eyeGlowMat);
    leftEye.position.set(-0.14, 0.30, 0.27);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeom, eyeGlowMat);
    rightEye.position.set(0.14, 0.30, 0.27);
    headGroup.add(rightEye);

    // Stone Fangs / Mouth
    const jawGeom = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    const jaw = new THREE.Mesh(jawGeom, darkSkinMat);
    jaw.position.set(0, 0.12, 0.26);
    headGroup.add(jaw);

    // Mayan Golden Crown Diadem
    const crownBandGeom = new THREE.BoxGeometry(0.56, 0.14, 0.56);
    const crownBand = new THREE.Mesh(crownBandGeom, goldArmorMat);
    crownBand.position.set(0, 0.48, 0);
    headGroup.add(crownBand);

    // Feathers of the Penacho fan
    const featherCount = 9;
    for (let f = 0; f < featherCount; f++) {
      const fAngle = ((f - 4) / 4) * (Math.PI * 0.4);
      const fGeom = new THREE.BoxGeometry(0.09, 0.65, 0.04);
      const fMesh = new THREE.Mesh(fGeom, f % 2 === 0 ? featherQuetzalMat : featherGoldMat);
      fMesh.position.set(Math.sin(fAngle) * 0.32, 0.72 + Math.cos(fAngle) * 0.25, -0.15);
      fMesh.rotation.z = -fAngle;
      headGroup.add(fMesh);
    }

    this.bossGroup.add(headGroup);

    // 3. Arms & Giant Claws
    const createArm = (isLeft: boolean) => {
      const arm = new THREE.Group();
      arm.position.set(isLeft ? -0.46 : 0.46, 1.45, 0);

      // Upper Arm
      const bicepGeom = new THREE.BoxGeometry(0.24, 0.52, 0.24);
      const bicep = new THREE.Mesh(bicepGeom, darkSkinMat);
      bicep.position.set(0, -0.22, 0);
      bicep.castShadow = true;
      arm.add(bicep);

      // Golden Spiked Bracer
      const bracerGeom = new THREE.BoxGeometry(0.28, 0.32, 0.28);
      const bracer = new THREE.Mesh(bracerGeom, goldArmorMat);
      bracer.position.set(0, -0.44, 0);
      arm.add(bracer);

      // Giant Hand / Claws
      const handGeom = new THREE.BoxGeometry(0.26, 0.26, 0.28);
      const hand = new THREE.Mesh(handGeom, bossSkinMat);
      hand.position.set(0, -0.66, 0.05);
      hand.castShadow = true;
      arm.add(hand);

      return arm;
    };

    const leftArm = createArm(true);
    this.bossGroup.add(leftArm);

    const rightArm = createArm(false);
    this.bossGroup.add(rightArm);

    // 4. Legs
    const createLeg = (isLeft: boolean) => {
      const leg = new THREE.Group();
      leg.position.set(isLeft ? -0.20 : 0.20, 0.85, 0);

      const thighGeom = new THREE.BoxGeometry(0.24, 0.55, 0.24);
      const thigh = new THREE.Mesh(thighGeom, darkSkinMat);
      thigh.position.set(0, -0.25, 0);
      thigh.castShadow = true;
      leg.add(thigh);

      const shinGeom = new THREE.BoxGeometry(0.26, 0.55, 0.26);
      const shin = new THREE.Mesh(shinGeom, bossSkinMat);
      shin.position.set(0, -0.72, 0);
      shin.castShadow = true;
      leg.add(shin);

      // Gold Greave
      const greaveGeom = new THREE.BoxGeometry(0.28, 0.28, 0.28);
      const greave = new THREE.Mesh(greaveGeom, goldArmorMat);
      greave.position.set(0, -0.68, 0.02);
      leg.add(greave);

      return leg;
    };

    const leftLeg = createLeg(true);
    this.bossGroup.add(leftLeg);

    const rightLeg = createLeg(false);
    this.bossGroup.add(rightLeg);

    // 5. Mystic Jade Shield Sphere (Visible during attack phase)
    const shieldGeom = new THREE.SphereGeometry(1.6, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      wireframe: true,
    });
    const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    shieldMesh.position.set(0, 1.2, 0);
    this.bossGroup.add(shieldMesh);

    // 6. Vulnerable Exhaustion Aura (Pulsing yellow aura when tired)
    const auraGeom = new THREE.SphereGeometry(1.4, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const auraMesh = new THREE.Mesh(auraGeom, auraMat);
    auraMesh.position.set(0, 1.2, 0);
    this.bossGroup.add(auraMesh);

    this.bossLimbs = {
      head: headGroup,
      torso: torsoGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      shieldMesh,
      auraMesh,
    };

    this.scene.add(this.bossGroup);
  }

  // --- RESET / INITIALIZE BOSS COMBAT ---
  public resetBoss() {
    this.health = this.maxHealth;
    this.isDefeated = false;
    this.phase = 'intro';
    this.phaseTimer = 3.0;
    this.attackCycleTimer = 2.5;
    this.attackIndex = 0;
    this.isInvulnerable = true;
    this.hasSpawnedVictoryReward = false;

    this.bossPos.copy(
      this.interiorElements
        ? this.interiorElements.bossStartPos
        : new THREE.Vector3(this.originX, 0, this.originZ - 6.0)
    );
    this.bossGroup.position.copy(this.bossPos);
    this.bossGroup.visible = true;

    // Clear active attacks
    this.clearMinisAndProjectiles();

    // Remove victory chest if any
    if (this.victoryChestMesh) {
      this.scene.remove(this.victoryChestMesh);
      this.victoryChestMesh = null;
    }

    this.emitState();
  }

  private clearMinisAndProjectiles() {
    this.miniZombies.forEach((m) => this.scene.remove(m.mesh));
    this.miniZombies = [];

    this.fireballs.forEach((f) => {
      this.scene.remove(f.mesh);
    });
    this.fireballs = [];

    this.shockwaves.forEach((s) => this.scene.remove(s.mesh));
    this.shockwaves = [];
  }

  private emitState() {
    const isTired = this.phase === 'tired';
    const statusMessage = this.isDefeated
      ? '¡DERROTADO!'
      : isTired
      ? `¡CANSADO! (${Math.ceil(this.phaseTimer)}s)`
      : this.phase === 'intro'
      ? '¡EL REY DESPIERTA!'
      : 'INVULNERABLE (ESQUIVA)';

    this.onBossStateUpdate?.({
      active: true,
      health: this.health,
      maxHealth: this.maxHealth,
      phase: this.phase,
      tiredTimeRemaining: isTired ? Math.max(0, this.phaseTimer) : 0,
      isInvulnerable: this.isInvulnerable,
      isTired,
      statusMessage,
    });
  }

  // --- 3. BOSS UPDATE & ATTACK STATE MACHINE ---
  public update(dt: number, playerPos: THREE.Vector3, currentDimension: string) {
    if (currentDimension !== 'mayan_boss') {
      return;
    }

    const time = performance.now() * 0.001;

    // Animate exit portal ring
    if (this.exitPortalRing) {
      this.exitPortalRing.rotation.z += 2.0 * dt;
    }

    if (this.isDefeated) {
      // Rotate victory chest if present
      if (this.victoryChestMesh) {
        this.victoryChestMesh.rotation.y += 1.0 * dt;
      }
      return;
    }

    // Hit Flash feedback
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.bossLimbs) {
        const flashIntensity = this.hitFlashTimer > 0 ? 1.5 : 0;
        (this.bossLimbs.torso.children[0] as THREE.Mesh).scale.setScalar(1 + flashIntensity * 0.1);
      }
    }

    // Look at player
    const toPlayerX = playerPos.x - this.bossPos.x;
    const toPlayerZ = playerPos.z - this.bossPos.z;
    const targetAngle = Math.atan2(toPlayerX, toPlayerZ);
    this.bossGroup.rotation.y = THREE.MathUtils.lerp(this.bossGroup.rotation.y, targetAngle, 4.0 * dt);

    // State Machine
    this.phaseTimer -= dt;

    if (this.phase === 'intro') {
      // Intro Roar
      this.isInvulnerable = true;
      if (this.bossLimbs) {
        this.bossLimbs.shieldMesh.visible = true;
        this.bossLimbs.auraMesh.visible = false;
        this.bossLimbs.leftArm.rotation.x = -Math.PI / 2 + Math.sin(time * 6) * 0.3;
        this.bossLimbs.rightArm.rotation.x = -Math.PI / 2 + Math.sin(time * 6) * 0.3;
        this.bossLimbs.head.rotation.x = -0.3;
      }

      if (this.phaseTimer <= 0) {
        this.phase = 'attacking';
        this.phaseTimer = this.attackDuration;
        this.attackCycleTimer = 1.5;
        this.isInvulnerable = true;
        soundEngine.playBossRoar();
        this.onToast?.('⚔️ ¡El Rey Zombi Maya ha despertado! ¡Esquiva sus ataques!');
        this.emitState();
      }
    } else if (this.phase === 'attacking') {
      this.isInvulnerable = true;

      // Animate Shield
      if (this.bossLimbs) {
        this.bossLimbs.shieldMesh.visible = true;
        this.bossLimbs.shieldMesh.rotation.y += 2.0 * dt;
        this.bossLimbs.shieldMesh.rotation.x += 1.0 * dt;
        (this.bossLimbs.shieldMesh.material as THREE.MeshStandardMaterial).opacity = 0.45 + Math.sin(time * 5) * 0.2;
        this.bossLimbs.auraMesh.visible = false;
      }

      // Attack Timing Loop
      this.attackCycleTimer -= dt;
      if (this.attackCycleTimer <= 0) {
        this.performNextAttack(playerPos);
        this.attackCycleTimer = 3.6; // New attack every ~3.6s
      }

      // Switch to Tired phase when attack duration expires
      if (this.phaseTimer <= 0) {
        this.phase = 'tired';
        this.phaseTimer = this.tiredDuration;
        this.isInvulnerable = false;

        soundEngine.playBossTiredSound();
        this.onToast?.('⚡ ¡EL JEFE ESTÁ AGOTADO! ¡ATÁCALO CON TU ESPADA!');
        this.emitState();
      }
    } else if (this.phase === 'tired') {
      this.isInvulnerable = false; // VULNERABLE WINDOW!

      // Boss kneels and pants heavily
      if (this.bossLimbs) {
        this.bossLimbs.shieldMesh.visible = false;
        this.bossLimbs.auraMesh.visible = true;

        const breathe = Math.sin(time * 8) * 0.15;
        (this.bossLimbs.auraMesh.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 10) * 0.3;

        this.bossLimbs.torso.position.y = 0.45 + breathe * 0.05;
        this.bossLimbs.head.position.y = 1.15 + breathe * 0.08;
        this.bossLimbs.head.rotation.x = 0.4;
        this.bossLimbs.leftArm.rotation.x = 0.2;
        this.bossLimbs.rightArm.rotation.x = 0.2;
        this.bossLimbs.leftLeg.rotation.x = -0.7;
        this.bossLimbs.rightLeg.rotation.x = -0.7;
      }

      // Return to attacking phase when tired window expires
      if (this.phaseTimer <= 0) {
        this.phase = 'attacking';
        this.phaseTimer = this.attackDuration;
        this.attackCycleTimer = 1.5;
        this.isInvulnerable = true;

        soundEngine.playBossRoar();
        this.onToast?.('🛡️ ¡El Jefe recuperó sus energías y activó su escudo!');
        this.emitState();
      }
    }

    // Update Mini Zombies
    this.updateMiniZombies(dt, playerPos);

    // Update Fireballs
    this.updateFireballs(dt, playerPos);

    // Update Shockwaves
    this.updateShockwaves(dt, playerPos);

    this.emitState();
  }

  // --- 4. BOSS ATTACK EXECUTION ---
  private performNextAttack(playerPos: THREE.Vector3) {
    const attackType = this.attackIndex % 3;
    this.attackIndex++;

    if (attackType === 0) {
      // Attack 1: Lanzar Bolas de Fuego (Fireballs)
      this.castFireballs(playerPos);
    } else if (attackType === 1) {
      // Attack 2: Invocar Zombis Pequeños (Mini Zombies)
      this.summonMiniZombies();
    } else {
      // Attack 3: Golpe de Puño al Suelo (Ground Slam Fist & Shockwave)
      this.performGroundSlam();
    }
  }

  // --- ATTACK 1: BOLAS DE FUEGO ---
  private castFireballs(playerPos: THREE.Vector3) {
    soundEngine.playFireballSound();
    this.onToast?.('🔥 ¡El Jefe lanza Bolas de Fuego!');

    // Fire 3 staggered fireballs (center, left, right)
    const offsets = [-0.3, 0, 0.3];
    offsets.forEach((off, idx) => {
      setTimeout(() => {
        if (this.isDefeated) return;

        const spawnPos = new THREE.Vector3(
          this.bossPos.x,
          this.bossPos.y + 3.8,
          this.bossPos.z
        );

        const target = playerPos.clone().add(new THREE.Vector3(off * 4, 0.8, off * 4));
        const dir = target.sub(spawnPos).normalize();

        const fireballGroup = new THREE.Group();
        fireballGroup.position.copy(spawnPos);

        // Core flaming sphere
        const sphereGeom = new THREE.SphereGeometry(0.48, 12, 12);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0xef4444,
          emissiveIntensity: 2.5,
          roughness: 0.1,
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        fireballGroup.add(sphere);

        // Outer Flame Halo
        const haloGeom = new THREE.SphereGeometry(0.72, 8, 8);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
        });
        const halo = new THREE.Mesh(haloGeom, haloMat);
        fireballGroup.add(halo);

        // Dynamic Light
        const fbLight = new THREE.PointLight(0xf97316, 2.8, 10);
        fireballGroup.add(fbLight);

        this.scene.add(fireballGroup);

        this.fireballs.push({
          mesh: fireballGroup,
          pos: spawnPos,
          vel: dir.multiplyScalar(15.5), // Fast projectile speed
          age: 0,
          maxAge: 4.5,
          light: fbLight,
        });
      }, idx * 280);
    });
  }

  private updateFireballs(dt: number, playerPos: THREE.Vector3) {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.age += dt;
      fb.pos.addScaledVector(fb.vel, dt);
      fb.mesh.position.copy(fb.pos);
      fb.mesh.rotation.x += 6 * dt;
      fb.mesh.rotation.y += 8 * dt;

      // Check hit with player
      const distToPlayer = fb.pos.distanceTo(playerPos);
      if (distToPlayer < 1.4) {
        // Hit Player!
        this.onPlayerHurt?.('¡Te alcanzó una Bola de Fuego del Jefe!');
        soundEngine.playPlayerHurtSound();
        this.removeFireball(i);
        continue;
      }

      // Check collision with ground or timeout
      if (fb.pos.y <= 0.2 || fb.age >= fb.maxAge) {
        this.removeFireball(i);
      }
    }
  }

  private removeFireball(index: number) {
    const fb = this.fireballs[index];
    this.scene.remove(fb.mesh);
    this.fireballs.splice(index, 1);
  }

  // --- ATTACK 2: SUMMON MINI ZOMBIES ---
  private summonMiniZombies() {
    soundEngine.playZombieGroanSound();
    this.onToast?.('🧟 ¡El Jefe invocó una horda de Zombis Pequeños!');

    const count = 3;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spawnX = this.bossPos.x + Math.cos(angle) * 5.5;
      const spawnZ = this.bossPos.z + Math.sin(angle) * 5.5;

      const miniGroup = new THREE.Group();
      miniGroup.position.set(spawnX, 0, spawnZ);
      miniGroup.scale.set(0.65, 0.65, 0.65); // Mini zombie scale!

      // Mini Zombie Materials
      const skinMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.8 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      // Torso
      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.25), shirtMat);
      chest.position.set(0, 0.8, 0);
      miniGroup.add(chest);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMat);
      head.position.set(0, 1.35, 0);
      miniGroup.add(head);

      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
      eye.position.set(0.1, 1.4, 0.21);
      miniGroup.add(eye);
      const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), eyeMat);
      eye2.position.set(-0.1, 1.4, 0.21);
      miniGroup.add(eye2);

      // Arms outstretched forward
      const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), skinMat);
      armL.position.set(-0.32, 0.9, 0.2);
      armL.rotation.x = -Math.PI / 2;
      miniGroup.add(armL);

      const armR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), skinMat);
      armR.position.set(0.32, 0.9, 0.2);
      armR.rotation.x = -Math.PI / 2;
      miniGroup.add(armR);

      // Legs
      const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), pantsMat);
      legL.position.set(-0.14, 0.25, 0);
      miniGroup.add(legL);

      const legR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), pantsMat);
      legR.position.set(0.14, 0.25, 0);
      miniGroup.add(legR);

      this.scene.add(miniGroup);

      this.miniZombies.push({
        id: this.nextMiniId++,
        mesh: miniGroup,
        pos: new THREE.Vector3(spawnX, 0, spawnZ),
        vel: new THREE.Vector3(),
        health: 1, // 1 hit to defeat
        isDead: false,
        walkCycle: Math.random() * Math.PI,
      });
    }
  }

  private updateMiniZombies(dt: number, playerPos: THREE.Vector3) {
    for (let i = this.miniZombies.length - 1; i >= 0; i--) {
      const mz = this.miniZombies[i];
      if (mz.isDead) continue;

      // Chase Player fast
      const dx = playerPos.x - mz.pos.x;
      const dz = playerPos.z - mz.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.1) {
        const speed = 5.2;
        mz.pos.x += (dx / dist) * speed * dt;
        mz.pos.z += (dz / dist) * speed * dt;
        mz.mesh.position.copy(mz.pos);

        const lookAngle = Math.atan2(dx, dz);
        mz.mesh.rotation.y = lookAngle;

        mz.walkCycle += dt * 10;
        mz.mesh.position.y = Math.abs(Math.sin(mz.walkCycle)) * 0.12;
      }

      // Check hit against player
      if (dist < 1.1) {
        this.onPlayerHurt?.('¡Un Zombi Pequeño te mordió!');
        soundEngine.playPlayerHurtSound();
        // Remove mini on hit
        this.scene.remove(mz.mesh);
        this.miniZombies.splice(i, 1);
      }
    }
  }

  // --- ATTACK 3: GROUND SLAM & SHOCKWAVE ---
  private performGroundSlam() {
    this.onToast?.('💥 ¡El Jefe golpea el suelo con su Puño! ¡Salta para esquivar!');
    soundEngine.playGroundSlamSound();

    // Fist slam animation
    if (this.bossLimbs) {
      this.bossLimbs.rightArm.rotation.x = -Math.PI * 0.9;
      setTimeout(() => {
        if (this.bossLimbs && !this.isDefeated) {
          this.bossLimbs.rightArm.rotation.x = 0.5;
        }
      }, 300);
    }

    // Create Expanding Shockwave Ring on Ground
    const shockGeom = new THREE.RingGeometry(0.8, 1.8, 32);
    const shockMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.5,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const shockMesh = new THREE.Mesh(shockGeom, shockMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.position.set(this.bossPos.x, 0.08, this.bossPos.z);
    this.scene.add(shockMesh);

    this.shockwaves.push({
      mesh: shockMesh,
      radius: 1.5,
      maxRadius: 28.0,
      speed: 13.0, // expanding shockwave speed
      center: this.bossPos.clone(),
      hasHitPlayer: false,
    });
  }

  private updateShockwaves(dt: number, playerPos: THREE.Vector3) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed * dt;

      const scale = sw.radius / 1.5;
      sw.mesh.scale.set(scale, scale, scale);

      const fade = Math.max(0, 1 - sw.radius / sw.maxRadius);
      (sw.mesh.material as THREE.MeshStandardMaterial).opacity = fade * 0.85;

      // Check if shockwave hits player (only if player is on ground / not jumping!)
      if (!sw.hasHitPlayer && playerPos.y < 0.6) {
        const distFromCenter = Math.hypot(playerPos.x - sw.center.x, playerPos.z - sw.center.z);
        if (Math.abs(distFromCenter - sw.radius) < 1.8) {
          sw.hasHitPlayer = true;
          this.onPlayerHurt?.('¡La onda de choque del Puño te derribó!');
          soundEngine.playPlayerHurtSound();
        }
      }

      if (sw.radius >= sw.maxRadius) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }
  }

  // --- 5. PLAYER SWORD HIT DETECTION ---
  public checkSwordHit(playerPos: THREE.Vector3, lookDir: THREE.Vector3, damage: number): boolean {
    if (this.isDefeated) return false;

    // 1. Check hitting Mini Zombies first
    for (let i = this.miniZombies.length - 1; i >= 0; i--) {
      const mz = this.miniZombies[i];
      const toMini = mz.pos.clone().sub(playerPos);
      const dist = toMini.length();
      if (dist < 3.2) {
        const dot = lookDir.dot(toMini.clone().normalize());
        if (dot > 0.4) {
          // Defeat mini zombie
          soundEngine.playZombieDeathSound();
          this.scene.remove(mz.mesh);
          this.miniZombies.splice(i, 1);
          return true;
        }
      }
    }

    // 2. Check hitting the Boss
    const toBoss = this.bossPos.clone().add(new THREE.Vector3(0, 2.5, 0)).sub(playerPos);
    const distToBoss = toBoss.length();

    if (distToBoss < 7.5) {
      const dot = lookDir.dot(toBoss.clone().normalize());
      if (dot > 0.3) {
        if (this.isInvulnerable || this.phase !== 'tired') {
          // Deflected by mystic shield!
          soundEngine.playBossShieldDeflectSound();
          this.onToast?.('🛡️ ¡El escudo del Jefe es invulnerable! ¡Espera a que se canse!');
          return false;
        } else {
          // SUCCESSFUL DAMAGE DURING TIRED PHASE!
          const actualDamage = damage * 28; // e.g. 28 HP for wood sword, 56 for fire, 84 for katana
          this.health = Math.max(0, this.health - actualDamage);
          this.hitFlashTimer = 0.25;
          soundEngine.playZombieHurtSound();

          if (this.health <= 0) {
            this.defeatBoss();
          } else {
            this.onToast?.(`💥 ¡Golpe crítico al Jefe! Vida restante: ${this.health}/${this.maxHealth}`);
          }

          this.emitState();
          return true;
        }
      }
    }

    return false;
  }

  // --- 6. BOSS DEFEAT & REWARD ---
  private defeatBoss() {
    this.isDefeated = true;
    this.phase = 'defeated';
    this.isInvulnerable = false;
    this.clearMinisAndProjectiles();

    // Play Victory Sounds
    soundEngine.playBossVictoryFanfare();

    // Award 2,000 Coins!
    this.onAddCoins?.(2000);
    this.onToast?.('🏆 ¡HAS DERROTADO AL REY ZOMBI MAYA! +2,000 🪙');

    // Spawn Grand Victory Chest at Boss Position
    this.spawnVictoryChest();

    // Collapse boss animation
    if (this.bossLimbs) {
      this.bossLimbs.shieldMesh.visible = false;
      this.bossLimbs.auraMesh.visible = false;
      this.bossGroup.rotation.x = Math.PI / 2; // fall back defeated
      this.bossGroup.position.y = 0.4;
    }

    this.emitState();
  }

  private spawnVictoryChest() {
    if (this.hasSpawnedVictoryReward) return;
    this.hasSpawnedVictoryReward = true;

    const chestGroup = new THREE.Group();
    chestGroup.position.set(this.originX, 0.4, this.originZ - 3.5);

    // Golden Chest Mesh
    const chestGeom = new THREE.BoxGeometry(2.2, 1.4, 1.4);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      metalness: 0.9,
      roughness: 0.2,
    });
    const chest = new THREE.Mesh(chestGeom, chestMat);
    chest.castShadow = true;
    chestGroup.add(chest);

    // Glowing Star Emblem on Chest
    const starGeom = new THREE.OctahedronGeometry(0.5, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 2.0,
    });
    const star = new THREE.Mesh(starGeom, starMat);
    star.position.set(0, 0.8, 0);
    chestGroup.add(star);

    const chestLight = new THREE.PointLight(0xfbbf24, 3.5, 14);
    chestLight.position.set(0, 1.2, 0);
    chestGroup.add(chestLight);

    this.scene.add(chestGroup);
    this.victoryChestMesh = chestGroup;
  }

  public destroy() {
    this.clearMinisAndProjectiles();
    if (this.arenaGroup) this.scene.remove(this.arenaGroup);
    if (this.bossGroup) this.scene.remove(this.bossGroup);
    if (this.victoryChestMesh) this.scene.remove(this.victoryChestMesh);
  }
}
