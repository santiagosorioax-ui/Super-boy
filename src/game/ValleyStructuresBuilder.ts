import * as THREE from 'three';
import { CoinData } from '../types';

export interface CampfireInstance {
  pos: THREE.Vector3;
  safeRadius: number;
  light: THREE.PointLight;
  flameMeshes: THREE.Mesh[];
  emberMesh: THREE.Mesh;
  baseIntensity: number;
  particles?: THREE.Points;
  particlePositions?: Float32Array;
  particleVelocities?: Float32Array;
}

export interface ValleyStructuresResult {
  campfires: CampfireInstance[];
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[];
  coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[];
  lanterns: THREE.PointLight[];
  update: (dt: number, time: number) => void;
}

export class ValleyStructuresBuilder {
  public static build(
    scene: THREE.Scene,
    getTerrainHeight: (x: number, z: number) => number
  ): ValleyStructuresResult {
    const colliders: THREE.Box3[] = [];
    const platforms: { box: THREE.Box3; topY: number }[] = [];
    const springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[] = [];
    const coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[] = [];
    const lanterns: THREE.PointLight[] = [];
    const campfires: CampfireInstance[] = [];

    // Shared Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x3f2212, roughness: 0.95 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, flatShading: true });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, flatShading: true });
    const giantLeafMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75, flatShading: true });
    const giantLeafMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true });
    const giantLeafMat3 = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.8, flatShading: true });
    const tentCanvasMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const tentInsideMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });

    // =========================================================================
    // 1. FOGATAS (CAMPFIRES) WITH ACTIVE SAFE ZONES & DANCING FLAMES
    // =========================================================================
    // Campfire 1 is explicitly at spawn (0, 0.4, 5.0) in the central courtyard!
    const campfireLocations: { x: number; z: number; label: string; safeRadius: number }[] = [
      { x: 0, z: 5.0, label: 'Fogata del Inicio (Plaza)', safeRadius: 8.5 },
      { x: 25, z: 80, label: 'Campamento del Bosque Antiguo', safeRadius: 9.0 },
      { x: -85, z: -20, label: 'Refugio del Cañón del Oeste', safeRadius: 8.5 },
      { x: 95, z: 35, label: 'Puesto de las Colinas Orientales', safeRadius: 8.5 },
      { x: 22, z: -46, label: 'Descanso del Camino Maya', safeRadius: 8.5 },
      { x: -55, z: -95, label: 'Mirador de las Cumbres Altas', safeRadius: 8.5 },
      { x: 80, z: 110, label: 'Refugio del Valle Profundo', safeRadius: 8.5 },
    ];

    campfireLocations.forEach((loc, cIdx) => {
      const terrainY = getTerrainHeight(loc.x, loc.z);
      const campGroup = new THREE.Group();
      campGroup.position.set(loc.x, terrainY, loc.z);

      // A. Circular Stone Ring Firepit (12 smooth boundary rocks)
      const stoneCount = 12;
      const ringRadius = 1.35;
      const rockGeom = new THREE.DodecahedronGeometry(0.32, 0);
      for (let i = 0; i < stoneCount; i++) {
        const angle = (i / stoneCount) * Math.PI * 2;
        const rx = Math.cos(angle) * ringRadius;
        const rz = Math.sin(angle) * ringRadius;
        const rock = new THREE.Mesh(rockGeom, darkStoneMat);
        rock.position.set(rx, 0.16, rz);
        rock.scale.set(0.9 + (i % 3) * 0.2, 0.8 + (i % 2) * 0.3, 0.9 + (i % 4) * 0.15);
        rock.rotation.set((i * 0.4) % 2, (i * 0.8) % 3, (i * 0.2) % 2);
        rock.castShadow = true;
        rock.receiveShadow = true;
        campGroup.add(rock);
      }

      // B. Ash & Glowing Ember Bed
      const emberGeom = new THREE.CylinderGeometry(1.05, 1.15, 0.2, 16);
      const emberMat = new THREE.MeshStandardMaterial({
        color: 0x991b1b,
        emissive: 0xef4444,
        emissiveIntensity: 1.4,
        roughness: 0.9,
      });
      const emberMesh = new THREE.Mesh(emberGeom, emberMat);
      emberMesh.position.y = 0.08;
      emberMesh.receiveShadow = true;
      campGroup.add(emberMesh);

      // C. Firewood Logs (Criss-crossed pyramid teepee structure)
      const logGeom = new THREE.CylinderGeometry(0.12, 0.14, 1.7, 7);
      const logMat = new THREE.MeshStandardMaterial({ color: 0x27170b, roughness: 0.95 });
      const logCount = 6;
      for (let i = 0; i < logCount; i++) {
        const angle = (i / logCount) * Math.PI * 2;
        const log = new THREE.Mesh(logGeom, logMat);
        log.position.set(Math.cos(angle) * 0.45, 0.42, Math.sin(angle) * 0.45);
        log.rotation.y = angle;
        log.rotation.x = 0.55;
        log.castShadow = true;
        campGroup.add(log);
      }

      // D. Animated Layered Flame Cones (Yellow, Orange, Fiery Crimson)
      const flameMeshes: THREE.Mesh[] = [];
      const flameLayers = [
        { r: 0.65, h: 1.4, color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 2.2, y: 0.65 },
        { r: 0.45, h: 1.6, color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 2.8, y: 0.78 },
        { r: 0.28, h: 1.85, color: 0xfef08a, emissive: 0xfde047, emissiveIntensity: 3.2, y: 0.92 },
      ];

      flameLayers.forEach((fl) => {
        const fGeom = new THREE.ConeGeometry(fl.r, fl.h, 7);
        const fMat = new THREE.MeshStandardMaterial({
          color: fl.color,
          emissive: fl.emissive,
          emissiveIntensity: fl.emissiveIntensity,
          roughness: 0.15,
          transparent: true,
          opacity: 0.92,
        });
        const fMesh = new THREE.Mesh(fGeom, fMat);
        fMesh.position.y = fl.y;
        fMesh.userData.baseScaleY = 1.0;
        campGroup.add(fMesh);
        flameMeshes.push(fMesh);
      });

      // E. Dynamic Flickering Warm Point Light
      const fireLight = new THREE.PointLight(0xff6600, 2.2, 18, 1.6);
      fireLight.position.set(0, 1.2, 0);
      campGroup.add(fireLight);
      lanterns.push(fireLight);

      // F. Rising Ember / Spark Particles
      const particleCount = 20;
      const partGeom = new THREE.BufferGeometry();
      const partPos = new Float32Array(particleCount * 3);
      const partVels = new Float32Array(particleCount * 3);

      for (let p = 0; p < particleCount; p++) {
        partPos[p * 3] = (Math.random() - 0.5) * 0.8;
        partPos[p * 3 + 1] = 0.4 + Math.random() * 1.5;
        partPos[p * 3 + 2] = (Math.random() - 0.5) * 0.8;

        partVels[p * 3] = (Math.random() - 0.5) * 0.3;
        partVels[p * 3 + 1] = 0.8 + Math.random() * 1.2;
        partVels[p * 3 + 2] = (Math.random() - 0.5) * 0.3;
      }
      partGeom.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
      const partMat = new THREE.PointsMaterial({
        color: 0xfde047,
        size: 0.35,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const particleMesh = new THREE.Points(partGeom, partMat);
      campGroup.add(particleMesh);

      // G. Log Benches Around the Fire (Rest & Sit area)
      const benchAngles = [0.8, -1.8, 3.0];
      benchAngles.forEach((bAngle) => {
        const bx = Math.cos(bAngle) * 2.5;
        const bz = Math.sin(bAngle) * 2.5;
        const benchGeom = new THREE.CylinderGeometry(0.24, 0.26, 2.2, 8);
        const bench = new THREE.Mesh(benchGeom, woodMat);
        bench.position.set(bx, 0.22, bz);
        bench.rotation.z = Math.PI / 2;
        bench.rotation.y = bAngle + Math.PI / 2;
        bench.castShadow = true;
        bench.receiveShadow = true;
        campGroup.add(bench);

        // Solid collider for bench
        const bBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(loc.x + bx, terrainY + 0.25, loc.z + bz),
          new THREE.Vector3(1.2, 0.5, 1.2)
        );
        colliders.push(bBox);
        platforms.push({ box: bBox, topY: terrainY + 0.5 });
      });

      // H. Explorer Tent (for wilderness campfires)
      if (cIdx >= 1 && cIdx <= 3) {
        const tentGroup = new THREE.Group();
        const tx = Math.cos(1.9) * 4.4;
        const tz = Math.sin(1.9) * 4.4;
        tentGroup.position.set(tx, 0, tz);
        tentGroup.rotation.y = 1.9 + Math.PI;

        // Triangular Prism Tent
        const tentGeom = new THREE.CylinderGeometry(0.01, 1.8, 3.2, 3, 1, false);
        const tent = new THREE.Mesh(tentGeom, tentCanvasMat);
        tent.position.y = 1.1;
        tent.rotation.z = Math.PI / 2;
        tent.rotation.y = Math.PI / 2;
        tent.castShadow = true;
        tent.receiveShadow = true;
        tentGroup.add(tent);

        // Wooden ridge pole
        const poleGeom = new THREE.CylinderGeometry(0.06, 0.06, 3.6, 6);
        const pole = new THREE.Mesh(poleGeom, woodMat);
        pole.position.y = 2.1;
        pole.rotation.x = Math.PI / 2;
        tentGroup.add(pole);

        // Wooden supply crates near tent
        const crateGeom = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const crate = new THREE.Mesh(crateGeom, woodMat);
        crate.position.set(1.6, 0.35, 0.5);
        crate.castShadow = true;
        tentGroup.add(crate);

        campGroup.add(tentGroup);

        const tentBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(loc.x + tx, terrainY + 1.1, loc.z + tz),
          new THREE.Vector3(2.4, 2.2, 3.2)
        );
        colliders.push(tentBox);
      }

      scene.add(campGroup);

      // Solid firepit base collider
      const firePitBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(loc.x, terrainY + 0.4, loc.z),
        new THREE.Vector3(2.2, 0.8, 2.2)
      );
      colliders.push(firePitBox);

      campfires.push({
        pos: new THREE.Vector3(loc.x, terrainY, loc.z),
        safeRadius: loc.safeRadius,
        light: fireLight,
        flameMeshes,
        emberMesh,
        baseIntensity: 2.2,
        particles: particleMesh,
        particlePositions: partPos,
        particleVelocities: partVels,
      });
    });

    // =========================================================================
    // 2. ÁRBOLES GIGANTES ANCESTRALES (MASSIVE ANCIENT OAKS & REDWOODS)
    // =========================================================================
    const giantTrees = [
      { x: -45, z: 65, type: 'ancient_oak', scale: 1.4 },
      { x: 55, z: 90, type: 'giant_redwood', scale: 1.5 },
      { x: -85, z: 55, type: 'ancient_oak', scale: 1.35 },
      { x: 110, z: -35, type: 'giant_redwood', scale: 1.6 },
      { x: -115, z: -75, type: 'giant_redwood', scale: 1.5 },
      { x: 65, z: -95, type: 'ancient_oak', scale: 1.45 },
      { x: -140, z: 20, type: 'giant_redwood', scale: 1.6 },
      { x: 135, z: 80, type: 'ancient_oak', scale: 1.5 },
    ];

    giantTrees.forEach((gt, idx) => {
      const terrainY = getTerrainHeight(gt.x, gt.z);
      const treeGroup = new THREE.Group();
      treeGroup.position.set(gt.x, terrainY, gt.z);

      if (gt.type === 'ancient_oak') {
        // Massive Oak Trunk (diameter ~3.2m, height ~18m)
        const trunkH = 14 * gt.scale;
        const trunkR = 1.8 * gt.scale;
        const trunkGeom = new THREE.CylinderGeometry(trunkR * 0.75, trunkR, trunkH, 10);
        const trunk = new THREE.Mesh(trunkGeom, barkMat);
        trunk.position.y = trunkH / 2 - 0.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Spreading Giant Roots (4 root arches at ground level)
        for (let r = 0; r < 4; r++) {
          const rAngle = (r / 4) * Math.PI * 2 + 0.3;
          const rootGeom = new THREE.ConeGeometry(0.85 * gt.scale, 4.0 * gt.scale, 6);
          const root = new THREE.Mesh(rootGeom, barkMat);
          root.position.set(Math.cos(rAngle) * (trunkR + 0.6), 1.0, Math.sin(rAngle) * (trunkR + 0.6));
          root.rotation.z = Math.PI / 3;
          root.rotation.y = rAngle;
          root.castShadow = true;
          treeGroup.add(root);
        }

        // Sprawling Canopy: 3 large foliage domes
        const canopyClusters = [
          { x: 0, y: trunkH + 2.5 * gt.scale, z: 0, r: 5.5 * gt.scale, mat: giantLeafMat1 },
          { x: -2.8 * gt.scale, y: trunkH + 1.2 * gt.scale, z: 2.2 * gt.scale, r: 4.5 * gt.scale, mat: giantLeafMat2 },
          { x: 3.0 * gt.scale, y: trunkH + 1.8 * gt.scale, z: -2.5 * gt.scale, r: 4.8 * gt.scale, mat: giantLeafMat3 },
          { x: 0, y: trunkH + 5.5 * gt.scale, z: 0, r: 3.8 * gt.scale, mat: giantLeafMat2 },
        ];

        canopyClusters.forEach((c) => {
          const cGeom = new THREE.DodecahedronGeometry(c.r, 1);
          const cMesh = new THREE.Mesh(cGeom, c.mat);
          cMesh.position.set(c.x, c.y, c.z);
          cMesh.castShadow = true;
          cMesh.receiveShadow = true;
          treeGroup.add(cMesh);
        });

        // Wooden Treehouse / Lookout Platform wrapped around trunk!
        const platY = 5.8 * gt.scale;
        const platGeom = new THREE.CylinderGeometry(trunkR + 1.8, trunkR + 1.8, 0.4, 8);
        const plat = new THREE.Mesh(platGeom, plankMat);
        plat.position.y = platY;
        plat.castShadow = true;
        plat.receiveShadow = true;
        treeGroup.add(plat);

        // Platform solid collider & jump surface
        const platBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(gt.x, terrainY + platY, gt.z),
          new THREE.Vector3((trunkR + 1.8) * 2, 0.6, (trunkR + 1.8) * 2)
        );
        colliders.push(platBox);
        platforms.push({ box: platBox, topY: terrainY + platY + 0.2 });

        // Hanging magical lantern under the platform
        const lgt = new THREE.PointLight(0xfde047, 1.4, 14);
        lgt.position.set(trunkR + 1.0, platY - 0.5, 0);
        treeGroup.add(lgt);
        lanterns.push(lgt);

        // Trampoline or Spring Pad nearby to leap up onto the platform!
        const springX = gt.x + (trunkR + 3.0);
        const springZ = gt.z + 1.5;
        const springY = getTerrainHeight(springX, springZ);

        const padGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.25, 12);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.6,
        });
        const padMesh = new THREE.Mesh(padGeom, padMat);
        padMesh.position.set(springX, springY + 0.35, springZ);
        padMesh.castShadow = true;
        scene.add(padMesh);

        springPads.push({
          pos: new THREE.Vector3(springX, springY, springZ),
          mesh: padMesh,
          radius: 1.5,
          topY: springY + 0.4,
        });

        // Golden Coin reward on tree platform
        const coinGroup = new THREE.Group();
        coinGroup.position.set(gt.x + 1.0, terrainY + platY + 0.9, gt.z);
        const coinGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
        const coinMesh = new THREE.Mesh(coinGeom, goldMat);
        coinMesh.rotation.x = Math.PI / 2;
        coinGroup.add(coinMesh);
        scene.add(coinGroup);

        coins.push({
          data: {
            id: 8000 + idx,
            x: gt.x + 1.0,
            y: terrainY + platY + 0.9,
            z: gt.z,
            type: 'gold',
            value: 25,
            collected: false,
          },
          mesh: coinGroup,
          light: null,
        });
      } else {
        // Giant Redwood / Towering Fir Tree (height ~26m)
        const trunkH = 18 * gt.scale;
        const trunkR = 1.4 * gt.scale;
        const trunkGeom = new THREE.CylinderGeometry(trunkR * 0.4, trunkR, trunkH, 8);
        const trunk = new THREE.Mesh(trunkGeom, barkMat);
        trunk.position.y = trunkH / 2 - 0.5;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);

        // Stacked Giant Fir Cones (4 tiers)
        const tiers = [
          { r: 5.8 * gt.scale, h: 5.5 * gt.scale, y: trunkH * 0.45, mat: giantLeafMat1 },
          { r: 4.8 * gt.scale, h: 5.2 * gt.scale, y: trunkH * 0.65, mat: giantLeafMat2 },
          { r: 3.6 * gt.scale, h: 4.8 * gt.scale, y: trunkH * 0.85, mat: giantLeafMat1 },
          { r: 2.2 * gt.scale, h: 4.5 * gt.scale, y: trunkH * 1.05, mat: giantLeafMat3 },
        ];

        tiers.forEach((tier) => {
          const coneGeom = new THREE.ConeGeometry(tier.r, tier.h, 8);
          const cone = new THREE.Mesh(coneGeom, tier.mat);
          cone.position.y = tier.y;
          cone.castShadow = true;
          cone.receiveShadow = true;
          treeGroup.add(cone);
        });
      }

      scene.add(treeGroup);

      // Solid base trunk collider
      const trunkCollider = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(gt.x, terrainY + 4, gt.z),
        new THREE.Vector3(3.2 * gt.scale, 8, 3.2 * gt.scale)
      );
      colliders.push(trunkCollider);
    });

    // =========================================================================
    // 3. TORRES DE VIGILANCIA DE MADERA (WATCHTOWERS CON VISTAS PANORÁMICAS)
    // =========================================================================
    const watchtowers = [
      { x: 68, z: 50, label: 'Torre Oriental' },
      { x: -75, z: -55, label: 'Torre del Cañón' },
      { x: 120, z: -80, label: 'Torre del Horizonte Norte' },
    ];

    watchtowers.forEach((wt, wIdx) => {
      const terrainY = getTerrainHeight(wt.x, wt.z);
      const towerGroup = new THREE.Group();
      towerGroup.position.set(wt.x, terrainY, wt.z);

      const towerH = 8.5;
      const towerW = 4.2;

      // 4 Main Stilt Posts
      const stiltGeom = new THREE.CylinderGeometry(0.24, 0.28, towerH, 8);
      const postCoords = [
        { x: -towerW / 2, z: -towerW / 2 },
        { x: towerW / 2, z: -towerW / 2 },
        { x: -towerW / 2, z: towerW / 2 },
        { x: towerW / 2, z: towerW / 2 },
      ];

      postCoords.forEach((coord) => {
        const post = new THREE.Mesh(stiltGeom, woodMat);
        post.position.set(coord.x, towerH / 2, coord.z);
        post.castShadow = true;
        post.receiveShadow = true;
        towerGroup.add(post);
      });

      // Diagonal Cross Braces
      const braceGeom = new THREE.CylinderGeometry(0.08, 0.08, towerW * 1.35, 6);
      for (let s = 0; s < 4; s++) {
        const brace = new THREE.Mesh(braceGeom, woodMat);
        brace.position.y = towerH * 0.45;
        brace.rotation.z = Math.PI / 4 * (s % 2 === 0 ? 1 : -1);
        if (s >= 2) brace.rotation.y = Math.PI / 2;
        towerGroup.add(brace);
      }

      // Observation Deck Floor
      const deckGeom = new THREE.BoxGeometry(towerW + 1.2, 0.45, towerW + 1.2);
      const deck = new THREE.Mesh(deckGeom, plankMat);
      deck.position.y = towerH;
      deck.castShadow = true;
      deck.receiveShadow = true;
      towerGroup.add(deck);

      // Wooden Guardrails
      const railGeom = new THREE.BoxGeometry(towerW + 1.2, 0.85, 0.1);
      for (let side = 0; side < 4; side++) {
        if (side === 0) continue; // opening for ladder entrance
        const rail = new THREE.Mesh(railGeom, woodMat);
        const angle = (side / 4) * Math.PI * 2;
        rail.position.set(Math.cos(angle) * (towerW / 2 + 0.5), towerH + 0.55, Math.sin(angle) * (towerW / 2 + 0.5));
        rail.rotation.y = angle + Math.PI / 2;
        towerGroup.add(rail);
      }

      // Roof Canopy (pyramidal shingle roof)
      const roofGeom = new THREE.ConeGeometry(towerW * 0.95, 2.2, 4);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = towerH + 3.4;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      towerGroup.add(roof);

      // Hanging Lantern on Deck
      const tLantern = new THREE.PointLight(0xfbbf24, 1.6, 16);
      tLantern.position.set(0, towerH + 2.4, 0);
      towerGroup.add(tLantern);
      lanterns.push(tLantern);

      // Climbing Steps / Ramp leading up
      const stepCount = 8;
      for (let st = 0; st < stepCount; st++) {
        const stepY = (st / stepCount) * towerH;
        const stepZ = -towerW / 2 - (stepCount - st) * 0.7;
        const stepGeom = new THREE.BoxGeometry(1.6, 0.3, 0.6);
        const stepMesh = new THREE.Mesh(stepGeom, plankMat);
        stepMesh.position.set(0, stepY, stepZ);
        stepMesh.castShadow = true;
        towerGroup.add(stepMesh);

        const sBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(wt.x, terrainY + stepY, wt.z + stepZ),
          new THREE.Vector3(1.6, 0.4, 0.6)
        );
        colliders.push(sBox);
        platforms.push({ box: sBox, topY: terrainY + stepY + 0.2 });
      }

      scene.add(towerGroup);

      // Deck Solid Collider & Surface Platform
      const deckBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(wt.x, terrainY + towerH, wt.z),
        new THREE.Vector3(towerW + 1.2, 0.6, towerW + 1.2)
      );
      colliders.push(deckBox);
      platforms.push({ box: deckBox, topY: terrainY + towerH + 0.25 });

      // Reward Gem / Star on top of tower
      const gemGroup = new THREE.Group();
      gemGroup.position.set(wt.x, terrainY + towerH + 1.2, wt.z);
      const gemGeom = new THREE.OctahedronGeometry(0.45, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 1.6,
        roughness: 0.1,
      });
      const gemMesh = new THREE.Mesh(gemGeom, gemMat);
      gemGroup.add(gemMesh);
      scene.add(gemGroup);

      coins.push({
        data: {
          id: 9000 + wIdx,
          x: wt.x,
          y: terrainY + towerH + 1.2,
          z: wt.z,
          type: 'gem',
          value: 50,
          collected: false,
        },
        mesh: gemGroup,
        light: null,
      });
    });

    // =========================================================================
    // 4. ARCOS Y RUINAS MÍSTICAS DE PIEDRA (STONE ARCHES & DOLMENS)
    // =========================================================================
    // Grand Stone Archway over the northern road towards the Mayan Temple
    const archPos = { x: 0, z: -35 };
    const archY = getTerrainHeight(archPos.x, archPos.z);
    const archGroup = new THREE.Group();
    archGroup.position.set(archPos.x, archY, archPos.z);

    const pillarGeom = new THREE.BoxGeometry(1.6, 7.5, 1.6);
    const lintelGeom = new THREE.BoxGeometry(9.0, 1.4, 2.0);

    const leftPillar = new THREE.Mesh(pillarGeom, stoneMat);
    leftPillar.position.set(-3.6, 3.75, 0);
    leftPillar.castShadow = true;
    archGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeom, stoneMat);
    rightPillar.position.set(3.6, 3.75, 0);
    rightPillar.castShadow = true;
    archGroup.add(rightPillar);

    const lintel = new THREE.Mesh(lintelGeom, stoneMat);
    lintel.position.set(0, 7.8, 0);
    lintel.castShadow = true;
    archGroup.add(lintel);

    // Stone Arch Lanterns
    const archLight = new THREE.PointLight(0x38bdf8, 1.5, 14);
    archLight.position.set(0, 6.8, 0);
    archGroup.add(archLight);
    lanterns.push(archLight);

    scene.add(archGroup);

    // Colliders for Arch pillars and lintel platform
    const lpBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(archPos.x - 3.6, archY + 3.75, archPos.z),
      new THREE.Vector3(1.6, 7.5, 1.6)
    );
    const rpBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(archPos.x + 3.6, archY + 3.75, archPos.z),
      new THREE.Vector3(1.6, 7.5, 1.6)
    );
    const lintelBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(archPos.x, archY + 7.8, archPos.z),
      new THREE.Vector3(9.0, 1.4, 2.0)
    );
    colliders.push(lpBox, rpBox, lintelBox);
    platforms.push({ box: lintelBox, topY: archY + 8.5 });

    // Mystical Stone Circle (Dolmen) on the Western Highlands
    const stoneCirclePos = { x: -110, z: 15 };
    const scY = getTerrainHeight(stoneCirclePos.x, stoneCirclePos.z);
    for (let m = 0; m < 7; m++) {
      const angle = (m / 7) * Math.PI * 2;
      const mx = stoneCirclePos.x + Math.cos(angle) * 5.5;
      const mz = stoneCirclePos.z + Math.sin(angle) * 5.5;
      const my = getTerrainHeight(mx, mz);

      const mGeom = new THREE.BoxGeometry(1.2, 4.0 + (m % 3) * 0.8, 1.2);
      const monoMesh = new THREE.Mesh(mGeom, stoneMat);
      monoMesh.position.set(mx, my + 2.0, mz);
      monoMesh.rotation.y = angle;
      monoMesh.rotation.z = (m % 2 === 0 ? 0.08 : -0.08);
      monoMesh.castShadow = true;
      scene.add(monoMesh);

      const mBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(mx, my + 2.0, mz),
        new THREE.Vector3(1.4, 4.0, 1.4)
      );
      colliders.push(mBox);
      platforms.push({ box: mBox, topY: my + 4.0 });
    }

    // =========================================================================
    // 5. PUENTE RÚSTICO DE MADERA (WOODEN FOOTBRIDGE)
    // =========================================================================
    const bridgeStart = { x: 42, z: -16 };
    const bridgeEnd = { x: 62, z: -16 };
    const bridgeLength = bridgeEnd.x - bridgeStart.x;
    const bridgeY = Math.max(getTerrainHeight(bridgeStart.x, bridgeStart.z), getTerrainHeight(bridgeEnd.x, bridgeEnd.z)) + 1.2;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set((bridgeStart.x + bridgeEnd.x) / 2, bridgeY, bridgeStart.z);

    // Plank Deck
    const bridgeDeckGeom = new THREE.BoxGeometry(bridgeLength, 0.25, 2.6);
    const bridgeDeck = new THREE.Mesh(bridgeDeckGeom, plankMat);
    bridgeDeck.castShadow = true;
    bridgeDeck.receiveShadow = true;
    bridgeGroup.add(bridgeDeck);

    // Side Rails
    const bRailGeom = new THREE.BoxGeometry(bridgeLength, 0.12, 0.12);
    const leftRail = new THREE.Mesh(bRailGeom, woodMat);
    leftRail.position.set(0, 0.65, -1.25);
    bridgeGroup.add(leftRail);

    const rightRail = new THREE.Mesh(bRailGeom, woodMat);
    rightRail.position.set(0, 0.65, 1.25);
    bridgeGroup.add(rightRail);

    // Support Stilts
    const bStiltGeom = new THREE.CylinderGeometry(0.2, 0.2, bridgeY + 1.5, 6);
    const s1 = new THREE.Mesh(bStiltGeom, woodMat);
    s1.position.set(-bridgeLength * 0.25, -bridgeY / 2, 0);
    bridgeGroup.add(s1);

    const s2 = new THREE.Mesh(bStiltGeom, woodMat);
    s2.position.set(bridgeLength * 0.25, -bridgeY / 2, 0);
    bridgeGroup.add(s2);

    scene.add(bridgeGroup);

    const bridgeBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3((bridgeStart.x + bridgeEnd.x) / 2, bridgeY, bridgeStart.z),
      new THREE.Vector3(bridgeLength, 0.4, 2.6)
    );
    colliders.push(bridgeBox);
    platforms.push({ box: bridgeBox, topY: bridgeY + 0.2 });

    // =========================================================================
    // UPDATE FUNCTION (ANIMATES FLAMES, LIGHT FLICKERING, EMBERS, PARTICLES)
    // =========================================================================
    const update = (dt: number, time: number) => {
      campfires.forEach((cf, idx) => {
        // Organic light flicker
        const flicker = Math.sin(time * 12 + idx * 3.7) * 0.35 + Math.cos(time * 19 + idx) * 0.2;
        cf.light.intensity = cf.baseIntensity + flicker;

        // Ember pulsation
        const emberPulse = Math.sin(time * 3 + idx) * 0.4 + 1.2;
        if (cf.emberMesh.material instanceof THREE.MeshStandardMaterial) {
          cf.emberMesh.material.emissiveIntensity = emberPulse;
        }

        // Animated layered flames dancing
        cf.flameMeshes.forEach((flame, fIdx) => {
          const wave = Math.sin(time * (10 + fIdx * 4) + idx * 2) * 0.18;
          flame.scale.y = 1.0 + wave;
          flame.scale.x = 1.0 - wave * 0.5;
          flame.scale.z = 1.0 - wave * 0.5;
          flame.rotation.y += dt * (1.5 + fIdx);
        });

        // Rising spark particles update
        if (cf.particles && cf.particlePositions && cf.particleVelocities) {
          const count = cf.particlePositions.length / 3;
          for (let p = 0; p < count; p++) {
            cf.particlePositions[p * 3] += cf.particleVelocities[p * 3] * dt;
            cf.particlePositions[p * 3 + 1] += cf.particleVelocities[p * 3 + 1] * dt;
            cf.particlePositions[p * 3 + 2] += cf.particleVelocities[p * 3 + 2] * dt;

            // Reset when too high
            if (cf.particlePositions[p * 3 + 1] > 2.8) {
              cf.particlePositions[p * 3] = (Math.random() - 0.5) * 0.7;
              cf.particlePositions[p * 3 + 1] = 0.3 + Math.random() * 0.2;
              cf.particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 0.7;
            }
          }
          cf.particles.geometry.attributes.position.needsUpdate = true;
        }
      });
    };

    return {
      campfires,
      colliders,
      platforms,
      springPads,
      coins,
      lanterns,
      update,
    };
  }
}
