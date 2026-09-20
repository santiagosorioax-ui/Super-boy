import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';

export interface GummyCitizen {
  name: string;
  colorHex: string;
  dialogue: string;
  basePos: THREE.Vector3;
  mesh: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  bubbleMesh: THREE.Mesh;
  wanderRadius: number;
  walkTimer: number;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  isTalking: boolean;
  waveTimer: number;
}

export class GummyCitizenManager {
  private scene: THREE.Scene;
  private citizens: GummyCitizen[] = [];

  constructor(scene: THREE.Scene, originX: number, originZ: number) {
    this.scene = scene;
    this.initCitizens(originX, originZ);
  }

  private initCitizens(ox: number, oz: number) {
    const citizenConfigs = [
      {
        name: 'Barnaby (Fresa)',
        colorHex: '#f43f5e',
        pos: new THREE.Vector3(ox + 4, 0.4, oz - 4),
        wanderRadius: 4.5,
        dialogue: '¡Hola amigo! ¡Los trampolines de aquí son gomitas vivas que rebotan altísimo!',
      },
      {
        name: 'Gummy Lime (Menta)',
        colorHex: '#10b981',
        pos: new THREE.Vector3(ox + 10, 0.4, oz - 12),
        wanderRadius: 3.5,
        dialogue: '¡En la tienda venden las Botas de Gomita! ¡Con ellas saltas más del doble!',
      },
      {
        name: 'Berry Blue (Mora)',
        colorHex: '#06b6d4',
        pos: new THREE.Vector3(ox - 8, 0.4, oz + 15),
        wanderRadius: 5.0,
        dialogue: '¡Mira el río de chocolate caliente! ¡Los puentes de barquillo son crujientes!',
      },
      {
        name: 'Honey Gold (Miel)',
        colorHex: '#f59e0b',
        pos: new THREE.Vector3(ox - 16, 0.4, oz - 8),
        wanderRadius: 4.0,
        dialogue: '¡Mmm! El aire aquí huele a vainilla y algodón de azúcar!',
      },
      {
        name: 'Grape Violet (Uva)',
        colorHex: '#8b5cf6',
        pos: new THREE.Vector3(ox + 18, 0.4, oz + 12),
        wanderRadius: 5.0,
        dialogue: '¡Las espadas de caramelo y chocolate son mucho más poderosas que las normales!',
      },
      {
        name: 'Choco Guardian',
        colorHex: '#78350f',
        pos: new THREE.Vector3(ox, 0.4, oz + 42),
        wanderRadius: 3.0,
        dialogue: '¡Alto ahí! Más adelante está el Castillo de Chocolate del Gran Rey Oso de Gomita...',
      },
      {
        name: 'Sugar Pop',
        colorHex: '#ec4899',
        pos: new THREE.Vector3(ox - 22, 0.4, oz + 24),
        wanderRadius: 4.5,
        dialogue: '¡Consejo secreto: cuando el Rey Oso se cansa, le da un bajón de azúcar! ¡Ahí debes atacarlo!',
      },
    ];

    citizenConfigs.forEach((cfg) => {
      const citizen = this.buildCitizen(cfg.name, cfg.colorHex, cfg.pos, cfg.wanderRadius, cfg.dialogue);
      this.citizens.push(citizen);
      this.scene.add(citizen.mesh);
    });
  }

  private buildCitizen(
    name: string,
    colorHex: string,
    pos: THREE.Vector3,
    wanderRadius: number,
    dialogue: string
  ): GummyCitizen {
    const group = new THREE.Group();
    group.position.copy(pos);

    const gummyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    });

    // 1. Torso
    const torsoGeom = new THREE.CapsuleGeometry(0.42, 0.55, 8, 14);
    const torso = new THREE.Mesh(torsoGeom, gummyMat);
    torso.position.y = 0.65;
    torso.castShadow = true;
    group.add(torso);

    // Cute belly button / crystal
    const crystal = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    crystal.position.set(0, 0.65, 0.38);
    group.add(crystal);

    // 2. Head
    const headGeom = new THREE.SphereGeometry(0.38, 14, 14);
    const head = new THREE.Mesh(headGeom, gummyMat);
    head.position.y = 1.25;
    head.castShadow = true;
    group.add(head);

    // Round Gummy Ears
    const earGeom = new THREE.SphereGeometry(0.16, 8, 8);
    const leftEar = new THREE.Mesh(earGeom, gummyMat);
    leftEar.position.set(-0.3, 1.52, 0);
    group.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.3, 1.52, 0);
    group.add(rightEar);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.13, 1.3, 0.34);
    group.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.set(0.13, 1.3, 0.34);
    group.add(rightEye);

    // Snout
    const snout = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.3 })
    );
    snout.position.set(0, 1.22, 0.34);
    group.add(snout);

    // Cute little black nose
    const nose = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x18181b })
    );
    nose.position.set(0, 1.26, 0.46);
    group.add(nose);

    // 3. Arms
    const armGeom = new THREE.CapsuleGeometry(0.14, 0.35, 6, 8);
    const leftArm = new THREE.Mesh(armGeom, gummyMat);
    leftArm.position.set(-0.5, 0.75, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeom, gummyMat);
    rightArm.position.set(0.5, 0.75, 0);
    group.add(rightArm);

    // 4. Legs
    const legGeom = new THREE.CapsuleGeometry(0.16, 0.3, 6, 8);
    const leftLeg = new THREE.Mesh(legGeom, gummyMat);
    leftLeg.position.set(-0.22, 0.22, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, gummyMat);
    rightLeg.position.set(0.22, 0.22, 0);
    group.add(rightLeg);

    // 5. Speech Bubble Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Rounded Card
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(16, 16, 480, 224, 28);
      ctx.fill();
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Speaker Name
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, 256, 68);

      // Dialogue Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';

      // Simple word wrapping
      const words = dialogue.split(' ');
      let line1 = '';
      let line2 = '';
      for (const w of words) {
        if (line1.length + w.length < 30) {
          line1 += (line1 ? ' ' : '') + w;
        } else {
          line2 += (line2 ? ' ' : '') + w;
        }
      }
      ctx.fillText(line1, 256, 125);
      if (line2) {
        ctx.fillText(line2, 256, 165);
      }
    }

    const bubbleTex = new THREE.CanvasTexture(canvas);
    const bubbleMat = new THREE.MeshBasicMaterial({
      map: bubbleTex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const bubbleMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), bubbleMat);
    bubbleMesh.position.set(0, 2.5, 0);
    bubbleMesh.visible = false;
    group.add(bubbleMesh);

    return {
      name,
      colorHex,
      dialogue,
      basePos: pos.clone(),
      currentPos: pos.clone(),
      targetPos: pos.clone(),
      wanderRadius,
      walkTimer: Math.random() * 5,
      mesh: group,
      head,
      leftArm,
      rightArm,
      bubbleMesh,
      isTalking: false,
      waveTimer: 0,
    };
  }

  public update(dt: number, playerPos: THREE.Vector3, currentDimension: string) {
    if (currentDimension !== 'candy') {
      return;
    }

    const time = performance.now() * 0.001;

    this.citizens.forEach((c) => {
      const distToPlayer = c.currentPos.distanceTo(playerPos);
      const isNearPlayer = distToPlayer < 4.2;

      // Make speech bubble look at player
      if (c.bubbleMesh.visible) {
        c.bubbleMesh.lookAt(playerPos.x, c.bubbleMesh.position.y + c.mesh.position.y, playerPos.z);
      }

      if (isNearPlayer) {
        // Stop and look at player
        if (!c.isTalking) {
          c.isTalking = true;
          c.bubbleMesh.visible = true;
          soundEngine.playGummyBounceSound();
        }

        // Face player
        const toPlayer = playerPos.clone().sub(c.currentPos);
        toPlayer.y = 0;
        if (toPlayer.lengthSq() > 0.01) {
          const angle = Math.atan2(toPlayer.x, toPlayer.z);
          c.mesh.rotation.y = THREE.MathUtils.lerp(c.mesh.rotation.y, angle, dt * 5.0);
        }

        // Friendly wave animation
        c.waveTimer += dt * 8.0;
        c.rightArm.rotation.z = Math.sin(c.waveTimer) * 0.8 - 1.2;
        c.leftArm.rotation.z = 0.2;

        // Happy little jelly hop
        const hop = Math.abs(Math.sin(time * 4.0)) * 0.15;
        c.mesh.position.y = c.basePos.y + hop;
      } else {
        // Resume wandering
        if (c.isTalking) {
          c.isTalking = false;
          c.bubbleMesh.visible = false;
        }

        c.walkTimer += dt;
        if (c.walkTimer > 4.5 + Math.random() * 3.0) {
          c.walkTimer = 0;
          // Pick new target within wander radius
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * c.wanderRadius;
          c.targetPos.set(
            c.basePos.x + Math.cos(angle) * dist,
            c.basePos.y,
            c.basePos.z + Math.sin(angle) * dist
          );
        }

        // Move smoothly towards target
        const toTarget = c.targetPos.clone().sub(c.currentPos);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist > 0.2) {
          toTarget.normalize();
          c.currentPos.addScaledVector(toTarget, dt * 1.2);
          c.mesh.position.copy(c.currentPos);

          const angle = Math.atan2(toTarget.x, toTarget.z);
          c.mesh.rotation.y = THREE.MathUtils.lerp(c.mesh.rotation.y, angle, dt * 4.0);

          // Gentle walking hop
          const walkHop = Math.abs(Math.sin(time * 5.0)) * 0.12;
          c.mesh.position.y = c.basePos.y + walkHop;

          // Swing arms
          c.leftArm.rotation.x = Math.sin(time * 5.0) * 0.5;
          c.rightArm.rotation.x = -Math.sin(time * 5.0) * 0.5;
          c.leftArm.rotation.z = 0;
          c.rightArm.rotation.z = 0;
        } else {
          c.mesh.position.y = c.basePos.y;
          c.leftArm.rotation.set(0, 0, 0);
          c.rightArm.rotation.set(0, 0, 0);
        }
      }
    });
  }
}
