import * as THREE from 'three';

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
    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xa8a29e, // Warm Mesoamerican limestone/sandstone
      roughness: 0.75,
      flatShading: true,
    });
    const darkAndesiteMat = new THREE.MeshStandardMaterial({
      color: 0x57534e, // Weathered volcanic andesite
      roughness: 0.8,
    });
    const carvedBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x292524, // Carved basalt serpent stone
      roughness: 0.7,
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
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });

    // 1. Four Monumental Stepped Pyramid Tiers (Chichén Itzá style)
    const tiers = [
      { w: 32, d: 32, h: 2.2, y: groundH + 1.1 },
      { w: 26, d: 26, h: 2.2, y: groundH + 3.3 },
      { w: 20, d: 20, h: 2.2, y: groundH + 5.5 },
      { w: 14, d: 14, h: 2.0, y: groundH + 7.5 },
    ];

    tiers.forEach((t) => {
      const tierGeom = new THREE.BoxGeometry(t.w, t.h, t.d);
      const tierMesh = new THREE.Mesh(tierGeom, sandstoneMat);
      tierMesh.position.set(0, t.y, 0);
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      templeGroup.add(tierMesh);

      // Decorative Cornice / Tablero molding on each tier
      const corniceGeom = new THREE.BoxGeometry(t.w + 0.6, 0.35, t.d + 0.6);
      const corniceMesh = new THREE.Mesh(corniceGeom, darkAndesiteMat);
      corniceMesh.position.set(0, t.y + t.h / 2 - 0.17, 0);
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

    const topPlatformY = groundH + 8.5;

    // 2. Monumental Accessible Grand Central Staircase (Facing South +Z towards Spawn)
    // 18 wide, gentle-climb steps with full side balustrades
    const stepCount = 18;
    const stepWidth = 7.5;
    const totalStepRise = topPlatformY - groundH;
    const stepHeight = totalStepRise / stepCount; // ~0.47m walkable rise!
    const stepDepth = 0.95;
    const stairsStartOffsetZ = 16.5; // Starts at base perimeter

    for (let s = 0; s < stepCount; s++) {
      const stepY = groundH + (s + 0.5) * stepHeight;
      const stepZ = stairsStartOffsetZ - s * stepDepth * 0.92;

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

    // 2.1 Staircase Slanted Stone Balustrades (Rampas de serpiente)
    const rampLength = Math.hypot(stairsStartOffsetZ, totalStepRise);
    const balustradeGeom = new THREE.BoxGeometry(0.8, 0.6, rampLength * 0.95);

    const balustradeL = new THREE.Mesh(balustradeGeom, sandstoneMat);
    balustradeL.position.set(-stepWidth / 2 - 0.4, topPlatformY / 2, stairsStartOffsetZ / 2 + 1);
    balustradeL.rotation.x = Math.atan2(totalStepRise, stairsStartOffsetZ * 0.92);
    balustradeL.castShadow = true;
    templeGroup.add(balustradeL);

    const balustradeR = new THREE.Mesh(balustradeGeom, sandstoneMat);
    balustradeR.position.set(stepWidth / 2 + 0.4, topPlatformY / 2, stairsStartOffsetZ / 2 + 1);
    balustradeR.rotation.x = Math.atan2(totalStepRise, stairsStartOffsetZ * 0.92);
    balustradeR.castShadow = true;
    templeGroup.add(balustradeR);

    // 2.2 Kukulkán Feathered Serpent Stone Heads at base of stairs
    [-stepWidth / 2 - 0.4, stepWidth / 2 + 0.4].forEach((hx) => {
      const serpentHead = new THREE.Group();
      serpentHead.position.set(hx, groundH + 0.6, stairsStartOffsetZ + 0.8);

      // Snout
      const snoutGeom = new THREE.BoxGeometry(0.7, 0.55, 0.9);
      const snout = new THREE.Mesh(snoutGeom, carvedBasaltMat);
      snout.castShadow = true;
      serpentHead.add(snout);

      // Fangs
      const fangGeom = new THREE.ConeGeometry(0.1, 0.28, 4);
      const fangL = new THREE.Mesh(fangGeom, goldOrnamentMat);
      fangL.position.set(-0.2, -0.22, 0.35);
      fangL.rotation.x = Math.PI;
      serpentHead.add(fangL);

      const fangR = new THREE.Mesh(fangGeom, goldOrnamentMat);
      fangR.position.set(0.2, -0.22, 0.35);
      fangR.rotation.x = Math.PI;
      serpentHead.add(fangR);

      // Glowing Jade Eyes
      const eyeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.08);
      const eyeL = new THREE.Mesh(eyeGeom, jadeGlowMat);
      eyeL.position.set(-0.28, 0.15, 0.1);
      serpentHead.add(eyeL);

      const eyeR = new THREE.Mesh(eyeGeom, jadeGlowMat);
      eyeR.position.set(0.28, 0.15, 0.1);
      serpentHead.add(eyeR);

      templeGroup.add(serpentHead);
    });

    // 3. Summit Sanctuary Shrine (Templo de la Cúspide)
    const shrineW = 9.5;
    const shrineD = 9.5;
    const shrineH = 4.2;
    const shrineY = topPlatformY + shrineH / 2;

    // Shrine Outer Walls
    const shrineGeom = new THREE.BoxGeometry(shrineW, shrineH, shrineD);
    const shrineMesh = new THREE.Mesh(shrineGeom, sandstoneMat);
    shrineMesh.position.set(0, shrineY, 0);
    shrineMesh.castShadow = true;
    shrineMesh.receiveShadow = true;
    templeGroup.add(shrineMesh);

    // Shrine Sloped Roof Structure
    const roofGeom = new THREE.BoxGeometry(shrineW + 1.2, 1.4, shrineD + 1.2);
    const roofMesh = new THREE.Mesh(roofGeom, darkAndesiteMat);
    roofMesh.position.set(0, topPlatformY + shrineH + 0.7, 0);
    roofMesh.castShadow = true;
    templeGroup.add(roofMesh);

    // Crest Comb (Crestería Maya on roof)
    const crestGeom = new THREE.BoxGeometry(shrineW * 0.7, 1.6, 0.6);
    const crestMesh = new THREE.Mesh(crestGeom, carvedBasaltMat);
    crestMesh.position.set(0, topPlatformY + shrineH + 2.0, 0);
    crestMesh.castShadow = true;
    templeGroup.add(crestMesh);

    const shrineBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, shrineY, cz),
      new THREE.Vector3(shrineW, shrineH, shrineD)
    );
    colliders.push(shrineBox);
    platforms.push({ box: shrineBox, topY: topPlatformY + shrineH + 1.4 });

    // 4. Portal Gate Archway & Interactive Doorway
    const portalZ = shrineD / 2 + 0.4;
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, topPlatformY, portalZ);

    // Door Portal Opening
    const doorFrameGeom = new THREE.BoxGeometry(3.6, 3.8, 0.6);
    const doorFrame = new THREE.Mesh(doorFrameGeom, darkAndesiteMat);
    doorFrame.position.set(0, 1.9, 0);
    portalGroup.add(doorFrame);

    // Glowing Green-Gold Mystic Mayan Portal Ring (Entry to Boss Chamber)
    const ringGeom = new THREE.TorusGeometry(1.6, 0.16, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.5,
    });
    const portalRing = new THREE.Mesh(ringGeom, ringMat);
    portalRing.position.set(0, 1.9, 0.2);
    portalGroup.add(portalRing);

    // Mystical Door Light
    const doorLight = new THREE.PointLight(0x10b981, 3.0, 12);
    doorLight.position.set(0, 2.0, 0.6);
    portalGroup.add(doorLight);

    // 5. 2 Braziers with Mayan Green Sacred Fire flanking the door
    [-3.2, 3.2].forEach((bx) => {
      const bGeom = new THREE.CylinderGeometry(0.5, 0.35, 1.2, 8);
      const bMesh = new THREE.Mesh(bGeom, darkAndesiteMat);
      bMesh.position.set(bx, 0.6, 0.2);
      portalGroup.add(bMesh);

      const fGeom = new THREE.ConeGeometry(0.35, 0.7, 8);
      const fMesh = new THREE.Mesh(fGeom, jadeGlowMat);
      fMesh.position.set(bx, 1.4, 0.2);
      portalGroup.add(fMesh);

      const bLight = new THREE.PointLight(0x34d399, 2.2, 8);
      bLight.position.set(bx, 1.5, 0.4);
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
