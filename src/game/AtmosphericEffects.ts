import * as THREE from 'three';

export interface AtmosphericEffectsResult {
  sunCoronaMesh: THREE.Mesh;
  sunGlowSprite: THREE.Sprite;
  godRaysGroup: THREE.Group;
  sunMotesPoints: THREE.Points;
  update: (camera: THREE.Camera, sunPosition: THREE.Vector3, isNight: boolean, time: number) => void;
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
      grad.addColorStop(0, 'rgba(255, 252, 235, 0.98)');
      grad.addColorStop(0.2, 'rgba(255, 225, 130, 0.65)');
      grad.addColorStop(0.55, 'rgba(255, 175, 65, 0.22)');
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
    sunGlowSprite.scale.set(42, 42, 1);
    scene.add(sunGlowSprite);

    // 3. Inner Brilliant Solar Core
    const coreGeom = new THREE.SphereGeometry(4.5, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const sunCoronaMesh = new THREE.Mesh(coreGeom, coreMat);
    scene.add(sunCoronaMesh);

    // 4. Realistic Volumetric Crepuscular Sun Rays (God Rays)
    // Canvas gradient texture for soft light beam shafts
    const beamCanvas = document.createElement('canvas');
    beamCanvas.width = 64;
    beamCanvas.height = 256;
    const beamCtx = beamCanvas.getContext('2d');
    if (beamCtx) {
      const bGrad = beamCtx.createLinearGradient(0, 0, 0, 256);
      bGrad.addColorStop(0, 'rgba(255, 245, 180, 0.45)');
      bGrad.addColorStop(0.4, 'rgba(255, 220, 140, 0.20)');
      bGrad.addColorStop(0.85, 'rgba(255, 190, 100, 0.05)');
      bGrad.addColorStop(1, 'rgba(255, 170, 80, 0)');
      beamCtx.fillStyle = bGrad;
      beamCtx.fillRect(0, 0, 64, 256);
    }
    const beamTex = new THREE.CanvasTexture(beamCanvas);

    const godRaysGroup = new THREE.Group();
    const beamGeom = new THREE.PlaneGeometry(16, 140);
    // Move origin to top of beam
    beamGeom.translate(0, -70, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      color: 0xfff0b3,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create a fan of 6 sunbeam planes radiating outward
    for (let i = 0; i < 6; i++) {
      const ray = new THREE.Mesh(beamGeom, beamMat);
      ray.rotation.z = ((i - 2.5) * 0.18);
      ray.rotation.y = (i * 0.35);
      godRaysGroup.add(ray);
    }
    scene.add(godRaysGroup);

    // 5. Ambient Golden Sun Motes (Dancing dust particles in sunbeams)
    const MOTE_COUNT = 240;
    const moteGeom = new THREE.BufferGeometry();
    const motePos = new Float32Array(MOTE_COUNT * 3);
    const moteVel = new Float32Array(MOTE_COUNT * 3);

    for (let i = 0; i < MOTE_COUNT; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 32;
      motePos[i * 3 + 1] = Math.random() * 10;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 32;

      moteVel[i * 3] = (Math.random() - 0.5) * 0.4;
      moteVel[i * 3 + 1] = 0.15 + Math.random() * 0.35;
      moteVel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));

    const moteMat = new THREE.PointsMaterial({
      color: 0xffe28a,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sunMotesPoints = new THREE.Points(moteGeom, moteMat);
    scene.add(sunMotesPoints);

    const camDir = new THREE.Vector3();
    const sunDir = new THREE.Vector3();

    return {
      sunCoronaMesh,
      sunGlowSprite,
      godRaysGroup,
      sunMotesPoints,
      update: (camera: THREE.Camera, sunPos: THREE.Vector3, isNight: boolean, time: number) => {
        if (isNight || sunPos.y < -5) {
          sunGlowSprite.visible = false;
          sunCoronaMesh.visible = false;
          godRaysGroup.visible = false;
          sunMotesPoints.visible = false;
          return;
        }

        sunGlowSprite.visible = true;
        sunCoronaMesh.visible = true;
        godRaysGroup.visible = true;
        sunMotesPoints.visible = true;

        sunGlowSprite.position.copy(sunPos);
        sunCoronaMesh.position.copy(sunPos);
        godRaysGroup.position.copy(sunPos);

        // Orient God Rays toward camera area with gentle sway
        godRaysGroup.lookAt(camera.position.x, 0, camera.position.z);
        godRaysGroup.rotation.z += Math.sin(time * 0.4) * 0.05;

        // Calculate optical dot product between camera look and sun vector
        camera.getWorldDirection(camDir);
        sunDir.copy(sunPos).sub(camera.position).normalize();
        const lookDot = camDir.dot(sunDir);

        if (lookDot > 0.3) {
          // Looking towards sun: atmospheric flare expansion
          const glareFactor = (lookDot - 0.3) / 0.7;
          const targetScale = 42 + glareFactor * 32;
          sunGlowSprite.scale.set(targetScale, targetScale, 1);
          coronaMat.opacity = 0.75 + glareFactor * 0.25;
          beamMat.opacity = 0.18 + glareFactor * 0.22;
        } else {
          sunGlowSprite.scale.set(42, 42, 1);
          coronaMat.opacity = 0.65;
          beamMat.opacity = 0.12;
        }

        // Animate floating golden sun motes near the player
        sunMotesPoints.position.set(camera.position.x, 0, camera.position.z);
        const posAttr = moteGeom.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        for (let i = 0; i < MOTE_COUNT; i++) {
          arr[i * 3 + 1] += moteVel[i * 3 + 1] * 0.016;
          arr[i * 3] += Math.sin(time * 0.8 + i) * 0.008;
          arr[i * 3 + 2] += Math.cos(time * 0.8 + i) * 0.008;

          // Wrap vertically
          if (arr[i * 3 + 1] > 12) {
            arr[i * 3 + 1] = 0.2;
          }
        }
        posAttr.needsUpdate = true;
      },
      dispose: () => {
        scene.remove(sunGlowSprite);
        scene.remove(sunCoronaMesh);
        scene.remove(godRaysGroup);
        scene.remove(sunMotesPoints);
        glowTex.dispose();
        beamTex.dispose();
        coronaMat.dispose();
        coreGeom.dispose();
        coreMat.dispose();
        beamGeom.dispose();
        beamMat.dispose();
        moteGeom.dispose();
        moteMat.dispose();
      },
    };
  }
}
