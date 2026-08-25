import * as THREE from 'three';
import { CoinData, GameSettings, TimeState, WorldDimension } from '../types';
import { soundEngine } from '../audio/soundEngine';
import { ZombieSystem } from './ZombieSystem';
import { CandyWorldBuilder, CandyWorldElements } from './CandyWorldBuilder';

export interface WorldCallbacks {
  onCoinCollected: (coin: CoinData, remaining: number, total: number, combo: number) => void;
  onTimeUpdate: (timeState: TimeState) => void;
  onJump: () => void;
  onSpring: () => void;
  onVictory: () => void;
  onFpsUpdate?: (fps: number) => void;
  onNearShop?: (isNear: boolean) => void;
  onNearMultiplierShop?: (isNear: boolean) => void;
  onOpenShop?: () => void;
  onOpenMultiplierShop?: () => void;
  onBuffsUpdate?: (buffs: { speedTimeRemaining: number; jumpTimeRemaining: number; magnetTimeRemaining: number }) => void;
  onWorldChange?: (world: WorldDimension) => void;
  onZombieDefeated?: (points: number, remaining: number) => void;
  onPlayerHurt?: (message: string) => void;
  onPlayerHealthUpdate?: (health: number, maxHealth: number) => void;
  onPlayerDied?: (coinsLost: number) => void;
}

export class GameWorld {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private callbacks: WorldCallbacks;

  // Performance & Quality
  private graphicsQuality: 'low' | 'medium' | 'high' = 'medium';
  private frameCount = 0;
  private lastFpsTime = 0;
  private isMobileDevice = false;

  // Lighting & Sky
  private hemiLight: THREE.HemisphereLight;
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private starsParticles: THREE.Points;
  private starsMaterial: THREE.PointsMaterial;
  private firefliesParticles: THREE.Points | null = null;
  private lanterns: THREE.PointLight[] = [];

  // Flashlight
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private isFlashlightOn = false;

  // Player & Camera
  private playerPos = new THREE.Vector3(0, 1.2, 8);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private yaw = 0;
  private pitch = 0;
  private isOnGround = false;
  private isSprinting = false;
  private viewMode: 'first_person' | 'third_person' = 'first_person';
  private playerMesh: THREE.Group;
  private limbs: {
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    head: THREE.Group;
    torso: THREE.Group;
    cape?: THREE.Mesh;
  } | null = null;
  private walkCycle = 0;
  private footstepTimer = 0;

  // Weapon & Equipped Items
  private equippedSwordId: string | null = null;
  private tpSwordMesh: THREE.Group | null = null;
  private fpsWeaponHolder: THREE.Group | null = null;
  private isSwingingSword = false;
  private swingProgress = 0;

  // Active Buffs
  private buffs = {
    speedTimeRemaining: 0,
    jumpTimeRemaining: 0,
    magnetTimeRemaining: 0,
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    magnetRadius: 20,
  };

  // Shop Buildings & Proximity (Main Valley & Candy World)
  private mainShopPos = new THREE.Vector3(6.5, 0.2, 2.0);
  private candyShopPos = new THREE.Vector3(608.0, 0.4, 588.0);
  private isNearShop = false;

  private mainMultiplierShopPos = new THREE.Vector3(-6.5, 0.2, 2.0);
  private candyMultiplierShopPos = new THREE.Vector3(592.0, 0.4, 588.0);
  private isNearMultiplierShop = false;

  private shopkeepers: THREE.Group[] = [];
  private shopRuneRings: THREE.Mesh[] = [];
  private shopDisplayWeapons: THREE.Group[] = [];
  private multiplierHolograms: THREE.Group[] = [];

  // Speed Aura Particles
  private speedAuraParticles: THREE.Points | null = null;

  // Controls input
  private moveInput = { x: 0, y: 0 };
  private keyState: Record<string, boolean> = {};

  // Time & Day/Night Cycle
  private timeOfDay = 8.5; // Starts at 8:30 AM
  private cycleSpeedMode: GameSettings['cycleSpeed'] = 'normal';

  // Environment & Colliders
  private colliders: THREE.Box3[] = [];
  private platforms: { box: THREE.Box3; topY: number }[] = [];
  private springPads: { pos: THREE.Vector3; mesh: THREE.Mesh; radius: number; topY: number }[] = [];

  // Grassy Mounds and Hills
  private mounds: { x: number; z: number; radius: number; height: number }[] = [
    // Central surrounding hills
    { x: 18, z: -15, radius: 9, height: 3.2 },
    { x: -22, z: 18, radius: 10, height: 3.6 },
    { x: 26, z: 28, radius: 11, height: 4.2 },
    { x: -30, z: -12, radius: 12, height: 4.5 },
    { x: -16, z: -35, radius: 10, height: 3.4 },
    { x: 32, z: -25, radius: 11, height: 4.0 },
    { x: -6, z: 36, radius: 9, height: 3.0 },
    { x: 14, z: 38, radius: 10, height: 3.5 },

    // North Highlands & Spire Peaks
    { x: 0, z: -65, radius: 16, height: 6.5 },
    { x: -45, z: -70, radius: 18, height: 7.2 },
    { x: 50, z: -75, radius: 17, height: 6.8 },
    { x: -20, z: -105, radius: 20, height: 8.5 },
    { x: 35, z: -110, radius: 18, height: 8.0 },

    // East Crystal Dunes & Plateaus
    { x: 65, z: 10, radius: 15, height: 5.5 },
    { x: 80, z: -40, radius: 18, height: 6.8 },
    { x: 95, z: 45, radius: 17, height: 6.2 },
    { x: 110, z: -15, radius: 19, height: 7.5 },
    { x: 75, z: 85, radius: 16, height: 5.8 },

    // South Ancient Forest Valleys
    { x: -40, z: 65, radius: 16, height: 5.4 },
    { x: 10, z: 85, radius: 17, height: 6.0 },
    { x: -60, z: 95, radius: 18, height: 7.0 },
    { x: 45, z: 110, radius: 19, height: 7.5 },

    // West Canyon & Monolith Ridges
    { x: -65, z: -25, radius: 16, height: 6.0 },
    { x: -90, z: 20, radius: 18, height: 7.2 },
    { x: -105, z: -55, radius: 20, height: 8.2 },
    { x: -110, z: 70, radius: 18, height: 7.6 },
  ];

  // Coins
  private coins: { data: CoinData; mesh: THREE.Group; light: THREE.PointLight | null }[] = [];
  private comboCount = 0;
  private comboTimer = 0;
  private collectedCount = 0;

  // Particle Effects (collecting, springs, sword slash)
  private particleSystems: { points: THREE.Points; velocities: THREE.Vector3[]; age: number; maxAge: number }[] = [];

  // Zombies & Candy World
  private zombieSystem: ZombieSystem | null = null;
  private candyWorldElements: CandyWorldElements | null = null;
  private currentWorld: WorldDimension = 'main';
  private portalCooldownTimer = 0;

  private isRunning = false;
  private animFrameId: number | null = null;
  private mouseSensitivity = 1.5;
  private baseFov = 100;
  private currentFov = 100;

  constructor(container: HTMLElement, callbacks: WorldCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect mobile device
    this.isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      (typeof window !== 'undefined' && window.innerWidth < 768);
    this.graphicsQuality = this.isMobileDevice ? 'medium' : 'high';

    // 1. Scene & Camera (Expansive 100° Field of View & 550m draw distance)
    this.scene = new THREE.Scene();
    const width = container.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800) || 800;
    const height = container.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600) || 600;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(100, aspect, 0.1, 550);
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: !this.isMobileDevice, 
      powerPreference: 'high-performance',
      precision: this.isMobileDevice ? 'mediump' : 'highp'
    });
    this.renderer.setSize(width, height);
    this.applyPixelRatio();
    this.setupShadows();
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 2. Sky & Atmosphere (Calibrated soft fog for wide scenic vistas)
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0038);

    // 3. Lighting Setup
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x445566, 1.2);
    this.scene.add(this.hemiLight);

    const shadowRes = this.isMobileDevice ? 512 : 1024;
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = shadowRes;
    this.sunLight.shadow.mapSize.height = shadowRes;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 240;
    const shadowD = 80;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    this.moonLight.castShadow = false; // Mobile optimization: only sun casts shadows
    this.scene.add(this.moonLight);

    // Sun and Moon visual meshes
    const sunGeom = new THREE.SphereGeometry(3.5, 12, 12);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea78 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeom = new THREE.SphereGeometry(2.8, 12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xddedff });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Starfield
    const { stars, mat } = this.createStarfield();
    this.starsParticles = stars;
    this.starsMaterial = mat;
    this.scene.add(this.starsParticles);

    // Flashlight
    this.flashlight = new THREE.SpotLight(0xffffff, 0, 35, Math.PI / 5, 0.4, 1.2);
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // First-person weapon holder attached to camera
    this.fpsWeaponHolder = new THREE.Group();
    this.fpsWeaponHolder.position.set(0.35, -0.32, -0.65);
    this.fpsWeaponHolder.rotation.set(0.2, -0.3, 0.1);
    this.camera.add(this.fpsWeaponHolder);
    this.scene.add(this.camera);

    // Player Mesh (Avatar for 3rd person)
    this.playerMesh = this.createPlayerAvatar();
    this.scene.add(this.playerMesh);

    // Speed Aura Particles
    this.initSpeedAura();

    // Build World Elements
    this.buildWorld();
    this.spawnFireflies();
    this.spawnCoins();

    // Initial Day-Night sync
    this.updateTimeOfDay(0);

    // Listeners
    this.setupEventListeners();
  }

  private initSpeedAura() {
    const count = 25;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = Math.random() * 1.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.6,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.speedAuraParticles = new THREE.Points(geom, mat);
    this.scene.add(this.speedAuraParticles);
  }

  private applyPixelRatio() {
    if (this.graphicsQuality === 'low') {
      this.renderer.setPixelRatio(1.0);
    } else if (this.graphicsQuality === 'medium') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    }
  }

  private setupShadows() {
    if (this.graphicsQuality === 'low') {
      this.renderer.shadowMap.enabled = false;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.graphicsQuality === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
    }
  }

  public setGraphicsQuality(quality: 'low' | 'medium' | 'high') {
    this.graphicsQuality = quality;
    this.applyPixelRatio();
    this.setupShadows();
    if (this.sunLight) {
      this.sunLight.castShadow = quality !== 'low';
      const shadowRes = quality === 'low' ? 256 : quality === 'medium' ? 512 : 1024;
      this.sunLight.shadow.mapSize.width = shadowRes;
      this.sunLight.shadow.mapSize.height = shadowRes;
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        (this.sunLight.shadow as unknown as { map: THREE.WebGLRenderTarget | null }).map = null;
      }
    }
    if (this.firefliesParticles) {
      this.firefliesParticles.visible = quality !== 'low';
    }
    this.onResize();
  }

  private triggerHaptic(pattern: number | number[] = 15) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  // --- STARFIELD & PARTICLES ---
  private createStarfield(): { stars: THREE.Points; mat: THREE.PointsMaterial } {
    const count = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 180 + Math.random() * 20;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 10; // keep above horizon
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Star colors (white, soft cyan, gold)
      const colorType = Math.random();
      if (colorType > 0.8) {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.6; // warm
      } else if (colorType > 0.6) {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1.0; // blue-white
      } else {
        colors[i * 3] = 1.0; colors[i * 3 + 1] = 1.0; colors[i * 3 + 2] = 1.0; // crisp white
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      fog: false,
    });

    const stars = new THREE.Points(geometry, mat);
    return { stars, mat };
  }

  private spawnFireflies() {
    const count = 75;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = 1 + Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x88ff44,
      size: 1.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.firefliesParticles = new THREE.Points(geom, mat);
    this.scene.add(this.firefliesParticles);
  }

  // --- PLAYER AVATAR (HUMAN ADVENTURER: SUPER BOY) ---
  private createPlayerAvatar(): THREE.Group {
    const group = new THREE.Group();

    // 1. Stylized Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffd5b8, // Warm natural peach skin tone
      roughness: 0.65,
      metalness: 0.02,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x4a2a16, // Rich chestnut brown hair
      roughness: 0.75,
      flatShading: true,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0xd93829, // Energetic adventurer red jacket
      roughness: 0.5,
    });
    const jacketTrimMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep navy trim & collar
      roughness: 0.5,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // White graphic shirt
      roughness: 0.6,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Golden star emblem & belt buckle
      roughness: 0.25,
      metalness: 0.8,
    });
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x3d2010, // Dark leather belt
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e2e4a, // Slate denim jeans
      roughness: 0.7,
    });
    const kneePatchMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Reinforced knee patches
      roughness: 0.8,
    });
    const shoeBodyMat = new THREE.MeshStandardMaterial({
      color: 0xd93829, // Red athletic sneaker upper
      roughness: 0.5,
    });
    const shoeSoleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White rubber sole & toe cap
      roughness: 0.35,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshBasicMaterial({ color: 0x2563eb }); // Vibrant sapphire blue iris
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 }); // Dark pupil
    const eyebrowMat = new THREE.MeshBasicMaterial({ color: 0x381e0f });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xa83244 });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x292524, // Fingerless adventurer wrist cuffs & gloves
      roughness: 0.6,
    });
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x065f46, // Forest green adventurer backpack
      roughness: 0.65,
    });
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Leather backpack straps
      roughness: 0.7,
    });
    const capeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Ruby hero scarf / mini-cape
      roughness: 0.5,
      side: THREE.DoubleSide,
    });

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.38, 0);

    // Head base (curved proportions)
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

    // Left & Right Human Ears
    const earGeom = new THREE.BoxGeometry(0.05, 0.09, 0.07);
    const leftEar = new THREE.Mesh(earGeom, skinMat);
    leftEar.position.set(-0.21, 0.20, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeom, skinMat);
    rightEar.position.set(0.21, 0.20, 0);
    headGroup.add(rightEar);

    // 3D Layered Hair
    const hairTopGeom = new THREE.BoxGeometry(0.42, 0.18, 0.42);
    const hairTop = new THREE.Mesh(hairTopGeom, hairMat);
    hairTop.position.set(0, 0.35, -0.01);
    headGroup.add(hairTop);

    const hairBackGeom = new THREE.BoxGeometry(0.42, 0.26, 0.14);
    const hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(0, 0.20, -0.15);
    headGroup.add(hairBack);

    // Sideburns
    const sideburnGeom = new THREE.BoxGeometry(0.06, 0.18, 0.14);
    const leftSideburn = new THREE.Mesh(sideburnGeom, hairMat);
    leftSideburn.position.set(-0.205, 0.24, 0.04);
    headGroup.add(leftSideburn);

    const rightSideburn = new THREE.Mesh(sideburnGeom, hairMat);
    rightSideburn.position.set(0.205, 0.24, 0.04);
    headGroup.add(rightSideburn);

    // Front Hair Bangs (Fringe locks)
    const bang1Geom = new THREE.ConeGeometry(0.05, 0.12, 4);
    const bang1 = new THREE.Mesh(bang1Geom, hairMat);
    bang1.position.set(-0.10, 0.32, 0.21);
    bang1.rotation.set(-0.3, 0, 0.2);
    headGroup.add(bang1);

    const bang2 = new THREE.Mesh(bang1Geom, hairMat);
    bang2.position.set(0.0, 0.33, 0.22);
    bang2.rotation.set(-0.35, 0, -0.1);
    headGroup.add(bang2);

    const bang3 = new THREE.Mesh(bang1Geom, hairMat);
    bang3.position.set(0.10, 0.32, 0.21);
    bang3.rotation.set(-0.3, 0, -0.2);
    headGroup.add(bang3);

    // Super Boy Cap (Sporty Backwards Cap with Star Badge)
    const capCrownGeom = new THREE.CylinderGeometry(0.22, 0.24, 0.14, 12);
    const capCrown = new THREE.Mesh(capCrownGeom, jacketMat);
    capCrown.position.set(0, 0.38, -0.02);
    headGroup.add(capCrown);

    const capBrimGeom = new THREE.BoxGeometry(0.22, 0.025, 0.16);
    const capBrim = new THREE.Mesh(capBrimGeom, jacketMat);
    capBrim.position.set(0, 0.33, -0.20);
    capBrim.rotation.x = -0.15;
    headGroup.add(capBrim);

    // Star Emblem on Cap
    const starGeom = new THREE.DodecahedronGeometry(0.04, 0);
    const capStar = new THREE.Mesh(starGeom, goldMat);
    capStar.position.set(0, 0.38, 0.19);
    capStar.rotation.y = 0.4;
    headGroup.add(capStar);

    group.add(headGroup);

    // 3. Torso Group (Layered Clothing & Accessories)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.82, 0);

    // Human Neck
    const neckGeom = new THREE.CylinderGeometry(0.09, 0.10, 0.18, 8);
    const neck = new THREE.Mesh(neckGeom, skinMat);
    neck.position.set(0, 0.45, 0);
    torsoGroup.add(neck);

    // Main Red Jacket
    const jacketGeom = new THREE.BoxGeometry(0.50, 0.46, 0.32);
    const jacket = new THREE.Mesh(jacketGeom, jacketMat);
    jacket.position.set(0, 0.23, 0);
    jacket.castShadow = true;
    torsoGroup.add(jacket);

    // Inner White Shirt Panel
    const shirtGeom = new THREE.BoxGeometry(0.24, 0.40, 0.02);
    const shirt = new THREE.Mesh(shirtGeom, shirtMat);
    shirt.position.set(0, 0.23, 0.162);
    torsoGroup.add(shirt);

    // Chest Emblem (Golden Adventure Star)
    const chestEmblem = new THREE.Mesh(starGeom, goldMat);
    chestEmblem.position.set(0, 0.27, 0.176);
    torsoGroup.add(chestEmblem);

    // Navy Lapels & Collar
    const lapelGeom = new THREE.BoxGeometry(0.05, 0.44, 0.03);
    const leftLapel = new THREE.Mesh(lapelGeom, jacketTrimMat);
    leftLapel.position.set(-0.14, 0.23, 0.162);
    torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeom, jacketTrimMat);
    rightLapel.position.set(0.14, 0.23, 0.162);
    torsoGroup.add(rightLapel);

    // Dark Leather Belt & Golden Buckle
    const beltGeom = new THREE.BoxGeometry(0.52, 0.08, 0.34);
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.set(0, 0.02, 0);
    torsoGroup.add(belt);

    const buckleGeom = new THREE.BoxGeometry(0.10, 0.09, 0.04);
    const buckle = new THREE.Mesh(buckleGeom, goldMat);
    buckle.position.set(0, 0.02, 0.175);
    torsoGroup.add(buckle);

    // Adventurer Backpack
    const packGeom = new THREE.BoxGeometry(0.36, 0.42, 0.18);
    const pack = new THREE.Mesh(packGeom, packMat);
    pack.position.set(0, 0.24, -0.24);
    pack.castShadow = true;
    torsoGroup.add(pack);

    const pocketGeom = new THREE.BoxGeometry(0.26, 0.18, 0.08);
    const pocket = new THREE.Mesh(pocketGeom, packMat);
    pocket.position.set(0, 0.16, -0.35);
    torsoGroup.add(pocket);

    // Straps over shoulders
    const strapGeom = new THREE.BoxGeometry(0.06, 0.44, 0.34);
    const leftStrap = new THREE.Mesh(strapGeom, strapMat);
    leftStrap.position.set(-0.16, 0.24, -0.01);
    torsoGroup.add(leftStrap);

    const rightStrap = new THREE.Mesh(strapGeom, strapMat);
    rightStrap.position.set(0.16, 0.24, -0.01);
    torsoGroup.add(rightStrap);

    // Hero Scarf / Neck Torus Ring
    const scarfCollarGeom = new THREE.TorusGeometry(0.15, 0.045, 6, 12);
    const scarfCollar = new THREE.Mesh(scarfCollarGeom, capeMat);
    scarfCollar.position.set(0, 0.43, 0);
    scarfCollar.rotation.x = Math.PI / 2;
    torsoGroup.add(scarfCollar);

    // Dynamic Trailing Scarf / Cape
    const capeGeom = new THREE.PlaneGeometry(0.30, 0.52);
    const cape = new THREE.Mesh(capeGeom, capeMat);
    cape.position.set(0, 0.38, -0.18);
    cape.rotation.x = 0.25;
    torsoGroup.add(cape);

    group.add(torsoGroup);

    // 4. Arms (Articulated at shoulder joints)
    const createArm = (isLeft: boolean): THREE.Group => {
      const arm = new THREE.Group();
      arm.position.set(isLeft ? -0.32 : 0.32, 1.20, 0);

      // Shoulder round cap
      const shoulderGeom = new THREE.SphereGeometry(0.09, 8, 8);
      const shoulder = new THREE.Mesh(shoulderGeom, jacketMat);
      shoulder.position.set(0, 0, 0);
      shoulder.castShadow = true;
      arm.add(shoulder);

      // Upper sleeve
      const sleeveGeom = new THREE.CylinderGeometry(0.08, 0.075, 0.20, 8);
      const sleeve = new THREE.Mesh(sleeveGeom, jacketMat);
      sleeve.position.set(0, -0.10, 0);
      sleeve.castShadow = true;
      arm.add(sleeve);

      // Forearm (Human Skin)
      const forearmGeom = new THREE.CylinderGeometry(0.068, 0.062, 0.18, 8);
      const forearm = new THREE.Mesh(forearmGeom, skinMat);
      forearm.position.set(0, -0.27, 0);
      forearm.castShadow = true;
      arm.add(forearm);

      // Wristband / Glove Cuff
      const wristGeom = new THREE.CylinderGeometry(0.072, 0.072, 0.07, 8);
      const wrist = new THREE.Mesh(wristGeom, gloveMat);
      wrist.position.set(0, -0.37, 0);
      arm.add(wrist);

      // Human Hand (Detailed Palm & Fingers)
      const palmGeom = new THREE.BoxGeometry(0.09, 0.09, 0.09);
      const palm = new THREE.Mesh(palmGeom, skinMat);
      palm.position.set(0, -0.46, 0.01);
      palm.castShadow = true;
      arm.add(palm);

      // Thumb
      const thumbGeom = new THREE.BoxGeometry(0.035, 0.055, 0.045);
      const thumb = new THREE.Mesh(thumbGeom, skinMat);
      thumb.position.set(isLeft ? -0.05 : 0.05, -0.44, 0.04);
      thumb.rotation.z = isLeft ? 0.3 : -0.3;
      arm.add(thumb);

      // Curled Fingers (Grip pose for holding swords/items)
      const fingersGeom = new THREE.BoxGeometry(0.08, 0.045, 0.05);
      const fingers = new THREE.Mesh(fingersGeom, skinMat);
      fingers.position.set(0, -0.48, 0.05);
      arm.add(fingers);

      return arm;
    };

    const leftArm = createArm(true);
    group.add(leftArm);

    const rightArm = createArm(false);
    group.add(rightArm);

    // 5. Legs (Articulated at hip joints)
    const createLeg = (isLeft: boolean): THREE.Group => {
      const leg = new THREE.Group();
      leg.position.set(isLeft ? -0.14 : 0.14, 0.74, 0);

      // Thigh (Denim Pants)
      const thighGeom = new THREE.CylinderGeometry(0.095, 0.088, 0.28, 8);
      const thigh = new THREE.Mesh(thighGeom, pantsMat);
      thigh.position.set(0, -0.14, 0);
      thigh.castShadow = true;
      leg.add(thigh);

      // Knee Patch
      const patchGeom = new THREE.BoxGeometry(0.11, 0.07, 0.025);
      const patch = new THREE.Mesh(patchGeom, kneePatchMat);
      patch.position.set(0, -0.27, 0.08);
      leg.add(patch);

      // Shin / Lower Leg
      const shinGeom = new THREE.CylinderGeometry(0.085, 0.08, 0.24, 8);
      const shin = new THREE.Mesh(shinGeom, pantsMat);
      shin.position.set(0, -0.38, 0);
      shin.castShadow = true;
      leg.add(shin);

      // High-Top Sneaker
      const sneakerCuffGeom = new THREE.CylinderGeometry(0.088, 0.088, 0.08, 8);
      const sneakerCuff = new THREE.Mesh(sneakerCuffGeom, shoeBodyMat);
      sneakerCuff.position.set(0, -0.52, 0);
      leg.add(sneakerCuff);

      const shoeBodyGeom = new THREE.BoxGeometry(0.13, 0.11, 0.22);
      const shoeBody = new THREE.Mesh(shoeBodyGeom, shoeBodyMat);
      shoeBody.position.set(0, -0.59, 0.03);
      shoeBody.castShadow = true;
      leg.add(shoeBody);

      // White Thick Rubber Sole
      const soleGeom = new THREE.BoxGeometry(0.14, 0.04, 0.24);
      const sole = new THREE.Mesh(soleGeom, shoeSoleMat);
      sole.position.set(0, -0.66, 0.03);
      sole.receiveShadow = true;
      leg.add(sole);

      // White Rubber Toe Cap
      const toeCapGeom = new THREE.BoxGeometry(0.13, 0.065, 0.07);
      const toeCap = new THREE.Mesh(toeCapGeom, shoeSoleMat);
      toeCap.position.set(0, -0.61, 0.12);
      leg.add(toeCap);

      // White Sneaker Laces
      const lacesGeom = new THREE.BoxGeometry(0.07, 0.03, 0.10);
      const laces = new THREE.Mesh(lacesGeom, shoeSoleMat);
      laces.position.set(0, -0.56, 0.05);
      leg.add(laces);

      return leg;
    };

    const leftLeg = createLeg(true);
    group.add(leftLeg);

    const rightLeg = createLeg(false);
    group.add(rightLeg);

    this.limbs = {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      head: headGroup,
      torso: torsoGroup,
      cape,
    };

    return group;
  }

  public getTerrainHeight(x: number, z: number): number {
    if (this.currentWorld === 'candy' || Math.hypot(x - 600, z - 600) < 140) {
      return 0.4;
    }
    const distFromCenter = Math.hypot(x, z);
    // Plaza courtyard check
    if (distFromCenter <= 8.5) {
      return 0.4;
    }

    let h = 0;
    if (distFromCenter > 11) {
      const localY = -z;
      const wave = Math.sin(x * 0.08) * Math.cos(localY * 0.08) * 1.5 + Math.sin(x * 0.03 + localY * 0.03) * 2.0;
      h = Math.max(0, wave);
    }

    // Add rolling grassy mounds elevation
    for (const mound of this.mounds) {
      const d = Math.hypot(x - mound.x, z - mound.z);
      if (d < mound.radius) {
        // Smooth cosine dome curve
        const moundH = (Math.cos((d / mound.radius) * Math.PI) + 1) * 0.5 * mound.height;
        if (moundH > h) {
          h = moundH;
        }
      }
    }

    return h;
  }

  // --- WORLD BUILDER ---
  private buildWorld() {
    // 1. Terrain Ground (48x48 vertex grid for silky smooth expansive hill curves)
    const groundGeom = new THREE.PlaneGeometry(320, 320, 48, 48);
    const posAttr = groundGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const localY = posAttr.getY(i);
      // Because ground.rotation.x = -Math.PI / 2, world Z is -localY
      const worldZ = -localY;
      const height = this.getTerrainHeight(x, worldZ);
      posAttr.setZ(i, height);
    }
    groundGeom.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x3e8a3a,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 1.1 Grassy Hills & Landscape Mounds with Hitboxes
    this.buildHillsAndMounds();

    // 1.2 Perimeter Mountain Walls with Thick Barriers (Radius 148)
    this.buildPerimeterHills();

    // 2. Central Sanctuary / Stone Plaza
    this.buildPlaza();

    // 2.1 The Shops & Multiplier Stalls (Main Valley)
    this.buildShopBuilding(6.5, 0, 2.0, 'valley');
    this.buildMultiplierShopBuilding(-6.5, 0, 2.0, 'valley');

    // 3. Parkour Platforms & Tower Ruins
    this.buildParkourCourse();

    // 3.1 Ancient Temple of the Sun (Mundo 1)
    this.buildTemple(0, -68);

    // 4. Spring Jump Pads (Trampolines firmly grounded and in strategic scenic spots)
    this.createSpringPad(0, -12);            // Central North
    this.createSpringPad(24, 18);            // Central East
    this.createSpringPad(-28, -22);          // Central West
    this.createSpringPad(35, -30, 6.0);      // East Ruins Summit Platform
    this.createSpringPad(0, 85);             // South Ancient Forest
    this.createSpringPad(-75, 30);           // West Canyon Spire Base
    this.createSpringPad(80, -60);           // North-East Highland Peak
    this.createSpringPad(-65, -80);          // North-West Sky Citadel

    // 5. Trees, Rocks, Foliage, and Lanterns (Non-overlapping)
    this.buildFoliage();

    // 6. Build Candy World and Portals
    this.candyWorldElements = CandyWorldBuilder.build(
      this.scene,
      100,
      (x, z) => this.getTerrainHeight(x, z)
    );
    this.colliders.push(...this.candyWorldElements.colliders);
    this.platforms.push(...this.candyWorldElements.platforms);
    this.springPads.push(...this.candyWorldElements.springPads);
    this.coins.push(...this.candyWorldElements.coins);

    // 6.1 The Shops & Multiplier Stalls (Candy World)
    this.buildShopBuilding(608.0, 0.4, 588.0, 'candy');
    this.buildMultiplierShopBuilding(592.0, 0.4, 588.0, 'candy');

    // 7. Initialize Zombies
    this.zombieSystem = new ZombieSystem(
      this.scene,
      (x, z) => this.getTerrainHeight(x, z),
      {
        onDefeated: (points, remaining) => {
          this.callbacks.onZombieDefeated?.(points, remaining);
        },
        onPlayerHurt: (msg) => {
          this.triggerHaptic([30, 40, 30]);
          this.callbacks.onPlayerHurt?.(msg);
        },
        spawnCoin: (pos, type) => {
          this.spawnBonusCoin(pos, type);
        },
        spawnParticles: (pos, color, count) => {
          this.spawnSlashParticles(pos, color, count);
        },
      }
    );
  }

  private buildHillsAndMounds() {
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.7,
      flatShading: true,
    });

    // Add summit rock formations on prominent mounds, firmly anchored to the sculpted terrain
    this.mounds.forEach((mound, idx) => {
      if (idx % 2 === 0) {
        const terrainY = this.getTerrainHeight(mound.x, mound.z);
        const boulderGeom = new THREE.DodecahedronGeometry(1.6, 0);
        const boulder = new THREE.Mesh(boulderGeom, rockMat);
        // Sink slightly into terrain for seamless grounding without floating edges
        boulder.position.set(mound.x, terrainY + 0.7, mound.z);
        boulder.rotation.set(0.3, idx * 0.8, 0.2);
        boulder.castShadow = true;
        boulder.receiveShadow = true;
        this.scene.add(boulder);

        // Precise solid collider for summit rock
        const rockBox = new THREE.Box3().setFromObject(boulder);
        this.colliders.push(rockBox);
        this.platforms.push({ box: rockBox, topY: terrainY + 2.1 });
      }
    });
  }

  private buildPerimeterHills() {
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x245523, roughness: 0.9, flatShading: true });
    const wallCount = 48;
    const radius = 148;

    for (let i = 0; i < wallCount; i++) {
      const angle = (i / wallCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 26 + (i % 6) * 4;
      const width = 28 + (i % 4) * 4;

      const hillGeom = new THREE.ConeGeometry(width, height, 8);
      const hill = new THREE.Mesh(hillGeom, hillMat);
      hill.position.set(x, height / 2 - 1, z);
      hill.castShadow = true;
      hill.receiveShadow = true;
      this.scene.add(hill);

      // Solid hill boundary collider (hitbox)
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, height / 2, z),
        new THREE.Vector3(width * 0.9, height, width * 0.9)
      );
      this.colliders.push(box);
    }
  }

  private buildPlaza() {
    // Stone circular courtyard
    const plazaGeom = new THREE.CylinderGeometry(8, 8.5, 0.4, 16);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const plaza = new THREE.Mesh(plazaGeom, stoneMat);
    plaza.position.set(0, 0.2, 0);
    plaza.receiveShadow = true;
    plaza.castShadow = true;
    this.scene.add(plaza);

    // 4 Stone Pillars surrounding courtyard
    const pillarGeom = new THREE.BoxGeometry(1.2, 4.5, 1.2);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });

    const pillarCoords = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: 5 },
      { x: 5, z: 5 },
    ];

    pillarCoords.forEach(({ x, z }) => {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(x, 2.25, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      const box = new THREE.Box3().setFromObject(pillar);
      this.colliders.push(box);
      this.platforms.push({ box, topY: 4.5 });

      // Lantern on top of each pillar
      this.createLantern(x, 4.8, z);
    });
  }

  private buildShopBuilding(x: number, y: number, z: number, theme: 'valley' | 'candy' = 'valley') {
    const shopGroup = new THREE.Group();
    shopGroup.position.set(x, y, z);
    shopGroup.rotation.y = theme === 'valley' ? -Math.PI / 3 : Math.PI / 4;

    // 1. Foundation Platform
    const baseGeom = new THREE.BoxGeometry(4.2, 0.35, 3.0);
    const baseMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xd97706 : 0x78350f,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    shopGroup.add(base);

    // 2. Counter Desk
    const counterGeom = new THREE.BoxGeometry(3.4, 0.95, 0.85);
    const counterMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0x92400e : 0x92400e,
      roughness: 0.6,
    });
    const counter = new THREE.Mesh(counterGeom, counterMat);
    counter.position.set(0, 0.7, 0.4);
    counter.castShadow = true;
    counter.receiveShadow = true;
    shopGroup.add(counter);

    // 3. Four Corner Posts
    const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.9, 8);
    const postMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xffffff : 0x451a03,
      roughness: 0.5,
    });
    const postPositions = [
      { px: -1.8, pz: -1.2 },
      { px: 1.8, pz: -1.2 },
      { px: -1.8, pz: 1.2 },
      { px: 1.8, pz: 1.2 },
    ];
    postPositions.forEach(({ px, pz }) => {
      const post = new THREE.Mesh(postGeom, postMat);
      post.position.set(px, 1.6, pz);
      post.castShadow = true;
      shopGroup.add(post);
    });

    // 4. Striped Canopy Awning
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 2.9, 0);

    const stripeCount = 9;
    const stripeWidth = 4.4 / stripeCount;
    const color1Mat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xf43f5e : 0xdc2626,
      roughness: 0.5,
    });
    const color2Mat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xffffff : 0xfef08a,
      roughness: 0.5,
    });

    for (let i = 0; i < stripeCount; i++) {
      const geom = new THREE.BoxGeometry(stripeWidth, 0.08, 3.4);
      const mesh = new THREE.Mesh(geom, i % 2 === 0 ? color1Mat : color2Mat);
      mesh.position.set(-2.2 + (i + 0.5) * stripeWidth, 0, 0);
      mesh.rotation.x = 0.15; // slope
      mesh.castShadow = true;
      roofGroup.add(mesh);
    }
    shopGroup.add(roofGroup);

    // 5. Hanging Warm / Sweet Lantern
    const lightColor = theme === 'candy' ? 0xf472b6 : 0xfbbf24;
    const shopLanternLight = new THREE.PointLight(lightColor, 1.8, 8);
    shopLanternLight.position.set(0, 2.4, 0.5);
    shopGroup.add(shopLanternLight);
    this.lanterns.push(shopLanternLight);

    const lanternGeom = new THREE.DodecahedronGeometry(0.18);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xfda4af : 0xfef08a,
      emissive: lightColor,
      emissiveIntensity: 1.5,
    });
    const lanternMesh = new THREE.Mesh(lanternGeom, lanternMat);
    lanternMesh.position.copy(shopLanternLight.position);
    shopGroup.add(lanternMesh);

    // 6. Shopkeeper NPC ("Tendero Santi" or "Tendero Caramelo")
    const merchant = new THREE.Group();
    merchant.position.set(0, 0.35, -0.4);
    merchant.userData.baseY = 0.35;

    // Robe
    const robeGeom = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 12);
    const robeMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xec4899 : 0x4f46e5,
      roughness: 0.5,
    });
    const robe = new THREE.Mesh(robeGeom, robeMat);
    robe.position.y = 0.5;
    robe.castShadow = true;
    merchant.add(robe);

    // Apron
    const apronGeom = new THREE.BoxGeometry(0.38, 0.6, 0.1);
    const apronMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xfacc15 : 0xf59e0b,
      roughness: 0.6,
    });
    const apron = new THREE.Mesh(apronGeom, apronMat);
    apron.position.set(0, 0.55, 0.3);
    merchant.add(apron);

    // Head
    const headGeom = new THREE.SphereGeometry(0.28, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.4 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.25;
    head.castShadow = true;
    merchant.add(head);

    // Wizard / Chef Hat
    const hatBrimGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 16);
    const hatMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xbe185d : 0x312e81,
      roughness: 0.4,
    });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 1.45;
    merchant.add(hatBrim);

    const hatConeGeom = new THREE.ConeGeometry(0.32, 0.6, 12);
    const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
    hatCone.position.set(0, 1.75, -0.05);
    hatCone.rotation.x = -0.15;
    merchant.add(hatCone);

    shopGroup.add(merchant);
    this.shopkeepers.push(merchant);

    // 7. Counter Showcase Items (Glowing Sword + Potion Bottles)
    const showcase = new THREE.Group();
    showcase.position.set(0, 1.25, 0.4);

    // Display Katana
    const katanaBladeGeom = new THREE.BoxGeometry(0.04, 0.75, 0.08);
    const katanaBladeMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xf43f5e : 0x06b6d4,
      emissive: theme === 'candy' ? 0xf43f5e : 0x06b6d4,
      emissiveIntensity: 1.6,
    });
    const katanaBlade = new THREE.Mesh(katanaBladeGeom, katanaBladeMat);
    katanaBlade.position.set(-0.8, 0.1, 0);
    katanaBlade.rotation.z = Math.PI / 4;
    showcase.add(katanaBlade);

    // Display Potion Bottles
    const potionColors = theme === 'candy' ? [0xf43f5e, 0x10b981, 0xfacc15] : [0x3b82f6, 0xa855f7, 0xeab308];
    potionColors.forEach((col, idx) => {
      const flaskGeom = new THREE.CylinderGeometry(0.06, 0.12, 0.24, 8);
      const flaskMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.2,
        roughness: 0.1,
      });
      const flask = new THREE.Mesh(flaskGeom, flaskMat);
      flask.position.set(0.2 + idx * 0.35, 0, 0);
      showcase.add(flask);
    });

    shopGroup.add(showcase);
    this.shopDisplayWeapons.push(showcase);

    // 8. 3D Floating Shop Board Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 3.4, 1.3);

    const signBoardGeom = new THREE.BoxGeometry(2.4, 0.6, 0.1);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signGroup.add(signBoard);

    // Golden frame
    const signFrameGeom = new THREE.BoxGeometry(2.5, 0.7, 0.06);
    const signFrameMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xec4899 : 0xf59e0b,
      emissive: theme === 'candy' ? 0xec4899 : 0xf59e0b,
      emissiveIntensity: 0.6,
    });
    const signFrame = new THREE.Mesh(signFrameGeom, signFrameMat);
    signGroup.add(signFrame);

    // Icon on sign
    const iconGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const iconMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xf43f5e : 0xffd700,
      emissive: theme === 'candy' ? 0xf43f5e : 0xf59e0b,
      emissiveIntensity: 1.2,
    });
    const iconMesh = new THREE.Mesh(iconGeom, iconMat);
    iconMesh.rotation.x = Math.PI / 2;
    iconMesh.position.z = 0.05;
    signGroup.add(iconMesh);

    shopGroup.add(signGroup);

    // 9. Pulsing Floor Interaction Rune Ring
    const ringGeom = new THREE.RingGeometry(1.4, 1.9, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: theme === 'candy' ? 0xec4899 : 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.04, 1.8);
    shopGroup.add(ring);
    this.shopRuneRings.push(ring);

    this.scene.add(shopGroup);
  }

  private buildMultiplierShopBuilding(x: number, y: number, z: number, theme: 'valley' | 'candy' = 'valley') {
    const multGroup = new THREE.Group();
    multGroup.position.set(x, y, z);
    multGroup.rotation.y = theme === 'valley' ? Math.PI / 3 : -Math.PI / 4;

    // 1. Crystal Pavilion Base
    const baseGeom = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0x831843 : 0x1e1b4b,
      roughness: 0.4,
      metalness: 0.3,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    multGroup.add(base);

    // 2. Crystal Altar / Counter
    const altarGeom = new THREE.BoxGeometry(2.8, 0.95, 0.85);
    const altarMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0x9d174d : 0x312e81,
      roughness: 0.3,
    });
    const altar = new THREE.Mesh(altarGeom, altarMat);
    altar.position.set(0, 0.7, 0.3);
    altar.castShadow = true;
    altar.receiveShadow = true;
    multGroup.add(altar);

    // 3. Shimmering Crystal Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.1, 0.14, 2.9, 6);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xf472b6 : 0x818cf8,
      emissive: theme === 'candy' ? 0xbe185d : 0x4338ca,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const pillarPositions = [
      { px: -1.6, pz: -1.0 },
      { px: 1.6, pz: -1.0 },
      { px: -1.6, pz: 1.0 },
      { px: 1.6, pz: 1.0 },
    ];
    pillarPositions.forEach(({ px, pz }) => {
      const p = new THREE.Mesh(pillarGeom, pillarMat);
      p.position.set(px, 1.6, pz);
      p.castShadow = true;
      multGroup.add(p);
    });

    // 4. Canopy Roof (Violet & Gold / Cyan)
    const roofGeom = new THREE.ConeGeometry(2.4, 1.2, 8);
    const roofMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xec4899 : 0x6366f1,
      emissive: theme === 'candy' ? 0x9d174d : 0x3730a3,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, 3.4, 0);
    roof.castShadow = true;
    multGroup.add(roof);

    // 5. Giant Spinning Multiplier Hologram Emblem ("1x - 6x Multiplier Icon")
    const hologram = new THREE.Group();
    hologram.position.set(0, 2.1, 0.3);
    hologram.userData.baseY = 2.1;

    // Glowing central star / diamond
    const gemGeom = new THREE.OctahedronGeometry(0.42, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xfacc15 : 0x38bdf8,
      emissive: theme === 'candy' ? 0xf59e0b : 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    const gem = new THREE.Mesh(gemGeom, gemMat);
    hologram.add(gem);

    // Orbiting multiplier rings
    const ring1Geom = new THREE.TorusGeometry(0.7, 0.05, 8, 24);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: theme === 'candy' ? 0xf43f5e : 0xa855f7,
      wireframe: false,
    });
    const ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    hologram.add(ring1);

    const ring2Geom = new THREE.TorusGeometry(0.9, 0.04, 8, 24);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: theme === 'candy' ? 0x10b981 : 0x38bdf8,
      wireframe: false,
    });
    const ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    hologram.add(ring2);

    multGroup.add(hologram);
    this.multiplierHolograms.push(hologram);

    // Light for the hologram
    const holoLight = new THREE.PointLight(theme === 'candy' ? 0xf472b6 : 0xa855f7, 2.2, 9);
    holoLight.position.set(0, 2.2, 0.3);
    multGroup.add(holoLight);
    this.lanterns.push(holoLight);

    // 6. Multiplier Alchemist Sage NPC
    const sage = new THREE.Group();
    sage.position.set(0, 0.35, -0.4);
    sage.userData.baseY = 0.35;

    // Robe
    const robeGeom = new THREE.CylinderGeometry(0.3, 0.5, 1.0, 12);
    const robeMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0x701a75 : 0x312e81,
      roughness: 0.5,
    });
    const robe = new THREE.Mesh(robeGeom, robeMat);
    robe.position.y = 0.5;
    robe.castShadow = true;
    sage.add(robe);

    // Glowing Rune Belt
    const beltGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12);
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.0,
    });
    const belt = new THREE.Mesh(beltGeom, beltMat);
    belt.position.y = 0.55;
    sage.add(belt);

    // Head
    const headGeom = new THREE.SphereGeometry(0.28, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.4 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 1.25;
    head.castShadow = true;
    sage.add(head);

    // Wizard Hat with glowing star
    const hatBrimGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
    const hatMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0x86198f : 0x1e1b4b,
      roughness: 0.3,
    });
    const hatBrim = new THREE.Mesh(hatBrimGeom, hatMat);
    hatBrim.position.y = 1.45;
    sage.add(hatBrim);

    const hatConeGeom = new THREE.ConeGeometry(0.34, 0.7, 12);
    const hatCone = new THREE.Mesh(hatConeGeom, hatMat);
    hatCone.position.set(0, 1.8, -0.05);
    hatCone.rotation.x = -0.15;
    sage.add(hatCone);

    multGroup.add(sage);
    this.shopkeepers.push(sage);

    // 7. Overhead Floating Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 3.8, 1.2);

    const signBoardGeom = new THREE.BoxGeometry(2.6, 0.6, 0.1);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signGroup.add(signBoard);

    // Neon Frame
    const signFrameGeom = new THREE.BoxGeometry(2.7, 0.7, 0.06);
    const signFrameMat = new THREE.MeshStandardMaterial({
      color: theme === 'candy' ? 0xec4899 : 0x818cf8,
      emissive: theme === 'candy' ? 0xdb2777 : 0x6366f1,
      emissiveIntensity: 0.9,
    });
    const signFrame = new THREE.Mesh(signFrameGeom, signFrameMat);
    signGroup.add(signFrame);

    multGroup.add(signGroup);

    // 8. Pulsing Floor Interaction Rune Ring
    const ringGeom = new THREE.RingGeometry(1.4, 1.9, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: theme === 'candy' ? 0xec4899 : 0x818cf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.04, 1.7);
    multGroup.add(ring);
    this.shopRuneRings.push(ring);

    this.scene.add(multGroup);
  }

  private createSwordMesh(swordId: string): THREE.Group {
    const sword = new THREE.Group();

    if (swordId === 'wood_sword') {
      const hiltGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
      const hiltMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
      const hilt = new THREE.Mesh(hiltGeom, hiltMat);
      hilt.position.y = -0.15;
      hilt.castShadow = true;
      sword.add(hilt);

      const guardGeom = new THREE.BoxGeometry(0.3, 0.06, 0.08);
      const guardMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
      const guard = new THREE.Mesh(guardGeom, guardMat);
      guard.position.y = 0.04;
      guard.castShadow = true;
      sword.add(guard);

      const bladeGeom = new THREE.BoxGeometry(0.12, 1.0, 0.04);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.y = 0.58;
      blade.castShadow = true;
      sword.add(blade);
    } else if (swordId === 'neon_katana') {
      const handleGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.38, 8);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      handle.position.y = -0.16;
      sword.add(handle);

      const guardGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
      const guardMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.8,
      });
      const guard = new THREE.Mesh(guardGeom, guardMat);
      guard.position.y = 0.04;
      sword.add(guard);

      const bladeGeom = new THREE.BoxGeometry(0.08, 1.2, 0.03);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xa5f3fc,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.y = 0.68;
      blade.castShadow = true;
      sword.add(blade);
    } else if (swordId === 'fire_greatsword') {
      const handleGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.42, 8);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      handle.position.y = -0.18;
      sword.add(handle);

      const guardGeom = new THREE.BoxGeometry(0.42, 0.08, 0.12);
      const guardMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.6,
      });
      const guard = new THREE.Mesh(guardGeom, guardMat);
      guard.position.y = 0.06;
      sword.add(guard);

      const bladeGeom = new THREE.BoxGeometry(0.18, 1.35, 0.05);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xf97316,
        emissiveIntensity: 2.0,
        roughness: 0.2,
      });
      const blade = new THREE.Mesh(bladeGeom, bladeMat);
      blade.position.y = 0.78;
      blade.castShadow = true;
      sword.add(blade);
    }

    return sword;
  }

  private buildParkourCourse() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const goldPlatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.3 });
    const crystalPlatMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.6 });

    // 1. Central Sky Observatory Platform Steps leading to high castle ruin
    const steps = [
      { x: 0, y: 1.8, z: -18, w: 3, h: 0.4, d: 3, mat: woodMat },
      { x: 0, y: 3.5, z: -24, w: 3, h: 0.4, d: 3, mat: woodMat },
      { x: -5, y: 5.2, z: -29, w: 3.2, h: 0.4, d: 3.2, mat: woodMat },
      { x: -12, y: 7.0, z: -29, w: 3.5, h: 0.5, d: 3.5, mat: stoneMat },
      { x: -18, y: 8.8, z: -24, w: 3.5, h: 0.5, d: 3.5, mat: stoneMat },
      { x: -22, y: 10.5, z: -17, w: 4, h: 0.6, d: 4, mat: goldPlatMat },
      // High Sky Bridge
      { x: -15, y: 10.5, z: -10, w: 3, h: 0.5, d: 3, mat: stoneMat },
      { x: -8, y: 11.5, z: -5, w: 3.5, h: 0.5, d: 3.5, mat: stoneMat },
      { x: 0, y: 13.0, z: -5, w: 5, h: 0.8, d: 5, mat: goldPlatMat }, // Summit observatory!
    ];

    steps.forEach((s) => {
      const geom = new THREE.BoxGeometry(s.w, s.h, s.d);
      const mesh = new THREE.Mesh(geom, s.mat);
      mesh.position.set(s.x, s.y, s.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Support wooden/stone foundation column from terrain up to platform so it never floats detached
      const groundY = this.getTerrainHeight(s.x, s.z);
      if (s.y - s.h / 2 > groundY + 0.3) {
        const pHeight = s.y - s.h / 2 - groundY;
        const postGeom = new THREE.CylinderGeometry(0.35, 0.4, pHeight, 8);
        const post = new THREE.Mesh(postGeom, woodMat);
        post.position.set(s.x, groundY + pHeight / 2, s.z);
        post.castShadow = true;
        this.scene.add(post);
      }

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.platforms.push({ box, topY: s.y + s.h / 2 });
    });

    // 2. East Mountain Ruins & Pillars
    const eastRuins = [
      { x: 22, y: 2.0, z: 0, w: 4, h: 4.0, d: 4 },
      { x: 28, y: 4.0, z: 6, w: 4, h: 8.0, d: 4 },
      { x: 35, y: 6.0, z: 12, w: 5, h: 12.0, d: 5 },
      { x: 28, y: 8.0, z: 20, w: 4, h: 16.0, d: 4 },
      // Expanded East Highland steps with stone pillar foundations
      { x: 55, y: 6.0, z: -10, w: 4.5, h: 1.0, d: 4.5 },
      { x: 68, y: 9.0, z: -18, w: 4.0, h: 1.0, d: 4.0 },
      { x: 82, y: 12.5, z: -25, w: 5.0, h: 1.2, d: 5.0 },
    ];

    eastRuins.forEach((r) => {
      const geom = new THREE.BoxGeometry(r.w, r.h, r.d);
      const mesh = new THREE.Mesh(geom, stoneMat);
      mesh.position.set(r.x, r.y, r.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Add solid stone base pillar if platform is high above terrain
      const groundY = this.getTerrainHeight(r.x, r.z);
      if (r.y - r.h / 2 > groundY + 0.3) {
        const pillarH = r.y - r.h / 2 - groundY;
        const pillarGeom = new THREE.CylinderGeometry(r.w * 0.38, r.w * 0.45, pillarH, 10);
        const pillar = new THREE.Mesh(pillarGeom, stoneMat);
        pillar.position.set(r.x, groundY + pillarH / 2, r.z);
        pillar.castShadow = true;
        this.scene.add(pillar);
      }

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.platforms.push({ box, topY: r.y + r.h / 2 });
    });

    // 3. North Highlands Sky Citadel Course
    const northCourse = [
      { x: 0, y: 8.0, z: -65, w: 5, h: 1.0, d: 5, mat: crystalPlatMat },
      { x: -12, y: 11.0, z: -78, w: 4, h: 0.8, d: 4, mat: goldPlatMat },
      { x: -25, y: 14.0, z: -90, w: 4, h: 0.8, d: 4, mat: woodMat },
      { x: -10, y: 17.5, z: -105, w: 6, h: 1.2, d: 6, mat: crystalPlatMat }, // North Zenith
    ];

    northCourse.forEach((nc) => {
      const geom = new THREE.BoxGeometry(nc.w, nc.h, nc.d);
      const mesh = new THREE.Mesh(geom, nc.mat);
      mesh.position.set(nc.x, nc.y, nc.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Solid pillar column foundation
      const groundY = this.getTerrainHeight(nc.x, nc.z);
      if (nc.y - nc.h / 2 > groundY + 0.3) {
        const pillarH = nc.y - nc.h / 2 - groundY;
        const pillarGeom = new THREE.CylinderGeometry(nc.w * 0.35, nc.w * 0.45, pillarH, 10);
        const pillar = new THREE.Mesh(pillarGeom, stoneMat);
        pillar.position.set(nc.x, groundY + pillarH / 2, nc.z);
        pillar.castShadow = true;
        this.scene.add(pillar);
      }

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.platforms.push({ box, topY: nc.y + nc.h / 2 });
    });

    // 4. West Canyon Spire Slabs
    const westCourse = [
      { x: -55, y: 5.0, z: 15, w: 4, h: 1.0, d: 4 },
      { x: -72, y: 8.5, z: 25, w: 4.5, h: 1.0, d: 4.5 },
      { x: -88, y: 12.0, z: 35, w: 5, h: 1.2, d: 5 },
      { x: -105, y: 16.0, z: 50, w: 6, h: 1.5, d: 6 },
    ];

    westCourse.forEach((wc) => {
      const geom = new THREE.BoxGeometry(wc.w, wc.h, wc.d);
      const mesh = new THREE.Mesh(geom, stoneMat);
      mesh.position.set(wc.x, wc.y, wc.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Solid spire column foundation
      const groundY = this.getTerrainHeight(wc.x, wc.z);
      if (wc.y - wc.h / 2 > groundY + 0.3) {
        const pillarH = wc.y - wc.h / 2 - groundY;
        const pillarGeom = new THREE.CylinderGeometry(wc.w * 0.38, wc.w * 0.48, pillarH, 10);
        const pillar = new THREE.Mesh(pillarGeom, stoneMat);
        pillar.position.set(wc.x, groundY + pillarH / 2, wc.z);
        pillar.castShadow = true;
        this.scene.add(pillar);
      }

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.platforms.push({ box, topY: wc.y + wc.h / 2 });
    });

    // 5. Southern Forest Stepping Stones (firmly anchored to terrain)
    for (let i = 0; i < 8; i++) {
      const x = -20 + (i % 4) * 10;
      const z = 24 + Math.floor(i / 4) * 16 + (i % 2) * 3;
      const terrainY = this.getTerrainHeight(x, z);
      const pillarHeight = 1.4 + (i % 4) * 0.6;
      const geom = new THREE.CylinderGeometry(1.5, 1.8, pillarHeight, 10);
      const mesh = new THREE.Mesh(geom, stoneMat);
      mesh.position.set(x, terrainY + pillarHeight / 2 - 0.2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const box = new THREE.Box3().setFromObject(mesh);
      this.colliders.push(box);
      this.platforms.push({ box, topY: terrainY + pillarHeight - 0.2 });
    }
  }

  private buildTemple(cx: number, cz: number) {
    const templeGroup = new THREE.Group();
    const groundH = this.getTerrainHeight(cx, cz);
    templeGroup.position.set(cx, 0, cz);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.6,
      flatShading: true,
    });
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.1,
    });
    const darkStoneMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      metalness: 0.7,
    });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.5,
    });

    // 1. Multi-Tiered Stone Base Podium
    const baseWidth = 22;
    const baseDepth = 24;
    const baseHeight = 1.4;
    const baseY = groundH + baseHeight / 2;

    const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
    baseMesh.position.set(0, baseY, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    templeGroup.add(baseMesh);

    // Main base platform collider
    const floorTopY = groundH + baseHeight;
    const baseBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, baseY, cz),
      new THREE.Vector3(baseWidth, baseHeight, baseDepth)
    );
    this.colliders.push(baseBox);
    this.platforms.push({ box: baseBox, topY: floorTopY });

    // Upper Marble Terrace
    const terraceW = 18;
    const terraceD = 20;
    const terraceH = 0.6;
    const terraceY = floorTopY + terraceH / 2;
    const terraceGeom = new THREE.BoxGeometry(terraceW, terraceH, terraceD);
    const terraceMesh = new THREE.Mesh(terraceGeom, marbleMat);
    terraceMesh.position.set(0, terraceY, 0);
    terraceMesh.castShadow = true;
    terraceMesh.receiveShadow = true;
    templeGroup.add(terraceMesh);

    const terraceTopY = floorTopY + terraceH;
    const terraceBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, terraceY, cz),
      new THREE.Vector3(terraceW, terraceH, terraceD)
    );
    this.colliders.push(terraceBox);
    this.platforms.push({ box: terraceBox, topY: terraceTopY });

    // 2. Grand Approach Steps (Facing South, +Z axis towards player spawn)
    const stepCount = 7;
    const stepWidth = 10;
    const stepDepth = 1.1;
    const totalStepRise = terraceTopY - groundH;
    const stepHeight = totalStepRise / stepCount;

    for (let i = 0; i < stepCount; i++) {
      const stepY = groundH + (i + 0.5) * stepHeight;
      const stepZ = terraceD / 2 + (stepCount - i - 0.5) * (stepDepth * 0.85);
      const curWidth = stepWidth + (stepCount - i) * 0.4;
      const stepGeom = new THREE.BoxGeometry(curWidth, stepHeight, stepDepth);
      const stepMesh = new THREE.Mesh(stepGeom, stoneMat);
      stepMesh.position.set(0, stepY, stepZ);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      templeGroup.add(stepMesh);

      const sBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cx, stepY, cz + stepZ),
        new THREE.Vector3(curWidth, stepHeight, stepDepth)
      );
      this.colliders.push(sBox);
      this.platforms.push({ box: sBox, topY: groundH + (i + 1) * stepHeight });
    }

    // 3. Classical Marble Columns with Plinths and Golden Capitals
    const columnH = 7.0;
    const colCoords = [
      // Front Row (Entrance)
      { x: -6.5, z: 8.0 },
      { x: -2.2, z: 8.0 },
      { x: 2.2, z: 8.0 },
      { x: 6.5, z: 8.0 },
      // Back Row
      { x: -6.5, z: -8.0 },
      { x: -2.2, z: -8.0 },
      { x: 2.2, z: -8.0 },
      { x: 6.5, z: -8.0 },
      // Side Flanks
      { x: -6.5, z: 0 },
      { x: 6.5, z: 0 },
    ];

    colCoords.forEach((cc) => {
      // Column Base Plinth
      const plinthGeom = new THREE.BoxGeometry(1.4, 0.4, 1.4);
      const plinth = new THREE.Mesh(plinthGeom, stoneMat);
      plinth.position.set(cc.x, terraceTopY + 0.2, cc.z);
      plinth.castShadow = true;
      templeGroup.add(plinth);

      // Fluted Shaft
      const colGeom = new THREE.CylinderGeometry(0.48, 0.56, columnH, 12);
      const colMesh = new THREE.Mesh(colGeom, marbleMat);
      colMesh.position.set(cc.x, terraceTopY + 0.4 + columnH / 2, cc.z);
      colMesh.castShadow = true;
      templeGroup.add(colMesh);

      // Golden Capital
      const capGeom = new THREE.BoxGeometry(1.5, 0.6, 1.5);
      const capital = new THREE.Mesh(capGeom, goldMat);
      capital.position.set(cc.x, terraceTopY + 0.4 + columnH + 0.3, cc.z);
      capital.castShadow = true;
      templeGroup.add(capital);

      // Column Solid Hitbox
      const colBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cx + cc.x, terraceTopY + (columnH + 1.2) / 2, cz + cc.z),
        new THREE.Vector3(1.4, columnH + 1.2, 1.4)
      );
      this.colliders.push(colBox);
    });

    // 4. Temple Architrave Beam & Sloped Golden Roof
    const architraveY = terraceTopY + columnH + 1.0;
    const archGeom = new THREE.BoxGeometry(17, 0.8, 19);
    const archMesh = new THREE.Mesh(archGeom, stoneMat);
    archMesh.position.set(0, architraveY, 0);
    archMesh.castShadow = true;
    templeGroup.add(archMesh);

    // Sloped Triangular Roof Structure
    const roofGeom = new THREE.ConeGeometry(12, 3.2, 4);
    const roofMesh = new THREE.Mesh(roofGeom, roofMat);
    roofMesh.position.set(0, architraveY + 2.0, 0);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.scale.set(1.15, 1.0, 1.25);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    templeGroup.add(roofMesh);

    // Front Golden Sun Emblem on Pediment
    const sunDiscGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16);
    const sunDisc = new THREE.Mesh(sunDiscGeom, goldMat);
    sunDisc.rotation.x = Math.PI / 2;
    sunDisc.position.set(0, architraveY + 1.5, 9.2);
    templeGroup.add(sunDisc);

    // Roof Top Collider and Platform
    const roofTopY = architraveY + 3.6;
    const roofBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, architraveY + 1.6, cz),
      new THREE.Vector3(15, 3.4, 17)
    );
    this.colliders.push(roofBox);
    this.platforms.push({ box: roofBox, topY: roofTopY });

    // 5. Central Sanctuary Altar & Eternal Sun Relic
    const altarW = 4.2;
    const altarH = 1.3;
    const altarD = 3.0;
    const altarY = terraceTopY + altarH / 2;
    const altarGeom = new THREE.BoxGeometry(altarW, altarH, altarD);
    const altarMesh = new THREE.Mesh(altarGeom, darkStoneMat);
    altarMesh.position.set(0, altarY, 0);
    altarMesh.castShadow = true;
    altarMesh.receiveShadow = true;
    templeGroup.add(altarMesh);

    const altarBox = new THREE.Box3().setFromCenterAndSize(
      new THREE.Vector3(cx, altarY, cz),
      new THREE.Vector3(altarW, altarH, altarD)
    );
    this.colliders.push(altarBox);
    this.platforms.push({ box: altarBox, topY: terraceTopY + altarH });

    // Floating Golden Sun Relic above Altar
    const relicGroup = new THREE.Group();
    const relicY = terraceTopY + altarH + 1.2;
    relicGroup.position.set(0, relicY, 0);
    relicGroup.userData.baseY = relicY;

    const relicGeom = new THREE.OctahedronGeometry(0.7, 0);
    const relicMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.1,
      metalness: 0.9,
    });
    const relicMesh = new THREE.Mesh(relicGeom, relicMat);
    relicGroup.add(relicMesh);

    // Glowing Orbital Rings around relic
    const rRing1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.04, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    rRing1.rotation.x = Math.PI / 4;
    relicGroup.add(rRing1);

    const rRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    rRing2.rotation.y = Math.PI / 3;
    relicGroup.add(rRing2);

    templeGroup.add(relicGroup);
    this.multiplierHolograms.push(relicGroup);

    // Sacred Sanctuary Light
    const sanctuaryLight = new THREE.PointLight(0xffb703, 3.5, 24);
    sanctuaryLight.position.set(0, relicY + 0.3, 0);
    templeGroup.add(sanctuaryLight);
    this.lanterns.push(sanctuaryLight);

    // 6. 4 Sacred Braziers with Fire
    const brazierPositions = [
      { bx: -8.0, bz: 8.5 },
      { bx: 8.0, bz: 8.5 },
      { bx: -8.0, bz: -8.5 },
      { bx: 8.0, bz: -8.5 },
    ];

    brazierPositions.forEach((bp) => {
      // Brazier Stand
      const bGeom = new THREE.CylinderGeometry(0.6, 0.4, 1.4, 8);
      const bMesh = new THREE.Mesh(bGeom, darkStoneMat);
      bMesh.position.set(bp.bx, floorTopY + 0.7, bp.bz);
      bMesh.castShadow = true;
      templeGroup.add(bMesh);

      // Fire Bowl
      const bowlGeom = new THREE.CylinderGeometry(0.8, 0.5, 0.5, 8);
      const bowl = new THREE.Mesh(bowlGeom, goldMat);
      bowl.position.set(bp.bx, floorTopY + 1.5, bp.bz);
      templeGroup.add(bowl);

      // Flame Mesh
      const flameGeom = new THREE.ConeGeometry(0.45, 0.9, 8);
      const flameMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xef4444,
        emissiveIntensity: 2.0,
      });
      const flame = new THREE.Mesh(flameGeom, flameMat);
      flame.position.set(bp.bx, floorTopY + 2.0, bp.bz);
      templeGroup.add(flame);

      const fLight = new THREE.PointLight(0xf97316, 2.0, 14);
      fLight.position.set(bp.bx, floorTopY + 2.2, bp.bz);
      templeGroup.add(fLight);
      this.lanterns.push(fLight);
    });

    // 7. Parkour Ledges for Climbing to the Temple Roof
    const ledges = [
      { lx: -7.6, ly: terraceTopY + 2.4, lz: 0 },
      { lx: -7.6, ly: terraceTopY + 4.6, lz: -3.5 },
      { lx: -7.6, ly: terraceTopY + 6.8, lz: -7.0 },
      { lx: -4.0, ly: architraveY + 0.5, lz: -8.5 },
    ];
    ledges.forEach((ld) => {
      const ledgeGeom = new THREE.BoxGeometry(1.6, 0.35, 1.6);
      const ledge = new THREE.Mesh(ledgeGeom, stoneMat);
      ledge.position.set(ld.lx, ld.ly, ld.lz);
      ledge.castShadow = true;
      ledge.receiveShadow = true;
      templeGroup.add(ledge);

      const lBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(cx + ld.lx, ld.ly, cz + ld.lz),
        new THREE.Vector3(1.6, 0.35, 1.6)
      );
      this.colliders.push(lBox);
      this.platforms.push({ box: lBox, topY: ld.ly + 0.18 });
    });

    this.scene.add(templeGroup);
  }

  private createSpringPad(x: number, z: number, explicitPlatformY?: number) {
    const group = new THREE.Group();
    const terrainY = this.getTerrainHeight(x, z);
    const y = explicitPlatformY !== undefined ? explicitPlatformY : terrainY;

    // If trampoline is elevated, build a solid stone pedestal base from the ground
    if (explicitPlatformY !== undefined && explicitPlatformY > terrainY + 0.3) {
      const pillarH = explicitPlatformY - terrainY;
      const pillarGeom = new THREE.CylinderGeometry(1.7, 2.0, pillarH, 12);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(0, -pillarH / 2, 0);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      const pBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, terrainY + pillarH / 2, z),
        new THREE.Vector3(3.4, pillarH, 3.4)
      );
      this.colliders.push(pBox);
      this.platforms.push({ box: pBox, topY: explicitPlatformY });
    }

    // Base ring
    const baseGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.3, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.15;
    base.receiveShadow = true;
    group.add(base);

    // Glowing Spring bounce pad
    const padGeom = new THREE.CylinderGeometry(1.3, 1.3, 0.25, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xbe185d,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const pad = new THREE.Mesh(padGeom, padMat);
    pad.position.y = 0.35;
    pad.castShadow = true;
    group.add(pad);

    group.position.set(x, y, z);
    this.scene.add(group);

    this.springPads.push({
      pos: new THREE.Vector3(x, y, z),
      mesh: pad,
      radius: 1.6,
      topY: y + 0.4,
    });
  }

  private createLantern(x: number, y: number, z: number) {
    const group = new THREE.Group();

    // Lantern post/housing
    const housingGeom = new THREE.BoxGeometry(0.5, 0.7, 0.5);
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });
    const housing = new THREE.Mesh(housingGeom, housingMat);
    housing.position.set(0, 0.35, 0);
    group.add(housing);

    const light = new THREE.PointLight(0xffaa33, 1.2, 14, 1.5);
    light.position.set(0, 0.4, 0);
    group.add(light);

    group.position.set(x, y, z);
    this.scene.add(group);

    this.lanterns.push(light);
  }

  private buildFoliage() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8, flatShading: true });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, flatShading: true });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7, flatShading: true });

    // Shared geometries to save memory and draw overhead on mobile
    const trunkGeom = new THREE.CylinderGeometry(0.35, 0.45, 3.0, 6);
    const pineCone1 = new THREE.ConeGeometry(2.2, 2.0, 6);
    const pineCone2 = new THREE.ConeGeometry(1.7, 1.8, 6);
    const pineCone3 = new THREE.ConeGeometry(1.2, 1.6, 6);
    const oakCrownGeom = new THREE.DodecahedronGeometry(1.8, 0);
    const rockGeom = new THREE.DodecahedronGeometry(1.2, 0);

    // Reserved / Occupied zones where trees & rocks MUST NOT spawn (avoids clipping/fusion)
    const occupiedZones: { x: number; z: number; radius: number }[] = [
      { x: 0, z: 0, radius: 12 }, // Central Plaza
      { x: 6.5, z: 2.0, radius: 6 }, // Shop & Merchant
      // Trampolines
      { x: 0, z: -12, radius: 4 },
      { x: 24, z: 18, radius: 4 },
      { x: -28, z: -22, radius: 4 },
      { x: 35, z: -30, radius: 5 },
      { x: 0, z: 85, radius: 5 },
      { x: -75, z: 30, radius: 5 },
      { x: 80, z: -60, radius: 5 },
      { x: -65, z: -80, radius: 5 },
      // Parkour courses & Stepping stones
      { x: 0, z: -24, radius: 14 },
      { x: -15, z: -20, radius: 12 },
      { x: 28, z: 10, radius: 14 },
      { x: 68, z: -18, radius: 14 },
      { x: -12, z: -85, radius: 16 },
      { x: -80, z: 30, radius: 16 },
      { x: -10, z: 28, radius: 14 },
    ];

    const isPositionOccupied = (x: number, z: number, minDistance: number) => {
      for (const zone of occupiedZones) {
        if (Math.hypot(x - zone.x, z - zone.z) < zone.radius + minDistance) {
          return true;
        }
      }
      return false;
    };

    // 1. Procedural Trees across the world with strict spacing to prevent merged trunks
    const targetTrees = 100;
    let placedTrees = 0;
    for (let i = 0; i < 280 && placedTrees < targetTrees; i++) {
      const angle = (i * 1.37) % (Math.PI * 2);
      const dist = 14 + ((i * 37) % 122);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (isPositionOccupied(x, z, 3.8)) continue;

      const terrainY = this.getTerrainHeight(x, z);
      const treeGroup = new THREE.Group();
      const height = 2.6 + (placedTrees % 3) * 0.7;

      // Trunk (embedded slightly in terrain for clean grounding)
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = height / 2 - 0.2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // Canopy
      if (placedTrees % 2 === 0) {
        // Pine Tree
        const cone1 = new THREE.Mesh(pineCone1, foliageMat1);
        cone1.position.y = height + 0.8;
        cone1.castShadow = true;
        cone1.receiveShadow = true;
        treeGroup.add(cone1);

        const cone2 = new THREE.Mesh(pineCone2, foliageMat2);
        cone2.position.y = height + 2.0;
        cone2.castShadow = true;
        cone2.receiveShadow = true;
        treeGroup.add(cone2);

        const cone3 = new THREE.Mesh(pineCone3, foliageMat1);
        cone3.position.y = height + 3.0;
        cone3.castShadow = true;
        cone3.receiveShadow = true;
        treeGroup.add(cone3);
      } else {
        // Oak Tree
        const crown = new THREE.Mesh(oakCrownGeom, foliageMat2);
        crown.position.y = height + 1.2;
        crown.castShadow = true;
        crown.receiveShadow = true;
        treeGroup.add(crown);
      }

      treeGroup.position.set(x, terrainY, z);
      this.scene.add(treeGroup);

      // Solid collider hitbox for trunk
      const box = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(x, terrainY + height / 2, z),
        new THREE.Vector3(1.2, height, 1.2)
      );
      this.colliders.push(box);

      occupiedZones.push({ x, z, radius: 3.2 });
      placedTrees++;
    }

    // 2. Rocks & Boulders firmly grounded with anti-fusion spacing
    const targetRocks = 45;
    let placedRocks = 0;
    for (let i = 0; i < 220 && placedRocks < targetRocks; i++) {
      const angle = (i * 2.19) % (Math.PI * 2);
      const dist = 12 + ((i * 43) % 125);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      if (isPositionOccupied(x, z, 3.0)) continue;

      const terrainY = this.getTerrainHeight(x, z);
      const scale = 0.8 + (placedRocks % 4) * 0.35;
      const rock = new THREE.Mesh(rockGeom, rockMat);
      rock.scale.set(scale, scale, scale);
      // Embed rock base ~25% into terrain so it never floats on hillsides
      rock.position.set(x, terrainY + scale * 0.45, z);
      rock.rotation.set((placedRocks * 0.5) % 3, (placedRocks * 0.7) % 3, 0);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);

      const box = new THREE.Box3().setFromObject(rock);
      this.colliders.push(box);
      this.platforms.push({ box, topY: terrainY + scale * 1.1 });

      occupiedZones.push({ x, z, radius: 2.5 });
      placedRocks++;
    }
  }

  // --- COINS SPAWN ---
  private spawnCoins() {
    const rawCoinLocations: { x: number; y: number; z: number; type: 'gold' | 'gem' | 'star'; value: number; onGround?: boolean }[] = [
      // 1. Plaza & nearby ground
      { x: 0, y: 1.2, z: 4, type: 'gold', value: 10, onGround: true },
      { x: -3.5, y: 1.2, z: 0, type: 'gold', value: 10, onGround: true },
      { x: 3.5, y: 1.2, z: 0, type: 'gold', value: 10, onGround: true },
      { x: 0, y: 1.2, z: -4, type: 'gold', value: 10, onGround: true },
      
      // 2. Top of pillars in Plaza
      { x: -5, y: 5.6, z: -5, type: 'gold', value: 20 },
      { x: 5, y: 5.6, z: -5, type: 'gold', value: 20 },
      { x: -5, y: 5.6, z: 5, type: 'gold', value: 20 },
      { x: 5, y: 5.6, z: 5, type: 'gold', value: 20 },

      // 3. Central Parkour steps
      { x: 0, y: 2.8, z: -18, type: 'gold', value: 15 },
      { x: 0, y: 4.5, z: -24, type: 'gold', value: 15 },
      { x: -5, y: 6.2, z: -29, type: 'gold', value: 15 },
      { x: -12, y: 8.0, z: -29, type: 'gem', value: 30 },
      { x: -18, y: 9.8, z: -24, type: 'gem', value: 30 },
      { x: -22, y: 11.5, z: -17, type: 'gem', value: 30 },
      { x: -8, y: 12.5, z: -5, type: 'gem', value: 35 },
      { x: 0, y: 14.5, z: -5, type: 'star', value: 100 }, // The Summit Grand Star!

      // 4. East Mountain ruins
      { x: 22, y: 5.0, z: 0, type: 'gold', value: 15 },
      { x: 28, y: 9.0, z: 6, type: 'gem', value: 30 },
      { x: 35, y: 13.0, z: 12, type: 'star', value: 80 },
      { x: 28, y: 17.0, z: 20, type: 'star', value: 100 },
      { x: 55, y: 7.5, z: -10, type: 'gem', value: 35 },
      { x: 68, y: 10.5, z: -18, type: 'gem', value: 40 },
      { x: 82, y: 14.0, z: -25, type: 'star', value: 100 }, // East Dunes Peak Star!

      // 5. Ancient Temple of the Sun (Mundo 1)
      { x: 0, y: 16.5, z: -68, type: 'star', value: 10 }, // Summit Solar Star!
      { x: 0, y: 10.5, z: -68, type: 'gem', value: 5 }, // Sanctuary Holy Altar Relic!
      { x: -3.5, y: 9.0, z: -68, type: 'gold', value: 1 },
      { x: 3.5, y: 9.0, z: -68, type: 'gold', value: 1 },
      { x: 0, y: 7.8, z: -59, type: 'gold', value: 1 }, // Temple Entrance Stair 1
      { x: -2.5, y: 8.2, z: -62, type: 'gold', value: 1 }, // Temple Entrance Stair 2
      { x: 2.5, y: 8.2, z: -62, type: 'gold', value: 1 }, // Temple Entrance Stair 3
      { x: -7.6, y: 15.0, z: -68, type: 'gem', value: 5 }, // Roof Parkour Ledge Gem

      // 6. North Highlands Sky Citadel
      { x: 0, y: 9.5, z: -65, type: 'gem', value: 35 },
      { x: -12, y: 12.5, z: -78, type: 'gem', value: 40 },
      { x: -25, y: 15.5, z: -90, type: 'gem', value: 45 },
      { x: -10, y: 19.0, z: -105, type: 'star', value: 120 }, // North Zenith Star!

      // 6. West Canyon Spires
      { x: -55, y: 6.5, z: 15, type: 'gold', value: 20 },
      { x: -72, y: 10.0, z: 25, type: 'gem', value: 40 },
      { x: -88, y: 13.5, z: 35, type: 'gem', value: 45 },
      { x: -105, y: 17.5, z: 50, type: 'star', value: 110 }, // West Spire Star!

      // 7. Trampoline launch aerial rewards
      { x: 0, y: 8.5, z: -12, type: 'gem', value: 40 },
      { x: 24, y: 9.0, z: 18, type: 'gem', value: 40 },
      { x: -28, y: 9.5, z: -22, type: 'gem', value: 40 },
      { x: 0, y: 12.5, z: 85, type: 'star', value: 80 },
      { x: -75, y: 13.5, z: 30, type: 'star', value: 80 },
      { x: 80, y: 14.5, z: -60, type: 'star', value: 90 },
      { x: -65, y: 13.5, z: -80, type: 'star', value: 90 },

      // 8. Hilltops, Valleys & Secret Forest Groves across the vast realm
      { x: 18, y: 1.2, z: -15, type: 'gem', value: 30, onGround: true },
      { x: -22, y: 1.2, z: 18, type: 'gem', value: 30, onGround: true },
      { x: 26, y: 1.2, z: 28, type: 'gem', value: 30, onGround: true },
      { x: -30, y: 1.2, z: -12, type: 'star', value: 60, onGround: true },
      { x: 50, y: 1.2, z: -75, type: 'gem', value: 35, onGround: true },
      { x: 35, y: 1.2, z: -110, type: 'star', value: 75, onGround: true },
      { x: 65, y: 1.2, z: 10, type: 'gem', value: 30, onGround: true },
      { x: 95, y: 1.2, z: 45, type: 'star', value: 70, onGround: true },
      { x: 110, y: 1.2, z: -15, type: 'star', value: 85, onGround: true },
      { x: -40, y: 1.2, z: 65, type: 'gem', value: 30, onGround: true },
      { x: 10, y: 1.2, z: 85, type: 'gem', value: 35, onGround: true },
      { x: -60, y: 1.2, z: 95, type: 'star', value: 70, onGround: true },
      { x: 45, y: 1.2, z: 110, type: 'star', value: 85, onGround: true },
      { x: -65, y: 1.2, z: -25, type: 'gem', value: 30, onGround: true },
      { x: -90, y: 1.2, z: 20, type: 'star', value: 70, onGround: true },
      { x: -105, y: 1.2, z: -55, type: 'star', value: 85, onGround: true },
      { x: -110, y: 1.2, z: 70, type: 'star', value: 85, onGround: true },
    ];

    const coinLocations = rawCoinLocations.map((loc) => {
      const groundH = this.getTerrainHeight(loc.x, loc.z);
      const adjustedValue = loc.type === 'gem' ? 5 : loc.type === 'star' ? 10 : 1;
      let finalY = loc.y;
      if (loc.onGround || loc.y < groundH + 1.2) {
        finalY = groundH + 1.2;
      }
      return { ...loc, y: finalY, value: adjustedValue };
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.7,
      metalness: 0.4,
      roughness: 0.1,
    });

    const starMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.1,
    });

    // Shared geometries for coins
    const coinGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12);
    const gemGeom = new THREE.OctahedronGeometry(0.65, 0);
    const starGeom = new THREE.IcosahedronGeometry(0.85, 0);

    coinLocations.forEach((loc, index) => {
      const group = new THREE.Group();
      let mesh: THREE.Mesh;

      if (loc.type === 'gem') {
        mesh = new THREE.Mesh(gemGeom, gemMat);
      } else if (loc.type === 'star') {
        mesh = new THREE.Mesh(starGeom, starMat);
      } else {
        mesh = new THREE.Mesh(coinGeom, goldMat);
        mesh.rotation.x = Math.PI / 2;
      }

      mesh.castShadow = true;
      group.add(mesh);

      group.position.set(loc.x, loc.y, loc.z);
      this.scene.add(group);

      this.coins.push({
        data: {
          id: index,
          x: loc.x,
          y: loc.y,
          z: loc.z,
          collected: false,
          value: loc.value,
          type: loc.type,
        },
        mesh: group,
        light: null,
      });
    });
  }

  // --- DAY / NIGHT ENGINE ---
  private updateTimeOfDay(dt: number) {
    if (this.cycleSpeedMode === 'freeze_day') {
      this.timeOfDay = 12.0;
    } else if (this.cycleSpeedMode === 'freeze_night') {
      this.timeOfDay = 0.0;
    } else {
      let speedFactor = 0.15; // default ~2.5 mins per full 24h day
      if (this.cycleSpeedMode === 'fast') speedFactor = 0.6; // 40s day
      if (this.cycleSpeedMode === 'slow') speedFactor = 0.05; // 8 mins day
      this.timeOfDay = (this.timeOfDay + dt * speedFactor) % 24;
    }

    const t = this.timeOfDay;
    // Calculate Sun Angle: 6:00 is sunrise (0 rad), 12:00 is noon (pi/2), 18:00 is sunset (pi), 0:00 is midnight (-pi/2)
    const sunAngle = ((t - 6) / 24) * Math.PI * 2;
    const sunDist = 120;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * sunDist;
    const sunZ = 20;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    // Moon is opposite to sun
    this.moonLight.position.set(-sunX, -sunY, -sunZ);
    this.moonMesh.position.set(-sunX, -sunY, -sunZ);

    // Determine Period
    let period: TimeState['period'] = 'day';
    let skyColor = new THREE.Color(0x87ceeb);
    let fogColor = new THREE.Color(0x87ceeb);
    let hemiSky = new THREE.Color(0xffffff);
    let hemiGround = new THREE.Color(0x445566);
    let sunIntensity = 2.0;
    let moonIntensity = 0.0;
    let starsOpacity = 0.0;
    let firefliesOpacity = 0.0;
    let lanternPower = 0.1;

    if (t >= 5 && t < 7.5) {
      // DAWN / SUNRISE
      period = 'dawn';
      const progress = (t - 5) / 2.5;
      skyColor.setRGB(0.95, 0.55 + progress * 0.25, 0.45 + progress * 0.45);
      fogColor.copy(skyColor);
      hemiSky.setRGB(1.0, 0.8, 0.6);
      sunIntensity = 0.5 + progress * 1.5;
      moonIntensity = (1 - progress) * 0.4;
      starsOpacity = (1 - progress) * 0.8;
      firefliesOpacity = (1 - progress) * 0.7;
    } else if (t >= 7.5 && t < 17) {
      // DAY
      period = 'day';
      skyColor.setHex(0x7ec8ed);
      fogColor.setHex(0x9bd8f5);
      hemiSky.setHex(0xffffff);
      hemiGround.setHex(0x446644);
      sunIntensity = 2.0;
      moonIntensity = 0.0;
      starsOpacity = 0.0;
      firefliesOpacity = 0.0;
    } else if (t >= 17 && t < 19.5) {
      // SUNSET / DUSK
      period = 'sunset';
      const progress = (t - 17) / 2.5;
      skyColor.setRGB(0.9 - progress * 0.7, 0.4 - progress * 0.3, 0.3 + progress * 0.2); // Crimson/Violet
      fogColor.copy(skyColor);
      hemiSky.setRGB(0.9, 0.4, 0.5);
      hemiGround.setRGB(0.3, 0.2, 0.2);
      sunIntensity = (1 - progress) * 2.0;
      moonIntensity = progress * 0.6;
      starsOpacity = progress * 0.9;
      firefliesOpacity = progress * 0.8;
      lanternPower = progress * 1.5;
    } else {
      // NIGHT
      period = 'night';
      skyColor.setHex(0x0a0f1d);
      fogColor.setHex(0x0e172a);
      hemiSky.setHex(0x1e293b);
      hemiGround.setHex(0x0f172a);
      sunIntensity = 0.0;
      moonIntensity = 0.75;
      starsOpacity = 1.0;
      firefliesOpacity = 0.9;
      lanternPower = 1.8;
    }

    // Apply colors to scene & lights
    this.scene.background = skyColor;
    if (this.scene.fog) {
      this.scene.fog.color = fogColor;
    }
    this.hemiLight.color = hemiSky;
    this.hemiLight.groundColor = hemiGround;
    this.sunLight.intensity = sunIntensity;
    this.moonLight.intensity = moonIntensity;
    this.starsMaterial.opacity = starsOpacity;

    if (this.firefliesParticles) {
      (this.firefliesParticles.material as THREE.PointsMaterial).opacity = firefliesOpacity;
    }

    this.lanterns.forEach((l) => {
      l.intensity = lanternPower;
    });

    // Notify Audio Engine about Night vs Day mood
    soundEngine.setNightMood(period === 'night' || period === 'sunset');

    // Callback formatted time
    const hours = Math.floor(t);
    const mins = Math.floor((t % 1) * 60);
    const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

    this.callbacks.onTimeUpdate({
      time: t,
      period,
      formattedTime: formatted,
      sunHeight: Math.sin(sunAngle),
    });
  }

  // --- CONTROLS & EVENT LISTENERS ---
  private setupEventListeners() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);

    this.renderer.domElement.addEventListener('click', () => {
      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock();
      }
    });

    window.addEventListener('mousemove', this.onMouseMove);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keyState[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.jump();
    }
    if (e.code === 'KeyE') {
      if (this.isNearShop) {
        this.callbacks.onOpenShop?.();
      } else if (this.isNearMultiplierShop) {
        this.callbacks.onOpenMultiplierShop?.();
      }
    }
    if (e.code === 'KeyT') {
      if (this.isNearShop) {
        this.callbacks.onOpenShop?.();
      }
    }
    if (e.code === 'KeyR' || e.code === 'KeyQ') {
      this.swingSword();
    }
    if (e.code === 'KeyF') {
      this.toggleFlashlight();
    }
    if (e.code === 'KeyV' || e.code === 'KeyC') {
      this.toggleViewMode();
    }
    if (e.code === 'KeyM') {
      soundEngine.toggleMusic();
    }
    if (e.code === 'KeyH' || e.code === 'KeyB') {
      this.teleportToSpawn();
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isSprinting = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keyState[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.isSprinting = false;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.renderer.domElement) {
      const factor = 0.0022 * this.mouseSensitivity;
      this.yaw -= e.movementX * factor;
      this.pitch -= e.movementY * factor;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  };

  // --- PUBLIC CONTROL APIS ---
  public setJoystickInput(x: number, y: number) {
    this.moveInput.x = x;
    this.moveInput.y = y;
  }

  public rotateCameraByTouch(deltaX: number, deltaY: number) {
    const factor = 0.0055 * this.mouseSensitivity;
    this.yaw -= deltaX * factor;
    this.pitch -= deltaY * factor;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
  }

  public jump() {
    if (this.isOnGround) {
      let jumpMult = 1.0;
      if (this.equippedSwordId === 'fire_greatsword') jumpMult *= 1.3;
      if (this.buffs.jumpTimeRemaining > 0) jumpMult *= this.buffs.jumpMultiplier;

      this.playerVel.y = 9.5 * jumpMult;
      this.isOnGround = false;
      this.triggerHaptic(12);
      soundEngine.playJumpSound();
      this.callbacks.onJump();
    }
  }

  public setSprinting(sprint: boolean) {
    this.isSprinting = sprint;
  }

  public toggleFlashlight(): boolean {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.intensity = this.isFlashlightOn ? 2.5 : 0;
    soundEngine.playFlashlightClick();
    return this.isFlashlightOn;
  }

  public toggleViewMode(): 'first_person' | 'third_person' {
    this.viewMode = this.viewMode === 'first_person' ? 'third_person' : 'first_person';
    return this.viewMode;
  }

  public setViewMode(mode: 'first_person' | 'third_person') {
    this.viewMode = mode;
  }

  public setCycleSpeed(mode: GameSettings['cycleSpeed']) {
    this.cycleSpeedMode = mode;
  }

  public setMouseSensitivity(val: number) {
    this.mouseSensitivity = val;
  }

  public setSensitivity(val: number) {
    this.mouseSensitivity = val;
  }

  public setFov(val: number) {
    this.baseFov = Math.max(50, Math.min(120, val));
  }

  public getFov(): number {
    return this.baseFov;
  }

  public getFlashlightState(): boolean {
    return this.isFlashlightOn;
  }

  public getViewMode(): 'first_person' | 'third_person' {
    return this.viewMode;
  }

  public getEquippedSwordId(): string | null {
    return this.equippedSwordId;
  }

  public isPlayerNearShop(): boolean {
    return this.isNearShop;
  }

  public isPlayerNearMultiplierShop(): boolean {
    return this.isNearMultiplierShop;
  }

  public getBuffs() {
    return { ...this.buffs };
  }

  public setEquippedSword(swordId: string | null) {
    this.equippedSwordId = swordId;

    // 1. Remove third person weapon if any
    if (this.tpSwordMesh && this.limbs) {
      this.limbs.rightArm.remove(this.tpSwordMesh);
      this.tpSwordMesh = null;
    }

    // 2. Remove first person weapon if any
    if (this.fpsWeaponHolder) {
      while (this.fpsWeaponHolder.children.length > 0) {
        this.fpsWeaponHolder.remove(this.fpsWeaponHolder.children[0]);
      }
    }

    if (swordId) {
      // Create TP mesh
      const tpMesh = this.createSwordMesh(swordId);
      tpMesh.position.set(0, -0.46, 0.12);
      tpMesh.rotation.set(Math.PI / 2, 0, 0);
      if (this.limbs) {
        this.limbs.rightArm.add(tpMesh);
      }
      this.tpSwordMesh = tpMesh;

      // Create FP mesh
      if (this.fpsWeaponHolder) {
        const fpMesh = this.createSwordMesh(swordId);
        fpMesh.scale.set(0.85, 0.85, 0.85);
        this.fpsWeaponHolder.add(fpMesh);
      }

      soundEngine.playEquipSound();
    }
  }

  public swingSword() {
    if (this.isSwingingSword) return;
    this.isSwingingSword = true;
    this.swingProgress = 0;

    const isLaser = this.equippedSwordId === 'neon_katana';
    soundEngine.playSwordSlashSound(isLaser);
    this.triggerHaptic(20);

    // Spawn sword slash sparks ahead of player
    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);
    const slashPos = this.playerPos.clone().add(new THREE.Vector3(0, 1.4, 0)).addScaledVector(lookDir, 1.6);
    this.spawnSwordSlashParticles(slashPos, isLaser ? 0x06b6d4 : 0xf59e0b);

    // Check hit against zombies
    const damage = this.equippedSwordId === 'neon_katana' ? 3 : this.equippedSwordId === 'fire_greatsword' ? 2 : 1;
    this.zombieSystem?.checkSwordHit(this.playerPos, lookDir, damage, this.currentWorld);
  }

  public spawnBonusCoin(pos: THREE.Vector3, type: 'gold' | 'gem') {
    const coinId = 300 + Math.floor(Math.random() * 10000);
    const coinGroup = new THREE.Group();
    coinGroup.position.copy(pos);

    const coinMat = new THREE.MeshStandardMaterial({
      color: type === 'gem' ? 0x06b6d4 : 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    });

    let mesh: THREE.Mesh;
    if (type === 'gem') {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), coinMat);
    } else {
      mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16), coinMat);
      mesh.rotation.x = Math.PI / 2;
    }
    mesh.castShadow = true;
    coinGroup.add(mesh);
    this.scene.add(coinGroup);

    this.coins.push({
      data: {
        id: coinId,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        collected: false,
        value: type === 'gem' ? 5 : 1,
        type,
      },
      mesh: coinGroup,
      light: null,
    });
  }

  public spawnSlashParticles(pos: THREE.Vector3, colorHex: number, count = 20) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 1.0,
        (Math.random() - 0.5) * 5
      );
      velocities.push(vel);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.8,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.particleSystems.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.7,
    });
  }

  public applyBuff(type: 'speed' | 'jump' | 'magnet', durationSec: number, multiplierOrRadius: number) {
    if (type === 'speed') {
      this.buffs.speedTimeRemaining = Math.max(this.buffs.speedTimeRemaining, durationSec);
      this.buffs.speedMultiplier = multiplierOrRadius;
    } else if (type === 'jump') {
      this.buffs.jumpTimeRemaining = Math.max(this.buffs.jumpTimeRemaining, durationSec);
      this.buffs.jumpMultiplier = multiplierOrRadius;
    } else if (type === 'magnet') {
      this.buffs.magnetTimeRemaining = Math.max(this.buffs.magnetTimeRemaining, durationSec);
      this.buffs.magnetRadius = multiplierOrRadius;
    }

    soundEngine.playDrinkPotionSound();
    this.triggerHaptic([30, 40, 30]);
  }

  public spawnSwordSlashParticles(pos: THREE.Vector3, colorHex: number) {
    const count = 18;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.4;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4 + 1.2,
        (Math.random() - 0.5) * 4
      );
      velocities.push(vel);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.75,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.particleSystems.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.35,
    });
  }

  public teleportToSpawn() {
    // Spawn effect at departing position
    this.spawnTeleportParticles(this.playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)));

    // Instantly reset player coordinates to Plaza Spawn
    this.playerPos.set(0, 1.2, 8);
    this.playerVel.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.isOnGround = true;

    // Spawn burst effect at arrival position
    this.spawnTeleportParticles(new THREE.Vector3(0, 1.2, 8));
    soundEngine.playTeleportSound();
    this.triggerHaptic([35, 45, 60]);
  }

  private spawnTeleportParticles(pos: THREE.Vector3) {
    const count = 40;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 0.3 + Math.random() * 0.8;
      positions[i * 3] = pos.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = pos.y + Math.random() * 1.8;
      positions[i * 3 + 2] = pos.z + Math.sin(angle) * radius;

      const vel = new THREE.Vector3(
        Math.cos(angle) * (1.5 + Math.random() * 2.0),
        Math.random() * 4.0 + 1.5,
        Math.sin(angle) * (1.5 + Math.random() * 2.0)
      );
      velocities.push(vel);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.85,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.particleSystems.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.85,
    });
  }

  public getNearestCoinDirection(): { angleDeg: number; distance: number } | null {
    let nearestDist = Infinity;
    let targetCoin: THREE.Vector3 | null = null;

    this.coins.forEach((c) => {
      if (!c.data.collected) {
        const d = this.playerPos.distanceTo(new THREE.Vector3(c.data.x, c.data.y, c.data.z));
        if (d < nearestDist) {
          nearestDist = d;
          targetCoin = new THREE.Vector3(c.data.x, c.data.y, c.data.z);
        }
      }
    });

    if (!targetCoin) return null;

    const dx = (targetCoin as THREE.Vector3).x - this.playerPos.x;
    const dz = (targetCoin as THREE.Vector3).z - this.playerPos.z;
    const coinAngle = Math.atan2(dx, dz);
    let relativeAngle = coinAngle - this.yaw;
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

    return {
      angleDeg: (relativeAngle * 180) / Math.PI,
      distance: Math.round(nearestDist),
    };
  }

  public resetAllCoins() {
    this.coins.forEach((c) => {
      c.data.collected = false;
      c.mesh.visible = true;
      if (c.light) c.light.intensity = 0.8;
    });
    this.collectedCount = 0;
    this.comboCount = 0;
  }

  // --- ANIMATION & PHYSICS LOOP ---
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private animate = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // 1. Update Day / Night progression
    this.updateTimeOfDay(dt);

    // 2. Buff Timers
    if (this.buffs.speedTimeRemaining > 0) {
      this.buffs.speedTimeRemaining = Math.max(0, this.buffs.speedTimeRemaining - dt);
    }
    if (this.buffs.jumpTimeRemaining > 0) {
      this.buffs.jumpTimeRemaining = Math.max(0, this.buffs.jumpTimeRemaining - dt);
    }
    if (this.buffs.magnetTimeRemaining > 0) {
      this.buffs.magnetTimeRemaining = Math.max(0, this.buffs.magnetTimeRemaining - dt);
    }
    this.callbacks.onBuffsUpdate?.({
      speedTimeRemaining: this.buffs.speedTimeRemaining,
      jumpTimeRemaining: this.buffs.jumpTimeRemaining,
      magnetTimeRemaining: this.buffs.magnetTimeRemaining,
    });

    // 3. Compute Input vector
    let moveX = this.moveInput.x;
    let moveY = this.moveInput.y;

    if (this.keyState['KeyW'] || this.keyState['ArrowUp']) moveY -= 1;
    if (this.keyState['KeyS'] || this.keyState['ArrowDown']) moveY += 1;
    if (this.keyState['KeyA'] || this.keyState['ArrowLeft']) moveX -= 1;
    if (this.keyState['KeyD'] || this.keyState['ArrowRight']) moveX += 1;

    const inputLen = Math.hypot(moveX, moveY);
    if (inputLen > 1) {
      moveX /= inputLen;
      moveY /= inputLen;
    }

    // 4. Compute Speed with Sword & Buff Bonuses
    let speedBonus = 1.0;
    if (this.equippedSwordId === 'wood_sword') speedBonus *= 1.15;
    if (this.equippedSwordId === 'neon_katana') speedBonus *= 1.35;
    if (this.equippedSwordId === 'fire_greatsword') speedBonus *= 1.5;
    if (this.buffs.speedTimeRemaining > 0) speedBonus *= this.buffs.speedMultiplier;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const speed = (this.isSprinting ? 12.5 : 7.8) * speedBonus;

    const targetVelX = (forward.x * -moveY + right.x * moveX) * speed;
    const targetVelZ = (forward.z * -moveY + right.z * moveX) * speed;

    this.playerVel.x = THREE.MathUtils.lerp(this.playerVel.x, targetVelX, 15 * dt);
    this.playerVel.z = THREE.MathUtils.lerp(this.playerVel.z, targetVelZ, 15 * dt);

    // Gravity
    this.playerVel.y -= 24 * dt;

    // Apply movement with axis separation for smooth wall sliding and solid hitbox collision
    const prevPos = this.playerPos.clone();
    const playerRadius = 0.55;
    const playerHeight = 1.8;

    // 1. Move X & Resolve Obstacle Hitboxes
    this.playerPos.x += this.playerVel.x * dt;
    const boxX = new THREE.Box3(
      new THREE.Vector3(this.playerPos.x - playerRadius, this.playerPos.y, prevPos.z - playerRadius),
      new THREE.Vector3(this.playerPos.x + playerRadius, this.playerPos.y + playerHeight, prevPos.z + playerRadius)
    );
    for (const col of this.colliders) {
      if (boxX.intersectsBox(col)) {
        if (this.playerPos.y + 0.35 < col.max.y) {
          this.playerPos.x = prevPos.x;
          this.playerVel.x = 0;
          break;
        }
      }
    }

    // 2. Move Z & Resolve Obstacle Hitboxes
    this.playerPos.z += this.playerVel.z * dt;
    const boxZ = new THREE.Box3(
      new THREE.Vector3(this.playerPos.x - playerRadius, this.playerPos.y, this.playerPos.z - playerRadius),
      new THREE.Vector3(this.playerPos.x + playerRadius, this.playerPos.y + playerHeight, this.playerPos.z + playerRadius)
    );
    for (const col of this.colliders) {
      if (boxZ.intersectsBox(col)) {
        if (this.playerPos.y + 0.35 < col.max.y) {
          this.playerPos.z = prevPos.z;
          this.playerVel.z = 0;
          break;
        }
      }
    }

    // 3. Perimeter Mountain & Boundary Constraint for current dimension
    if (this.currentWorld === 'main') {
      const distFromOrigin = Math.hypot(this.playerPos.x, this.playerPos.z);
      if (distFromOrigin > 144) {
        const angle = Math.atan2(this.playerPos.z, this.playerPos.x);
        this.playerPos.x = Math.cos(angle) * 144;
        this.playerPos.z = Math.sin(angle) * 144;
      }
    } else {
      const distFromCandy = Math.hypot(this.playerPos.x - 600, this.playerPos.z - 600);
      if (distFromCandy > 105) {
        const angle = Math.atan2(this.playerPos.z - 600, this.playerPos.x - 600);
        this.playerPos.x = 600 + Math.cos(angle) * 105;
        this.playerPos.z = 600 + Math.sin(angle) * 105;
      }
    }

    // 4. Move Y (Vertical)
    this.playerPos.y += this.playerVel.y * dt;

    // 5. Collision Detection with Platforms
    let landedOnPlatform = false;
    for (const plat of this.platforms) {
      if (
        this.playerPos.x >= plat.box.min.x - playerRadius &&
        this.playerPos.x <= plat.box.max.x + playerRadius &&
        this.playerPos.z >= plat.box.min.z - playerRadius &&
        this.playerPos.z <= plat.box.max.z + playerRadius
      ) {
        if (prevPos.y >= plat.topY - 0.25 && this.playerPos.y <= plat.topY + 0.15 && this.playerVel.y <= 0) {
          this.playerPos.y = plat.topY;
          this.playerVel.y = 0;
          this.isOnGround = true;
          landedOnPlatform = true;
          break;
        }
      }
    }

    // 6. Terrain Ground & Hill Surface Hitbox Resolution
    if (!landedOnPlatform) {
      const terrainGroundY = this.getTerrainHeight(this.playerPos.x, this.playerPos.z);
      if (this.playerPos.y <= terrainGroundY) {
        // Prevent walking straight through vertical cliffs / walls
        const stepDelta = terrainGroundY - prevPos.y;
        if (stepDelta > 1.2 && this.isOnGround) {
          this.playerPos.x = prevPos.x;
          this.playerPos.z = prevPos.z;
          this.playerPos.y = prevPos.y;
          this.playerVel.x = 0;
          this.playerVel.z = 0;
        } else {
          this.playerPos.y = terrainGroundY;
          this.playerVel.y = 0;
          this.isOnGround = true;
        }
      } else {
        this.isOnGround = false;
      }
    }

    // 6. Spring Trampoline Pads Check
    for (const spring of this.springPads) {
      const dist = Math.hypot(this.playerPos.x - spring.pos.x, this.playerPos.z - spring.pos.z);
      if (dist < spring.radius && Math.abs(this.playerPos.y - spring.topY) < 0.8) {
        this.playerVel.y = 19.5;
        this.isOnGround = false;
        this.triggerHaptic([20, 30, 20]);
        soundEngine.playSpringPadSound();
        this.callbacks.onSpring();

        spring.mesh.scale.set(1.2, 0.4, 1.2);
        setTimeout(() => spring.mesh.scale.set(1, 1, 1), 150);
        break;
      }
    }

    // 7. Check Shop Proximity & Animate Shops (Item Shop & Multiplier Shop)
    const activeShopPos = this.currentWorld === 'candy' ? this.candyShopPos : this.mainShopPos;
    const distToShop = this.playerPos.distanceTo(activeShopPos);
    const nearShop = distToShop < 4.2;
    if (nearShop !== this.isNearShop) {
      this.isNearShop = nearShop;
      this.callbacks.onNearShop?.(nearShop);
    }

    const activeMultiplierPos = this.currentWorld === 'candy' ? this.candyMultiplierShopPos : this.mainMultiplierShopPos;
    const distToMultiplier = this.playerPos.distanceTo(activeMultiplierPos);
    const nearMultiplier = distToMultiplier < 4.2;
    if (nearMultiplier !== this.isNearMultiplierShop) {
      this.isNearMultiplierShop = nearMultiplier;
      this.callbacks.onNearMultiplierShop?.(nearMultiplier);
    }

    const time = this.clock.getElapsedTime();
    this.shopkeepers.forEach((sk) => {
      const baseY = (sk.userData.baseY as number) || 0.35;
      sk.position.y = baseY + Math.sin(time * 2.5) * 0.03;
    });
    this.shopRuneRings.forEach((ring) => {
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(time * 3) * 0.25;
    });
    this.shopDisplayWeapons.forEach((disp) => {
      disp.rotation.y = time * 0.7;
    });
    this.multiplierHolograms.forEach((holo) => {
      const baseY = (holo.userData.baseY as number) || 2.1;
      holo.position.y = baseY + Math.sin(time * 3.2) * 0.1;
      holo.rotation.y = time * 1.6;
    });

    // 8. Speed Aura Particles
    if (this.speedAuraParticles) {
      const isBuffActive = this.buffs.speedTimeRemaining > 0;
      (this.speedAuraParticles.material as THREE.PointsMaterial).opacity = isBuffActive ? 0.8 : 0;
      if (isBuffActive) {
        this.speedAuraParticles.position.copy(this.playerPos);
        this.speedAuraParticles.rotation.y += 3.0 * dt;
      }
    }

    // 9. Footsteps Audio
    const horizontalSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    if (this.isOnGround && horizontalSpeed > 1.5) {
      this.footstepTimer += dt * (this.isSprinting ? 1.6 : 1.0);
      if (this.footstepTimer > 0.38) {
        this.footstepTimer = 0;
        soundEngine.playFootstep();
      }
    }

    // 10. Update Sword Swing State
    if (this.isSwingingSword) {
      this.swingProgress += dt * 6.5;
      if (this.swingProgress >= 1) {
        this.isSwingingSword = false;
        this.swingProgress = 0;
      }
    }

    // 11. Portal Energy Rings & Teleportation
    if (this.candyWorldElements) {
      this.candyWorldElements.mainPortal.ring.rotation.z += 2.2 * dt;
      this.candyWorldElements.candyPortal.ring.rotation.z += 2.2 * dt;

      if (this.portalCooldownTimer > 0) {
        this.portalCooldownTimer -= dt;
      } else {
        if (this.currentWorld === 'main') {
          const horizDist = Math.hypot(
            this.playerPos.x - this.candyWorldElements.mainPortal.pos.x,
            this.playerPos.z - this.candyWorldElements.mainPortal.pos.z
          );
          if (horizDist < 4.2 && Math.abs(this.playerPos.y - this.candyWorldElements.mainPortal.pos.y) < 6.0) {
            this.teleportToWorld('candy');
          }
        } else {
          const horizDist = Math.hypot(
            this.playerPos.x - this.candyWorldElements.candyPortal.pos.x,
            this.playerPos.z - this.candyWorldElements.candyPortal.pos.z
          );
          if (horizDist < 4.2 && Math.abs(this.playerPos.y - this.candyWorldElements.candyPortal.pos.y) < 6.0) {
            this.teleportToWorld('main');
          }
        }
      }
    }

    // 12. Update Zombies (AI, Pathing, Attack, Hit Feedback)
    this.zombieSystem?.update(dt, this.playerPos, this.currentWorld, (knockDir) => {
      this.playerVel.x = knockDir.x * 11;
      this.playerVel.z = knockDir.z * 11;
      this.playerVel.y = 5.2;
      this.isOnGround = false;
    });

    // 13. Stomp Check on Zombies
    if (this.playerVel.y < -0.5) {
      const stomped = this.zombieSystem?.checkPlayerStomp(this.playerPos, this.playerVel.y, this.currentWorld);
      if (stomped) {
        this.playerVel.y = 13.5;
        this.isOnGround = false;
        this.triggerHaptic([25, 40, 25]);
        soundEngine.playSpringPadSound();
      }
    }

    // 14. Update Coins (Rotation, Magnet Pull, Pickup)
    this.updateCoins(dt);

    // 15. Update Particles
    this.updateParticles(dt);

    // 16. Position Camera & Avatar
    this.updateCameraAndAvatar(dt, horizontalSpeed);

    // 17. Render Frame
    this.renderer.render(this.scene, this.camera);

    // 18. FPS Tracking
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.callbacks.onFpsUpdate?.(fps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  };

  public teleportToWorld(target: WorldDimension) {
    this.currentWorld = target;
    this.portalCooldownTimer = 2.8;

    soundEngine.playPortalTeleportSound();
    this.triggerHaptic([30, 60, 40, 80]);

    if (target === 'candy') {
      this.playerPos.set(600, 1.2, 608);
      this.playerVel.set(0, 0, 0);
      this.yaw = Math.PI; // Face towards candy forest
      this.pitch = 0;
      this.isOnGround = true;

      // Sweet candy atmosphere
      this.scene.background = new THREE.Color(0xfbcfe8);
      this.scene.fog = new THREE.FogExp2(0xfbcfe8, 0.0032);
      this.sunLight.color.setHex(0xffedd5);
      this.sunMesh.material = new THREE.MeshBasicMaterial({ color: 0xfde047 });

      this.callbacks.onWorldChange?.('candy');
      this.spawnSlashParticles(this.playerPos.clone(), 0xf43f5e, 45);
    } else {
      const groundH = this.getTerrainHeight(18, -12);
      this.playerPos.set(18, groundH + 1.2, -12);
      this.playerVel.set(0, 0, 0);
      this.yaw = 0;
      this.pitch = 0;
      this.isOnGround = true;

      // Restore Main World atmosphere
      this.scene.background = new THREE.Color(0x87ceeb);
      this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0038);
      this.sunLight.color.setHex(0xfffaed);
      this.sunMesh.material = new THREE.MeshBasicMaterial({ color: 0xffea78 });

      this.callbacks.onWorldChange?.('main');
      this.spawnSlashParticles(this.playerPos.clone(), 0x38bdf8, 45);
    }
  }

  public getCurrentWorld(): WorldDimension {
    return this.currentWorld;
  }

  private updateCoins(dt: number) {
    const time = this.clock.getElapsedTime();

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    const collectRadius = 1.6;
    const isMagnetActive = this.buffs.magnetTimeRemaining > 0;
    const magnetRadius = this.buffs.magnetRadius;

    this.coins.forEach((c) => {
      if (c.data.collected) return;

      // Magnet Pull toward player!
      if (isMagnetActive) {
        const d = this.playerPos.distanceTo(c.mesh.position);
        if (d < magnetRadius) {
          const dir = this.playerPos.clone().sub(c.mesh.position).normalize();
          c.mesh.position.addScaledVector(dir, Math.min(22 * dt, d));
        }
      }

      // Spin & Bob
      c.mesh.rotation.y += (c.data.type === 'star' ? 2.5 : 1.8) * dt;
      c.mesh.position.y = c.data.y + Math.sin(time * 3 + c.data.id) * 0.15;

      // Check pickup
      const dist = this.playerPos.distanceTo(c.mesh.position);
      if (dist < collectRadius) {
        c.data.collected = true;
        c.mesh.visible = false;
        if (c.light) c.light.intensity = 0;

        this.comboCount++;
        this.comboTimer = 3.0;
        this.collectedCount++;

        this.triggerHaptic(15);
        soundEngine.playCoinSound(this.comboCount);
        this.spawnCoinSparkles(c.mesh.position, c.data.type);

        const remaining = this.coins.filter((coin) => !coin.data.collected).length;
        this.callbacks.onCoinCollected(c.data, remaining, this.coins.length, this.comboCount);

        if (remaining === 0) {
          this.triggerHaptic([40, 50, 40, 50, 80]);
          soundEngine.playVictoryFanfare();
          this.callbacks.onVictory();
        }
      }
    });
  }

  private spawnCoinSparkles(pos: THREE.Vector3, type: CoinData['type']) {
    const count = type === 'star' ? 40 : 20;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    const color = type === 'gem' ? 0x06b6d4 : type === 'star' ? 0xf59e0b : 0xffd700;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1.5,
        (Math.random() - 0.5) * 6
      );
      velocities.push(vel);
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size: 0.9,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geom, mat);
    this.scene.add(points);

    this.particleSystems.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.8,
    });
  }

  private updateParticles(dt: number) {
    for (let p = this.particleSystems.length - 1; p >= 0; p--) {
      const ps = this.particleSystems[p];
      ps.age += dt;
      const progress = ps.age / ps.maxAge;

      if (progress >= 1.0) {
        this.scene.remove(ps.points);
        ps.points.geometry.dispose();
        (ps.points.material as THREE.Material).dispose();
        this.particleSystems.splice(p, 1);
        continue;
      }

      const posAttr = ps.points.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < ps.velocities.length; i++) {
        const vel = ps.velocities[i];
        vel.y -= 9.8 * dt;
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + vel.x * dt,
          posAttr.getY(i) + vel.y * dt,
          posAttr.getZ(i) + vel.z * dt
        );
      }
      posAttr.needsUpdate = true;
      (ps.points.material as THREE.PointsMaterial).opacity = 1.0 - progress;
    }

    // Fireflies
    if (this.firefliesParticles) {
      const time = this.clock.getElapsedTime();
      const posAttr = this.firefliesParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        posAttr.setY(i, posAttr.getY(i) + Math.sin(time * 2 + i) * 0.008);
      }
      posAttr.needsUpdate = true;
    }
  }

  private updateCameraAndAvatar(dt: number, horizontalSpeed: number) {
    const eyeHeight = 1.7;
    const playerEyePos = new THREE.Vector3(this.playerPos.x, this.playerPos.y + eyeHeight, this.playerPos.z);

    // Sword swing angles
    const swingAngle = this.isSwingingSword ? Math.sin(this.swingProgress * Math.PI) : 0;

    // Avatar animation & human kinematics
    if (this.limbs) {
      const time = this.clock.getElapsedTime();

      if (this.isOnGround) {
        if (horizontalSpeed > 0.4) {
          // Running / Walking animation
          const stepSpeed = this.isSprinting ? 14 : 9;
          this.walkCycle += dt * stepSpeed;

          const legSwing = Math.sin(this.walkCycle) * (this.isSprinting ? 0.75 : 0.55);
          const armSwing = -Math.sin(this.walkCycle) * (this.isSprinting ? 0.65 : 0.45);

          this.limbs.leftLeg.rotation.x = legSwing;
          this.limbs.rightLeg.rotation.x = -legSwing;
          this.limbs.leftLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.leftLeg.rotation.z, 0, 8 * dt);
          this.limbs.rightLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.rightLeg.rotation.z, 0, 8 * dt);

          this.limbs.leftArm.rotation.x = armSwing;
          this.limbs.leftArm.rotation.z = 0.08;

          if (!this.isSwingingSword) {
            this.limbs.rightArm.rotation.x = -armSwing;
            this.limbs.rightArm.rotation.y = THREE.MathUtils.lerp(this.limbs.rightArm.rotation.y, 0, 10 * dt);
            this.limbs.rightArm.rotation.z = -0.08;
          }

          // Human Spine & Torso tilt + stride bounce
          const bounce = Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
          this.limbs.torso.position.y = 0.82 + bounce;
          this.limbs.torso.rotation.x = this.isSprinting ? 0.14 : 0.06;
          this.limbs.torso.rotation.y = THREE.MathUtils.lerp(this.limbs.torso.rotation.y, -Math.sin(this.walkCycle) * 0.08, 10 * dt);
          this.limbs.torso.rotation.z = Math.sin(this.walkCycle) * 0.04;

          this.limbs.head.position.y = 1.38 + bounce;
          this.limbs.head.rotation.x = this.isSprinting ? -0.05 : 0;
          this.limbs.head.rotation.y = THREE.MathUtils.lerp(this.limbs.head.rotation.y, 0, 8 * dt);

          // Hero Scarf trailing wind flutter
          if (this.limbs.cape) {
            const windAngle = (this.isSprinting ? 0.70 : 0.40) + Math.sin(time * 12) * 0.12;
            this.limbs.cape.rotation.x = THREE.MathUtils.lerp(this.limbs.cape.rotation.x, windAngle, 10 * dt);
          }
        } else {
          // Idle breathing and alive natural human stance
          const breathe = Math.sin(time * 2.4) * 0.022;
          const subtleShift = Math.sin(time * 0.9);

          // Torso breathing expansion & natural chest heave
          this.limbs.torso.scale.set(1 + breathe * 0.9, 1 + breathe * 0.5, 1 + breathe * 0.9);
          this.limbs.torso.position.y = THREE.MathUtils.lerp(this.limbs.torso.position.y, 0.82 + breathe * 1.1, 10 * dt);
          this.limbs.torso.rotation.x = THREE.MathUtils.lerp(this.limbs.torso.rotation.x, breathe * 0.4, 8 * dt);
          this.limbs.torso.rotation.y = THREE.MathUtils.lerp(this.limbs.torso.rotation.y, subtleShift * 0.02, 6 * dt);
          this.limbs.torso.rotation.z = THREE.MathUtils.lerp(this.limbs.torso.rotation.z, subtleShift * 0.015, 6 * dt);

          // Head natural breathing and curious micro-glances
          this.limbs.head.position.y = THREE.MathUtils.lerp(this.limbs.head.position.y, 1.38 + breathe * 1.3, 10 * dt);
          this.limbs.head.rotation.x = Math.sin(time * 1.6) * 0.025 - breathe * 0.3;
          this.limbs.head.rotation.y = THREE.MathUtils.lerp(this.limbs.head.rotation.y, Math.sin(time * 0.7) * 0.07 + Math.sin(time * 0.25) * 0.04, 6 * dt);

          // Leg weight shift
          this.limbs.leftLeg.rotation.x = THREE.MathUtils.lerp(this.limbs.leftLeg.rotation.x, subtleShift * 0.015, 8 * dt);
          this.limbs.rightLeg.rotation.x = THREE.MathUtils.lerp(this.limbs.rightLeg.rotation.x, -subtleShift * 0.015, 8 * dt);
          this.limbs.leftLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.leftLeg.rotation.z, 0, 8 * dt);
          this.limbs.rightLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.rightLeg.rotation.z, 0, 8 * dt);

          // Arms relaxed posture following breath
          this.limbs.leftArm.rotation.x = THREE.MathUtils.lerp(this.limbs.leftArm.rotation.x, breathe * 0.5, 8 * dt);
          this.limbs.leftArm.rotation.z = 0.08 + Math.sin(time * 2.4) * 0.025;

          if (!this.isSwingingSword) {
            this.limbs.rightArm.rotation.x = THREE.MathUtils.lerp(this.limbs.rightArm.rotation.x, breathe * 0.5, 8 * dt);
            this.limbs.rightArm.rotation.y = THREE.MathUtils.lerp(this.limbs.rightArm.rotation.y, 0, 8 * dt);
            this.limbs.rightArm.rotation.z = -0.08 - Math.sin(time * 2.4) * 0.025;
          }

          if (this.limbs.cape) {
            this.limbs.cape.rotation.x = THREE.MathUtils.lerp(this.limbs.cape.rotation.x, 0.15 + Math.sin(time * 2.5) * 0.06, 6 * dt);
          }
        }
      } else {
        // Airborne / Jumping pose: legs tuck back, arms spread for balance
        this.limbs.leftLeg.rotation.x = THREE.MathUtils.lerp(this.limbs.leftLeg.rotation.x, -0.45, 12 * dt);
        this.limbs.rightLeg.rotation.x = THREE.MathUtils.lerp(this.limbs.rightLeg.rotation.x, -0.30, 12 * dt);
        this.limbs.leftLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.leftLeg.rotation.z, -0.15, 12 * dt);
        this.limbs.rightLeg.rotation.z = THREE.MathUtils.lerp(this.limbs.rightLeg.rotation.z, 0.15, 12 * dt);

        this.limbs.leftArm.rotation.x = THREE.MathUtils.lerp(this.limbs.leftArm.rotation.x, -0.6, 12 * dt);
        this.limbs.leftArm.rotation.z = THREE.MathUtils.lerp(this.limbs.leftArm.rotation.z, 0.45, 12 * dt);

        if (!this.isSwingingSword) {
          this.limbs.rightArm.rotation.x = THREE.MathUtils.lerp(this.limbs.rightArm.rotation.x, -0.5, 12 * dt);
          this.limbs.rightArm.rotation.z = THREE.MathUtils.lerp(this.limbs.rightArm.rotation.z, -0.4, 12 * dt);
        }

        this.limbs.torso.rotation.x = THREE.MathUtils.lerp(this.limbs.torso.rotation.x, -0.10, 10 * dt);
        this.limbs.head.rotation.x = THREE.MathUtils.lerp(this.limbs.head.rotation.x, 0.15, 10 * dt);

        if (this.limbs.cape) {
          this.limbs.cape.rotation.x = THREE.MathUtils.lerp(this.limbs.cape.rotation.x, 0.85 + Math.sin(time * 16) * 0.15, 12 * dt);
        }
      }

      // Sword Swing attack animation (heroic martial slash)
      if (this.isSwingingSword) {
        this.limbs.rightArm.rotation.x = -Math.PI / 2 - swingAngle * 1.5;
        this.limbs.rightArm.rotation.y = swingAngle * 0.6;
        this.limbs.rightArm.rotation.z = -swingAngle * 0.8;
        this.limbs.torso.rotation.y = swingAngle * 0.35;
      }
    }

    // First person weapon swing animation
    if (this.fpsWeaponHolder) {
      if (this.isSwingingSword) {
        this.fpsWeaponHolder.rotation.set(
          0.2 - swingAngle * 1.4,
          -0.3 + swingAngle * 0.9,
          0.1 - swingAngle * 1.2
        );
      } else {
        this.fpsWeaponHolder.rotation.set(0.2, -0.3, 0.1);
      }
    }

    // Dynamic FOV (Sprint & Speed Buff smooth zoom expansion)
    const isSpeedActive = this.buffs.speedTimeRemaining > 0;
    const isMovingFast = horizontalSpeed > 3.0;
    const sprintBonus = (this.isSprinting && isMovingFast) ? 6 : 0;
    const buffBonus = isSpeedActive ? 4 : 0;
    const targetFov = this.baseFov + sprintBonus + buffBonus;

    this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, 6.0 * dt);
    if (Math.abs(this.camera.fov - this.currentFov) > 0.03) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // Avatar Transform (faces forward in movement & camera direction)
    this.playerMesh.position.copy(this.playerPos);
    this.playerMesh.rotation.y = this.yaw + Math.PI;

    if (this.viewMode === 'first_person') {
      this.playerMesh.visible = false;
      this.camera.position.copy(playerEyePos);
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    } else {
      this.playerMesh.visible = true;
      const camDist = 5.2;
      const camHeight = 1.45;

      const backX = Math.sin(this.yaw) * Math.cos(this.pitch) * camDist;
      const backZ = Math.cos(this.yaw) * Math.cos(this.pitch) * camDist;
      const backY = Math.sin(-this.pitch) * camDist + camHeight;

      this.camera.position.set(
        this.playerPos.x + backX,
        Math.max(this.playerPos.y + backY, 0.5),
        this.playerPos.z + backZ
      );
      this.camera.lookAt(playerEyePos);
    }

    // Flashlight sync
    if (this.isFlashlightOn) {
      this.flashlight.position.copy(playerEyePos);
      const lookDir = new THREE.Vector3();
      this.camera.getWorldDirection(lookDir);
      this.flashlightTarget.position.copy(playerEyePos).add(lookDir.multiplyScalar(10));
    }
  }

  // --- CLEANUP ---
  public destroy() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);

    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
