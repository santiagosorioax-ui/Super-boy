import * as THREE from 'three';

export interface MayanTempleInteriorElements {
  group: THREE.Group;
  colliders: THREE.Box3[];
  platforms: { box: THREE.Box3; topY: number }[];
  spawnPos: THREE.Vector3;
  bossStartPos: THREE.Vector3;
  exitPortalPos: THREE.Vector3;
  exitPortalRing: THREE.Mesh;
}

export class MayanTempleInteriorBuilder {
  public static build(
    scene: THREE.Scene,
    originX = -700,
    originY = 0,
    originZ = -700
  ): MayanTempleInteriorElements {
    const templeGroup = new THREE.Group();
    templeGroup.position.set(originX, originY, originZ);

    const colliders: THREE.Box3[] = [];
    const platforms: { box: THREE.Box3; topY: number }[] = [];

    // --- ANCIENT MESOAMERICAN SACRED PALETTE ---
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Subterranean volcanic basalt flagstone
      roughness: 0.85,
      flatShading: true,
    });
    const carvedStoneMat = new THREE.MeshStandardMaterial({
      color: 0x44403c, // Carved relief limestone blocks
      roughness: 0.8,
    });
    const basaltBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0c0a09, // Obsidian & polished ceremonial basalt
      roughness: 0.6,
      metalness: 0.2,
    });
    const goldOrnamentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Sacred Mayan gold
      emissive: 0xb45309,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.25,
    });
    const jadeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Glowing imperial jade
      emissive: 0x059669,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const turquoiseGlyphMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Mystic turquoise hieroglyphs
      emissive: 0x0891b2,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    });
    const sacredFireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399, // Spiritual green soul-fire
    });
    const royalCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0x881337, // Royal cinnabar ceremonial floor runner
      roughness: 0.7,
    });

    // =========================================================================
    // 1. COLOSSAL SACRED TEMPLE FLOOR (58m wide x 96m long grand basilica)
    // =========================================================================
    const floorW = 58;
    const floorL = 96;
    const floorH = 2.0;

    const floorGeom = new THREE.BoxGeometry(floorW, floorH, floorL);
    const floorMesh = new THREE.Mesh(floorGeom, darkStoneMat);
    floorMesh.position.set(0, -floorH / 2, 0);
    floorMesh.receiveShadow = true;
    templeGroup.add(floorMesh);

    const floorBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX, originY - floorH / 2, originZ),
      new THREE.Vector3(floorW, floorH, floorL)
    );
    colliders.push(floorBox);
    platforms.push({ box: floorBox, topY: originY });

    // 1.1 Central Royal Crimson Stone Runner (Path of the Mayan Kings)
    const runnerW = 8.5;
    const runnerL = 82;
    const runnerGeom = new THREE.BoxGeometry(runnerW, 0.05, runnerL);
    const runnerMesh = new THREE.Mesh(runnerGeom, royalCrimsonMat);
    runnerMesh.position.set(0, 0.025, 0);
    runnerMesh.receiveShadow = true;
    templeGroup.add(runnerMesh);

    // Runner Gold Fret Borders (Grecas Mayas)
    [-runnerW / 2, runnerW / 2].forEach((bx) => {
      const borderGeom = new THREE.BoxGeometry(0.4, 0.08, runnerL);
      const borderMesh = new THREE.Mesh(borderGeom, goldOrnamentMat);
      borderMesh.position.set(bx, 0.04, 0);
      templeGroup.add(borderMesh);
    });

    // 1.2 Giant Mayan Sun Calendar Wheel (Rueda Calendárica de Xibalbá) at Center (Z = -8)
    const calendarGroup = new THREE.Group();
    calendarGroup.position.set(0, 0.06, -8);

    const outerRingGeom = new THREE.RingGeometry(10.5, 14.0, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.9,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeom, ringMat);
    outerRing.rotation.x = -Math.PI / 2;
    calendarGroup.add(outerRing);

    const midRingGeom = new THREE.RingGeometry(5.0, 9.8, 24);
    const midRing = new THREE.Mesh(midRingGeom, goldOrnamentMat);
    midRing.rotation.x = -Math.PI / 2;
    calendarGroup.add(midRing);

    const centerDiscGeom = new THREE.CircleGeometry(4.2, 16);
    const centerDisc = new THREE.Mesh(centerDiscGeom, turquoiseGlyphMat);
    centerDisc.rotation.x = -Math.PI / 2;
    calendarGroup.add(centerDisc);

    templeGroup.add(calendarGroup);

    // =========================================================================
    // 2. MONUMENTAL STONE WALLS & ENCLOSING CORBEL VAULT (BÓVEDA MAYA)
    // 18m tall walls with high stepped stone ceiling
    // =========================================================================
    const wallH = 18.0;
    const wallThick = 3.0;

    // 2.1 North Sanctum Wall (Behind the King's Altar)
    const northWallGeom = new THREE.BoxGeometry(floorW, wallH, wallThick);
    const northWall = new THREE.Mesh(northWallGeom, carvedStoneMat);
    northWall.position.set(0, wallH / 2, -floorL / 2 + wallThick / 2);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    templeGroup.add(northWall);

    const nBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX, originY + wallH / 2, originZ - floorL / 2 + wallThick / 2),
      new THREE.Vector3(floorW, wallH, wallThick)
    );
    colliders.push(nBox);

    // 2.2 South Wall (Entrance / Exit Portal Wall)
    const southWallGeom = new THREE.BoxGeometry(floorW, wallH, wallThick);
    const southWall = new THREE.Mesh(southWallGeom, carvedStoneMat);
    southWall.position.set(0, wallH / 2, floorL / 2 - wallThick / 2);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    templeGroup.add(southWall);

    const sBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX, originY + wallH / 2, originZ + floorL / 2 - wallThick / 2),
      new THREE.Vector3(floorW, wallH, wallThick)
    );
    colliders.push(sBox);

    // 2.3 East Wall
    const eastWallGeom = new THREE.BoxGeometry(wallThick, wallH, floorL);
    const eastWall = new THREE.Mesh(eastWallGeom, darkStoneMat);
    eastWall.position.set(floorW / 2 - wallThick / 2, wallH / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    templeGroup.add(eastWall);

    const eBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX + floorW / 2 - wallThick / 2, originY + wallH / 2, originZ),
      new THREE.Vector3(wallThick, wallH, floorL)
    );
    colliders.push(eBox);

    // 2.4 West Wall
    const westWallGeom = new THREE.BoxGeometry(wallThick, wallH, floorL);
    const westWall = new THREE.Mesh(westWallGeom, darkStoneMat);
    westWall.position.set(-floorW / 2 + wallThick / 2, wallH / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    templeGroup.add(westWall);

    const wBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX - floorW / 2 + wallThick / 2, originY + wallH / 2, originZ),
      new THREE.Vector3(wallThick, wallH, floorL)
    );
    colliders.push(wBox);

    // 2.5 Stepped Mesoamerican Corbel Vault Ceiling (Arco Falso / Bóveda Maya)
    const ceilingTiers = [
      { y: wallH + 1.0, w: floorW - 2, h: 2.0 },
      { y: wallH + 3.0, w: floorW - 8, h: 2.0 },
      { y: wallH + 5.0, w: floorW - 16, h: 2.0 },
      { y: wallH + 6.5, w: floorW - 24, h: 1.5 }, // Keystone ridge
    ];

    ceilingTiers.forEach((ct) => {
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(ct.w, ct.h, floorL), basaltBlackMat);
      cMesh.position.set(0, ct.y, 0);
      cMesh.castShadow = true;
      templeGroup.add(cMesh);
    });

    // Ceiling Collider to prevent any escape into the void
    const ceilingBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(originX, originY + wallH + 4, originZ),
      new THREE.Vector3(floorW, 4, floorL)
    );
    colliders.push(ceilingBox);

    // =========================================================================
    // 3. GIANT KUKULKÁN SERPENT RELIEF ON THE NORTH SANCTUM WALL
    // =========================================================================
    const serpentMaskGroup = new THREE.Group();
    serpentMaskGroup.position.set(0, 11.5, -floorL / 2 + wallThick + 0.6);

    // Massive Serpent Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.0, 2.2), carvedStoneMat);
    serpentMaskGroup.add(snout);

    // Golden Fangs
    [-1.9, 1.9].forEach((fx) => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 4), goldOrnamentMat);
      fang.position.set(fx, -2.2, 0.8);
      fang.rotation.x = Math.PI;
      serpentMaskGroup.add(fang);
    });

    // Giant Glowing Jade Eyes of the Ancient God
    [-2.0, 2.0].forEach((ex) => {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), jadeGlowMat);
      eye.position.set(ex, 1.0, 1.0);
      serpentMaskGroup.add(eye);

      const eyeLight = new THREE.PointLight(0x10b981, 3.2, 20);
      eyeLight.position.set(ex, 1.0, 1.8);
      serpentMaskGroup.add(eyeLight);
    });

    // Feather Fan Plumes radiating from mask
    for (let f = 0; f < 13; f++) {
      const angle = ((f - 6) / 6) * (Math.PI * 0.45);
      const plume = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.2, 0.25), goldOrnamentMat);
      plume.position.set(Math.sin(angle) * 4.6, 2.5 + Math.cos(angle) * 2.8, 0);
      plume.rotation.z = -angle;
      serpentMaskGroup.add(plume);
    }

    templeGroup.add(serpentMaskGroup);

    // =========================================================================
    // 4. HIGH ROYAL DAIS & SACRIFICIAL ALTAR (TRONO DEL REY ZOMBI)
    // 3 Stepped Platforms at North End (Z = -32)
    // =========================================================================
    const altarBaseZ = -32;
    const altarTiers = [
      { w: 32, d: 20, h: 1.1, y: 0.55 },
      { w: 24, d: 15, h: 1.1, y: 1.65 },
      { w: 16, d: 10, h: 1.0, y: 2.7 },
    ];

    altarTiers.forEach((tier) => {
      const tMesh = new THREE.Mesh(new THREE.BoxGeometry(tier.w, tier.h, tier.d), carvedStoneMat);
      tMesh.position.set(0, tier.y, altarBaseZ);
      tMesh.castShadow = true;
      tMesh.receiveShadow = true;
      templeGroup.add(tMesh);

      // Tablero moulding
      const moulding = new THREE.Mesh(new THREE.BoxGeometry(tier.w + 0.5, 0.25, tier.d + 0.5), goldOrnamentMat);
      moulding.position.set(0, tier.y + tier.h / 2 - 0.12, altarBaseZ);
      templeGroup.add(moulding);

      const tBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(originX, originY + tier.y, originZ + altarBaseZ),
        new THREE.Vector3(tier.w, tier.h, tier.d)
      );
      colliders.push(tBox);
      platforms.push({ box: tBox, topY: originY + tier.y + tier.h / 2 });
    });

    const topAltarY = 3.2;

    // Altar Steps leading up to top tier (Front facing South)
    const altarStepCount = 8;
    const altarStepW = 7.5;
    const altarStepRise = topAltarY / altarStepCount;
    const altarStepRun = 1.0;
    const altarStairsStartZ = altarBaseZ + 20 / 2 + 1.2;

    for (let st = 0; st < altarStepCount; st++) {
      const stepY = (st + 0.5) * altarStepRise;
      const stepZ = altarStairsStartZ - st * altarStepRun;
      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(altarStepW, altarStepRise, altarStepRun), darkStoneMat);
      sMesh.position.set(0, stepY, stepZ);
      sMesh.castShadow = true;
      templeGroup.add(sMesh);

      const sBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(originX, originY + stepY, originZ + stepZ),
        new THREE.Vector3(altarStepW, altarStepRise, altarStepRun)
      );
      colliders.push(sBox);
      platforms.push({ box: sBox, topY: originY + (st + 1) * altarStepRise });
    }

    // Grand Basalt Throne of the Mayan Zombie King
    const throneGroup = new THREE.Group();
    throneGroup.position.set(0, topAltarY, altarBaseZ - 2.0);

    // Throne Seat
    const throneSeat = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.4, 2.6), basaltBlackMat);
    throneSeat.position.set(0, 0.7, 0);
    throneGroup.add(throneSeat);

    // Throne High Backrest
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(4.4, 5.0, 1.0), carvedStoneMat);
    throneBack.position.set(0, 3.2, -0.8);
    throneGroup.add(throneBack);

    // Jade Skull Relief on Throne Backrest
    const skullRelief = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), jadeGlowMat);
    skullRelief.position.set(0, 4.0, -0.2);
    throneGroup.add(skullRelief);

    // Golden Armrests
    [-2.3, 2.3].forEach((ax) => {
      const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 2.8), goldOrnamentMat);
      armrest.position.set(ax, 1.3, 0);
      throneGroup.add(armrest);
    });

    templeGroup.add(throneGroup);

    // 2 Giant Obelisks / Hieroglyphic Stelae (Estelas Sagradas) flanking the Altar
    [-14.0, 14.0].forEach((ox) => {
      const stelaGroup = new THREE.Group();
      stelaGroup.position.set(ox, 0, altarBaseZ);

      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, 3.0), darkStoneMat);
      baseMesh.position.y = 0.7;
      stelaGroup.add(baseMesh);

      const shaftMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 9.5, 1.6), carvedStoneMat);
      shaftMesh.position.y = 6.15;
      shaftMesh.castShadow = true;
      stelaGroup.add(shaftMesh);

      // Glowing Mayan Hieroglyphs inlaid on stela face
      for (let g = 0; g < 6; g++) {
        const glyphMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.12), turquoiseGlyphMat);
        glyphMesh.position.set(0, 2.5 + g * 1.2, 0.82);
        stelaGroup.add(glyphMesh);
      }

      templeGroup.add(stelaGroup);

      const oBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(originX + ox, originY + 5.5, originZ + altarBaseZ),
        new THREE.Vector3(3.0, 11.0, 3.0)
      );
      colliders.push(oBox);
    });

    // =========================================================================
    // 5. DOUBLE COLONNADE OF THE FEATHERED SERPENT (AVENIDA DE COLUMNAS)
    // 12 Monumental Pillars (6 on East, 6 on West)
    // =========================================================================
    const pillarZPositions = [-20, -10, 0, 10, 20, 30];
    const pillarXOffset = 15.5;

    pillarZPositions.forEach((pz) => {
      [-pillarXOffset, pillarXOffset].forEach((px) => {
        const colGroup = new THREE.Group();
        colGroup.position.set(px, 0, pz);

        // Heavy Base
        const pBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 3.0), darkStoneMat);
        pBase.position.y = 0.8;
        pBase.castShadow = true;
        colGroup.add(pBase);

        // Column Shaft with tableros
        const pShaft = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 13.5, 10), carvedStoneMat);
        pShaft.position.y = 8.35;
        pShaft.castShadow = true;
        colGroup.add(pShaft);

        // Gold & Jade Capital
        const pCap = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 3.2), goldOrnamentMat);
        pCap.position.y = 15.6;
        colGroup.add(pCap);

        // Brazier Bowl mounted at Y = 4.2m facing towards central aisle
        const bowlX = px > 0 ? -1.5 : 1.5;
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.6, 0.8, 8), goldOrnamentMat);
        bowl.position.set(bowlX, 4.2, 0);
        colGroup.add(bowl);

        // Crackling Sacred Green Flame
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 8), sacredFireMat);
        flame.position.set(bowlX, 5.0, 0);
        colGroup.add(flame);

        // Dynamic Green Lantern Light
        const fireLight = new THREE.PointLight(0x10b981, 2.8, 20);
        fireLight.position.set(bowlX, 5.2, 0);
        colGroup.add(fireLight);

        templeGroup.add(colGroup);

        const colBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(originX + px, originY + 7.5, originZ + pz),
          new THREE.Vector3(3.0, 15.0, 3.0)
        );
        colliders.push(colBox);
      });
    });

    // =========================================================================
    // 6. LATERAL ROYAL BURIAL ALCOVES & CARVED SARCOPHAGI
    // =========================================================================
    const sarcophagiConfigs = [
      { x: -floorW / 2 + wallThick + 2.8, z: -15, rotY: Math.PI / 2 },
      { x: -floorW / 2 + wallThick + 2.8, z: 5, rotY: Math.PI / 2 },
      { x: -floorW / 2 + wallThick + 2.8, z: 25, rotY: Math.PI / 2 },
      { x: floorW / 2 - wallThick - 2.8, z: -15, rotY: -Math.PI / 2 },
      { x: floorW / 2 - wallThick - 2.8, z: 5, rotY: -Math.PI / 2 },
      { x: floorW / 2 - wallThick - 2.8, z: 25, rotY: -Math.PI / 2 },
    ];

    sarcophagiConfigs.forEach((sc) => {
      const sarcGroup = new THREE.Group();
      sarcGroup.position.set(sc.x, 0, sc.z);
      sarcGroup.rotation.y = sc.rotY;

      // Sarcophagus Stone Base
      const sBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.2, 2.4), darkStoneMat);
      sBase.position.y = 0.6;
      sBase.castShadow = true;
      sarcGroup.add(sBase);

      // Carved Effigy Lid
      const sLid = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.7, 2.6), carvedStoneMat);
      sLid.position.y = 1.45;
      sLid.castShadow = true;
      sarcGroup.add(sLid);

      // Inlaid Jade Mask on Sarcophagus
      const mask = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.9), jadeGlowMat);
      mask.position.set(1.4, 1.85, 0);
      sarcGroup.add(mask);

      templeGroup.add(sarcGroup);

      const sBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(originX + sc.x, originY + 1.0, originZ + sc.z),
        new THREE.Vector3(3.2, 2.0, 5.2)
      );
      colliders.push(sBox);
      platforms.push({ box: sBox, topY: originY + 1.8 });
    });

    // =========================================================================
    // 7. GRAND EXIT / RETURN PORTAL GATEWAY (PUERTA AL VALLE PRINCIPAL)
    // Located at South end of the hall (Z = +40)
    // =========================================================================
    const portalBaseZ = 40.0;
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, portalBaseZ);

    // Ceremonial Stone Portal Pedestal
    const portalBaseMesh = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.7, 3.8), carvedStoneMat);
    portalBaseMesh.position.y = 0.35;
    portalGroup.add(portalBaseMesh);

    // Stone Gate Pylons with entwined serpent carvings
    [-4.2, 4.2].forEach((px) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.8, 7.5, 1.8), darkStoneMat);
      pylon.position.set(px, 4.1, 0);
      pylon.castShadow = true;
      portalGroup.add(pylon);

      // Pylon Torch
      const torch = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 8), sacredFireMat);
      torch.position.set(px, 8.3, 0);
      portalGroup.add(torch);
    });

    // Portal Lintel Beam
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.6, 2.2), goldOrnamentMat);
    lintel.position.set(0, 8.2, 0);
    portalGroup.add(lintel);

    // Overhead Sign Tablet
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 128);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪 SALIDA AL VALLE MAYA', 256, 50);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText('« Entra para regresar al exterior »', 256, 92);
    }
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 1.8),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
    );
    signMesh.position.set(0, 9.8, 0.1);
    portalGroup.add(signMesh);

    // Glowing Azure Vortex Portal Ring
    const exitRingGeom = new THREE.TorusGeometry(2.6, 0.25, 16, 32);
    const exitRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.8,
    });
    const exitPortalRing = new THREE.Mesh(exitRingGeom, exitRingMat);
    exitPortalRing.position.set(0, 4.0, 0);
    portalGroup.add(exitPortalRing);

    // Sky Beacon Light Beam inside Portal
    const beamGeom = new THREE.CylinderGeometry(1.4, 1.4, 16, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(0, 8.0, 0);
    portalGroup.add(beam);

    // Glowing Portal Light
    const portalLight = new THREE.PointLight(0x38bdf8, 3.8, 16);
    portalLight.position.set(0, 4.0, 1.0);
    portalGroup.add(portalLight);

    templeGroup.add(portalGroup);

    scene.add(templeGroup);

    return {
      group: templeGroup,
      colliders,
      platforms,
      // Player enters here facing North down the grand aisle towards the altar
      spawnPos: new THREE.Vector3(originX, originY + 1.2, originZ + 18.0),
      // Boss starts at the center of the arena/altar area
      bossStartPos: new THREE.Vector3(originX, originY, originZ - 10.0),
      // Exit portal position
      exitPortalPos: new THREE.Vector3(originX, originY + 1.2, originZ + portalBaseZ),
      exitPortalRing,
    };
  }
}
