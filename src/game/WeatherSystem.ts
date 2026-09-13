import * as THREE from 'three';
import { WeatherState, WeatherType } from '../types';
import { soundEngine } from '../audio/soundEngine';

export interface WeatherCallbacks {
  onWeatherChange?: (state: WeatherState) => void;
  onToast?: (message: string) => void;
}

export interface WeatherPhysics {
  frictionFactor: number; // 1.0 normal, 0.35 in rain (slippery ground)
  accelerationFactor: number; // 1.0 normal, 0.65 in rain
  speedFactor: number; // 1.0 normal, 0.9 in dense fog
  windForce: THREE.Vector3; // Physical push vector applied to player
  isSlippery: boolean;
}

export class WeatherSystem {
  private scene: THREE.Scene;
  private callbacks: WeatherCallbacks;

  // Current & Target State
  private currentWeather: WeatherType = 'clear';
  private weatherTimer = 55; // Countdown until next weather shift (seconds)
  private currentTotalDuration = 55;
  private transitionTimer = 0;
  private readonly transitionDuration = 3.0; // 3 seconds smooth transition

  // Atmospheric values
  private currentRainIntensity = 0; // 0 to 1
  private targetRainIntensity = 0;
  private currentFogDensity = 0.0038;
  private targetFogDensity = 0.0038;
  private currentWindSpeed = 2.0; // m/s
  private targetWindSpeed = 2.0;
  private windDirection = new THREE.Vector2(0.707, -0.707); // Normalized X/Z

  // 3D Particle Systems
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;
  private rainCount = 2200;

  private windParticles: THREE.Points | null = null;
  private windPositions: Float32Array | null = null;
  private windCount = 450;

  // Lightning & Sound Effects
  private lightningCountdown = 14;
  private isLightningFlashing = false;
  private lightningLight: THREE.DirectionalLight | null = null;
  private audioTickTimer = 0;

  constructor(scene: THREE.Scene, callbacks: WeatherCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    this.initRainSystem();
    this.initWindSystem();
    this.initLightningLight();

    // Start with a pleasant initial weather (clear or random)
    this.weatherTimer = 60 + Math.random() * 30;
    this.currentTotalDuration = this.weatherTimer;
  }

  // --- 1. INITIALIZE RAIN 3D PARTICLE SYSTEM ---
  private initRainSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 70; // +/- 35m X
      positions[i * 3 + 1] = Math.random() * 30; // 0 to 30m Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70; // +/- 35m Z
      velocities[i] = 24 + Math.random() * 12; // Falling speed
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainPositions = positions;
    this.rainVelocities = velocities;

    const material = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.frustumCulled = false;
    this.scene.add(this.rainParticles);
  }

  // --- 2. INITIALIZE WIND 3D PARTICLE SYSTEM (Leaves & Dust wisps) ---
  private initWindSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.windCount * 3);
    const colors = new Float32Array(this.windCount * 3);

    const leafPalettes = [
      new THREE.Color(0x84cc16), // Lime leaf
      new THREE.Color(0xa3e635), // Bright green leaf
      new THREE.Color(0xeab308), // Golden leaf
      new THREE.Color(0xf97316), // Orange leaf
      new THREE.Color(0xe2e8f0), // Dust/air streak
    ];

    for (let i = 0; i < this.windCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = 0.5 + Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const col = leafPalettes[Math.floor(Math.random() * leafPalettes.length)];
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.windPositions = positions;

    const material = new THREE.PointsMaterial({
      size: 0.26,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.windParticles = new THREE.Points(geometry, material);
    this.windParticles.frustumCulled = false;
    this.scene.add(this.windParticles);
  }

  // --- 3. LIGHTNING LIGHT ---
  private initLightningLight() {
    this.lightningLight = new THREE.DirectionalLight(0xe0f2fe, 0);
    this.lightningLight.position.set(20, 90, 20);
    this.scene.add(this.lightningLight);
  }

  // --- 4. WEATHER TRANSITIONS & RANDOM SELECTION ---
  public setWeather(type: WeatherType, announce = true) {
    if (this.currentWeather === type) return;

    this.currentWeather = type;
    this.transitionTimer = 0;

    // Set duration based on weather type (45 to 85 seconds)
    const durations: Record<WeatherType, number> = {
      clear: 65 + Math.random() * 25,
      rain: 50 + Math.random() * 20,
      fog: 45 + Math.random() * 20,
      wind: 50 + Math.random() * 25,
    };
    this.weatherTimer = durations[type];
    this.currentTotalDuration = this.weatherTimer;

    // Randomize wind direction on each weather change
    const angle = Math.random() * Math.PI * 2;
    this.windDirection.set(Math.cos(angle), Math.sin(angle)).normalize();

    // Configure targets
    switch (type) {
      case 'clear':
        this.targetRainIntensity = 0;
        this.targetFogDensity = 0.0038;
        this.targetWindSpeed = 2.0;
        break;
      case 'rain':
        this.targetRainIntensity = 0.95;
        this.targetFogDensity = 0.0085;
        this.targetWindSpeed = 6.5;
        this.lightningCountdown = 8 + Math.random() * 12;
        break;
      case 'fog':
        this.targetRainIntensity = 0;
        this.targetFogDensity = 0.026; // Dense misty fog
        this.targetWindSpeed = 1.5;
        break;
      case 'wind':
        this.targetRainIntensity = 0;
        this.targetFogDensity = 0.0048;
        this.targetWindSpeed = 14.5; // Strong howling wind gusts
        break;
    }

    const state = this.getWeatherState();
    this.callbacks.onWeatherChange?.(state);

    if (announce) {
      this.announceWeather(type);
    }
  }

  private announceWeather(type: WeatherType) {
    switch (type) {
      case 'clear':
        this.callbacks.onToast?.('☀️ ¡El clima se ha despejado! El sol brilla sobre el valle.');
        break;
      case 'rain':
        this.callbacks.onToast?.('🌧️ ¡Ha comenzado a llover! El suelo está mojado y resbaladizo.');
        soundEngine.playRainAmbience(0.9);
        break;
      case 'fog':
        this.callbacks.onToast?.('🌫️ ¡Densa neblina cubre el entorno! La visibilidad ha disminuido.');
        break;
      case 'wind':
        this.callbacks.onToast?.('💨 ¡Fuertes ráfagas de viento! Te empujan con fuerza al caminar.');
        soundEngine.playWindGust(1.2);
        break;
    }
  }

  private pickNextRandomWeather() {
    const pool: WeatherType[] = ['clear', 'rain', 'fog', 'wind'];
    // Avoid repeating the exact same weather consecutively
    const candidates = pool.filter((w) => w !== this.currentWeather);
    // Weighted probabilities
    const rand = Math.random();
    let next: WeatherType = 'clear';
    if (this.currentWeather !== 'clear' && rand < 0.45) {
      next = 'clear';
    } else if (rand < 0.35 && candidates.includes('rain')) {
      next = 'rain';
    } else if (rand < 0.65 && candidates.includes('wind')) {
      next = 'wind';
    } else if (candidates.includes('fog')) {
      next = 'fog';
    } else {
      next = candidates[Math.floor(Math.random() * candidates.length)];
    }

    this.setWeather(next, true);
  }

  // --- 5. PER-FRAME UPDATE LOOP ---
  public update(dt: number, playerPos: THREE.Vector3, isPlayerGrounded: boolean) {
    // 1. Weather timer countdown
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.pickNextRandomWeather();
    }

    // 2. Smooth atmospheric transitions
    if (this.transitionTimer < this.transitionDuration) {
      this.transitionTimer += dt;
      const t = Math.min(1, this.transitionTimer / this.transitionDuration);
      this.currentRainIntensity = THREE.MathUtils.lerp(this.currentRainIntensity, this.targetRainIntensity, t * 0.25);
      this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, this.targetFogDensity, t * 0.25);
      this.currentWindSpeed = THREE.MathUtils.lerp(this.currentWindSpeed, this.targetWindSpeed, t * 0.25);
    } else {
      this.currentRainIntensity = this.targetRainIntensity;
      this.currentFogDensity = this.targetFogDensity;
      this.currentWindSpeed = this.targetWindSpeed;
    }

    // 3. Update Rain Particle Mesh around player
    if (this.rainParticles && this.rainPositions && this.rainVelocities) {
      const mat = this.rainParticles.material as THREE.PointsMaterial;
      const targetOpacity = Math.max(0, Math.min(0.75, this.currentRainIntensity * 0.75));
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 6 * dt);
      mat.visible = mat.opacity > 0.01;

      if (mat.visible) {
        const pArray = this.rainPositions;
        const vArray = this.rainVelocities;
        const windX = this.windDirection.x * this.currentWindSpeed * 0.25;
        const windZ = this.windDirection.y * this.currentWindSpeed * 0.25;

        for (let i = 0; i < this.rainCount; i++) {
          const idx = i * 3;
          // Fall downwards
          pArray[idx + 1] -= vArray[i] * dt;
          // Wind slant
          pArray[idx + 0] += windX * dt;
          pArray[idx + 2] += windZ * dt;

          // Wrap vertically below ground or player
          if (pArray[idx + 1] < playerPos.y - 2.5) {
            pArray[idx + 1] = playerPos.y + 22 + Math.random() * 6;
            pArray[idx + 0] = playerPos.x + (Math.random() - 0.5) * 65;
            pArray[idx + 2] = playerPos.z + (Math.random() - 0.5) * 65;
          }

          // Wrap horizontally if too far from player
          if (Math.abs(pArray[idx + 0] - playerPos.x) > 35) {
            pArray[idx + 0] = playerPos.x + (Math.random() - 0.5) * 60;
          }
          if (Math.abs(pArray[idx + 2] - playerPos.z) > 35) {
            pArray[idx + 2] = playerPos.z + (Math.random() - 0.5) * 60;
          }
        }

        const posAttr = this.rainParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
        posAttr.needsUpdate = true;
      }
    }

    // 4. Update Wind Particles (Leaves & Dust)
    if (this.windParticles && this.windPositions) {
      const mat = this.windParticles.material as THREE.PointsMaterial;
      const isWindActive = this.currentWeather === 'wind';
      const targetOpacity = isWindActive ? 0.85 : 0.15;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 5 * dt);
      mat.visible = mat.opacity > 0.01;

      if (mat.visible) {
        const pArray = this.windPositions;
        const speed = this.currentWindSpeed;
        const dirX = this.windDirection.x;
        const dirZ = this.windDirection.y;

        for (let i = 0; i < this.windCount; i++) {
          const idx = i * 3;
          pArray[idx + 0] += dirX * speed * dt;
          pArray[idx + 2] += dirZ * speed * dt;
          // Slight vertical flutter
          pArray[idx + 1] += Math.sin(i + dt * 4) * 0.4 * dt;

          // Wrap relative to player
          const dx = pArray[idx + 0] - playerPos.x;
          const dz = pArray[idx + 2] - playerPos.z;
          if (Math.hypot(dx, dz) > 42) {
            pArray[idx + 0] = playerPos.x - dirX * 38 + (Math.random() - 0.5) * 25;
            pArray[idx + 2] = playerPos.z - dirZ * 38 + (Math.random() - 0.5) * 25;
            pArray[idx + 1] = Math.max(playerPos.y + 0.5, playerPos.y + Math.random() * 12);
          }
        }

        const posAttr = this.windParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
        posAttr.needsUpdate = true;
      }
    }

    // 5. Lightning in Rain
    if (this.currentWeather === 'rain' && this.currentRainIntensity > 0.4) {
      this.lightningCountdown -= dt;
      if (this.lightningCountdown <= 0) {
        this.triggerLightningFlash(playerPos);
        this.lightningCountdown = 12 + Math.random() * 18;
      }
    }

    // 6. Periodic Audio Ambience (Rain drops or Wind gusts)
    this.audioTickTimer += dt;
    if (this.audioTickTimer > 2.8) {
      this.audioTickTimer = 0;
      if (this.currentWeather === 'rain' && this.currentRainIntensity > 0.2) {
        soundEngine.playRainAmbience(this.currentRainIntensity);
      } else if (this.currentWeather === 'wind') {
        soundEngine.playWindGust(0.8 + Math.random() * 0.5);
      }
    }
  }

  // Trigger occasional lightning flash and distant thunder
  private triggerLightningFlash(playerPos: THREE.Vector3) {
    if (!this.lightningLight || this.isLightningFlashing) return;
    this.isLightningFlashing = true;

    this.lightningLight.position.set(playerPos.x + 15, playerPos.y + 80, playerPos.z + 15);
    this.lightningLight.intensity = 3.5;

    // Thunder boom sound
    setTimeout(() => {
      soundEngine.playThunder();
    }, 400);

    // Rapid double flash
    setTimeout(() => {
      if (this.lightningLight) this.lightningLight.intensity = 0.5;
      setTimeout(() => {
        if (this.lightningLight) this.lightningLight.intensity = 2.8;
        setTimeout(() => {
          if (this.lightningLight) this.lightningLight.intensity = 0;
          this.isLightningFlashing = false;
        }, 80);
      }, 70);
    }, 90);
  }

  // --- 6. PHYSICS INFLUENCE ON PLAYER ---
  public getPhysics(playerPos: THREE.Vector3, isOnGround: boolean): WeatherPhysics {
    let frictionFactor = 1.0;
    let accelerationFactor = 1.0;
    let speedFactor = 1.0;
    const windForce = new THREE.Vector3(0, 0, 0);

    switch (this.currentWeather) {
      case 'rain':
        // Wet, slippery surface
        frictionFactor = 0.38; // Much lower deceleration/stopping grip -> sliding effect!
        accelerationFactor = 0.65;
        speedFactor = 0.96;
        break;

      case 'fog':
        // Damp, cautious atmosphere with reduced visibility
        frictionFactor = 0.95;
        accelerationFactor = 0.95;
        speedFactor = 0.88; // Slightly slower stride in thick mist
        break;

      case 'wind': {
        // Strong gusts push the player!
        const forceMagnitude = this.currentWindSpeed * 0.48;
        windForce.x = this.windDirection.x * forceMagnitude;
        windForce.z = this.windDirection.y * forceMagnitude;
        // In air, wind carries player with extra momentum
        if (!isOnGround) {
          windForce.multiplyScalar(1.4);
        }
        speedFactor = 1.0;
        break;
      }

      case 'clear':
      default:
        frictionFactor = 1.0;
        accelerationFactor = 1.0;
        speedFactor = 1.0;
        break;
    }

    return {
      frictionFactor,
      accelerationFactor,
      speedFactor,
      windForce,
      isSlippery: this.currentWeather === 'rain',
    };
  }

  // Atmospheric Fog & Sky influence getters
  public getFogDensity(): number {
    return this.currentFogDensity;
  }

  public getRainIntensity(): number {
    return this.currentRainIntensity;
  }

  public getWeatherType(): WeatherType {
    return this.currentWeather;
  }

  public getWeatherState(): WeatherState {
    const descriptions: Record<WeatherType, { name: string; desc: string }> = {
      clear: {
        name: 'Despejado',
        desc: 'Cielo claro y soleado. Condiciones ideales de movimiento.',
      },
      rain: {
        name: 'Lluvia',
        desc: 'Gotas de lluvia y suelo mojado. ¡Mayor inercia y deslizamiento!',
      },
      fog: {
        name: 'Neblina Densa',
        desc: 'Niebla espesa en el horizonte. Visibilidad reducida.',
      },
      wind: {
        name: 'Viento Fuerte',
        desc: 'Ráfagas intensas empujan al jugador en dirección del viento.',
      },
    };

    const info = descriptions[this.currentWeather];
    return {
      type: this.currentWeather,
      displayName: info.name,
      description: info.desc,
      durationRemaining: Math.max(0, Math.round(this.weatherTimer)),
      totalDuration: Math.round(this.currentTotalDuration),
      windDirection: { x: this.windDirection.x, z: this.windDirection.y },
      windSpeed: Math.round(this.currentWindSpeed),
      rainIntensity: this.currentRainIntensity,
      fogDensity: this.currentFogDensity,
      isSlippery: this.currentWeather === 'rain',
    };
  }

  public dispose() {
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles.geometry.dispose();
      (this.rainParticles.material as THREE.Material).dispose();
      this.rainParticles = null;
    }
    if (this.windParticles) {
      this.scene.remove(this.windParticles);
      this.windParticles.geometry.dispose();
      (this.windParticles.material as THREE.Material).dispose();
      this.windParticles = null;
    }
    if (this.lightningLight) {
      this.scene.remove(this.lightningLight);
      this.lightningLight = null;
    }
  }
}
