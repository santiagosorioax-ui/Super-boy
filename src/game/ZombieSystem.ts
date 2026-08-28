import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';

export interface ZombieEntity {
  id: number;
  mesh: THREE.Group;
  limbs: {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    head: THREE.Group;
    torso: THREE.Group;
    eyes: THREE.Mesh[];
    healthBarMesh?: THREE.Mesh;
  };
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotY: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  respawnTimer: number;
  wanderTarget: THREE.Vector3;
  wanderTimer: number;
  state: 'idle' | 'wander' | 'chase' | 'hurt';
  hitFlashTimer: number;
  groanTimer: number;
  attackCooldown: number;
  dimension: 'main' | 'candy';
  walkCycle: number;
  isSugarZombie?: boolean;
}

export class ZombieSystem {
  private scene: THREE.Scene;
  private zombies: ZombieEntity[] = [];
  private onDefeatedCallback?: (points: number, remaining: number) => void;
  private onPlayerHurtCallback?: (message: string) => void;
  private spawnCoinCallback?: (pos: THREE.Vector3, type: 'gold' | 'gem') => void;
  private spawnParticlesCallback?: (pos: THREE.Vector3, color: number, count: number) => void;
  private getTerrainHeightFn: (x: number, z: number) => number;
  private nextZombieId = 1;
  private isNightActive = false;

  constructor(
    scene: THREE.Scene,
    getTerrainHeightFn: (x: number, z: number) => number,
    callbacks: {
      onDefeated?: (points: number, remaining: number) => void;
      onPlayerHurt?: (message: string) => void;
      spawnCoin?: (pos: THREE.Vector3, type: 'gold' | 'gem') => void;
      spawnParticles?: (pos: THREE.Vector3, color: number, count: number) => void;
    }
  ) {
    this.scene = scene;
    this.getTerrainHeightFn = getTerrainHeightFn;
    this.onDefeatedCallback = callbacks.onDefeated;
    this.onPlayerHurtCallback = callbacks.onPlayerHurt;
    this.spawnCoinCallback = callbacks.spawnCoin;
    this.spawnParticlesCallback = callbacks.spawnParticles;

    this.spawnInitialZombieHordes();
    // Default hidden until night comes
    this.zombies.forEach((z) => {
      z.mesh.visible = false;
    });
  }

  private createZombieAvatar(isSugarZombie = false): { mesh: THREE.Group; limbs: ZombieEntity['limbs'] } {
    const group = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: isSugarZombie ? 0x10b981 : 0x4d7c0f,
      roughness: 0.7,
      metalness: isSugarZombie ? 0.2 : 0.05,
    });
    const darkSkinMat = new THREE.MeshStandardMaterial({
      color: isSugarZombie ? 0x059669 : 0x365314,
      roughness: 0.8,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: isSugarZombie ? 0xf43f5e : 0x475569,
      roughness: 0.85,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: isSugarZombie ? 0x8b5cf6 : 0x1e293b,
      roughness: 0.8,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: isSugarZombie ? 0xfef08a : 0xffedd5 });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });

    // 1. Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.85, 0);

    const chestGeom = new THREE.BoxGeometry(0.50, 0.58, 0.28);
    const chestMesh = new THREE.Mesh(chestGeom, shirtMat);
    chestMesh.position.set(0, 0.18, 0);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    const ripGeom = new THREE.BoxGeometry(0.18, 0.12, 0.04);
    const rip = new THREE.Mesh(ripGeom, darkSkinMat);
    rip.position.set(0.08, 0.14, 0.13);
    torsoGroup.add(rip);

    group.add(torsoGroup);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.45, 0);

    const headGeom = new THREE.BoxGeometry(0.42, 0.44, 0.42);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.position.set(0, 0.20, 0);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Mouth
    const mouthGeom = new THREE.BoxGeometry(0.18, 0.08, 0.04);
    const mouth = new THREE.Mesh(mouthGeom, mouthMat);
    mouth.position.set(0, 0.09, 0.20);
    headGroup.add(mouth);

    // Teeth
    const toothGeom = new THREE.BoxGeometry(0.035, 0.04, 0.03);
    const tooth = new THREE.Mesh(toothGeom, eyeWhiteMat);
    tooth.position.set(-0.04, 0.11, 0.21);
    headGroup.add(tooth);

    // Left Eye
    const eyeGeom = new THREE.BoxGeometry(0.09, 0.09, 0.02);
    const leftEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    leftEye.position.set(-0.11, 0.22, 0.21);
    headGroup.add(leftEye);

    const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.02), eyePupilMat);
    leftPupil.position.set(-0.11, 0.22, 0.22);
    headGroup.add(leftPupil);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    rightEye.position.set(0.11, 0.20, 0.21);
    headGroup.add(rightEye);

    const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.02), eyePupilMat);
    rightPupil.position.set(0.11, 0.20, 0.22);
    headGroup.add(rightPupil);

    // Menacing eyebrows
    const browGeom = new THREE.BoxGeometry(0.12, 0.03, 0.02);
    const leftBrow = new THREE.Mesh(browGeom, darkSkinMat);
    leftBrow.position.set(-0.11, 0.28, 0.215);
    leftBrow.rotation.z = -0.15;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeom, darkSkinMat);
    rightBrow.position.set(0.11, 0.27, 0.215);
    rightBrow.rotation.z = 0.15;
    headGroup.add(rightBrow);

    // Overhead Billboard Badge (Health & Name Tag)
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 256;
    tagCanvas.height = 64;
    const tagCtx = tagCanvas.getContext('2d');
    if (tagCtx) {
      tagCtx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      tagCtx.beginPath();
      tagCtx.roundRect(4, 4, 248, 56, 12);
      tagCtx.fill();
      tagCtx.strokeStyle = isSugarZombie ? '#f43f5e' : '#ef4444';
      tagCtx.lineWidth = 4;
      tagCtx.stroke();

      tagCtx.fillStyle = '#ffffff';
      tagCtx.font = 'bold 24px sans-serif';
      tagCtx.textAlign = 'center';
      tagCtx.fillText(isSugarZombie ? '🍬 Zombi Dulce' : '🧟 Zombi', 128, 38);
    }
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, side: THREE.DoubleSide });
    const tagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), tagMat);
    tagMesh.position.set(0, 0.65, 0);
    headGroup.add(tagMesh);

    group.add(headGroup);

    // 3. Arms
    const createArm = (isLeft: boolean) => {
      const arm = new THREE.Group();
      arm.position.set(isLeft ? -0.38 : 0.38, 1.05, 0);

      const sleeveGeom = new THREE.BoxGeometry(0.19, 0.26, 0.19);
      const sleeve = new THREE.Mesh(sleeveGeom, shirtMat);
      sleeve.position.set(0, -0.06, 0);
      sleeve.castShadow = true;
      arm.add(sleeve);

      const armGeom = new THREE.BoxGeometry(0.14, 0.46, 0.14);
      const armMesh = new THREE.Mesh(armGeom, skinMat);
      armMesh.position.set(0, -0.28, 0);
      armMesh.castShadow = true;
      arm.add(armMesh);

      const handGeom = new THREE.BoxGeometry(0.15, 0.12, 0.15);
      const hand = new THREE.Mesh(handGeom, darkSkinMat);
      hand.position.set(0, -0.52, 0);
      arm.add(hand);

      arm.rotation.x = -Math.PI / 2.2;
      arm.rotation.z = isLeft ? 0.08 : -0.08;

      return arm;
    };

    const leftArm = createArm(true);
    const rightArm = createArm(false);
    group.add(leftArm);
    group.add(rightArm);

    // 4. Legs
    const createLeg = (isLeft: boolean) => {
      const leg = new THREE.Group();
      leg.position.set(isLeft ? -0.15 : 0.15, 0.75, 0);

      const legGeom = new THREE.BoxGeometry(0.17, 0.68, 0.17);
      const legMesh = new THREE.Mesh(legGeom, pantsMat);
      legMesh.position.set(0, -0.34, 0);
      legMesh.castShadow = true;
      leg.add(legMesh);

      const footGeom = new THREE.BoxGeometry(0.18, 0.10, 0.22);
      const foot = new THREE.Mesh(footGeom, darkSkinMat);
      foot.position.set(0, -0.68, 0.03);
      leg.add(foot);

      return leg;
    };

    const leftLeg = createLeg(true);
    const rightLeg = createLeg(false);
    group.add(leftLeg);
    group.add(rightLeg);

    return {
      mesh: group,
      limbs: {
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        head: headGroup,
        torso: torsoGroup,
        eyes: [leftPupil, rightPupil],
        healthBarMesh: tagMesh,
      },
    };
  }

  private getRandomSpawnPosition(dimension: 'main' | 'candy', nearPlayerPos?: THREE.Vector3): THREE.Vector3 {
    if (dimension === 'candy') {
      if (nearPlayerPos && Math.random() < 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 35;
        let x = nearPlayerPos.x + Math.cos(angle) * radius;
        let z = nearPlayerPos.z + Math.sin(angle) * radius;
        // Clamp within candy island boundary
        const dx = x - 600;
        const dz = z - 600;
        const distFromCenter = Math.hypot(dx, dz);
        if (distFromCenter > 85) {
          x = 600 + (dx / distFromCenter) * 80;
          z = 600 + (dz / distFromCenter) * 80;
        }
        return new THREE.Vector3(x, 0.4, z);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 80;
        const x = 600 + Math.cos(angle) * radius;
        const z = 600 + Math.sin(angle) * radius;
        return new THREE.Vector3(x, 0.4, z);
      }
    } else {
      if (nearPlayerPos && Math.random() < 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 18 + Math.random() * 45;
        let x = nearPlayerPos.x + Math.cos(angle) * radius;
        let z = nearPlayerPos.z + Math.sin(angle) * radius;
        // Clamp to main map limits
        x = Math.max(-110, Math.min(110, x));
        z = Math.max(-110, Math.min(110, z));
        const y = this.getTerrainHeightFn(x, z);
        return new THREE.Vector3(x, y, z);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 105;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = this.getTerrainHeightFn(x, z);
        return new THREE.Vector3(x, y, z);
      }
    }
  }

  private spawnInitialZombieHordes() {
    // 32 Zombies scattered in Main World
    for (let i = 0; i < 32; i++) {
      const pos = this.getRandomSpawnPosition('main');
      this.createZombieEntity(pos, 'main', false);
    }

    // 26 Sugar Zombies in Candy World
    for (let i = 0; i < 26; i++) {
      const pos = this.getRandomSpawnPosition('candy');
      this.createZombieEntity(pos, 'candy', true);
    }
  }

  private createZombieEntity(pos: THREE.Vector3, dimension: 'main' | 'candy', isSugarZombie: boolean): ZombieEntity {
    const id = this.nextZombieId++;
    const { mesh, limbs } = this.createZombieAvatar(isSugarZombie);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const entity: ZombieEntity = {
      id,
      mesh,
      limbs,
      pos: pos.clone(),
      vel: new THREE.Vector3(0, 0, 0),
      rotY: Math.random() * Math.PI * 2,
      health: isSugarZombie ? 3 : 2,
      maxHealth: isSugarZombie ? 3 : 2,
      isDead: false,
      respawnTimer: 0,
      wanderTarget: new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 16,
        pos.y,
        pos.z + (Math.random() - 0.5) * 16
      ),
      wanderTimer: 2 + Math.random() * 4,
      state: 'wander',
      hitFlashTimer: 0,
      groanTimer: 2 + Math.random() * 7,
      attackCooldown: 0,
      dimension,
      walkCycle: Math.random() * 10,
      isSugarZombie,
    };

    this.zombies.push(entity);
    return entity;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    currentDimension: 'main' | 'candy',
    isNight: boolean,
    onPlayerAttack: (knockDir: THREE.Vector3, isSugarZombie: boolean) => void
  ) {
    // 1. Day / Night Transition Handling
    if (this.isNightActive !== isNight) {
      this.isNightActive = isNight;
      if (isNight) {
        // Night falls: awaken zombies with sound & particles
        soundEngine.playNightAwakenSound();
        for (const z of this.zombies) {
          if (!z.isDead && z.dimension === currentDimension) {
            z.mesh.visible = true;
            this.spawnParticlesCallback?.(
              z.pos.clone().add(new THREE.Vector3(0, 0.5, 0)),
              z.isSugarZombie ? 0xf43f5e : 0x4d7c0f,
              15
            );
          }
        }
      } else {
        // Day rises: bury/hide zombies
        for (const z of this.zombies) {
          if (z.mesh.visible && z.dimension === currentDimension) {
            this.spawnParticlesCallback?.(
              z.pos.clone().add(new THREE.Vector3(0, 0.5, 0)),
              0x94a3b8,
              10
            );
          }
          z.mesh.visible = false;
        }
      }
    }

    // If it's daytime, zombies do NOT exist in the world
    if (!isNight) {
      for (const z of this.zombies) {
        z.mesh.visible = false;
      }
      return;
    }

    const aggroRadiusSq = 18 * 18;
    const hitPlayerRadiusSq = 1.45 * 1.45;

    for (const z of this.zombies) {
      // 1. Dimension Filter
      if (z.dimension !== currentDimension) {
        z.mesh.visible = false;
        continue;
      }

      // 2. Dead / Respawn Logic (Respawn dynamically anywhere in world!)
      if (z.isDead) {
        z.mesh.visible = false;
        z.respawnTimer -= dt;
        if (z.respawnTimer <= 0) {
          // Pick fresh random spawn position in the world (anywhere or near player's exploration zone)
          const newPos = this.getRandomSpawnPosition(z.dimension, playerPos);
          z.pos.copy(newPos);
          z.mesh.position.copy(newPos);
          z.vel.set(0, 0, 0);
          z.isDead = false;
          z.health = z.maxHealth;
          z.mesh.visible = true;
          z.wanderTarget.copy(newPos);
          z.wanderTimer = 2;

          this.spawnParticlesCallback?.(
            z.pos.clone().add(new THREE.Vector3(0, 1, 0)),
            z.isSugarZombie ? 0xf43f5e : 0x84cc16,
            20
          );
        }
        continue;
      }

      z.mesh.visible = true;

      // 3. Keep Health Tag facing the player/camera
      if (z.limbs.healthBarMesh) {
        const dxToPlayer = playerPos.x - z.pos.x;
        const dzToPlayer = playerPos.z - z.pos.z;
        const lookAngle = Math.atan2(dxToPlayer, dzToPlayer) - z.rotY;
        z.limbs.healthBarMesh.rotation.y = lookAngle;
      }

      // 4. Attack Cooldown & Groan Sound
      if (z.attackCooldown > 0) {
        z.attackCooldown -= dt;
      }
      z.groanTimer -= dt;
      if (z.groanTimer <= 0) {
        z.groanTimer = 5 + Math.random() * 8;
        const distSq = (playerPos.x - z.pos.x) ** 2 + (playerPos.z - z.pos.z) ** 2;
        if (distSq < 22 * 22) {
          soundEngine.playZombieGroanSound();
        }
      }

      // 5. AI Behavior (Chase or Wander)
      const dx = playerPos.x - z.pos.x;
      const dz = playerPos.z - z.pos.z;
      const distSq = dx * dx + dz * dz;

      let moveSpeed = 0;

      if (distSq < aggroRadiusSq) {
        // CHASE MODE
        z.state = 'chase';
        const targetRotY = Math.atan2(dx, dz);
        let diff = targetRotY - z.rotY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        z.rotY += diff * Math.min(1, 5.5 * dt);

        moveSpeed = z.isSugarZombie ? 3.8 : 3.2;

        // Attack Player Check with cooldown
        if (distSq < hitPlayerRadiusSq && Math.abs(playerPos.y - z.pos.y) < 1.7 && z.attackCooldown <= 0) {
          z.attackCooldown = 1.35; // 1.35s between hits from this zombie
          const knockDir = new THREE.Vector3(dx, 0, dz).normalize();
          if (knockDir.lengthSq() < 0.001) knockDir.set(0, 0, 1);
          onPlayerAttack(knockDir, !!z.isSugarZombie);
          soundEngine.playZombieHitSound();
          z.vel.x = -knockDir.x * 4.0;
          z.vel.z = -knockDir.z * 4.0;
        }
      } else {
        // WANDER MODE
        z.state = 'wander';
        z.wanderTimer -= dt;
        if (z.wanderTimer <= 0) {
          z.wanderTimer = 3 + Math.random() * 4;
          const wanderPos = this.getRandomSpawnPosition(z.dimension);
          z.wanderTarget.copy(wanderPos);
        }

        const wdx = z.wanderTarget.x - z.pos.x;
        const wdz = z.wanderTarget.z - z.pos.z;
        const wDistSq = wdx * wdx + wdz * wdz;

        if (wDistSq > 1.5) {
          const targetRotY = Math.atan2(wdx, wdz);
          let diff = targetRotY - z.rotY;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          z.rotY += diff * Math.min(1, 3.2 * dt);
          moveSpeed = 1.6;
        } else {
          moveSpeed = 0;
        }
      }

      // 6. Movement & Ground Snapping
      if (moveSpeed > 0) {
        z.vel.x = Math.sin(z.rotY) * moveSpeed;
        z.vel.z = Math.cos(z.rotY) * moveSpeed;
      } else {
        z.vel.x *= 0.85;
        z.vel.z *= 0.85;
      }

      z.pos.x += z.vel.x * dt;
      z.pos.z += z.vel.z * dt;

      // Ground height
      const targetY = z.dimension === 'candy' ? 0.4 : this.getTerrainHeightFn(z.pos.x, z.pos.z);
      z.pos.y = targetY;

      z.mesh.position.copy(z.pos);
      z.mesh.rotation.y = z.rotY;

      // 7. Shambling Animation
      const time = performance.now() * 0.001;
      if (moveSpeed > 0) {
        z.walkCycle += dt * (moveSpeed * 3.5);
        const legSwing = Math.sin(z.walkCycle) * 0.5;
        z.limbs.leftLeg.rotation.x = legSwing;
        z.limbs.rightLeg.rotation.x = -legSwing;

        z.limbs.torso.rotation.z = Math.sin(z.walkCycle) * 0.08;
        z.limbs.torso.position.y = 0.85 + Math.abs(Math.sin(z.walkCycle * 2)) * 0.04;
        z.limbs.head.rotation.z = -Math.sin(z.walkCycle) * 0.06;

        z.limbs.leftArm.rotation.x = -Math.PI / 2.2 + Math.sin(z.walkCycle) * 0.18;
        z.limbs.rightArm.rotation.x = -Math.PI / 2.2 - Math.sin(z.walkCycle) * 0.18;
      } else {
        const breathe = Math.sin(time * 2.2 + z.id) * 0.025;
        z.limbs.torso.position.y = 0.85 + breathe;
        z.limbs.head.rotation.x = Math.sin(time * 1.2 + z.id) * 0.08;
        z.limbs.head.rotation.y = Math.sin(time * 0.8 + z.id) * 0.12;
        z.limbs.leftArm.rotation.x = -Math.PI / 2.2 + Math.sin(time * 1.5 + z.id) * 0.06;
        z.limbs.rightArm.rotation.x = -Math.PI / 2.2 - Math.sin(time * 1.5 + z.id) * 0.06;
      }

      // 8. Hit Flash Recovery
      if (z.hitFlashTimer > 0) {
        z.hitFlashTimer -= dt;
        if (z.hitFlashTimer <= 0) {
          z.mesh.scale.set(1, 1, 1);
        }
      }
    }
  }

  public checkSwordHit(
    playerPos: THREE.Vector3,
    lookDir: THREE.Vector3,
    damage: number,
    currentDimension: 'main' | 'candy'
  ): boolean {
    if (!this.isNightActive) return false;
    let hitAny = false;
    const hitRange = 3.6;

    for (const z of this.zombies) {
      if (z.isDead || z.dimension !== currentDimension) continue;

      const toZombie = z.pos.clone().sub(playerPos);
      const dist = toZombie.length();

      if (dist < hitRange) {
        toZombie.normalize();
        const dot = lookDir.dot(toZombie);

        if (dot > 0.25) {
          this.applyDamageToZombie(z, damage, lookDir);
          hitAny = true;
        }
      }
    }

    return hitAny;
  }

  public checkPlayerStomp(
    playerPos: THREE.Vector3,
    playerVelY: number,
    currentDimension: 'main' | 'candy'
  ): boolean {
    if (!this.isNightActive || playerVelY > -0.2) return false;

    for (const z of this.zombies) {
      if (z.isDead || z.dimension !== currentDimension) continue;

      const horizDistSq = (playerPos.x - z.pos.x) ** 2 + (playerPos.z - z.pos.z) ** 2;
      if (horizDistSq < 1.35 * 1.35) {
        const yDiff = playerPos.y - z.pos.y;
        if (yDiff >= 1.1 && yDiff <= 2.5) {
          const knockDir = new THREE.Vector3(z.pos.x - playerPos.x, 0, z.pos.z - playerPos.z).normalize();
          this.applyDamageToZombie(z, 3, knockDir);
          return true;
        }
      }
    }

    return false;
  }

  private applyDamageToZombie(z: ZombieEntity, damage: number, knockDir: THREE.Vector3) {
    z.health -= damage;
    z.hitFlashTimer = 0.25;
    z.mesh.scale.set(1.25, 0.8, 1.25);

    z.vel.x += knockDir.x * 8.5;
    z.vel.z += knockDir.z * 8.5;

    soundEngine.playZombieHitSound();

    if (z.health <= 0) {
      // Zombie Defeated!
      z.isDead = true;
      z.respawnTimer = 3.5 + Math.random() * 3.0; // Fast dynamic respawn across the map!
      z.mesh.visible = false;

      // Spawn Coins/Gems
      this.spawnCoinCallback?.(z.pos.clone().add(new THREE.Vector3(0.5, 0.8, 0)), 'gold');
      this.spawnCoinCallback?.(z.pos.clone().add(new THREE.Vector3(-0.5, 0.8, 0)), z.isSugarZombie ? 'gem' : 'gold');

      const remainingAlive = this.zombies.filter(
        (item) => !item.isDead && item.dimension === z.dimension
      ).length;
      this.onDefeatedCallback?.(35, remainingAlive);
    }
  }

  public getZombies(): ZombieEntity[] {
    return this.zombies;
  }
}
