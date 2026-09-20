import * as THREE from 'three';
import { CoinData } from '../types';
import { TextureSynthesizer } from './TextureSynthesizer';

export interface SweetCampfireInstance {
  pos: THREE.Vector3;
  safeRadius: number;
  light: THREE.PointLight;
  flameMeshes: THREE.Mesh[];
  emberMesh: THREE.Mesh;
}

export interface CandyWorldElements {
  group: THREE.Group;
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[];
  coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[];
  mainPortal: { pos: THREE.Vector3; mesh: THREE.Group; ring: THREE.Mesh };
  candyPortal: { pos: THREE.Vector3; mesh: THREE.Group; ring: THREE.Mesh };
  chocoPortal: { pos: THREE.Vector3; mesh: THREE.Group; ring: THREE.Mesh };
  castleArenaCenter: THREE.Vector3;
  campfires: SweetCampfireInstance[];
  update: (dt: number, time: number) => void;
}

export class CandyWorldBuilder {
  public static build(
    scene: THREE.Scene,
    coinStartId = 100,
    getTerrainHeightFn?: (x: number, z: number) => number
  ): CandyWorldElements {
    const group = new THREE.Group();
    const colliders: THREE.Box3[] = [];
    const platforms: { box: THREE.Box3; topY: number }[] = [];
    const springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[] = [];
    const coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[] = [];

    const originX = 600;
    const originZ = 600;

    // --- MATERIALS ---
    const glazeNormal = TextureSynthesizer.getCandyGlazeNormal();

    const frostingMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Strawberry icing pink
      roughness: 0.55,
      metalness: 0.05,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.25, 0.25),
    });
    const biscuitMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Waffle / Wafer crust
      roughness: 0.8,
    });
    const chocolateDarkMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Rich Dark Chocolate
      roughness: 0.38,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.18, 0.18),
    });
    const chocolateMilkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Creamy Milk Chocolate
      roughness: 0.42,
    });
    const marshmallowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Fluffy White Marshmallow
      roughness: 0.8,
    });
    const candyCaneRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Glossy Cherry Red Candy
      roughness: 0.28,
      metalness: 0.1,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.2, 0.2),
    });
    const candyCaneWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure White Peppermint Sugar
      roughness: 0.28,
    });
    const lollipopMintMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Mint Lime Candy
      roughness: 0.22,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
    const lollipopBerryMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Grape / Blueberry Candy
      roughness: 0.22,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
    const lollipopLemonMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Sweet Lemon Drop
      roughness: 0.22,
      normalMap: glazeNormal,
      normalScale: new THREE.Vector2(0.3, 0.3),
    });
    const gummyGreenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const gummyPinkMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const gummyOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const gummyCyanMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });

    // 1. Frosting Terrain Main Island (Expanded from 220x220 to 310x310)
    const islandGeom = new THREE.CylinderGeometry(150, 156, 6, 40);
    const island = new THREE.Mesh(islandGeom, frostingMat);
    island.position.set(originX, -2.6, originZ);
    island.receiveShadow = true;
    island.castShadow = true;
    group.add(island);

    // Biscuit wafer rim around expanded main island
    const rimGeom = new THREE.TorusGeometry(152, 3.5, 12, 40);
    const rim = new THREE.Mesh(rimGeom, biscuitMat);
    rim.position.set(originX, 0.2, originZ);
    rim.rotation.x = Math.PI / 2;
    rim.receiveShadow = true;
    group.add(rim);

    // Satellite Island 1: "Isla de los Malvaviscos Flotantes" (West)
    const sat1Geom = new THREE.CylinderGeometry(42, 46, 5, 24);
    const sat1Mesh = new THREE.Mesh(sat1Geom, frostingMat);
    sat1Mesh.position.set(originX - 120, -2.2, originZ - 25);
    sat1Mesh.receiveShadow = true;
    group.add(sat1Mesh);

    const sat1Rim = new THREE.Mesh(new THREE.TorusGeometry(43, 2.2, 10, 24), biscuitMat);
    sat1Rim.position.set(originX - 120, 0.3, originZ - 25);
    sat1Rim.rotation.x = Math.PI / 2;
    group.add(sat1Rim);

    // Satellite Island 2: "Archipiélago de Gomitas Saltarinas" (East)
    const sat2Geom = new THREE.CylinderGeometry(45, 48, 5, 24);
    const sat2Mesh = new THREE.Mesh(sat2Geom, frostingMat);
    sat2Mesh.position.set(originX + 125, -2.2, originZ + 30);
    sat2Mesh.receiveShadow = true;
    group.add(sat2Mesh);

    const sat2Rim = new THREE.Mesh(new THREE.TorusGeometry(46, 2.2, 10, 24), biscuitMat);
    sat2Rim.position.set(originX + 125, 0.3, originZ + 30);
    sat2Rim.rotation.x = Math.PI / 2;
    group.add(sat2Rim);

    // Satellite Island 3: "Cumbres Azucaradas del Norte" (North, behind Templo Choco)
    const sat3Geom = new THREE.CylinderGeometry(48, 52, 6, 24);
    const sat3Mesh = new THREE.Mesh(sat3Geom, frostingMat);
    sat3Mesh.position.set(originX, -2.0, originZ + 135);
    sat3Mesh.receiveShadow = true;
    group.add(sat3Mesh);

    // Grand Wafer Bridges connecting satellite islands
    const createWaferBridge = (x1: number, z1: number, x2: number, z2: number, width = 5.0) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dx, dz);

      const bGeom = new THREE.BoxGeometry(width, 0.6, dist);
      const bMesh = new THREE.Mesh(bGeom, biscuitMat);
      bMesh.position.set((x1 + x2) / 2, 0.3, (z1 + z2) / 2);
      bMesh.rotation.y = angle;
      bMesh.receiveShadow = true;
      group.add(bMesh);
    };

    createWaferBridge(originX - 85, originZ - 15, originX - 120, originZ - 25);
    createWaferBridge(originX + 85, originZ + 20, originX + 125, originZ + 30);
    createWaferBridge(originX, originZ + 90, originX, originZ + 135);

    // Sprinkles on the frosting ground
    const sprinkleColors = [0x38bdf8, 0xfacc15, 0xef4444, 0x10b981, 0xa855f7, 0xffffff];
    for (let i = 0; i < 150; i++) {
      const angle = (i * 2.39) % (Math.PI * 2);
      const rad = 8 + ((i * 23) % 135);
      const sx = originX + Math.cos(angle) * rad;
      const sz = originZ + Math.sin(angle) * rad;

      const sprinkleGeom = new THREE.CapsuleGeometry(0.18, 0.7, 4, 8);
      const sMat = new THREE.MeshStandardMaterial({
        color: sprinkleColors[i % sprinkleColors.length],
        roughness: 0.3,
      });
      const sprinkle = new THREE.Mesh(sprinkleGeom, sMat);
      sprinkle.position.set(sx, 0.45, sz);
      sprinkle.rotation.set(Math.PI / 2, 0, (i * 1.2) % Math.PI);
      sprinkle.castShadow = true;
      group.add(sprinkle);
    }

    // 2. Central Candy Plaza & Return Portal Arch
    const candyPlazaGeom = new THREE.CylinderGeometry(10, 11, 0.6, 24);
    const candyPlaza = new THREE.Mesh(candyPlazaGeom, biscuitMat);
    candyPlaza.position.set(originX, 0.3, originZ);
    candyPlaza.receiveShadow = true;
    group.add(candyPlaza);

    // 3. Candy Canes (Striped Arches & Pillars)
    const createCandyCane = (x: number, z: number, height = 7, scale = 1.0) => {
      const caneGroup = new THREE.Group();
      caneGroup.position.set(x, 0.4, z);
      caneGroup.scale.set(scale, scale, scale);

      // Stacked alternating red & white segments
      const segmentHeight = 0.5;
      const segments = Math.floor(height / segmentHeight);
      for (let s = 0; s < segments; s++) {
        const segGeom = new THREE.CylinderGeometry(0.4, 0.4, segmentHeight, 12);
        const seg = new THREE.Mesh(segGeom, s % 2 === 0 ? candyCaneRedMat : candyCaneWhiteMat);
        seg.position.y = s * segmentHeight + segmentHeight / 2;
        seg.castShadow = true;
        caneGroup.add(seg);
      }

      // Curved hook on top
      const hookGeom = new THREE.TorusGeometry(1.2, 0.4, 12, 16, Math.PI);
      const hook = new THREE.Mesh(hookGeom, candyCaneRedMat);
      hook.position.set(1.2, height, 0);
      hook.rotation.z = Math.PI;
      hook.castShadow = true;
      caneGroup.add(hook);

      group.add(caneGroup);

      // Collider
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, height / 2, z),
        new THREE.Vector3(1.2 * scale, height * scale, 1.2 * scale)
      );
      colliders.push(box);
      platforms.push({ box, topY: height * scale });
    };

    // Place decorative giant candy canes around plaza and pathways
    createCandyCane(originX - 7, originZ - 7, 8, 1.2);
    createCandyCane(originX + 7, originZ - 7, 8, 1.2);
    createCandyCane(originX - 7, originZ + 7, 8, 1.2);
    createCandyCane(originX + 7, originZ + 7, 8, 1.2);
    createCandyCane(originX - 25, originZ + 15, 9, 1.3);
    createCandyCane(originX + 30, originZ - 20, 10, 1.4);
    createCandyCane(originX + 45, originZ + 35, 11, 1.5);
    createCandyCane(originX - 50, originZ - 40, 10, 1.4);

    // 4. Giant Swirl Lollipop Trees
    const createLollipopTree = (x: number, z: number, height = 9, flavor: 'cherry' | 'mint' | 'berry' | 'lemon' = 'cherry') => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0.4, z);

      // White candy stick trunk
      const stickGeom = new THREE.CylinderGeometry(0.35, 0.4, height, 12);
      const stick = new THREE.Mesh(stickGeom, candyCaneWhiteMat);
      stick.position.y = height / 2;
      stick.castShadow = true;
      treeGroup.add(stick);

      // Huge Swirl Disc Head
      const discMat =
        flavor === 'mint'
          ? lollipopMintMat
          : flavor === 'berry'
          ? lollipopBerryMat
          : flavor === 'lemon'
          ? lollipopLemonMat
          : candyCaneRedMat;

      const headGeom = new THREE.CylinderGeometry(3.0, 3.0, 0.9, 24);
      const head = new THREE.Mesh(headGeom, discMat);
      head.position.y = height + 2.5;
      head.rotation.z = Math.PI / 2;
      head.castShadow = true;
      treeGroup.add(head);

      // Swirl Spiral Rings on the sides
      const spiralGeom = new THREE.TorusGeometry(1.8, 0.15, 8, 24);
      const spiral1 = new THREE.Mesh(spiralGeom, candyCaneWhiteMat);
      spiral1.position.set(0.48, height + 2.5, 0);
      spiral1.rotation.y = Math.PI / 2;
      treeGroup.add(spiral1);

      const spiral2 = new THREE.Mesh(spiralGeom, candyCaneWhiteMat);
      spiral2.position.set(-0.48, height + 2.5, 0);
      spiral2.rotation.y = Math.PI / 2;
      treeGroup.add(spiral2);

      group.add(treeGroup);

      // Trunk and Top platforms
      const trunkBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, height / 2, z),
        new THREE.Vector3(1.2, height, 1.2)
      );
      colliders.push(trunkBox);

      const topBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, height + 2.5, z),
        new THREE.Vector3(5.5, 1.0, 5.5)
      );
      platforms.push({ box: topBox, topY: height + 3.0 });
    };

    // Place Lollipop Trees
    createLollipopTree(originX - 18, originZ - 20, 8, 'cherry');
    createLollipopTree(originX + 22, originZ - 18, 9, 'mint');
    createLollipopTree(originX - 28, originZ + 25, 10, 'berry');
    createLollipopTree(originX + 26, originZ + 24, 8.5, 'lemon');
    createLollipopTree(originX + 48, originZ - 10, 11, 'cherry');
    createLollipopTree(originX - 45, originZ - 15, 10, 'mint');
    createLollipopTree(originX + 15, originZ + 55, 12, 'berry');
    createLollipopTree(originX - 35, originZ + 50, 11.5, 'lemon');

    // 5. Giant Chocolate Bar Platforms (Tiered Mountain)
    const createChocolatePlatform = (x: number, y: number, z: number, w = 6, d = 4, isDark = false) => {
      const barGeom = new THREE.BoxGeometry(w, 0.8, d);
      const bar = new THREE.Mesh(barGeom, isDark ? chocolateDarkMat : chocolateMilkMat);
      bar.position.set(x, y + 0.4, z);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);

      // Chocolate segments grooves
      const gridCols = Math.floor(w / 1.5);
      const gridRows = Math.floor(d / 1.5);
      for (let c = 0; c < gridCols; c++) {
        for (let r = 0; r < gridRows; r++) {
          const blockGeom = new THREE.BoxGeometry(1.2, 0.2, 1.2);
          const block = new THREE.Mesh(blockGeom, isDark ? chocolateDarkMat : chocolateMilkMat);
          block.position.set(
            x - w / 2 + 0.8 + c * 1.5,
            y + 0.85,
            z - d / 2 + 0.8 + r * 1.5
          );
          group.add(block);
        }
      }

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y + 0.4, z),
        new THREE.Vector3(w, 0.8, d)
      );
      colliders.push(box);
      platforms.push({ box, topY: y + 0.95 });
    };

    // Chocolate Staircase Mountain Course
    createChocolatePlatform(originX - 15, 1.5, originZ - 35, 7, 5, true);
    createChocolatePlatform(originX - 15, 4.0, originZ - 45, 6, 5, false);
    createChocolatePlatform(originX - 5, 7.0, originZ - 52, 6, 5, true);
    createChocolatePlatform(originX + 8, 10.0, originZ - 52, 6, 5, false);
    createChocolatePlatform(originX + 22, 13.5, originZ - 45, 7, 6, true);
    createChocolatePlatform(originX + 32, 17.0, originZ - 35, 6, 6, false); // Summit Grand Sweet Star!

    // 6. Floating Marshmallow Clouds & Steps
    const createMarshmallowStep = (x: number, y: number, z: number, radius = 2.0) => {
      const geom = new THREE.CylinderGeometry(radius, radius, 0.7, 16);
      const mesh = new THREE.Mesh(geom, marshmallowMat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(radius * 2, 0.7, radius * 2)
      );
      platforms.push({ box, topY: y + 0.35 });
    };

    createMarshmallowStep(originX - 35, 3.5, originZ - 10, 2.2);
    createMarshmallowStep(originX - 45, 6.0, originZ + 5, 2.4);
    createMarshmallowStep(originX - 40, 9.0, originZ + 25, 2.2);
    createMarshmallowStep(originX - 25, 12.0, originZ + 38, 2.5);
    createMarshmallowStep(originX - 5, 15.0, originZ + 45, 2.8);

    // 7. Gummy Bear Trampolines (Bouncers - "Los trampolines son gomitas")
    const createGummyTrampoline = (
      x: number,
      y: number,
      z: number,
      color: 'pink' | 'green' | 'orange' | 'cyan',
      rotation = 0
    ) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(x, y, z);
      padGroup.rotation.y = rotation;

      const mat =
        color === 'green'
          ? gummyGreenMat
          : color === 'orange'
          ? gummyOrangeMat
          : color === 'cyan'
          ? gummyCyanMat
          : gummyPinkMat;

      // 7.1 Translucent Sugar Ring Base
      const sugarBase = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.6, 0.25, 24),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          transparent: true,
          opacity: 0.7,
        })
      );
      sugarBase.position.y = 0.12;
      padGroup.add(sugarBase);

      // 7.2 Main Gummy Bear Bouncy Cushion Body
      const bodyGeom = new THREE.CylinderGeometry(2.1, 2.3, 0.65, 24);
      const bodyMesh = new THREE.Mesh(bodyGeom, mat);
      bodyMesh.position.y = 0.45;
      bodyMesh.castShadow = true;
      padGroup.add(bodyMesh);

      // 7.3 Cute Big Round Gummy Bear Ears
      const earGeom = new THREE.SphereGeometry(0.6, 16, 16);
      earGeom.scale(1.0, 0.75, 0.6);

      const leftEar = new THREE.Mesh(earGeom, mat);
      leftEar.position.set(-1.4, 0.7, -1.2);
      padGroup.add(leftEar);

      const rightEar = leftEar.clone();
      rightEar.position.set(1.4, 0.7, -1.2);
      padGroup.add(rightEar);

      // Inner ear sugar drops
      const innerEarGeom = new THREE.SphereGeometry(0.3, 12, 12);
      const innerLeft = new THREE.Mesh(innerEarGeom, candyCaneWhiteMat);
      innerLeft.position.set(-1.4, 0.78, -1.05);
      padGroup.add(innerLeft);

      const innerRight = innerLeft.clone();
      innerRight.position.set(1.4, 0.78, -1.05);
      padGroup.add(innerRight);

      // 7.4 Cute Gummy Bear Paws
      const pawGeom = new THREE.SphereGeometry(0.48, 14, 14);
      pawGeom.scale(1.1, 0.65, 1.2);

      const pawLeft = new THREE.Mesh(pawGeom, mat);
      pawLeft.position.set(-1.6, 0.45, 1.2);
      padGroup.add(pawLeft);

      const pawRight = pawLeft.clone();
      pawRight.position.set(1.6, 0.45, 1.2);
      padGroup.add(pawRight);

      // 7.5 Cute Gummy Snout & Jelly Nose
      const snout = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 14, 14),
        candyCaneWhiteMat
      );
      snout.scale.set(1.0, 0.55, 0.8);
      snout.position.set(0, 0.72, -0.6);
      padGroup.add(snout);

      const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0x1e1b4b })
      );
      nose.position.set(0, 0.85, -0.85);
      padGroup.add(nose);

      group.add(padGroup);

      springPads.push({
        pos: new THREE.Vector3(x, y, z),
        mesh: bodyMesh,
        radius: 2.5,
        topY: y + 0.75,
      });
    };

    // Place Gummy Bear Trampolines in various flavors across the world
    createGummyTrampoline(originX, 0.4, originZ - 18, 'pink', 0);
    createGummyTrampoline(originX + 28, 0.4, originZ + 12, 'green', -0.5);
    createGummyTrampoline(originX - 28, 0.4, originZ - 8, 'orange', 0.8);
    createGummyTrampoline(originX + 40, 0.4, originZ - 28, 'cyan', -1.2);
    createGummyTrampoline(originX - 16, 0.4, originZ + 42, 'pink', 0.3);
    createGummyTrampoline(originX + 16, 0.4, originZ + 42, 'green', -0.3);

    // 7.1 EL CASTILLO DE CHOCOLATE (Chocolate Castle)
    const castleCenter = new THREE.Vector3(originX, 0.4, originZ + 68);
    const castleGroup = new THREE.Group();
    castleGroup.position.copy(castleCenter);

    // Chocolate Materials
    const darkChocoBarMat = new THREE.MeshStandardMaterial({
      color: 0x361603,
      roughness: 0.35,
      metalness: 0.05,
    });
    const milkChocoBarMat = new THREE.MeshStandardMaterial({
      color: 0x6b2e0b,
      roughness: 0.4,
    });
    const whiteFrostingMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.25,
    });
    const waffleConeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.75,
    });
    const cherryGlossMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.1,
      metalness: 0.2,
    });

    // Castle Grand Platform
    const castleBaseGeom = new THREE.BoxGeometry(36, 1.0, 38);
    const castleBase = new THREE.Mesh(castleBaseGeom, biscuitMat);
    castleBase.position.set(0, 0.5, 0);
    castleBase.receiveShadow = true;
    castleGroup.add(castleBase);
    platforms.push({
      box: new THREE.Box3(
        new THREE.Vector3(castleCenter.x - 18, 0, castleCenter.z - 19),
        new THREE.Vector3(castleCenter.x + 18, 1.0, castleCenter.z + 19)
      ),
      topY: 1.0,
    });

    // Castle Outer Walls (Dark & Milk Chocolate Bricks)
    const wallThickness = 2.4;
    const wallHeight = 12.0;

    // West Wall
    const westWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 36),
      darkChocoBarMat
    );
    westWall.position.set(-16.8, wallHeight / 2 + 0.5, 0);
    westWall.castShadow = true;
    castleGroup.add(westWall);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(castleCenter.x - 18, 0, castleCenter.z - 18),
        new THREE.Vector3(castleCenter.x - 15.6, wallHeight + 1, castleCenter.z + 18)
      )
    );

    // East Wall
    const eastWall = westWall.clone();
    eastWall.position.set(16.8, wallHeight / 2 + 0.5, 0);
    castleGroup.add(eastWall);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(castleCenter.x + 15.6, 0, castleCenter.z - 18),
        new THREE.Vector3(castleCenter.x + 18, wallHeight + 1, castleCenter.z + 18)
      )
    );

    // North Wall (Behind Royal Throne)
    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(36, wallHeight, wallThickness),
      darkChocoBarMat
    );
    northWall.position.set(0, wallHeight / 2 + 0.5, 17.8);
    northWall.castShadow = true;
    castleGroup.add(northWall);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(castleCenter.x - 18, 0, castleCenter.z + 16.6),
        new THREE.Vector3(castleCenter.x + 18, wallHeight + 1, castleCenter.z + 19)
      )
    );

    // South Facade with Grand Entrance Archway
    // Left South Wall
    const southLeft = new THREE.Mesh(
      new THREE.BoxGeometry(13.5, wallHeight, wallThickness),
      darkChocoBarMat
    );
    southLeft.position.set(-11.2, wallHeight / 2 + 0.5, -17.8);
    southLeft.castShadow = true;
    castleGroup.add(southLeft);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(castleCenter.x - 18, 0, castleCenter.z - 19),
        new THREE.Vector3(castleCenter.x - 4.5, wallHeight + 1, castleCenter.z - 16.6)
      )
    );

    // Right South Wall
    const southRight = southLeft.clone();
    southRight.position.set(11.2, wallHeight / 2 + 0.5, -17.8);
    castleGroup.add(southRight);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(castleCenter.x + 4.5, 0, castleCenter.z - 19),
        new THREE.Vector3(castleCenter.x + 18, wallHeight + 1, castleCenter.z - 16.6)
      )
    );

    // Entrance Arch Lintels & Drip Frosting
    const archLintel = new THREE.Mesh(
      new THREE.BoxGeometry(10, 4.0, wallThickness + 0.8),
      milkChocoBarMat
    );
    archLintel.position.set(0, wallHeight - 1.5, -17.8);
    castleGroup.add(archLintel);

    // Frosting Drip Carvings
    const dripGeom = new THREE.CylinderGeometry(0.3, 0.1, 1.8, 8);
    for (let d = -4; d <= 4; d += 1.2) {
      const drip = new THREE.Mesh(dripGeom, whiteFrostingMat);
      drip.position.set(d, wallHeight - 3.8, -16.8);
      castleGroup.add(drip);
    }

    // 4 Grand Waffle Cone Towers at the 4 Corners
    const cornerPositions = [
      { x: -17, z: -18 },
      { x: 17, z: -18 },
      { x: -17, z: 18 },
      { x: 17, z: 18 },
    ];

    cornerPositions.forEach((pos) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(pos.x, 0, pos.z);

      // Tower Shaft (Layered Chocolate Cylinders)
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 3.2, wallHeight + 3, 16),
        milkChocoBarMat
      );
      shaft.position.y = (wallHeight + 3) / 2;
      shaft.castShadow = true;
      towerGroup.add(shaft);

      // Waffle Spire Cone
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 7.5, 16),
        waffleConeMat
      );
      cone.position.y = wallHeight + 3 + 3.75;
      cone.castShadow = true;
      towerGroup.add(cone);

      // Dark Chocolate Glaze Cap
      const glaze = new THREE.Mesh(
        new THREE.ConeGeometry(2.4, 3.5, 16),
        darkChocoBarMat
      );
      glaze.position.y = wallHeight + 3 + 5.5;
      towerGroup.add(glaze);

      // Glossy Giant Red Cherry on Top
      const cherry = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 14, 14),
        cherryGlossMat
      );
      cherry.position.y = wallHeight + 3 + 7.8;
      towerGroup.add(cherry);

      castleGroup.add(towerGroup);

      // Tower colliders
      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(castleCenter.x + pos.x - 3, 0, castleCenter.z + pos.z - 3),
          new THREE.Vector3(castleCenter.x + pos.x + 3, wallHeight + 6, castleCenter.z + pos.z + 3)
        )
      );
    });

    // Castle Battlements (Almenas)
    for (let bx = -15; bx <= 15; bx += 3) {
      // South Battlements
      if (Math.abs(bx) > 4) {
        const merlon = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.8, wallThickness),
          milkChocoBarMat
        );
        merlon.position.set(bx, wallHeight + 1.4, -17.8);
        castleGroup.add(merlon);
      }
      // North Battlements
      const merlonN = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.8, wallThickness),
        milkChocoBarMat
      );
      merlonN.position.set(bx, wallHeight + 1.4, 17.8);
      castleGroup.add(merlonN);
    }

    // Grand 3D Banner Sign over Entrance Gate
    const createCastleSign = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(28, 12, 4, 0.95)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 140, 24);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏰 CASTILLO DE CHOCOLATE', 256, 64);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('« Guarida del Gran Rey Oso de Gomita »', 256, 116);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const signMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.0), signMat);
      mesh.position.set(0, wallHeight - 1.2, -19.4);
      return mesh;
    };
    castleGroup.add(createCastleSign());

    // Interior Arena: Checkerboard Floor Tiles of Dark and White Chocolate
    const tileSize = 3.2;
    for (let tx = -4; tx <= 4; tx++) {
      for (let tz = -4; tz <= 4; tz++) {
        const isDark = (tx + tz) % 2 === 0;
        const tile = new THREE.Mesh(
          new THREE.BoxGeometry(tileSize - 0.1, 0.2, tileSize - 0.1),
          isDark ? darkChocoBarMat : whiteFrostingMat
        );
        tile.position.set(tx * tileSize, 1.05, tz * tileSize);
        tile.receiveShadow = true;
        castleGroup.add(tile);
      }
    }

    // 6 Interior Chocolate Columns with Gold Wrappers
    const columnPositions = [
      { x: -10, z: -9 },
      { x: 10, z: -9 },
      { x: -10, z: 2 },
      { x: 10, z: 2 },
      { x: -10, z: 11 },
      { x: 10, z: 11 },
    ];

    columnPositions.forEach((cp) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 1.1, wallHeight, 16),
        darkChocoBarMat
      );
      col.position.set(cp.x, wallHeight / 2 + 0.5, cp.z);
      col.castShadow = true;
      castleGroup.add(col);

      // Gold wrapper rings
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.15, 0.8, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
      );
      ring.position.set(cp.x, 3.5, cp.z);
      castleGroup.add(ring);

      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(castleCenter.x + cp.x - 1.2, 0, castleCenter.z + cp.z - 1.2),
          new THREE.Vector3(castleCenter.x + cp.x + 1.2, wallHeight, castleCenter.z + cp.z + 1.2)
        )
      );
    });

    // Grand Royal Chocolate Throne at the back (z = +14)
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, 1.0, 14.0);

    // Throne Dais
    const dais = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 0.8, 5.0),
      milkChocoBarMat
    );
    dais.position.y = 0.4;
    dais.receiveShadow = true;
    throneGroup.add(dais);
    platforms.push({
      box: new THREE.Box3(
        new THREE.Vector3(castleCenter.x - 3.2, 0, castleCenter.z + 11.5),
        new THREE.Vector3(castleCenter.x + 3.2, 1.8, castleCenter.z + 16.5)
      ),
      topY: 1.8,
    });

    // Throne Seat
    const throneSeat = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 1.2, 2.4),
      darkChocoBarMat
    );
    throneSeat.position.set(0, 1.4, 0);
    throneGroup.add(throneSeat);

    // Throne High Backrest
    const throneBack = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 4.8, 0.8),
      darkChocoBarMat
    );
    throneBack.position.set(0, 3.8, 0.8);
    throneGroup.add(throneBack);

    // Golden Royal Crest & Giant Ruby Jewel on Throne
    const crest = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
    );
    crest.position.set(0, 6.6, 0.8);
    throneGroup.add(crest);

    const royalGem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, emissive: 0x991b1b })
    );
    royalGem.position.set(0, 5.2, 1.3);
    throneGroup.add(royalGem);

    castleGroup.add(throneGroup);

    group.add(castleGroup);

    // --- 7.1.5 PORTAL AL TEMPLO CHOCO (Entrada a la dimensión aparte del Templo Choco) ---
    const chocoPortalPos = new THREE.Vector3(originX, 0.4, originZ + 58);
    const chocoPortalGroup = new THREE.Group();
    chocoPortalGroup.position.copy(chocoPortalPos);

    // Waffle biscuit pedestal
    const chocoPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.6, 0.5, 24),
      chocolateDarkMat
    );
    chocoPedestal.position.y = 0.25;
    chocoPedestal.receiveShadow = true;
    chocoPortalGroup.add(chocoPedestal);

    // Twin Dark Chocolate Arch Pillars
    const chocoArchL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 5.2, 12),
      chocolateDarkMat
    );
    chocoArchL.position.set(-2.4, 2.6, 0);
    chocoPortalGroup.add(chocoArchL);

    const chocoArchR = chocoArchL.clone();
    chocoArchR.position.set(2.4, 2.6, 0);
    chocoPortalGroup.add(chocoArchR);

    // Swirling Molten Caramel & Chocolate Ring
    const chocoRingGeom = new THREE.TorusGeometry(2.1, 0.35, 16, 32);
    const chocoPortalRing = new THREE.Mesh(
      chocoRingGeom,
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.4,
        roughness: 0.2,
      })
    );
    chocoPortalRing.position.set(0, 2.6, 0);
    chocoPortalGroup.add(chocoPortalRing);

    // Swirling Dark Chocolate Vortex Disc
    const chocoDisc = new THREE.Mesh(
      new THREE.CircleGeometry(1.95, 32),
      new THREE.MeshBasicMaterial({
        color: 0x3b1d09,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      })
    );
    chocoDisc.position.set(0, 2.6, 0);
    chocoPortalGroup.add(chocoDisc);

    // Illuminated Header Sign: 🍫 TEMPLO CHOCO
    const chocoCanvas = document.createElement('canvas');
    chocoCanvas.width = 512;
    chocoCanvas.height = 130;
    const chocoCtx = chocoCanvas.getContext('2d');
    if (chocoCtx) {
      chocoCtx.fillStyle = 'rgba(28, 10, 0, 0.94)';
      chocoCtx.beginPath();
      chocoCtx.roundRect(8, 8, 496, 114, 20);
      chocoCtx.fill();
      chocoCtx.strokeStyle = '#f59e0b';
      chocoCtx.lineWidth = 6;
      chocoCtx.stroke();

      chocoCtx.fillStyle = '#fef08a';
      chocoCtx.font = 'bold 34px sans-serif';
      chocoCtx.textAlign = 'center';
      chocoCtx.fillText('🍫 TEMPLO CHOCO 🍫', 256, 56);

      chocoCtx.fillStyle = '#f472b6';
      chocoCtx.font = 'bold 20px sans-serif';
      chocoCtx.fillText('« Guarida del Gran Rey Oso de Gomita »', 256, 96);
    }
    const chocoTex = new THREE.CanvasTexture(chocoCanvas);
    const chocoSignMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 1.1),
      new THREE.MeshBasicMaterial({ map: chocoTex, side: THREE.DoubleSide })
    );
    chocoSignMesh.position.set(0, 4.8, 0.1);
    chocoPortalGroup.add(chocoSignMesh);

    // Warm Golden Portal Light
    const chocoPortalLight = new THREE.PointLight(0xf59e0b, 2.8, 16);
    chocoPortalLight.position.set(0, 2.8, 0.6);
    chocoPortalGroup.add(chocoPortalLight);

    group.add(chocoPortalGroup);

    // --- FOGATAS DE MALVAVISCO EN MUNDO CARAMELO ---
    const campfires: SweetCampfireInstance[] = [];

    const createSweetCampfire = (cx: number, cy: number, cz: number) => {
      const fireGroup = new THREE.Group();
      fireGroup.position.set(cx, cy, cz);

      // Chocolate Stone Ring
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const sugarMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.4 });
      for (let i = 0; i < 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const pMesh = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.36),
          i % 2 === 0 ? stoneMat : sugarMat
        );
        pMesh.position.set(Math.cos(ang) * 1.4, 0.2, Math.sin(ang) * 1.4);
        fireGroup.add(pMesh);
      }

      // Cinnamon Wafer Logs
      const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
      for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.18, 2.0, 8),
          logMat
        );
        log.rotation.z = Math.PI / 3;
        log.rotation.y = (i / 4) * Math.PI;
        log.position.y = 0.22;
        fireGroup.add(log);
      }

      // Sweet Animated Flame Cones
      const flameMeshes: THREE.Mesh[] = [];
      const flameColors = [0xf59e0b, 0xf43f5e, 0xfbbf24];
      for (let f = 0; f < 3; f++) {
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.42 - f * 0.1, 1.1 - f * 0.2, 8),
          new THREE.MeshStandardMaterial({
            color: flameColors[f],
            emissive: flameColors[f],
            emissiveIntensity: 1.6,
            transparent: true,
            opacity: 0.88,
            roughness: 0.1,
          })
        );
        flame.position.set((Math.random() - 0.5) * 0.2, 0.65 + f * 0.15, (Math.random() - 0.5) * 0.2);
        fireGroup.add(flame);
        flameMeshes.push(flame);
      }

      // Embers
      const emberMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      emberMesh.position.y = 0.28;
      fireGroup.add(emberMesh);

      // Roasting Marshmallow on a Stick
      const stick = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6),
        new THREE.MeshStandardMaterial({ color: 0xd97706 })
      );
      stick.position.set(0.6, 0.9, 0.4);
      stick.rotation.z = -Math.PI / 4;
      fireGroup.add(stick);

      const roastMallow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.35, 10),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 })
      );
      roastMallow.position.set(0.1, 1.4, 0.4);
      roastMallow.rotation.z = -Math.PI / 4;
      fireGroup.add(roastMallow);

      // Point Light
      const cfLight = new THREE.PointLight(0xf59e0b, 2.4, 16);
      cfLight.position.set(0, 1.2, 0);
      fireGroup.add(cfLight);

      group.add(fireGroup);

      campfires.push({
        pos: new THREE.Vector3(cx, cy, cz),
        safeRadius: 6.5,
        light: cfLight,
        flameMeshes,
        emberMesh,
      });
    };

    // 3 Fogatas en Mundo Caramelo
    createSweetCampfire(originX - 22, 0.4, originZ - 8);  // Cerca de la tienda
    createSweetCampfire(originX + 42, 0.4, originZ + 18); // En el bosque de piruletas
    createSweetCampfire(originX, 0.4, originZ + 48);     // Frente al Templo Choco

    // 7.2 EL RÍO DE CHOCOLATE LÍQUIDO Y PUENTE DE BARQUILLO
    const riverGroup = new THREE.Group();
    riverGroup.position.set(originX, 0.42, originZ + 24);

    // River Bed (Chocolate & Strawberry Swirl)
    const riverGeom = new THREE.PlaneGeometry(160, 10);
    riverGeom.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.1,
      metalness: 0.3,
    });
    const riverMesh = new THREE.Mesh(riverGeom, riverMat);
    riverMesh.receiveShadow = true;
    riverGroup.add(riverMesh);

    // River Cream Foam Banks
    const bankGeom = new THREE.BoxGeometry(160, 0.5, 1.4);
    const bankSouth = new THREE.Mesh(bankGeom, whiteFrostingMat);
    bankSouth.position.set(0, 0.25, -5.2);
    riverGroup.add(bankSouth);

    const bankNorth = bankSouth.clone();
    bankNorth.position.set(0, 0.25, 5.2);
    riverGroup.add(bankNorth);

    // Grand Wafer Biscuit Bridge at Center (originX, originZ + 24)
    const bridgeGroup = new THREE.Group();
    const bridgeGeom = new THREE.BoxGeometry(6.4, 0.7, 12.0);
    const bridgeMesh = new THREE.Mesh(bridgeGeom, biscuitMat);
    bridgeMesh.position.y = 0.35;
    bridgeMesh.receiveShadow = true;
    bridgeMesh.castShadow = true;
    bridgeGroup.add(bridgeMesh);

    // Candy Cane Railings on Bridge
    for (let rz = -5; rz <= 5; rz += 2.5) {
      const postGeom = new THREE.CylinderGeometry(0.18, 0.18, 1.4, 8);
      const postL = new THREE.Mesh(postGeom, candyCaneRedMat);
      postL.position.set(-3.1, 1.2, rz);
      bridgeGroup.add(postL);

      const postR = postL.clone();
      postR.position.set(3.1, 1.2, rz);
      bridgeGroup.add(postR);
    }
    const railGeom = new THREE.CylinderGeometry(0.14, 0.14, 11.5, 8);
    railGeom.rotateX(Math.PI / 2);
    const railL = new THREE.Mesh(railGeom, candyCaneWhiteMat);
    railL.position.set(-3.1, 1.8, 0);
    bridgeGroup.add(railL);

    const railR = railL.clone();
    railR.position.set(3.1, 1.8, 0);
    bridgeGroup.add(railR);

    riverGroup.add(bridgeGroup);
    group.add(riverGroup);

    // 7.3 LA TIENDA DE CARAMELO DE SANTI (Physical Kiosk at candyShopPos: 608, 0.4, 588)
    const shopGroup = new THREE.Group();
    shopGroup.position.set(608.0, 0.4, 588.0);

    // Shop Wafer Counter & Base
    const shopBase = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 1.2, 3.8),
      biscuitMat
    );
    shopBase.position.y = 0.6;
    shopBase.castShadow = true;
    shopGroup.add(shopBase);
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(608 - 2.8, 0, 588 - 2.0),
        new THREE.Vector3(608 + 2.8, 1.8, 588 + 2.0)
      )
    );

    // 4 Striped Candy Cane Corner Posts
    const shopPostGeom = new THREE.CylinderGeometry(0.18, 0.18, 4.0, 10);
    [
      { x: -2.5, z: -1.7 },
      { x: 2.5, z: -1.7 },
      { x: -2.5, z: 1.7 },
      { x: 2.5, z: 1.7 },
    ].forEach((pp) => {
      const p = new THREE.Mesh(shopPostGeom, candyCaneRedMat);
      p.position.set(pp.x, 2.0, pp.z);
      shopGroup.add(p);
    });

    // Scalloped Striped Peppermint Canopy Roof
    const roofGeom = new THREE.ConeGeometry(4.2, 1.8, 8);
    const roof = new THREE.Mesh(
      roofGeom,
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 })
    );
    roof.position.y = 4.6;
    shopGroup.add(roof);

    // Display Jars & Boots Cushion on Counter
    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.9, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0xa855f7 })
    );
    cushion.position.set(0, 1.3, 0);
    shopGroup.add(cushion);

    // Glowing Miniature Gummy Boots on Display!
    const displayBootL = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.5, 0.65),
      gummyPinkMat
    );
    displayBootL.position.set(-0.35, 1.65, 0);
    shopGroup.add(displayBootL);

    const displayBootR = displayBootL.clone();
    displayBootR.position.set(0.35, 1.65, 0);
    shopGroup.add(displayBootR);

    // 3D Illuminated Shop Sign
    const createShopSign = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 120, 24);
        ctx.fill();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🍬 TIENDA DE DULCES & BOTAS', 256, 60);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('« ¡Espadas de Caramelo y Botas de Gomita! »', 256, 102);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const sMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const sm = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.3), sMat);
      sm.position.set(0, 3.8, 1.95);
      return sm;
    };
    shopGroup.add(createShopSign());

    group.add(shopGroup);

    // 7.4 HONGOS DE GOMINOLA GIGANTES (Giant Bouncy Gummy Mushrooms)
    const createGummyMushroom = (
      mx: number,
      my: number,
      mz: number,
      capColor: THREE.MeshStandardMaterial,
      scale = 1.0
    ) => {
      const mGroup = new THREE.Group();
      mGroup.position.set(mx, my, mz);
      mGroup.scale.set(scale, scale, scale);

      // Sugar Stalk
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 1.1, 4.0, 16),
        whiteFrostingMat
      );
      stalk.position.y = 2.0;
      stalk.castShadow = true;
      mGroup.add(stalk);

      // Translucent Jelly Cap
      const capGeom = new THREE.SphereGeometry(2.4, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
      const cap = new THREE.Mesh(capGeom, capColor);
      cap.position.y = 3.9;
      cap.castShadow = true;
      mGroup.add(cap);

      group.add(mGroup);

      platforms.push({
        box: new THREE.Box3(
          new THREE.Vector3(mx - 2.2 * scale, my, mz - 2.2 * scale),
          new THREE.Vector3(mx + 2.2 * scale, my + 4.2 * scale, mz + 2.2 * scale)
        ),
        topY: my + 4.2 * scale,
      });

      // Cap also acts as a bouncer!
      springPads.push({
        pos: new THREE.Vector3(mx, my + 3.8 * scale, mz),
        mesh: cap,
        radius: 2.4 * scale,
        topY: my + 4.3 * scale,
      });
    };

    createGummyMushroom(originX - 35, 0.4, originZ + 20, gummyPinkMat, 1.1);
    createGummyMushroom(originX + 38, 0.4, originZ + 35, gummyGreenMat, 1.2);
    createGummyMushroom(originX - 22, 0.4, originZ + 55, gummyOrangeMat, 1.0);

    // 7.5 NUBES DE ALGODÓN DE AZÚCAR FLOTANTES (High Sky Clouds for Gummy Boots)
    const createCottonCandyCloud = (
      cx: number,
      cy: number,
      cz: number,
      colorHex: number
    ) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cx, cy, cz);

      const cloudMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.9,
        transparent: true,
        opacity: 0.88,
      });

      // Cluster of fluffy spheres
      const puffGeom = new THREE.SphereGeometry(1.8, 14, 14);
      const p1 = new THREE.Mesh(puffGeom, cloudMat);
      cloudGroup.add(p1);

      const p2 = new THREE.Mesh(puffGeom, cloudMat);
      p2.position.set(-1.6, -0.2, 0.4);
      p2.scale.set(0.85, 0.85, 0.85);
      cloudGroup.add(p2);

      const p3 = new THREE.Mesh(puffGeom, cloudMat);
      p3.position.set(1.6, -0.1, -0.3);
      p3.scale.set(0.9, 0.9, 0.9);
      cloudGroup.add(p3);

      const p4 = new THREE.Mesh(puffGeom, cloudMat);
      p4.position.set(0, 0.4, 1.2);
      p4.scale.set(0.8, 0.8, 0.8);
      cloudGroup.add(p4);

      group.add(cloudGroup);

      platforms.push({
        box: new THREE.Box3(
          new THREE.Vector3(cx - 3.2, cy - 1.0, cz - 2.5),
          new THREE.Vector3(cx + 3.2, cy + 1.2, cz + 2.5)
        ),
        topY: cy + 1.2,
      });
    };

    createCottonCandyCloud(originX - 15, 14.0, originZ + 10, 0xfbcfe8); // Pink pastel
    createCottonCandyCloud(originX + 15, 18.0, originZ + 18, 0xcffafe); // Cyan pastel
    createCottonCandyCloud(originX, 22.0, originZ + 38, 0xfef08a); // Buttercup pastel
    createCottonCandyCloud(originX + 22, 26.0, originZ + 55, 0xe9d5ff); // Lavender pastel overlooking castle!

    // 8. Dimensional Portals
    // Helper to create a 3D Sign Canvas
    const createPortalSign = (text: string, subText: string, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 108, 24);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, 256, 58);

        ctx.fillStyle = color;
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(subText, 256, 96);
      }
      const tex = new THREE.CanvasTexture(canvas);
      const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
      const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), signMat);
      return signMesh;
    };

    // 8.1 Portal inside Candy World (Returns to Main World)
    const candyPortalGroup = new THREE.Group();
    candyPortalGroup.position.set(originX, 0.4, originZ);

    // Stone / Wafer Base platform
    const candyPortalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.8, 0.4, 24),
      biscuitMat
    );
    candyPortalBase.position.y = 0.2;
    candyPortalBase.receiveShadow = true;
    candyPortalGroup.add(candyPortalBase);

    // Golden wafer arch
    const archGeom = new THREE.TorusGeometry(2.4, 0.38, 12, 24, Math.PI);
    const arch = new THREE.Mesh(archGeom, biscuitMat);
    arch.position.set(0, 2.6, 0);
    arch.castShadow = true;
    candyPortalGroup.add(arch);

    // Pillar supports
    const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 2.6, 12), candyCaneWhiteMat);
    pillar1.position.set(-2.4, 1.3, 0);
    candyPortalGroup.add(pillar1);

    const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 2.6, 12), candyCaneWhiteMat);
    pillar2.position.set(2.4, 1.3, 0);
    candyPortalGroup.add(pillar2);

    // Swirling Emerald / Cyan Dimensional Vortex
    const vortexGeom = new THREE.RingGeometry(0.2, 2.2, 32);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const candyPortalRing = new THREE.Mesh(vortexGeom, vortexMat);
    candyPortalRing.position.set(0, 2.6, 0);
    candyPortalGroup.add(candyPortalRing);

    // Sky Beacon Beam (Cyan/Emerald)
    const candyBeamGeom = new THREE.CylinderGeometry(0.8, 0.8, 70, 16);
    const candyBeamMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const candyBeam = new THREE.Mesh(candyBeamGeom, candyBeamMat);
    candyBeam.position.set(0, 35, 0);
    candyPortalGroup.add(candyBeam);

    // Overhead Sign
    const candySign = createPortalSign('🌿 VALLE PRINCIPAL', '« Entra para regresar »', '#34d399');
    candySign.position.set(0, 5.5, 0);
    candyPortalGroup.add(candySign);

    group.add(candyPortalGroup);

    // 8.2 Portal inside Main World (Teleports to Candy World)
    const mainPortalGroup = new THREE.Group();
    const mainPortalGroundH = getTerrainHeightFn ? getTerrainHeightFn(18, -18) : 0.4;
    const mainPortalPos = new THREE.Vector3(18, mainPortalGroundH, -18);
    mainPortalGroup.position.copy(mainPortalPos);

    // Frosted Pink Biscuit & Marshmallow Platform Base
    const frostedBiscuitMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.4,
      metalness: 0.1,
    });
    const mainPortalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.0, 0.4, 24),
      frostedBiscuitMat
    );
    mainPortalBase.position.y = 0.2;
    mainPortalBase.receiveShadow = true;
    mainPortalGroup.add(mainPortalBase);

    // Marshmallow rim ring around the base
    const marshmallowRing = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.25, 8, 24),
      marshmallowMat
    );
    marshmallowRing.rotation.x = Math.PI / 2;
    marshmallowRing.position.y = 0.4;
    mainPortalGroup.add(marshmallowRing);

    // Candy Cane Arch
    const candyArchMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      roughness: 0.25,
      metalness: 0.1,
    });
    const mainArch = new THREE.Mesh(archGeom, candyArchMat);
    mainArch.position.set(0, 2.6, 0);
    mainArch.castShadow = true;
    mainPortalGroup.add(mainArch);

    // Striped Candy Cane Pillars
    const candyPillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 2.8, 16), candyCaneWhiteMat);
    candyPillar1.position.set(-2.4, 1.4, 0);
    mainPortalGroup.add(candyPillar1);

    const candyPillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 2.8, 16), candyCaneWhiteMat);
    candyPillar2.position.set(2.4, 1.4, 0);
    mainPortalGroup.add(candyPillar2);

    // Red spiral rings on the pillars
    for (let r = 0; r < 4; r++) {
      const ringGeom = new THREE.TorusGeometry(0.44, 0.08, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
      const r1 = new THREE.Mesh(ringGeom, ringMat);
      r1.rotation.x = Math.PI / 2 + 0.2;
      r1.position.set(-2.4, 0.6 + r * 0.6, 0);
      mainPortalGroup.add(r1);

      const r2 = new THREE.Mesh(ringGeom, ringMat);
      r2.rotation.x = Math.PI / 2 - 0.2;
      r2.position.set(2.4, 0.6 + r * 0.6, 0);
      mainPortalGroup.add(r2);
    }

    // Swirling Cotton Candy / Magenta Vortex Ring
    const mainVortexMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const mainPortalRing = new THREE.Mesh(vortexGeom, mainVortexMat);
    mainPortalRing.position.set(0, 2.6, 0);
    mainPortalGroup.add(mainPortalRing);

    // Sky Beacon Beam (Vibrant Hot Pink / Magenta reaching 85m into the sky, visible everywhere)
    const mainBeamGeom = new THREE.CylinderGeometry(0.9, 0.9, 85, 16);
    const mainBeamMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mainBeam = new THREE.Mesh(mainBeamGeom, mainBeamMat);
    mainBeam.position.set(0, 42.5, 0);
    mainPortalGroup.add(mainBeam);

    // Floating Giant Swirl Lollipop & Sugar Star above Portal
    const lollipopHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.25, 24),
      new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.2 })
    );
    lollipopHead.rotation.x = Math.PI / 2;
    lollipopHead.position.set(0, 6.0, 0);
    mainPortalGroup.add(lollipopHead);

    const lollipopStar = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 1.2 })
    );
    lollipopStar.position.set(0, 6.0, 0.2);
    mainPortalGroup.add(lollipopStar);

    // Glowing Pink Portal Point Light
    const portalPointLight = new THREE.PointLight(0xf43f5e, 2.5, 14);
    portalPointLight.position.set(0, 2.6, 0.8);
    mainPortalGroup.add(portalPointLight);

    // Overhead Sign: 🍭 MUNDO CARAMELO
    const mainSign = createPortalSign('🍭 MUNDO CARAMELO', '« Castillo de Chocolate & Gran Oso »', '#f43f5e');
    mainSign.position.set(0, 4.8, 0);
    mainPortalGroup.add(mainSign);

    // Guide path of cute candy stepping stones leading towards portal from plaza
    const pathStones = [
      { x: 10, z: -8 },
      { x: 13, z: -12 },
      { x: 16, z: -15 },
    ];
    pathStones.forEach((st, idx) => {
      const stoneH = getTerrainHeightFn ? getTerrainHeightFn(st.x, st.z) : 0.4;
      const stoneMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 0.15, 16),
        new THREE.MeshStandardMaterial({
          color: idx % 2 === 0 ? 0xf472b6 : 0x38bdf8,
          roughness: 0.3,
        })
      );
      stoneMesh.position.set(st.x, stoneH + 0.08, st.z);
      stoneMesh.receiveShadow = true;
      scene.add(stoneMesh);
    });

    scene.add(mainPortalGroup);

    // 9. Sweet Candyland Coins & Sugar Gems
    const candyCoinLocations: { x: number; y: number; z: number; type: 'gold' | 'gem' | 'star'; value: number }[] = [
      { x: originX, y: 1.6, z: originZ + 6, type: 'gold', value: 1 },
      { x: originX - 6, y: 1.6, z: originZ + 3, type: 'gold', value: 1 },
      { x: originX + 6, y: 1.6, z: originZ + 3, type: 'gold', value: 1 },
      { x: originX - 18, y: 12.0, z: originZ - 20, type: 'gem', value: 5 }, // Cherry lollipop top
      { x: originX + 22, y: 13.0, z: originZ - 18, type: 'gem', value: 5 }, // Mint lollipop top
      { x: originX - 28, y: 14.0, z: originZ + 25, type: 'gem', value: 5 }, // Berry lollipop top
      { x: originX - 15, y: 3.0, z: originZ - 35, type: 'gold', value: 1 },
      { x: originX - 15, y: 5.5, z: originZ - 45, type: 'gold', value: 1 },
      { x: originX - 5, y: 8.5, z: originZ - 52, type: 'gem', value: 5 },
      { x: originX + 8, y: 11.5, z: originZ - 52, type: 'gem', value: 5 },
      { x: originX + 22, y: 15.0, z: originZ - 45, type: 'gem', value: 5 },
      { x: originX + 32, y: 19.0, z: originZ - 35, type: 'star', value: 10 }, // The Summit Sugar Super Star!
      // New Castle & Life Coins:
      { x: originX, y: 1.6, z: originZ + 24, type: 'gold', value: 1 }, // River Bridge
      { x: originX, y: 1.6, z: originZ + 54, type: 'gold', value: 1 }, // Castle Approach
      { x: originX - 6, y: 1.6, z: originZ + 66, type: 'gem', value: 5 }, // Arena Left
      { x: originX + 6, y: 1.6, z: originZ + 66, type: 'gem', value: 5 }, // Arena Right
      { x: originX, y: 3.4, z: originZ + 82, type: 'star', value: 10 }, // Royal Throne Star!
      { x: originX - 17, y: 16.0, z: originZ + 50, type: 'gem', value: 5 }, // Tower SW Cherry
      { x: originX + 17, y: 16.0, z: originZ + 50, type: 'gem', value: 5 }, // Tower SE Cherry
      // Sky Cloud Secret Stashes (Gummy Boots Playground):
      { x: originX - 15, y: 15.5, z: originZ + 10, type: 'gem', value: 5 }, // Pink Cloud
      { x: originX + 15, y: 19.5, z: originZ + 18, type: 'gem', value: 5 }, // Cyan Cloud
      { x: originX, y: 23.5, z: originZ + 38, type: 'star', value: 10 }, // Buttercup Cloud
      { x: originX + 22, y: 27.5, z: originZ + 55, type: 'star', value: 10 }, // Castle Sky Summit Cloud!
      // Bouncy Gummy Mushrooms:
      { x: originX - 35, y: 5.2, z: originZ + 20, type: 'gem', value: 5 },
      { x: originX + 38, y: 5.5, z: originZ + 35, type: 'gem', value: 5 },
    ];

    const coinMatGold = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.2,
    });
    const coinMatGem = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Pink Ruby Gem
      metalness: 0.3,
      roughness: 0.1,
    });
    const coinMatStar = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.8,
      roughness: 0.1,
    });

    const coinGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16);
    const gemGeom = new THREE.OctahedronGeometry(0.48, 0);
    const starGeom = new THREE.DodecahedronGeometry(0.7, 0);

    candyCoinLocations.forEach((loc, idx) => {
      const coinGroup = new THREE.Group();
      coinGroup.position.set(loc.x, loc.y, loc.z);

      let mesh: THREE.Mesh;
      if (loc.type === 'star') {
        mesh = new THREE.Mesh(starGeom, coinMatStar);
      } else if (loc.type === 'gem') {
        mesh = new THREE.Mesh(gemGeom, coinMatGem);
      } else {
        mesh = new THREE.Mesh(coinGeom, coinMatGold);
        mesh.rotation.x = Math.PI / 2;
      }
      mesh.castShadow = true;
      coinGroup.add(mesh);

      group.add(coinGroup);

      coins.push({
        data: {
          id: coinStartId + idx,
          x: loc.x,
          y: loc.y,
          z: loc.z,
          collected: false,
          value: loc.value,
          type: loc.type,
        },
        mesh: coinGroup,
        light: null,
      });
    });

    scene.add(group);

    return {
      group,
      colliders,
      platforms,
      springPads,
      coins,
      mainPortal: {
        pos: mainPortalPos,
        mesh: mainPortalGroup,
        ring: mainPortalRing,
      },
      candyPortal: {
        pos: new THREE.Vector3(originX, 0.4, originZ),
        mesh: candyPortalGroup,
        ring: candyPortalRing,
      },
      chocoPortal: {
        pos: chocoPortalPos,
        mesh: chocoPortalGroup,
        ring: chocoPortalRing,
      },
      castleArenaCenter: castleCenter,
      campfires,
      update: (dt: number, time: number) => {
        // Animate campfire flames & embers
        campfires.forEach((cf, idx) => {
          cf.flameMeshes.forEach((flame, fIdx) => {
            const flicker = 1.0 + Math.sin(time * 7 + idx * 2.3 + fIdx * 1.7) * 0.16;
            flame.scale.set(flicker, flicker, flicker);
          });
        });

        // Rotate portal rings
        chocoPortalRing.rotation.z += 1.8 * dt;
        candyPortalRing.rotation.z += 1.2 * dt;
        mainPortalRing.rotation.z += 1.2 * dt;
      },
    };
  }
}
