import * as THREE from 'three';
import { CoinData } from '../types';

export interface CandyWorldElements {
  group: THREE.Group;
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[];
  coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[];
  mainPortal: { pos: THREE.Vector3; mesh: THREE.Group; ring: THREE.Mesh };
  candyPortal: { pos: THREE.Vector3; mesh: THREE.Group; ring: THREE.Mesh };
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
    const frostingMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Strawberry icing pink
      roughness: 0.6,
      metalness: 0.05,
    });
    const biscuitMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Waffle / Wafer crust
      roughness: 0.8,
    });
    const chocolateDarkMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Rich Dark Chocolate
      roughness: 0.4,
    });
    const chocolateMilkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Creamy Milk Chocolate
      roughness: 0.45,
    });
    const marshmallowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Fluffy White Marshmallow
      roughness: 0.8,
    });
    const candyCaneRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Glossy Cherry Red Candy
      roughness: 0.3,
      metalness: 0.1,
    });
    const candyCaneWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure White Peppermint Sugar
      roughness: 0.3,
    });
    const lollipopMintMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Mint Lime Candy
      roughness: 0.25,
    });
    const lollipopBerryMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6, // Grape / Blueberry Candy
      roughness: 0.25,
    });
    const lollipopLemonMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Sweet Lemon Drop
      roughness: 0.25,
    });
    const gummyGreenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const gummyPinkMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Frosting Terrain Island (220x220)
    const islandGeom = new THREE.CylinderGeometry(110, 115, 6, 32);
    const island = new THREE.Mesh(islandGeom, frostingMat);
    island.position.set(originX, -2.6, originZ);
    island.receiveShadow = true;
    island.castShadow = true;
    group.add(island);

    // Biscuit wafer rim
    const rimGeom = new THREE.TorusGeometry(112, 3, 12, 32);
    const rim = new THREE.Mesh(rimGeom, biscuitMat);
    rim.position.set(originX, 0.2, originZ);
    rim.rotation.x = Math.PI / 2;
    rim.receiveShadow = true;
    group.add(rim);

    // Sprinkles on the frosting ground
    const sprinkleColors = [0x38bdf8, 0xfacc15, 0xef4444, 0x10b981, 0xa855f7, 0xffffff];
    for (let i = 0; i < 90; i++) {
      const angle = (i * 2.39) % (Math.PI * 2);
      const rad = 8 + ((i * 19) % 95);
      const sx = originX + Math.cos(angle) * rad;
      const sz = originZ + Math.sin(angle) * rad;

      const sprinkleGeom = new THREE.CapsuleGeometry(0.16, 0.6, 4, 8);
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

    // 7. Gummy Bear Trampolines (Bouncers)
    const createGummyTrampoline = (x: number, y: number, z: number, color: 'green' | 'pink') => {
      const padGroup = new THREE.Group();
      padGroup.position.set(x, y, z);

      const padGeom = new THREE.CylinderGeometry(1.8, 2.0, 0.5, 20);
      const padMesh = new THREE.Mesh(padGeom, color === 'green' ? gummyGreenMat : gummyPinkMat);
      padMesh.position.y = 0.25;
      padMesh.castShadow = true;
      padGroup.add(padMesh);

      // Gummy Bear Ears
      const ear1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), color === 'green' ? gummyGreenMat : gummyPinkMat);
      ear1.position.set(-1.2, 0.45, -0.6);
      padGroup.add(ear1);

      const ear2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), color === 'green' ? gummyGreenMat : gummyPinkMat);
      ear2.position.set(1.2, 0.45, -0.6);
      padGroup.add(ear2);

      group.add(padGroup);

      springPads.push({
        pos: new THREE.Vector3(x, y, z),
        mesh: padMesh,
        radius: 2.2,
        topY: y + 0.5,
      });
    };

    createGummyTrampoline(originX, 0.4, originZ - 18, 'pink');
    createGummyTrampoline(originX + 28, 0.4, originZ + 12, 'green');
    createGummyTrampoline(originX - 28, 0.4, originZ - 8, 'pink');
    createGummyTrampoline(originX + 40, 0.4, originZ - 28, 'green');

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

    // 8.2 Portal inside Main World (Teleports to Mayan Temple)
    const mainPortalGroup = new THREE.Group();
    const mainPortalGroundH = getTerrainHeightFn ? getTerrainHeightFn(18, -18) : 0.4;
    const mainPortalPos = new THREE.Vector3(18, mainPortalGroundH, -18);
    mainPortalGroup.position.copy(mainPortalPos);

    // Mayan Stone Base Platform
    const darkAndesiteMat = new THREE.MeshStandardMaterial({
      color: 0x292524,
      roughness: 0.8,
      flatShading: true,
    });
    const jadeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const goldOrnamentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });

    const mainPortalBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.0, 0.4, 16),
      darkAndesiteMat
    );
    mainPortalBase.position.y = 0.2;
    mainPortalBase.receiveShadow = true;
    mainPortalGroup.add(mainPortalBase);

    // Mayan Stone Arch
    const mainArch = new THREE.Mesh(archGeom, darkAndesiteMat);
    mainArch.position.set(0, 2.6, 0);
    mainArch.castShadow = true;
    mainPortalGroup.add(mainArch);

    const mainPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 0.8), darkAndesiteMat);
    mainPillar1.position.set(-2.4, 1.4, 0);
    mainPortalGroup.add(mainPillar1);

    const mainPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.8, 0.8), darkAndesiteMat);
    mainPillar2.position.set(2.4, 1.4, 0);
    mainPortalGroup.add(mainPillar2);

    // Swirling Jade Green Mayan Vortex Ring
    const mainVortexMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const mainPortalRing = new THREE.Mesh(vortexGeom, mainVortexMat);
    mainPortalRing.position.set(0, 2.6, 0);
    mainPortalGroup.add(mainPortalRing);

    // Sky Beacon Beam (Mystic Emerald Green)
    const mainBeamGeom = new THREE.CylinderGeometry(0.9, 0.9, 80, 16);
    const mainBeamMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mainBeam = new THREE.Mesh(mainBeamGeom, mainBeamMat);
    mainBeam.position.set(0, 40, 0);
    mainPortalGroup.add(mainBeam);

    // Floating Golden Serpent / Sun Icon above Portal
    const sunIcon = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), goldOrnamentMat);
    sunIcon.position.set(0, 5.8, 0);
    mainPortalGroup.add(sunIcon);

    // Overhead Sign
    const mainSign = createPortalSign('🏛️ TEMPLO MAYA', '« Entra para enfrentar al Rey Zombi »', '#10b981');
    mainSign.position.set(0, 4.8, 0);
    mainPortalGroup.add(mainSign);

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
    };
  }
}
