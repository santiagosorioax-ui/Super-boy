import * as THREE from 'three';

/**
 * TextureSynthesizer
 * Generates ultra-fast, high-resolution procedural PBR textures (Diffuse, Normal, Roughness)
 * in pure HTML Canvas at zero bandwidth cost and zero network latency.
 * Cached as singletons to ensure maximum rendering performance and zero GPU memory waste.
 */
export class TextureSynthesizer {
  private static grassTexture: THREE.CanvasTexture | null = null;
  private static grassNormal: THREE.CanvasTexture | null = null;
  private static grassRoughness: THREE.CanvasTexture | null = null;

  private static rockTexture: THREE.CanvasTexture | null = null;
  private static rockNormal: THREE.CanvasTexture | null = null;

  private static cobblestoneTexture: THREE.CanvasTexture | null = null;
  private static cobblestoneNormal: THREE.CanvasTexture | null = null;

  private static woodBarkTexture: THREE.CanvasTexture | null = null;
  private static woodBarkNormal: THREE.CanvasTexture | null = null;

  private static woodPlankTexture: THREE.CanvasTexture | null = null;
  private static woodPlankNormal: THREE.CanvasTexture | null = null;

  private static waterNormal: THREE.CanvasTexture | null = null;
  private static candyGlazeNormal: THREE.CanvasTexture | null = null;
  private static chocoCarvedNormal: THREE.CanvasTexture | null = null;
  private static mayanStoneTexture: THREE.CanvasTexture | null = null;
  private static mayanStoneNormal: THREE.CanvasTexture | null = null;
  private static currentAnisotropy = 4;

  /**
   * Set texture anisotropic filtering across all synthesised textures
   */
  public static setAnisotropy(level: number) {
    this.currentAnisotropy = Math.max(1, Math.min(16, level));
    const allTextures = [
      this.grassTexture,
      this.grassNormal,
      this.grassRoughness,
      this.rockTexture,
      this.rockNormal,
      this.cobblestoneTexture,
      this.cobblestoneNormal,
      this.woodBarkTexture,
      this.woodBarkNormal,
      this.woodPlankTexture,
      this.woodPlankNormal,
      this.mayanStoneTexture,
      this.mayanStoneNormal,
    ];
    allTextures.forEach((t) => {
      if (t) {
        t.anisotropy = this.currentAnisotropy;
        t.needsUpdate = true;
      }
    });
  }

  /**
   * Grass Diffuse Texture (512x512 multi-frequency organic blade distribution)
   */
  public static getGrassTexture(): THREE.CanvasTexture {
    if (this.grassTexture) return this.grassTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base emerald meadow fill
      ctx.fillStyle = '#3a8738';
      ctx.fillRect(0, 0, size, size);

      // Micro-texture noise pass
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;

      // Deterministic PRNG for stable textures
      let seed = 1337;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < data.length; i += 4) {
        const noise = (rnd() - 0.5) * 38;
        const patch = Math.sin((i / 4 / size) * 0.08) * Math.cos(((i / 4) % size) * 0.08) * 16;
        data[i] = Math.max(35, Math.min(85, 58 + noise + patch)); // R (deep earthy green)
        data[i + 1] = Math.max(90, Math.min(185, 142 + noise + patch * 1.2)); // G (lush blade green)
        data[i + 2] = Math.max(30, Math.min(80, 52 + noise * 0.8)); // B
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // Fine grass blade strokes for crisp up-close realism
      ctx.strokeStyle = 'rgba(110, 205, 95, 0.28)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let j = 0; j < 650; j++) {
        const x = rnd() * size;
        const y = rnd() * size;
        const len = 3 + rnd() * 6;
        const angle = -Math.PI / 2 + (rnd() - 0.5) * 0.8;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      }
      ctx.stroke();

      // Earth / clover micro flecks
      ctx.fillStyle = 'rgba(40, 75, 30, 0.35)';
      for (let k = 0; k < 280; k++) {
        const cx = rnd() * size;
        const cy = rnd() * size;
        const cr = 0.8 + rnd() * 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 40);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.grassTexture = tex;
    return tex;
  }

  /**
   * Grass Tangent-Space Normal Map (Bumpy blade relief)
   */
  public static getGrassNormal(): THREE.CanvasTexture {
    if (this.grassNormal) return this.grassNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;
      let seed = 4242;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < data.length; i += 4) {
        const nx = 128 + (rnd() - 0.5) * 36;
        const ny = 128 + (rnd() - 0.5) * 36;
        data[i] = Math.round(nx);
        data[i + 1] = Math.round(ny);
        data[i + 2] = 245; // Blue channel points up
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 40);
    this.grassNormal = tex;
    return tex;
  }

  /**
   * Weathered Slate / Granite Rock Texture (512x512)
   */
  public static getRockTexture(): THREE.CanvasTexture {
    if (this.rockTexture) return this.rockTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, size, size);

      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      let seed = 9876;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % size;
        const y = Math.floor(i / 4 / size);
        // Strata veins
        const vein = Math.sin(y * 0.05 + Math.cos(x * 0.03) * 3) * 22;
        const grain = (rnd() - 0.5) * 30;
        const base = Math.max(70, Math.min(160, 115 + vein + grain));

        data[i] = Math.round(base * 0.95);
        data[i + 1] = Math.round(base * 1.0);
        data[i + 2] = Math.round(base * 1.08);
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // Quartz streaks
      ctx.strokeStyle = 'rgba(230, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 18; s++) {
        ctx.beginPath();
        const startX = rnd() * size;
        const startY = rnd() * size;
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(
          startX + (rnd() - 0.5) * 90,
          startY + (rnd() - 0.5) * 60,
          startX + (rnd() - 0.5) * 120,
          startY + (rnd() - 0.5) * 120,
          startX + (rnd() - 0.5) * 160,
          startY + (rnd() - 0.5) * 160
        );
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.rockTexture = tex;
    return tex;
  }

  /**
   * Rock Normal Map (Faceted stone crevices)
   */
  public static getRockNormal(): THREE.CanvasTexture {
    if (this.rockNormal) return this.rockNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          const slopeX = Math.sin(x * 0.12 + y * 0.04) * 40;
          const slopeY = Math.cos(y * 0.12 - x * 0.04) * 40;
          data[idx] = Math.max(0, Math.min(255, 128 + slopeX));
          data[idx + 1] = Math.max(0, Math.min(255, 128 + slopeY));
          data[idx + 2] = 230;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    this.rockNormal = tex;
    return tex;
  }

  /**
   * Cobblestone Plaza Paving (Rounded stones with recessed mortar)
   */
  public static getCobblestoneTexture(): THREE.CanvasTexture {
    if (this.cobblestoneTexture) return this.cobblestoneTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Dark mortar background
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, size, size);

      const rows = 12;
      const cols = 12;
      const cellW = size / cols;
      const cellH = size / rows;

      let seed = 555;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2 === 0) ? 0 : cellW * 0.5;
        for (let c = -1; c <= cols; c++) {
          const cx = c * cellW + offset + (rnd() - 0.5) * 4;
          const cy = r * cellH + (rnd() - 0.5) * 4;
          const stoneW = cellW * 0.88;
          const stoneH = cellH * 0.84;

          const stoneTone = 145 + Math.round((rnd() - 0.5) * 35);
          ctx.fillStyle = `rgb(${stoneTone - 8}, ${stoneTone}, ${stoneTone + 10})`;

          // Rounded stone block
          ctx.beginPath();
          ctx.roundRect(cx + 2, cy + 2, stoneW, stoneH, 5);
          ctx.fill();

          // Highlight top bevel
          ctx.strokeStyle = `rgba(255, 255, 255, 0.22)`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.cobblestoneTexture = tex;
    return tex;
  }

  /**
   * Cobblestone Tangent-Space Normal Map
   */
  public static getCobblestoneNormal(): THREE.CanvasTexture {
    if (this.cobblestoneNormal) return this.cobblestoneNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Neutral normal map
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, size, size);

      const rows = 12;
      const cols = 12;
      const cellW = size / cols;
      const cellH = size / rows;

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2 === 0) ? 0 : cellW * 0.5;
        for (let c = -1; c <= cols; c++) {
          const cx = c * cellW + offset;
          const cy = r * cellH;
          const grad = ctx.createRadialGradient(
            cx + cellW * 0.5, cy + cellH * 0.5, 2,
            cx + cellW * 0.5, cy + cellH * 0.5, cellW * 0.46
          );
          grad.addColorStop(0, '#8080ff');
          grad.addColorStop(0.7, '#8888ee');
          grad.addColorStop(1, '#6666bb');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(cx + 2, cy + 2, cellW * 0.86, cellH * 0.84, 4);
          ctx.fill();
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.cobblestoneNormal = tex;
    return tex;
  }

  /**
   * Wood Bark Texture (256x512 vertical organic grain)
   */
  public static getWoodBarkTexture(): THREE.CanvasTexture {
    if (this.woodBarkTexture) return this.woodBarkTexture;

    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#4a2c17';
      ctx.fillRect(0, 0, w, h);

      let seed = 3131;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      // Vertical bark grooves
      ctx.lineWidth = 2.0;
      for (let g = 0; g < 48; g++) {
        const x = (g / 48) * w + (rnd() - 0.5) * 4;
        ctx.strokeStyle = (g % 2 === 0) ? 'rgba(30, 15, 8, 0.45)' : 'rgba(105, 68, 38, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (rnd() - 0.5) * 12, h * 0.33, x + (rnd() - 0.5) * 12, h * 0.66, x, h);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.woodBarkTexture = tex;
    return tex;
  }

  /**
   * Wood Plank Deck Texture for Bridges & Watchtowers
   */
  public static getWoodPlankTexture(): THREE.CanvasTexture {
    if (this.woodPlankTexture) return this.woodPlankTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#2b1810';
      ctx.fillRect(0, 0, size, size);

      const planks = 8;
      const plankH = size / planks;

      let seed = 771;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let p = 0; p < planks; p++) {
        const y = p * plankH;
        const tone = 110 + Math.round((rnd() - 0.5) * 24);
        ctx.fillStyle = `rgb(${tone}, ${Math.round(tone * 0.62)}, ${Math.round(tone * 0.32)})`;
        ctx.fillRect(0, y + 2, size, plankH - 4);

        // Wood grain streaks
        ctx.strokeStyle = 'rgba(40, 20, 10, 0.3)';
        ctx.lineWidth = 1.0;
        for (let s = 0; s < 6; s++) {
          const gy = y + 4 + s * (plankH / 7);
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(size, gy + (rnd() - 0.5) * 3);
          ctx.stroke();
        }

        // Nail studs
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(16, y + plankH * 0.5, 2.5, 0, Math.PI * 2);
        ctx.arc(size - 16, y + plankH * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.woodPlankTexture = tex;
    return tex;
  }

  /**
   * Flowing Dynamic Water Tangent Normal Map (256x256 sinusoidal wave ripples)
   */
  public static getWaterNormal(): THREE.CanvasTexture {
    if (this.waterNormal) return this.waterNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          // Dual wave interference
          const u = (x / size) * Math.PI * 4;
          const v = (y / size) * Math.PI * 4;

          const waveX = Math.sin(u) * 0.6 + Math.sin(u * 2.3 + v * 1.2) * 0.4;
          const waveY = Math.cos(v) * 0.6 + Math.cos(v * 2.1 - u * 1.5) * 0.4;

          data[idx] = Math.round(128 + waveX * 65);
          data[idx + 1] = Math.round(128 + waveY * 65);
          data[idx + 2] = 240;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 4);
    this.waterNormal = tex;
    return tex;
  }

  /**
   * Sugar Glaze / Candy Crystal Tangent Normal Map
   */
  public static getCandyGlazeNormal(): THREE.CanvasTexture {
    if (this.candyGlazeNormal) return this.candyGlazeNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const imgData = ctx.createImageData(size, size);
      const data = imgData.data;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = (y * size + x) * 4;
          // Swirl spiral relief
          const dx = x - 128;
          const dy = y - 128;
          const r = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const swirl = Math.sin(r * 0.25 - angle * 4) * 40;

          data[idx] = Math.round(128 + swirl);
          data[idx + 1] = Math.round(128 + Math.cos(r * 0.25) * 35);
          data[idx + 2] = 235;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.candyGlazeNormal = tex;
    return tex;
  }

  /**
   * Choco Temple Aztec / Mayan Glyph Carved Relief Normal Map
   */
  public static getChocoCarvedNormal(): THREE.CanvasTexture {
    if (this.chocoCarvedNormal) return this.chocoCarvedNormal;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, size, size);

      // Geometric stepped glyph relief
      ctx.strokeStyle = '#9999ee';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, size - 32, size - 32);
      ctx.strokeRect(48, 48, size - 96, size - 96);

      ctx.fillStyle = '#6666bb';
      ctx.fillRect(80, 80, size - 160, size - 160);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.chocoCarvedNormal = tex;
    return tex;
  }

  /**
   * Ancient Mayan Carved Limestone Diffuse Texture
   */
  public static getMayanStoneTexture(): THREE.CanvasTexture {
    if (this.mayanStoneTexture) return this.mayanStoneTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base Mesoamerican weathered limestone
      ctx.fillStyle = '#b8b1a4';
      ctx.fillRect(0, 0, size, size);

      // Micro noise for ancient weathered porous surface
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      let seed = 91823;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      for (let i = 0; i < data.length; i += 4) {
        const noise = (rnd() - 0.5) * 36;
        data[i] = Math.max(90, Math.min(210, 184 + noise));
        data[i + 1] = Math.max(85, Math.min(200, 176 + noise * 0.9));
        data[i + 2] = Math.max(75, Math.min(190, 164 + noise * 0.8));
        data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);

      // Ancient stone block division lines
      ctx.strokeStyle = 'rgba(60, 50, 42, 0.45)';
      ctx.lineWidth = 3;
      for (let y = 0; y < size; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();

        const offset = (y % 128 === 0) ? 0 : 32;
        for (let x = offset; x < size; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 64);
          ctx.stroke();
        }
      }

      // Moss & lichen stains on ancient crevices
      ctx.fillStyle = 'rgba(74, 110, 52, 0.22)';
      for (let j = 0; j < 40; j++) {
        const mx = rnd() * size;
        const my = rnd() * size;
        const mr = 4 + rnd() * 12;
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.anisotropy = this.currentAnisotropy;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.mayanStoneTexture = tex;
    return tex;
  }

  /**
   * Ancient Mayan Stone Block Relief Normal Map
   */
  public static getMayanStoneNormal(): THREE.CanvasTexture {
    if (this.mayanStoneNormal) return this.mayanStoneNormal;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#8080ff';
      ctx.fillRect(0, 0, size, size);

      // Deep carved mortar grooves
      ctx.fillStyle = '#5555bb';
      for (let y = 0; y < size; y += 64) {
        ctx.fillRect(0, y - 2, size, 4);

        const offset = (y % 128 === 0) ? 0 : 32;
        for (let x = offset; x < size; x += 64) {
          ctx.fillRect(x - 2, y, 4, 64);
        }
      }

      // Embossed bevel highlights on block edges
      ctx.fillStyle = '#aaaaff';
      for (let y = 0; y < size; y += 64) {
        ctx.fillRect(0, y + 2, size, 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.anisotropy = this.currentAnisotropy;
    this.mayanStoneNormal = tex;
    return tex;
  }
}
