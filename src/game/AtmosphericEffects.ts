import * as THREE from 'three';

export interface AtmosphericEffectsResult {
  sunCoronaMesh: THREE.Mesh;
  sunGlowSprite: THREE.Sprite;
  update: (camera: THREE.Camera, sunPosition: THREE.Vector3, isNight: boolean) => void;
  dispose: () => void;
}

export class AtmosphericEffects {
  public static create(scene: THREE.Scene): AtmosphericEffectsResult {
    // 1. Procedural Soft Radial Sun Glow Texture via HTML Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 250, 220, 0.95)');
      grad.addColorStop(0.2, 'rgba(255, 220, 130, 0.6)');
      grad.addColorStop(0.55, 'rgba(255, 170, 60, 0.18)');
      grad.addColorStop(1, 'rgba(255, 140, 40, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const glowTex = new THREE.CanvasTexture(canvas);

    // 2. High-Altitude Sun Corona Billboard
    const coronaMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: 0xfffae6,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sunGlowSprite = new THREE.Sprite(coronaMat);
    sunGlowSprite.scale.set(38, 38, 1);
    scene.add(sunGlowSprite);

    // 3. Inner Brilliant Solar Core
    const coreGeom = new THREE.SphereGeometry(4.2, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const sunCoronaMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(sunCoronaMesh);

    const camDir = new THREE.Vector3();
    const sunDir = new THREE.Vector3();

    return {
      sunCoronaMesh,
      sunGlowSprite,
      update: (camera: THREE.Camera, sunPos: THREE.Vector3, isNight: boolean) => {
        if (isNight || sunPos.y < -5) {
          sunGlowSprite.visible = false;
          sunCoronaMesh.visible = false;
          return;
        }

        sunGlowSprite.visible = true;
        sunCoronaMesh.visible = true;

        sunGlowSprite.position.copy(sunPos);
        sunCoronaMesh.position.copy(sunPos);

        // Calculate optical dot product between camera look and sun vector
        camera.getWorldDirection(camDir);
        sunDir.copy(sunPos).sub(camera.position).normalize();
        const lookDot = camDir.dot(sunDir);

        if (lookDot > 0.45) {
          // Looking directly or near sun: soft celestial glare expansion
          const glareFactor = (lookDot - 0.45) / 0.55;
          const targetScale = 38 + glareFactor * 24;
          sunGlowSprite.scale.set(targetScale, targetScale, 1);
          coronaMat.opacity = 0.75 + glareFactor * 0.25;
        } else {
          sunGlowSprite.scale.set(38, 38, 1);
          coronaMat.opacity = 0.65;
        }
      },
      dispose: () => {
        scene.remove(sunGlowSprite);
        scene.remove(sunCoronaMesh);
        glowTex.dispose();
        coronaMat.dispose();
        coreGeom.dispose();
        coreMat.dispose();
      },
    };
  }
}
