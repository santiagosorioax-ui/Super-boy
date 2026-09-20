import * as THREE from 'three';
import { TextureSynthesizer } from './TextureSynthesizer';

export interface ChocoTempleElements {
  group: THREE.Group;
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  returnPortalPos: THREE.Vector3;
  returnPortalRing: THREE.Mesh;
  arenaCenter: THREE.Vector3;
  update: (dt: number, time: number) => void;
}

export class ChocoTempleBuilder {
  public static build(
    scene: THREE.Scene,
    originX = 1400,
    originZ = 1400,
    groundH = 0.4
  ): ChocoTempleElements {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(originX, groundH, originZ);

    const colliders: THREE.Box3[] = [];
    const platforms: { box: THREE.Box3; topY: number }[] = [];

    // --- TEMPLE CHOCO MATERIALS ---
    const carvedChocoNorm = TextureSynthesizer.getChocoCarvedNormal();

    const darkChocoMat = new THREE.MeshStandardMaterial({
      color: 0x2b1304, // Rich 85% Dark Chocolate
      roughness: 0.38,
      metalness: 0.08,
      normalMap: carvedChocoNorm,
      normalScale: new THREE.Vector2(0.4, 0.4),
    });
    const milkChocoMat = new THREE.MeshStandardMaterial({
      color: 0x5a2d0c, // Silky Milk Chocolate
      roughness: 0.4,
      metalness: 0.05,
      normalMap: carvedChocoNorm,
      normalScale: new THREE.Vector2(0.35, 0.35),
    });
    const whiteChocoMat = new THREE.MeshStandardMaterial({
      color: 0xfff8eb, // Vanilla White Chocolate
      roughness: 0.32,
      normalMap: carvedChocoNorm,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
    const waferCrustMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Crispy Golden Wafer
      roughness: 0.75,
    });
    const caramelGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.2,
    });
    const moltenCaramelMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });
    const rubyCherryMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });

    // 1. ARENA AREAL CHECKERBOARD FLOOR (38m x 38m)
    const arenaSize = 38;
    const arenaHalf = arenaSize / 2;
    const floorTileSize = 4.75;
    const tilesPerSide = arenaSize / floorTileSize;

    const floorSubGroup = new THREE.Group();
    for (let ix = 0; ix < tilesPerSide; ix++) {
      for (let iz = 0; iz < tilesPerSide; iz++) {
        const isDark = (ix + iz) % 2 === 0;
        const tileGeom = new THREE.BoxGeometry(floorTileSize - 0.1, 0.8, floorTileSize - 0.1);
        const tileMesh = new THREE.Mesh(tileGeom, isDark ? darkChocoMat : milkChocoMat);
        tileMesh.position.set(
          -arenaHalf + (ix + 0.5) * floorTileSize,
          -0.4,
          -arenaHalf + (iz + 0.5) * floorTileSize
        );
        tileMesh.receiveShadow = true;
        floorSubGroup.add(tileMesh);
      }
    }
    templeGroup.add(floorSubGroup);

    // Floor platform for player collision
    const floorBox = new THREE.Box3(
      new THREE.Vector3(originX - arenaHalf, groundH - 0.8, originZ - arenaHalf),
      new THREE.Vector3(originX + arenaHalf, groundH, originZ + arenaHalf)
    );
    platforms.push({ box: floorBox, topY: groundH });

    // Golden Sugar Center Medallion (Sacred Cocoa Seal)
    const medallionGeom = new THREE.CylinderGeometry(5.5, 5.5, 0.12, 32);
    const medallion = new THREE.Mesh(medallionGeom, caramelGoldMat);
    medallion.position.set(0, 0.06, 0);
    medallion.receiveShadow = true;
    templeGroup.add(medallion);

    const medallionInnerGeom = new THREE.CylinderGeometry(4.2, 4.2, 0.16, 24);
    const medallionInner = new THREE.Mesh(medallionInnerGeom, darkChocoMat);
    medallionInner.position.set(0, 0.08, 0);
    templeGroup.add(medallionInner);

    // 2. COLOSSAL CHOCOLATE PERIMETER WALLS & BATTLEMENTS
    const wallHeight = 9.0;
    const wallThickness = 2.4;

    const createWall = (
      x: number,
      z: number,
      w: number,
      d: number,
      addCrenellations = true
    ) => {
      const wallGeom = new THREE.BoxGeometry(w, wallHeight, d);
      const wallMesh = new THREE.Mesh(wallGeom, darkChocoMat);
      wallMesh.position.set(x, wallHeight / 2, z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      templeGroup.add(wallMesh);

      // Gold wafer trim along the top
      const trimGeom = new THREE.BoxGeometry(w + 0.4, 0.6, d + 0.4);
      const trimMesh = new THREE.Mesh(trimGeom, waferCrustMat);
      trimMesh.position.set(x, wallHeight + 0.3, z);
      templeGroup.add(trimMesh);

      // Add crenellations (chocolate teeth)
      if (addCrenellations) {
        const count = Math.floor(Math.max(w, d) / 2.5);
        for (let i = 0; i < count; i++) {
          if (i % 2 === 0) {
            const toothGeom = new THREE.BoxGeometry(
              w > d ? 1.4 : d + 0.2,
              1.2,
              w > d ? w + 0.2 : 1.4
            );
            const tooth = new THREE.Mesh(toothGeom, milkChocoMat);
            if (w > d) {
              tooth.position.set(x - w / 2 + (i + 0.5) * (w / count), wallHeight + 1.2, z);
            } else {
              tooth.position.set(x, wallHeight + 1.2, z - d / 2 + (i + 0.5) * (d / count));
            }
            templeGroup.add(tooth);
          }
        }
      }

      // Collider
      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(originX + x - w / 2, groundH, originZ + z - d / 2),
          new THREE.Vector3(originX + x + w / 2, groundH + wallHeight + 3, originZ + z + d / 2)
        )
      );
    };

    // North Wall (Back Throne Wall)
    createWall(0, -arenaHalf - wallThickness / 2, arenaSize + wallThickness * 2, wallThickness);
    // East Wall
    createWall(arenaHalf + wallThickness / 2, 0, wallThickness, arenaSize);
    // West Wall
    createWall(-arenaHalf - wallThickness / 2, 0, wallThickness, arenaSize);
    // South Wall (Front Wall with portal doorway opening)
    const doorGap = 7.0;
    const halfSouthWidth = (arenaSize - doorGap) / 2;
    createWall(
      -arenaHalf + halfSouthWidth / 2,
      arenaHalf + wallThickness / 2,
      halfSouthWidth,
      wallThickness
    );
    createWall(
      arenaHalf - halfSouthWidth / 2,
      arenaHalf + wallThickness / 2,
      halfSouthWidth,
      wallThickness
    );
    // Arch over the south portal doorway
    const southArchGeom = new THREE.BoxGeometry(doorGap + 0.8, 3.2, wallThickness);
    const southArch = new THREE.Mesh(southArchGeom, darkChocoMat);
    southArch.position.set(0, wallHeight - 1.6, arenaHalf + wallThickness / 2);
    templeGroup.add(southArch);

    // 3. EIGHT COLOSSAL MARBLED CHOCOLATE PILLARS
    const pillarCoords = [
      { x: -12, z: -12 },
      { x: 12, z: -12 },
      { x: -12, z: 0 },
      { x: 12, z: 0 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: -5.5, z: -arenaHalf + 2.8 },
      { x: 5.5, z: -arenaHalf + 2.8 },
    ];

    const torchFires: THREE.Mesh[] = [];

    pillarCoords.forEach((p) => {
      // Pillar Base
      const baseGeom = new THREE.BoxGeometry(2.4, 1.2, 2.4);
      const base = new THREE.Mesh(baseGeom, waferCrustMat);
      base.position.set(p.x, 0.6, p.z);
      base.castShadow = true;
      templeGroup.add(base);

      // Shaft
      const shaftGeom = new THREE.CylinderGeometry(0.85, 0.95, wallHeight - 1.2, 16);
      const shaft = new THREE.Mesh(shaftGeom, milkChocoMat);
      shaft.position.set(p.x, wallHeight / 2 + 0.2, p.z);
      shaft.castShadow = true;
      templeGroup.add(shaft);

      // White Chocolate Spiral Ribbon Ring
      for (let r = 0; r < 4; r++) {
        const ringGeom = new THREE.TorusGeometry(0.92, 0.12, 8, 24);
        const ring = new THREE.Mesh(ringGeom, whiteChocoMat);
        ring.position.set(p.x, 1.8 + r * 1.8, p.z);
        ring.rotation.x = Math.PI / 2;
        templeGroup.add(ring);
      }

      // Capital (Top)
      const capGeom = new THREE.BoxGeometry(2.2, 0.9, 2.2);
      const cap = new THREE.Mesh(capGeom, waferCrustMat);
      cap.position.set(p.x, wallHeight - 0.2, p.z);
      templeGroup.add(cap);

      // Sconce / Cacao Torch on Pillar
      const sconceGeom = new THREE.ConeGeometry(0.45, 0.8, 8);
      const sconce = new THREE.Mesh(sconceGeom, caramelGoldMat);
      sconce.position.set(p.x, 3.8, p.z + 0.9);
      sconce.rotation.x = Math.PI;
      templeGroup.add(sconce);

      // Warm Amber Sweet Flame
      const flameGeom = new THREE.SphereGeometry(0.3, 8, 8);
      flameGeom.scale(0.8, 1.5, 0.8);
      const flame = new THREE.Mesh(flameGeom, moltenCaramelMat);
      flame.position.set(p.x, 4.3, p.z + 0.9);
      templeGroup.add(flame);
      torchFires.push(flame);

      // Collider for pillar
      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(originX + p.x - 1.2, groundH, originZ + p.z - 1.2),
          new THREE.Vector3(originX + p.x + 1.2, groundH + wallHeight, originZ + p.z + 1.2)
        )
      );
    });

    // 4. NORTH WALL MOLTEN CHOCOLATE ALTAR & CASCADE
    const altarBaseGeom = new THREE.BoxGeometry(14, 2.2, 4.5);
    const altarBase = new THREE.Mesh(altarBaseGeom, darkChocoMat);
    altarBase.position.set(0, 1.1, -arenaHalf + 2.5);
    templeGroup.add(altarBase);

    // Altar Steps
    const altarStepsGeom = new THREE.BoxGeometry(10, 1.1, 2.4);
    const altarSteps = new THREE.Mesh(altarStepsGeom, waferCrustMat);
    altarSteps.position.set(0, 0.55, -arenaHalf + 5.2);
    templeGroup.add(altarSteps);

    // Golden Cacao Cauldron
    const cauldronGeom = new THREE.CylinderGeometry(2.0, 1.4, 2.2, 16);
    const cauldron = new THREE.Mesh(cauldronGeom, caramelGoldMat);
    cauldron.position.set(0, 2.4, -arenaHalf + 2.5);
    templeGroup.add(cauldron);

    // Molten Caramel Basin Inside Cauldron
    const lavaCaramelGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.2, 16);
    const lavaCaramel = new THREE.Mesh(lavaCaramelGeom, moltenCaramelMat);
    lavaCaramel.position.set(0, 3.4, -arenaHalf + 2.5);
    templeGroup.add(lavaCaramel);

    // Light from the cauldron
    const cauldronLight = new THREE.PointLight(0xf59e0b, 3.5, 24);
    cauldronLight.position.set(0, 4.0, -arenaHalf + 2.5);
    templeGroup.add(cauldronLight);

    // Colliders for altar
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(originX - 7, groundH, originZ - arenaHalf),
        new THREE.Vector3(originX + 7, groundH + 3.5, originZ - arenaHalf + 4.8)
      )
    );

    // 5. RETURN PORTAL TO MUNDO CARAMELO
    const returnPortalPos = new THREE.Vector3(originX, groundH, originZ + arenaHalf - 2.5);
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, arenaHalf - 2.5);

    // Portal Pedestal
    const portalBaseGeom = new THREE.CylinderGeometry(3.0, 3.4, 0.4, 24);
    const portalBase = new THREE.Mesh(portalBaseGeom, waferCrustMat);
    portalBase.position.y = 0.2;
    portalGroup.add(portalBase);

    // Portal Outer Arch
    const archGeom = new THREE.TorusGeometry(2.4, 0.35, 16, 32, Math.PI);
    const archMesh = new THREE.Mesh(archGeom, darkChocoMat);
    archMesh.position.set(0, 0.4, 0);
    portalGroup.add(archMesh);

    // Swirling Caramel Return Vortex
    const vortexRingGeom = new THREE.TorusGeometry(2.0, 0.25, 16, 32);
    const returnPortalRing = new THREE.Mesh(vortexRingGeom, caramelGoldMat);
    returnPortalRing.position.set(0, 2.4, 0);
    portalGroup.add(returnPortalRing);

    // Shimmering Portal Inner Disc
    const portalDiscGeom = new THREE.CircleGeometry(1.9, 24);
    const portalDiscMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6, // Strawberry icing pink return glow
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const portalDisc = new THREE.Mesh(portalDiscGeom, portalDiscMat);
    portalDisc.position.set(0, 2.4, 0);
    portalGroup.add(portalDisc);

    // Portal Glow Light
    const portalLight = new THREE.PointLight(0xf472b6, 2.5, 14);
    portalLight.position.set(0, 2.6, 0);
    portalGroup.add(portalLight);

    templeGroup.add(portalGroup);

    // Add everything to scene
    scene.add(templeGroup);

    // Center Arena Point Lights for rich warm ambience
    const centerAmbLight1 = new THREE.PointLight(0xffedd5, 1.8, 30);
    centerAmbLight1.position.set(originX, groundH + 7.0, originZ - 6);
    scene.add(centerAmbLight1);

    const centerAmbLight2 = new THREE.PointLight(0xfbbf24, 1.4, 25);
    centerAmbLight2.position.set(originX, groundH + 6.0, originZ + 6);
    scene.add(centerAmbLight2);

    const arenaCenter = new THREE.Vector3(originX, groundH, originZ);

    return {
      group: templeGroup,
      colliders,
      platforms,
      returnPortalPos,
      returnPortalRing,
      arenaCenter,
      update: (dt: number, time: number) => {
        // Animate return portal
        returnPortalRing.rotation.z += 1.8 * dt;
        returnPortalRing.rotation.y = Math.sin(time * 2.5) * 0.2;

        // Animate torch flames
        torchFires.forEach((flame, idx) => {
          const flicker = 1.0 + Math.sin(time * 7 + idx) * 0.15;
          flame.scale.set(0.8 * flicker, 1.5 * flicker, 0.8 * flicker);
        });

        // Animate Cauldron Molten Caramel
        lavaCaramel.position.y = 3.4 + Math.sin(time * 3) * 0.05;
      },
    };
  }
}
