import * as THREE from 'three';
import { TextureSynthesizer } from './TextureSynthesizer';

export interface ScenicRiverResult {
  group: THREE.Group;
  waterMesh: THREE.Mesh;
  pondMesh: THREE.Mesh;
  update: (dt: number, time: number) => void;
}

export class ScenicRiverBuilder {
  public static build(
    scene: THREE.Scene,
    getTerrainHeight: (x: number, z: number) => number
  ): ScenicRiverResult {
    const group = new THREE.Group();

    // 1. Water Material with real-time specular sun reflection & animated ripple normal map
    const waterNormal = TextureSynthesizer.getWaterNormal();
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x247ba0,
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.82,
      normalMap: waterNormal,
      normalScale: new THREE.Vector2(0.35, 0.35),
    });

    // 2. River Segment 1: Flows under the Wooden Footbridge (x: 40 to 65, z: -16)
    // Orient slightly diagonally to follow natural terrain contours
    const riverLength = 70;
    const riverWidth = 7.5;
    const riverGeom = new THREE.PlaneGeometry(riverLength, riverWidth, 24, 6);
    riverGeom.rotateX(-Math.PI / 2);
    riverGeom.rotateY(-0.18); // Slight natural diagonal angle

    const riverMesh = new THREE.Mesh(riverGeom, waterMat);
    const riverCenterX = 52;
    const riverCenterZ = -16;
    const riverY = Math.min(getTerrainHeight(riverCenterX, riverCenterZ), 0.5) - 0.08;
    riverMesh.position.set(riverCenterX, Math.max(0.12, riverY), riverCenterZ);
    riverMesh.receiveShadow = true;
    group.add(riverMesh);

    // Riverbed Border Stones & Smooth Boulders along the riverbanks
    const stoneGeom = new THREE.DodecahedronGeometry(0.65, 0);
    const stoneTex = TextureSynthesizer.getRockTexture();
    const stoneNorm = TextureSynthesizer.getRockNormal();
    const pebbleMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      map: stoneTex,
      normalMap: stoneNorm,
      flatShading: true,
    });

    const riverBankPoints: { x: number; z: number }[] = [
      { x: 32, z: -20 }, { x: 38, z: -21 }, { x: 44, z: -21 }, { x: 50, z: -20 }, { x: 58, z: -19 }, { x: 68, z: -18 },
      { x: 30, z: -12 }, { x: 36, z: -11 }, { x: 44, z: -11 }, { x: 52, z: -11 }, { x: 60, z: -12 }, { x: 70, z: -13 },
    ];

    riverBankPoints.forEach((pt, i) => {
      const pMesh = new THREE.Mesh(stoneGeom, pebbleMat);
      const py = getTerrainHeight(pt.x, pt.z);
      const scale = 0.6 + (i % 3) * 0.35;
      pMesh.scale.set(scale * 1.3, scale * 0.65, scale);
      pMesh.position.set(pt.x, py + 0.15, pt.z);
      pMesh.rotation.set((i * 0.4) % Math.PI, (i * 1.1) % Math.PI, 0);
      pMesh.receiveShadow = true;
      pMesh.castShadow = true;
      group.add(pMesh);
    });

    // 3. Scenic Crystal Pond at (x: 28, z: 18) south-east of central plaza
    const pondGeom = new THREE.CircleGeometry(11.5, 32);
    pondGeom.rotateX(-Math.PI / 2);
    const pondMesh = new THREE.Mesh(pondGeom, waterMat);
    const pondCenterX = 28;
    const pondCenterZ = 18;
    const pondY = Math.min(getTerrainHeight(pondCenterX, pondCenterZ), 0.6) - 0.05;
    pondMesh.position.set(pondCenterX, Math.max(0.15, pondY), pondCenterZ);
    pondMesh.receiveShadow = true;
    group.add(pondMesh);

    // Decorative Water Lily Pads on the Pond
    const lilyGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.04, 12);
    const lilyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const flowerGeom = new THREE.ConeGeometry(0.22, 0.35, 6);
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 });

    const lilyCoords = [
      { x: pondCenterX - 3.5, z: pondCenterZ - 2.5 },
      { x: pondCenterX + 4.0, z: pondCenterZ + 1.2 },
      { x: pondCenterX - 1.2, z: pondCenterZ + 4.5 },
      { x: pondCenterX + 2.8, z: pondCenterZ - 4.0 },
    ];

    lilyCoords.forEach((lc) => {
      const lilyGroup = new THREE.Group();
      lilyGroup.position.set(lc.x, pondMesh.position.y + 0.03, lc.z);

      const pad = new THREE.Mesh(lilyGeom, lilyMat);
      pad.receiveShadow = true;
      lilyGroup.add(pad);

      const flower = new THREE.Mesh(flowerGeom, flowerMat);
      flower.position.y = 0.18;
      flower.rotation.x = Math.PI;
      lilyGroup.add(flower);

      group.add(lilyGroup);
    });

    scene.add(group);

    return {
      group,
      waterMesh: riverMesh,
      pondMesh,
      update: (dt: number, _time: number) => {
        // Flowing dynamic water animation with zero performance penalty
        if (waterNormal) {
          waterNormal.offset.x = (waterNormal.offset.x + dt * 0.05) % 1.0;
          waterNormal.offset.y = (waterNormal.offset.y + dt * 0.025) % 1.0;
        }
      },
    };
  }
}
