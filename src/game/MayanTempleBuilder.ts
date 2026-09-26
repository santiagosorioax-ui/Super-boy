import * as THREE from 'three';
import { TextureSynthesizer } from './TextureSynthesizer';

export interface MayanTempleElements {
  group: THREE.Group;
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  portalPos: THREE.Vector3;
  portalRing: THREE.Mesh;
}

export class MayanTempleBuilder {
  public static build(
    scene: THREE.Scene,
    cx = 0,
    cz = -68,
    groundH = 0.4
  ): MayanTempleElements {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(cx, 0, cz);

    const colliders: THREE.Box3[] = [];
    const platforms: { box: THREE.Box3; topY: number }[] = [];

    // --- MESOAMERICAN STONE & JADE MATERIALS ---
    const mayanTex = TextureSynthesizer.getMayanStoneTexture();
    const mayanNorm = TextureSynthesizer.getMayanStoneNormal();
    const rockNorm = TextureSynthesizer.getRockNormal();

    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xc4beb6, // Weathered ancient Mesoamerican limestone
      roughness: 0.75,
      map: mayanTex,
      normalMap: mayanNorm,
      normalScale: new THREE.Vector2(0.65, 0.65),
    });
    const darkAndesiteMat = new THREE.MeshStandardMaterial({
      color: 0x4a4642, // Dark volcanic andesite stone
      roughness: 0.82,
      map: mayanTex,
      normalMap: mayanNorm,
      normalScale: new THREE.Vector2(0.8, 0.8),
    });
    const carvedBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x292524, // Carved basalt serpent stone
      roughness: 0.7,
      normalMap: rockNorm,
      normalScale: new THREE.Vector2(0.5, 0.5),
    });
    const goldOrnamentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      metalness: 0.7,
      roughness: 0.3,
    });
    const jadeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    // =========================================================================
    // 1. SIX COLOSSAL STEPPED PYRAMID TIERS (EL CASTILLO DE CHICHÉN ITZÁ)
    // Base is 54m x 54m wide and rises 18.6m tall into the clouds!
    // =========================================================================
    const tiers = [
      { w: 54, d: 54, h: 3.2, y: groundH + 1.6 },
      { w: 45, d: 45, h: 3.2, y: groundH + 4.8 },
      { w: 36, d: 36, h: 3.2, y: groundH + 8.0 },
      { w: 28, d: 28, h: 3.2, y: groundH + 11.2 },
      { w: 20, d: 20, h: 3.2, y: groundH + 14.4 },
      { w: 13.5, d: 13.5, h: 2.6, y: groundH + 17.3 },
    ];

    tiers.forEach((t) => {
      // Main Tier Stone Mass
      const tierGeom = new THREE.BoxGeometry(t.w, t.h, t.d);
      const tierMesh = new THREE.Mesh(tierGeom, sandstoneMat);
      tierMesh.position.set(0, t.y, 0);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      templeGroup.add(tierMesh);

      // Decorative Cornice / Tablero moulding running along the upper edge of each tier
      const corniceGeom = new THREE.BoxGeometry(t.w + 0.8, 0.45, t.d + 0.8);
      const corniceMesh = new THREE.Mesh(corniceGeom, darkAndesiteMat);
      corniceMesh.position.set(0, t.y + t.h / 2 - 0.22, 0);
      corniceMesh.castShadow = true;
      templeGroup.add(corniceMesh);

      // Platform collider for each step level
      const tierTopY = t.y + t.h / 2;
      const tBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cx, t.y, cz),
        new THREE.Vector3(t.w, t.h, t.d)
      );
      colliders.push(tBox);
      platforms.push({ box: tBox, topY: tierTopY });
    });

    const topPlatformY = groundH + 18.6;

    // =========================================================================
    // 2. MONUMENTAL 36-STEP GRAND CEREMONIAL STAIRCASE (Facing South +Z)
    // 9.4m wide regal stairway spanning from the valley floor to the summit
    // =========================================================================
    const stepCount = 36;
    const stepWidth = 9.4;
    const totalStepRise = topPlatformY - groundH;
    const stepHeight = totalStepRise / stepCount; // ~0.516m smooth walkable rise
    const stepDepth = 0.78;
    const stairsStartOffsetZ = 27.2; // Starts at base perimeter

    for (let s = 0; s < stepCount; s++) {
      const stepY = groundH + (s + 0.5) * stepHeight;
      const stepZ = stairsStartOffsetZ - s * stepDepth * 0.94;

      const stepGeom = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeom, darkAndesiteMat);
      stepMesh.position.set(0, stepY, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      templeGroup.add(stepMesh);

      const sBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cx, stepY, cz + stepZ),
        new THREE.Vector3(stepWidth, stepHeight, stepDepth)
      );
      colliders.push(sBox);
      platforms.push({ box: sBox, topY: groundH + (s + 1) * stepHeight });
    }

    // 2.1 Slanted Stone Serpentine Balustrades flanking the stairs
    const rampLength = Math.hypot(stairsStartOffsetZ, totalStepRise);
    const balustradeGeom = new THREE.BoxGeometry(1.0, 0.8, rampLength * 0.96);

    const balustradeL = new THREE.Mesh(balustradeGeom, sandstoneMat);
    balustradeL.position.set(-stepWidth / 2 - 0.5, topPlatformY / 2, stairsStartOffsetZ / 2 + 1.2);
    balustradeL.rotation.x = Math.atan2(totalStepRise, stairsStartOffsetZ * 0.94);
    balustradeL.castShadow = true;
    templeGroup.add(balustradeL);

    const balustradeR = new THREE.Mesh(balustradeGeom, sandstoneMat);
    balustradeR.position.set(stepWidth / 2 + 0.5, topPlatformY / 2, stairsStartOffsetZ / 2 + 1.2);
    balustradeR.rotation.x = Math.atan2(totalStepRise, stairsStartOffsetZ * 0.94);
    balustradeR.castShadow = true;
    templeGroup.add(balustradeR);

    // 2.2 Giant Kukulkán Feathered Serpent Stone Heads at base of stairs
    [-stepWidth / 2 - 0.5, stepWidth / 2 + 0.5].forEach((hx) => {
      const serpentHead = new THREE.Group();
      serpentHead.position.set(hx, groundH + 0.9, stairsStartOffsetZ + 1.4);

      // Massive Snout
      const snoutGeom = new THREE.BoxGeometry(1.1, 0.9, 1.4);
      const snout = new THREE.Mesh(snoutGeom, carvedBasaltMat);
      snout.castShadow = true;
      serpentHead.add(snout);

      // Golden Fangs
      [-0.32, 0.32].forEach((fx) => {
        const fangGeom = new THREE.ConeGeometry(0.16, 0.45, 4);
        const fang = new THREE.Mesh(fangGeom, goldOrnamentMat);
        fang.position.set(fx, -0.38, 0.55);
        fang.rotation.x = Math.PI;
        serpentHead.add(fang);
      });

      // Glowing Jade Eyes
      [-0.42, 0.42].forEach((ex) => {
        const eyeGeom = new THREE.BoxGeometry(0.18, 0.18, 0.12);
        const eye = new THREE.Mesh(eyeGeom, jadeGlowMat);
        eye.position.set(ex, 0.25, 0.2);
        serpentHead.add(eye);

        const eyeLight = new THREE.PointLight(0x10b981, 1.8, 6);
        eyeLight.position.set(ex, 0.25, 0.5);
        serpentHead.add(eyeLight);
      });

      // Crest feather plumes
      const crestGeom = new THREE.BoxGeometry(0.9, 0.6, 0.3);
      const crest = new THREE.Mesh(crestGeom, goldOrnamentMat);
      crest.position.set(0, 0.6, -0.3);
      serpentHead.add(crest);

      templeGroup.add(serpentHead);
    });

    // 2.3 Tier Terraces Stone Braziers with Sacred Green Mayan Flames
    // Placed on intermediate tier corners
    const terraceCorners = [
      { x: -24, z: -24, y: groundH + 3.2 },
      { x: 24, z: -24, y: groundH + 3.2 },
      { x: -24, z: 24, y: groundH + 3.2 },
      { x: 24, z: 24, y: groundH + 3.2 },
      { x: -16, z: -16, y: groundH + 9.6 },
      { x: 16, z: -16, y: groundH + 9.6 },
      { x: -16, z: 16, y: groundH + 9.6 },
      { x: 16, z: 16, y: groundH + 9.6 },
    ];

    terraceCorners.forEach((tc) => {
      const brazier = new THREE.Group();
      brazier.position.set(tc.x, tc.y, tc.z);

      const bBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 0.8, 8), darkAndesiteMat);
      bBase.position.y = 0.4;
      brazier.add(bBase);

      const bFlame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 8), jadeGlowMat);
      bFlame.position.y = 1.15;
      brazier.add(bFlame);

      const bLight = new THREE.PointLight(0x10b981, 2.0, 10);
      bLight.position.y = 1.3;
      brazier.add(bLight);

      templeGroup.add(brazier);
    });

    // =========================================================================
    // 3. COLOSSAL SUMMIT SANCTUARY (TEMPLO DE LA CÚSPIDE)
    // 10.5m x 10.5m shrine towering on the summit platform
    // =========================================================================
    const shrineW = 10.5;
    const shrineD = 10.5;
    const shrineH = 5.6;
    const shrineY = topPlatformY + shrineH / 2;

    // Shrine Outer Walls
    const shrineGeom = new THREE.BoxGeometry(shrineW, shrineH, shrineD);
    const shrineMesh = new THREE.Mesh(shrineGeom, sandstoneMat);
    shrineMesh.position.set(0, shrineY, 0);
    shrineMesh.castShadow = true;
    shrineMesh.receiveShadow = true;
    templeGroup.add(shrineMesh);

    // Shrine Sloped Roof Structure
    const roofGeom = new THREE.BoxGeometry(shrineW + 1.6, 1.8, shrineD + 1.6);
    const roofMesh = new THREE.Mesh(roofGeom, darkAndesiteMat);
    roofMesh.position.set(0, topPlatformY + shrineH + 0.9, 0);
    roofMesh.castShadow = true;
    templeGroup.add(roofMesh);

    // High Mesoamerican Crestería (Roof Crest Comb)
    const crestGeom = new THREE.BoxGeometry(shrineW * 0.75, 2.4, 0.8);
    const crestMesh = new THREE.Mesh(crestGeom, carvedBasaltMat);
    crestMesh.position.set(0, topPlatformY + shrineH + 2.7, 0);
    crestMesh.castShadow = true;
    templeGroup.add(crestMesh);

    // Golden Solar Medallion in center of Crestería
    const solarDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16), goldOrnamentMat);
    solarDisc.rotation.x = Math.PI / 2;
    solarDisc.position.set(0, topPlatformY + shrineH + 2.7, 0.45);
    templeGroup.add(solarDisc);

    const shrineBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, shrineY, cz),
      new THREE.Vector3(shrineW, shrineH, shrineD)
    );
    colliders.push(shrineBox);
    platforms.push({ box: shrineBox, topY: topPlatformY + shrineH + 1.8 });

    // =========================================================================
    // 4. GRAND PORTAL ARCHWAY & ENTRANCE TO BOSS CHAMBER
    // =========================================================================
    const portalZ = shrineD / 2 + 0.6;
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, topPlatformY, portalZ);

    // Massive Carved Stone Door Frame
    const doorFrameGeom = new THREE.BoxGeometry(4.4, 4.8, 0.8);
    const doorFrame = new THREE.Mesh(doorFrameGeom, darkAndesiteMat);
    doorFrame.position.set(0, 2.4, 0);
    portalGroup.add(doorFrame);

    // Glowing Green-Gold Mystic Mayan Portal Ring (Entry to Boss Chamber)
    const ringGeom = new THREE.TorusGeometry(2.2, 0.22, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.8,
    });
    const portalRing = new THREE.Mesh(ringGeom, ringMat);
    portalRing.position.set(0, 2.4, 0.3);
    portalGroup.add(portalRing);

    // Mystical Door Atmosphere Light
    const doorLight = new THREE.PointLight(0x10b981, 4.0, 18);
    doorLight.position.set(0, 2.4, 0.8);
    portalGroup.add(doorLight);

    // 4 Braziers with Mayan Green Sacred Fire flanking the summit door
    [-3.8, -2.2, 2.2, 3.8].forEach((bx) => {
      const bGeom = new THREE.CylinderGeometry(0.55, 0.4, 1.4, 8);
      const bMesh = new THREE.Mesh(bGeom, darkAndesiteMat);
      bMesh.position.set(bx, 0.7, 0.3);
      portalGroup.add(bMesh);

      const fGeom = new THREE.ConeGeometry(0.4, 0.85, 8);
      const fMesh = new THREE.Mesh(fGeom, jadeGlowMat);
      fMesh.position.set(bx, 1.7, 0.3);
      portalGroup.add(fMesh);

      const bLight = new THREE.PointLight(0x34d399, 2.5, 10);
      bLight.position.set(bx, 1.8, 0.5);
      portalGroup.add(bLight);
    });

    templeGroup.add(portalGroup);

    scene.add(templeGroup);

    return {
      group: templeGroup,
      colliders,
      platforms,
      portalPos: new THREE.Vector3(cx, topPlatformY + 1.2, cz + portalZ),
      portalRing,
    };
  }
}
