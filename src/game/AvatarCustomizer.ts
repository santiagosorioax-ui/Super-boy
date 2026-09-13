import * as THREE from 'three';
import { PlayerCustomization, CharacterGender } from '../types';
import { CLOTHING_CATALOG } from '../data/clothingCatalog';

export interface AvatarLimbs {
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  cape: THREE.Mesh | null;
}

export interface AvatarInstance {
  group: THREE.Group;
  limbs: AvatarLimbs;
  updateCustomization: (customization: PlayerCustomization) => void;
}

export function createCustomAvatar(initialCustomization?: PlayerCustomization): AvatarInstance {
  const rootGroup = new THREE.Group();

  // 1. Reusable Shared Materials with Dynamic Tints
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffd5b8, // Warm peach skin tone
    roughness: 0.65,
    metalness: 0.02,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x4a2a16, // Default chestnut brown
    roughness: 0.75,
    flatShading: true,
  });

  const jacketMat = new THREE.MeshStandardMaterial({
    color: 0xd93829, // Default red
    roughness: 0.5,
  });

  const jacketTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Navy trim
    roughness: 0.5,
  });

  const shirtMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // White inner shirt
    roughness: 0.6,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.8,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x3d2010,
    roughness: 0.7,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x1e2e4a,
    roughness: 0.7,
  });

  const kneePatchMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
  });

  const shoeBodyMat = new THREE.MeshStandardMaterial({
    color: 0xd93829,
    roughness: 0.5,
  });

  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
  });

  const packMat = new THREE.MeshStandardMaterial({
    color: 0x065f46,
    roughness: 0.65,
  });

  const strapMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.7,
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
  const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x381e0f });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xa83244 });
  const gloveMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.6 });

  // 2. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.38, 0);

  // Head base
  const headGeom = new THREE.BoxGeometry(0.38, 0.40, 0.38);
  const headMesh = new THREE.Mesh(headGeom, skinMat);
  headMesh.position.set(0, 0.20, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Nose
  const noseGeom = new THREE.BoxGeometry(0.05, 0.06, 0.07);
  const nose = new THREE.Mesh(noseGeom, skinMat);
  nose.position.set(0, 0.19, 0.21);
  headGroup.add(nose);

  // Smiling Mouth
  const mouthGeom = new THREE.BoxGeometry(0.12, 0.025, 0.02);
  const mouth = new THREE.Mesh(mouthGeom, mouthMat);
  mouth.position.set(0, 0.11, 0.195);
  headGroup.add(mouth);

  // Left Eye
  const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.02);
  const leftEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  leftEyeWhite.position.set(-0.095, 0.23, 0.192);
  headGroup.add(leftEyeWhite);

  const irisGeom = new THREE.BoxGeometry(0.05, 0.06, 0.02);
  const leftIris = new THREE.Mesh(irisGeom, irisMat);
  leftIris.position.set(-0.095, 0.23, 0.198);
  headGroup.add(leftIris);

  const pupilGeom = new THREE.BoxGeometry(0.025, 0.035, 0.02);
  const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
  leftPupil.position.set(-0.095, 0.23, 0.202);
  headGroup.add(leftPupil);

  const glintGeom = new THREE.BoxGeometry(0.012, 0.012, 0.02);
  const leftGlint = new THREE.Mesh(glintGeom, eyeWhiteMat);
  leftGlint.position.set(-0.085, 0.245, 0.205);
  headGroup.add(leftGlint);

  // Right Eye
  const rightEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  rightEyeWhite.position.set(0.095, 0.23, 0.192);
  headGroup.add(rightEyeWhite);

  const rightIris = new THREE.Mesh(irisGeom, irisMat);
  rightIris.position.set(0.095, 0.23, 0.198);
  headGroup.add(rightIris);

  const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
  rightPupil.position.set(0.095, 0.23, 0.202);
  headGroup.add(rightPupil);

  const rightGlint = new THREE.Mesh(glintGeom, eyeWhiteMat);
  rightGlint.position.set(0.105, 0.245, 0.205);
  headGroup.add(rightGlint);

  // Eyebrows
  const browGeom = new THREE.BoxGeometry(0.09, 0.025, 0.02);
  const leftBrow = new THREE.Mesh(browGeom, eyebrowMat);
  leftBrow.position.set(-0.095, 0.29, 0.195);
  leftBrow.rotation.z = 0.08;
  headGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeom, eyebrowMat);
  rightBrow.position.set(0.095, 0.29, 0.195);
  rightBrow.rotation.z = -0.08;
  headGroup.add(rightBrow);

  // Eyelashes (visible for girl gender)
  const eyelashGeom = new THREE.BoxGeometry(0.07, 0.012, 0.02);
  const leftLash = new THREE.Mesh(eyelashGeom, pupilMat);
  leftLash.position.set(-0.095, 0.28, 0.204);
  leftLash.rotation.z = 0.12;
  leftLash.visible = false;
  headGroup.add(leftLash);

  const rightLash = new THREE.Mesh(eyelashGeom, pupilMat);
  rightLash.position.set(0.095, 0.28, 0.204);
  rightLash.rotation.z = -0.12;
  rightLash.visible = false;
  headGroup.add(rightLash);

  // Ears
  const earGeom = new THREE.BoxGeometry(0.05, 0.09, 0.07);
  const leftEar = new THREE.Mesh(earGeom, skinMat);
  leftEar.position.set(-0.21, 0.20, 0);
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeom, skinMat);
  rightEar.position.set(0.21, 0.20, 0);
  headGroup.add(rightEar);

  // Hair Base Group (Common Hair Top & Back)
  const hairTopGeom = new THREE.BoxGeometry(0.42, 0.18, 0.42);
  const hairTop = new THREE.Mesh(hairTopGeom, hairMat);
  hairTop.position.set(0, 0.35, -0.01);
  headGroup.add(hairTop);

  const hairBackGeom = new THREE.BoxGeometry(0.42, 0.26, 0.14);
  const hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(0, 0.20, -0.15);
  headGroup.add(hairBack);

  // Boy Hair Specifics Group
  const boyHairGroup = new THREE.Group();
  const sideburnGeom = new THREE.BoxGeometry(0.06, 0.18, 0.14);
  const leftSideburn = new THREE.Mesh(sideburnGeom, hairMat);
  leftSideburn.position.set(-0.205, 0.24, 0.04);
  boyHairGroup.add(leftSideburn);

  const rightSideburn = new THREE.Mesh(sideburnGeom, hairMat);
  rightSideburn.position.set(0.205, 0.24, 0.04);
  boyHairGroup.add(rightSideburn);

  const bang1Geom = new THREE.ConeGeometry(0.05, 0.12, 4);
  const bang1 = new THREE.Mesh(bang1Geom, hairMat);
  bang1.position.set(-0.10, 0.32, 0.21);
  bang1.rotation.set(-0.3, 0, 0.2);
  boyHairGroup.add(bang1);

  const bang2 = new THREE.Mesh(bang1Geom, hairMat);
  bang2.position.set(0.0, 0.33, 0.22);
  bang2.rotation.set(-0.35, 0, -0.1);
  boyHairGroup.add(bang2);

  const bang3 = new THREE.Mesh(bang1Geom, hairMat);
  bang3.position.set(0.10, 0.32, 0.21);
  bang3.rotation.set(-0.3, 0, -0.2);
  boyHairGroup.add(bang3);
  headGroup.add(boyHairGroup);

  // Girl Hair Specifics Group (Long Cascading Ponytail & Side Bangs)
  const girlHairGroup = new THREE.Group();
  girlHairGroup.visible = false;

  // Ponytail Tail & Bow
  const ponytailBase = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), hairMat);
  ponytailBase.position.set(0, 0.36, -0.24);
  girlHairGroup.add(ponytailBase);

  const ponytailStrand1 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.40, 8), hairMat);
  ponytailStrand1.position.set(0, 0.14, -0.27);
  ponytailStrand1.rotation.x = 0.35;
  girlHairGroup.add(ponytailStrand1);

  const ponytailStrand2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 6), hairMat);
  ponytailStrand2.position.set(0, -0.12, -0.32);
  ponytailStrand2.rotation.x = 0.25;
  girlHairGroup.add(ponytailStrand2);

  // Cute hair ribbon/bow
  const bowMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.4 });
  const bowLeft = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), bowMat);
  bowLeft.position.set(-0.08, 0.38, -0.23);
  bowLeft.rotation.z = Math.PI / 2;
  girlHairGroup.add(bowLeft);

  const bowRight = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), bowMat);
  bowRight.position.set(0.08, 0.38, -0.23);
  bowRight.rotation.z = -Math.PI / 2;
  girlHairGroup.add(bowRight);

  // Cute soft front bangs for girl
  const girlBang1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), hairMat);
  girlBang1.position.set(-0.08, 0.31, 0.21);
  girlBang1.rotation.z = 0.15;
  girlHairGroup.add(girlBang1);

  const girlBang2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.04), hairMat);
  girlBang2.position.set(0.08, 0.31, 0.21);
  girlBang2.rotation.z = -0.15;
  girlHairGroup.add(girlBang2);

  headGroup.add(girlHairGroup);

  // Dynamic Hats Group
  const hatGroup = new THREE.Group();
  headGroup.add(hatGroup);

  rootGroup.add(headGroup);

  // 3. Torso Group
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.82, 0);

  // Neck
  const neckGeom = new THREE.CylinderGeometry(0.09, 0.10, 0.18, 8);
  const neck = new THREE.Mesh(neckGeom, skinMat);
  neck.position.set(0, 0.45, 0);
  torsoGroup.add(neck);

  // Main Jacket / Top
  const jacketGeom = new THREE.BoxGeometry(0.50, 0.46, 0.32);
  const jacket = new THREE.Mesh(jacketGeom, jacketMat);
  jacket.position.set(0, 0.23, 0);
  jacket.castShadow = true;
  torsoGroup.add(jacket);

  // Inner Shirt
  const shirtGeom = new THREE.BoxGeometry(0.24, 0.40, 0.02);
  const shirt = new THREE.Mesh(shirtGeom, shirtMat);
  shirt.position.set(0, 0.23, 0.162);
  torsoGroup.add(shirt);

  // Chest Emblem
  const starGeom = new THREE.DodecahedronGeometry(0.04, 0);
  const chestEmblem = new THREE.Mesh(starGeom, goldMat);
  chestEmblem.position.set(0, 0.27, 0.176);
  torsoGroup.add(chestEmblem);

  // Lapels
  const lapelGeom = new THREE.BoxGeometry(0.05, 0.44, 0.03);
  const leftLapel = new THREE.Mesh(lapelGeom, jacketTrimMat);
  leftLapel.position.set(-0.14, 0.23, 0.162);
  torsoGroup.add(leftLapel);

  const rightLapel = new THREE.Mesh(lapelGeom, jacketTrimMat);
  rightLapel.position.set(0.14, 0.23, 0.162);
  torsoGroup.add(rightLapel);

  // Belt & Buckle
  const beltGeom = new THREE.BoxGeometry(0.52, 0.08, 0.34);
  const belt = new THREE.Mesh(beltGeom, beltMat);
  belt.position.set(0, 0.02, 0);
  torsoGroup.add(belt);

  const buckleGeom = new THREE.BoxGeometry(0.10, 0.09, 0.04);
  const buckle = new THREE.Mesh(buckleGeom, goldMat);
  buckle.position.set(0, 0.02, 0.175);
  torsoGroup.add(buckle);

  // Dynamic Backpack Group
  const backpackContainer = new THREE.Group();
  torsoGroup.add(backpackContainer);

  // Scarf & Cape
  const scarfCollarGeom = new THREE.TorusGeometry(0.15, 0.045, 6, 12);
  const scarfCollar = new THREE.Mesh(scarfCollarGeom, capeMat);
  scarfCollar.position.set(0, 0.43, 0);
  scarfCollar.rotation.x = Math.PI / 2;
  torsoGroup.add(scarfCollar);

  const capeGeom = new THREE.PlaneGeometry(0.30, 0.52);
  const cape = new THREE.Mesh(capeGeom, capeMat);
  cape.position.set(0, 0.38, -0.18);
  cape.rotation.x = 0.25;
  torsoGroup.add(cape);

  rootGroup.add(torsoGroup);

  // 4. Arms
  const createArm = (isLeft: boolean): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(isLeft ? -0.32 : 0.32, 1.20, 0);

    const shoulderGeom = new THREE.SphereGeometry(0.09, 8, 8);
    const shoulder = new THREE.Mesh(shoulderGeom, jacketMat);
    shoulder.position.set(0, 0, 0);
    shoulder.castShadow = true;
    arm.add(shoulder);

    const sleeveGeom = new THREE.CylinderGeometry(0.08, 0.075, 0.20, 8);
    const sleeve = new THREE.Mesh(sleeveGeom, jacketMat);
    sleeve.position.set(0, -0.10, 0);
    sleeve.castShadow = true;
    arm.add(sleeve);

    const forearmGeom = new THREE.CylinderGeometry(0.068, 0.062, 0.18, 8);
    const forearm = new THREE.Mesh(forearmGeom, skinMat);
    forearm.position.set(0, -0.27, 0);
    forearm.castShadow = true;
    arm.add(forearm);

    const wristGeom = new THREE.CylinderGeometry(0.072, 0.072, 0.07, 8);
    const wrist = new THREE.Mesh(wristGeom, gloveMat);
    wrist.position.set(0, -0.37, 0);
    arm.add(wrist);

    const palmGeom = new THREE.BoxGeometry(0.09, 0.09, 0.09);
    const palm = new THREE.Mesh(palmGeom, skinMat);
    palm.position.set(0, -0.46, 0.01);
    palm.castShadow = true;
    arm.add(palm);

    const thumbGeom = new THREE.BoxGeometry(0.035, 0.055, 0.045);
    const thumb = new THREE.Mesh(thumbGeom, skinMat);
    thumb.position.set(isLeft ? -0.05 : 0.05, -0.44, 0.04);
    thumb.rotation.z = isLeft ? 0.3 : -0.3;
    arm.add(thumb);

    const fingersGeom = new THREE.BoxGeometry(0.08, 0.045, 0.05);
    const fingers = new THREE.Mesh(fingersGeom, skinMat);
    fingers.position.set(0, -0.48, 0.05);
    arm.add(fingers);

    return arm;
  };

  const leftArm = createArm(true);
  rootGroup.add(leftArm);

  const rightArm = createArm(false);
  rootGroup.add(rightArm);

  // 5. Legs
  const createLeg = (isLeft: boolean): THREE.Group => {
    const leg = new THREE.Group();
    leg.position.set(isLeft ? -0.14 : 0.14, 0.74, 0);

    const thighGeom = new THREE.CylinderGeometry(0.095, 0.088, 0.28, 8);
    const thigh = new THREE.Mesh(thighGeom, pantsMat);
    thigh.position.set(0, -0.14, 0);
    thigh.castShadow = true;
    leg.add(thigh);

    const patchGeom = new THREE.BoxGeometry(0.11, 0.07, 0.025);
    const patch = new THREE.Mesh(patchGeom, kneePatchMat);
    patch.position.set(0, -0.27, 0.08);
    leg.add(patch);

    const shinGeom = new THREE.CylinderGeometry(0.085, 0.08, 0.24, 8);
    const shin = new THREE.Mesh(shinGeom, pantsMat);
    shin.position.set(0, -0.38, 0);
    shin.castShadow = true;
    leg.add(shin);

    const sneakerCuffGeom = new THREE.CylinderGeometry(0.088, 0.088, 0.08, 8);
    const sneakerCuff = new THREE.Mesh(sneakerCuffGeom, shoeBodyMat);
    sneakerCuff.position.set(0, -0.52, 0);
    leg.add(sneakerCuff);

    const shoeBodyGeom = new THREE.BoxGeometry(0.13, 0.11, 0.22);
    const shoeBody = new THREE.Mesh(shoeBodyGeom, shoeBodyMat);
    shoeBody.position.set(0, -0.59, 0.03);
    shoeBody.castShadow = true;
    leg.add(shoeBody);

    const soleGeom = new THREE.BoxGeometry(0.14, 0.04, 0.24);
    const sole = new THREE.Mesh(soleGeom, shoeSoleMat);
    sole.position.set(0, -0.66, 0.03);
    sole.receiveShadow = true;
    leg.add(sole);

    const toeCapGeom = new THREE.BoxGeometry(0.13, 0.065, 0.07);
    const toeCap = new THREE.Mesh(toeCapGeom, shoeSoleMat);
    toeCap.position.set(0, -0.61, 0.12);
    leg.add(toeCap);

    const lacesGeom = new THREE.BoxGeometry(0.07, 0.03, 0.10);
    const laces = new THREE.Mesh(lacesGeom, shoeSoleMat);
    laces.position.set(0, -0.56, 0.05);
    leg.add(laces);

    return leg;
  };

  const leftLeg = createLeg(true);
  rootGroup.add(leftLeg);

  const rightLeg = createLeg(false);
  rootGroup.add(rightLeg);

  // 6. Hat Mesh Generator
  function buildHatMesh(hatId: string, primaryColor: number = 0xd93829, secondaryColor: number = 0xf59e0b): THREE.Group {
    const group = new THREE.Group();
    const matA = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.5 });
    const matB = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.4, metalness: 0.3 });

    switch (hatId) {
      case 'hat_none':
        return group;

      case 'hat_cowboy': {
        // Wide curved brim
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.03, 16), matA);
        brim.position.set(0, 0.36, -0.02);
        brim.rotation.x = -0.08;
        group.add(brim);

        // Crown with indent
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.18, 14), matA);
        crown.position.set(0, 0.46, -0.02);
        group.add(crown);

        // Leather band with buckle
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.04, 14), matB);
        band.position.set(0, 0.38, -0.02);
        group.add(band);
        break;
      }

      case 'hat_beanie': {
        const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), matA);
        beanie.position.set(0, 0.38, -0.02);
        beanie.scale.set(1, 0.9, 1);
        group.add(beanie);

        // Pom-pom on top
        const pompom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06, 1), matB);
        pompom.position.set(0, 0.56, -0.03);
        group.add(pompom);
        break;
      }

      case 'hat_cat_ears': {
        // Headband ring
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 16), matA);
        band.position.set(0, 0.36, 0.02);
        band.rotation.x = Math.PI / 2;
        group.add(band);

        // Left & Right Cat Ears
        const earGeom = new THREE.ConeGeometry(0.07, 0.14, 4);
        const leftEarMesh = new THREE.Mesh(earGeom, matA);
        leftEarMesh.position.set(-0.14, 0.48, 0.02);
        leftEarMesh.rotation.set(0, 0, 0.3);
        group.add(leftEarMesh);

        const rightEarMesh = new THREE.Mesh(earGeom, matA);
        rightEarMesh.position.set(0.14, 0.48, 0.02);
        rightEarMesh.rotation.set(0, 0, -0.3);
        group.add(rightEarMesh);

        // Inner ear pink pads
        const innerMat = new THREE.MeshBasicMaterial({ color: 0xfecdd3 });
        const leftInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), innerMat);
        leftInner.position.set(-0.14, 0.47, 0.05);
        leftInner.rotation.z = 0.3;
        group.add(leftInner);

        const rightInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), innerMat);
        rightInner.position.set(0.14, 0.47, 0.05);
        rightInner.rotation.z = -0.3;
        group.add(rightInner);
        break;
      }

      case 'hat_crown': {
        const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.08, 16, 1, true), matA);
        crownBase.position.set(0, 0.40, -0.01);
        group.add(crownBase);

        // 5 Gold Spikes
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 4), matA);
          spike.position.set(Math.sin(angle) * 0.23, 0.48, Math.cos(angle) * 0.23 - 0.01);
          group.add(spike);

          // Ruby gem on top of spike
          const gem = new THREE.Mesh(new THREE.DodecahedronGeometry(0.022, 0), matB);
          gem.position.set(Math.sin(angle) * 0.23, 0.54, Math.cos(angle) * 0.23 - 0.01);
          group.add(gem);
        }
        break;
      }

      case 'hat_space': {
        // Space helmet ring & bubble visor
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.05, 8, 20), matA);
        ring.position.set(0, 0.26, 0.05);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const visorMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.75,
        });
        const visor = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), visorMat);
        visor.position.set(0, 0.26, 0.05);
        group.add(visor);
        break;
      }

      case 'hat_wizard': {
        // Wide floppy brim
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.40, 0.03, 16), matA);
        brim.position.set(0, 0.36, -0.02);
        group.add(brim);

        // Tall conical wizard crown with crook
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.48, 12), matA);
        cone.position.set(0, 0.58, -0.04);
        cone.rotation.x = -0.2;
        group.add(cone);

        // Gold stars on hat
        for (let i = 0; i < 3; i++) {
          const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.035, 0), matB);
          star.position.set((i - 1) * 0.10, 0.50 + i * 0.05, 0.10);
          group.add(star);
        }
        break;
      }

      case 'hat_default':
      default: {
        // Classic Super Boy Cap (Sporty Backwards Cap with Star Badge)
        const capCrownGeom = new THREE.CylinderGeometry(0.22, 0.24, 0.14, 12);
        const capCrown = new THREE.Mesh(capCrownGeom, matA);
        capCrown.position.set(0, 0.38, -0.02);
        group.add(capCrown);

        const capBrimGeom = new THREE.BoxGeometry(0.22, 0.025, 0.16);
        const capBrim = new THREE.Mesh(capBrimGeom, matA);
        capBrim.position.set(0, 0.33, -0.20);
        capBrim.rotation.x = -0.15;
        group.add(capBrim);

        const capStar = new THREE.Mesh(new THREE.DodecahedronGeometry(0.04, 0), matB);
        capStar.position.set(0, 0.38, 0.19);
        capStar.rotation.y = 0.4;
        group.add(capStar);
        break;
      }
    }

    return group;
  }

  // 7. Backpack Mesh Generator
  function buildBackpackMesh(packId: string, primaryColor: number = 0x065f46, secondaryColor: number = 0xb45309): THREE.Group {
    const group = new THREE.Group();
    const matA = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.65 });
    const matB = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.5 });

    switch (packId) {
      case 'pack_none':
        return group;

      case 'pack_tactical': {
        const mainPack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.20), matA);
        mainPack.position.set(0, 0.24, -0.25);
        mainPack.castShadow = true;
        group.add(mainPack);

        // Utility pouches
        const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.10), matB);
        pouchL.position.set(-0.21, 0.24, -0.22);
        group.add(pouchL);

        const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.10), matB);
        pouchR.position.set(0.21, 0.24, -0.22);
        group.add(pouchR);
        break;
      }

      case 'pack_candy': {
        // Pink bear head shape backpack
        const bearBody = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), matA);
        bearBody.position.set(0, 0.24, -0.24);
        bearBody.scale.set(1, 1.1, 0.8);
        group.add(bearBody);

        const earL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), matB);
        earL.position.set(-0.14, 0.40, -0.24);
        group.add(earL);

        const earR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), matB);
        earR.position.set(0.14, 0.40, -0.24);
        group.add(earR);
        break;
      }

      case 'pack_jetpack': {
        // Dual metallic thrusters
        const thrusterGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 10);
        const tubeL = new THREE.Mesh(thrusterGeom, matA);
        tubeL.position.set(-0.15, 0.24, -0.24);
        group.add(tubeL);

        const tubeR = new THREE.Mesh(thrusterGeom, matA);
        tubeR.position.set(0.15, 0.24, -0.24);
        group.add(tubeR);

        // Rocket exhaust cones
        const coneL = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.10, 8), matB);
        coneL.position.set(-0.15, 0.0, -0.24);
        coneL.rotation.x = Math.PI;
        group.add(coneL);

        const coneR = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.10, 8), matB);
        coneR.position.set(0.15, 0.0, -0.24);
        coneR.rotation.x = Math.PI;
        group.add(coneR);

        // Jet fire / glow particles
        const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const fireL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), fireMat);
        fireL.position.set(-0.15, -0.09, -0.24);
        fireL.rotation.x = Math.PI;
        group.add(fireL);

        const fireR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), fireMat);
        fireR.position.set(0.15, -0.09, -0.24);
        fireR.rotation.x = Math.PI;
        group.add(fireR);
        break;
      }

      case 'pack_wings': {
        // Radiant Angel / Phoenix Wings
        const wingMat = new THREE.MeshStandardMaterial({
          color: primaryColor,
          emissive: secondaryColor,
          emissiveIntensity: 0.35,
          side: THREE.DoubleSide,
        });

        // Left Wing
        const leftWing = new THREE.Group();
        leftWing.position.set(-0.10, 0.28, -0.20);
        const wingGeom = new THREE.PlaneGeometry(0.55, 0.40);
        const wingLMesh = new THREE.Mesh(wingGeom, wingMat);
        wingLMesh.position.set(-0.25, 0.10, 0);
        wingLMesh.rotation.set(-0.1, 0.4, 0.2);
        leftWing.add(wingLMesh);
        group.add(leftWing);

        // Right Wing
        const rightWing = new THREE.Group();
        rightWing.position.set(0.10, 0.28, -0.20);
        const wingRMesh = new THREE.Mesh(wingGeom, wingMat);
        wingRMesh.position.set(0.25, 0.10, 0);
        wingRMesh.rotation.set(-0.1, -0.4, -0.2);
        rightWing.add(wingRMesh);
        group.add(rightWing);
        break;
      }

      case 'pack_default':
      default: {
        const packGeom = new THREE.BoxGeometry(0.36, 0.42, 0.18);
        const pack = new THREE.Mesh(packGeom, matA);
        pack.position.set(0, 0.24, -0.24);
        pack.castShadow = true;
        group.add(pack);

        const pocketGeom = new THREE.BoxGeometry(0.26, 0.18, 0.08);
        const pocket = new THREE.Mesh(pocketGeom, matA);
        pocket.position.set(0, 0.16, -0.35);
        group.add(pocket);
        break;
      }
    }

    // Shoulder straps if not wings
    if (packId !== 'pack_none') {
      const strapGeom = new THREE.BoxGeometry(0.06, 0.44, 0.34);
      const leftStrap = new THREE.Mesh(strapGeom, strapMat);
      leftStrap.position.set(-0.16, 0.24, -0.01);
      group.add(leftStrap);

      const rightStrap = new THREE.Mesh(strapGeom, strapMat);
      rightStrap.position.set(0.16, 0.24, -0.01);
      group.add(rightStrap);
    }

    return group;
  }

  // 8. Customization Updater
  function updateCustomization(customization: PlayerCustomization) {
    const isGirl = customization.gender === 'girl';

    // Toggle Gender Features
    boyHairGroup.visible = !isGirl;
    girlHairGroup.visible = isGirl;
    leftLash.visible = isGirl;
    rightLash.visible = isGirl;

    // Hair color (slightly softer for girl)
    hairMat.color.setHex(isGirl ? 0x6b3e26 : 0x4a2a16);

    // Find equipped items from catalog
    const hatItem = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.hatId);
    const shirtItem = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.shirtId);
    const pantsItem = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.pantsId);
    const shoesItem = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.shoesId);
    const packItem = CLOTHING_CATALOG.find((i) => i.id === customization.equipped.backpackId);

    // Rebuild Hat
    while (hatGroup.children.length > 0) {
      hatGroup.remove(hatGroup.children[0]);
    }
    const newHat = buildHatMesh(
      customization.equipped.hatId,
      hatItem?.primaryColor ?? 0xd93829,
      hatItem?.secondaryColor ?? 0xf59e0b
    );
    hatGroup.add(newHat);

    // Rebuild Backpack
    while (backpackContainer.children.length > 0) {
      backpackContainer.remove(backpackContainer.children[0]);
    }
    const newPack = buildBackpackMesh(
      customization.equipped.backpackId,
      packItem?.primaryColor ?? 0x065f46,
      packItem?.secondaryColor ?? 0xb45309
    );
    backpackContainer.add(newPack);

    // Update Shirt / Jacket Colors
    if (shirtItem) {
      jacketMat.color.setHex(shirtItem.primaryColor ?? 0xd93829);
      jacketTrimMat.color.setHex(shirtItem.secondaryColor ?? 0x1e3a8a);
      shirtMat.color.setHex(shirtItem.accentColor ?? 0xf8fafc);
      capeMat.color.setHex(shirtItem.primaryColor ?? 0xef4444);
    }

    // Update Pants Colors
    if (pantsItem) {
      pantsMat.color.setHex(pantsItem.primaryColor ?? 0x1e2e4a);
      kneePatchMat.color.setHex(pantsItem.secondaryColor ?? 0x0f172a);
    }

    // Update Shoes Colors
    if (shoesItem) {
      shoeBodyMat.color.setHex(shoesItem.primaryColor ?? 0xd93829);
      shoeSoleMat.color.setHex(shoesItem.secondaryColor ?? 0xffffff);
    }
  }

  // Apply initial customization if provided
  if (initialCustomization) {
    updateCustomization(initialCustomization);
  } else {
    // Default boy setup
    const defaultHat = buildHatMesh('hat_default');
    hatGroup.add(defaultHat);
    const defaultPack = buildBackpackMesh('pack_default');
    backpackContainer.add(defaultPack);
  }

  return {
    group: rootGroup,
    limbs: {
      head: headGroup,
      torso: torsoGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      cape,
    },
    updateCustomization,
  };
}
