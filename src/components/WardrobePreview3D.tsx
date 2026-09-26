import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlayerCustomization } from '../types';
import { createCustomAvatar, AvatarInstance } from '../game/AvatarCustomizer';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface WardrobePreview3DProps {
  customization: PlayerCustomization;
}

export const WardrobePreview3D: React.FC<WardrobePreview3DProps> = ({ customization }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<AvatarInstance | null>(null);
  const rotationYRef = useRef<number>(0);
  const targetRotationYRef = useRef<number>(0);
  const zoomRef = useRef<number>(3.2);
  const targetZoomRef = useRef<number>(3.2);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 1.1, zoomRef.current);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    keyLight.position.set(2.5, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-3, 3, -2.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf59e0b, 0.7);
    fillLight.position.set(0, -1, 2);
    scene.add(fillLight);

    // 4. Stylized Studio Turntable Pedestal
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3,
      metalness: 0.7,
    });
    const pedestalRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 32), pedestalMat);
    pedestal.position.set(0, -0.06, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.025, 8, 32), pedestalRingMat);
    ring.position.set(0, 0, 0);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 5. Create Avatar with Initial Customization
    const avatar = createCustomAvatar(customization);
    avatarRef.current = avatar;
    scene.add(avatar.group);

    // 6. Animation Loop with Idle Breathing
    let animationFrameId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += delta;

      // Smooth Rotation Lerp
      rotationYRef.current = THREE.MathUtils.lerp(rotationYRef.current, targetRotationYRef.current, 0.15);
      avatar.group.rotation.y = rotationYRef.current;

      // Smooth Camera Zoom Lerp
      zoomRef.current = THREE.MathUtils.lerp(zoomRef.current, targetZoomRef.current, 0.15);
      camera.position.z = zoomRef.current;
      camera.lookAt(0, 0.95, 0);

      // Subtle Idle Breathing
      const breathe = Math.sin(elapsed * 2.2) * 0.015;
      avatar.limbs.torso.position.y = 0.82 + breathe;
      avatar.limbs.head.position.y = 1.38 + breathe * 1.3;
      avatar.limbs.leftArm.rotation.x = breathe * 0.4;
      avatar.limbs.rightArm.rotation.x = -breathe * 0.4;

      if (avatar.limbs.cape) {
        avatar.limbs.cape.rotation.x = 0.25 + Math.sin(elapsed * 3) * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Avatar When Customization Prop Changes
  useEffect(() => {
    if (avatarRef.current) {
      avatarRef.current.updateCustomization(customization);
    }
  }, [customization]);

  // Touch & Mouse Drag Handlers for 360° Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    targetRotationYRef.current += deltaX * 0.018;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }
  };

  const handleRotate = (dir: 'left' | 'right') => {
    targetRotationYRef.current += dir === 'left' ? -Math.PI / 3 : Math.PI / 3;
  };

  const handleZoom = (dir: 'in' | 'out') => {
    targetZoomRef.current = Math.max(2.1, Math.min(4.2, targetZoomRef.current + (dir === 'in' ? -0.4 : 0.4)));
  };

  const handleResetView = () => {
    targetRotationYRef.current = 0;
    targetZoomRef.current = 3.2;
  };

  return (
    <div
      id="wardrobe-3d-preview"
      className="relative w-full h-[320px] sm:h-[400px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-slate-700/60 shadow-2xl flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic Background Light Burst */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-sky-500/5 to-transparent pointer-events-none" />

      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none z-10"
        title="Arrastra para rotar 360°"
      />

      {/* Top Floating Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>{customization.gender === 'girl' ? 'Super Girl' : 'Super Boy'}</span>
      </div>

      {/* Interactive Controls Overlay (Rotate, Zoom, Reset) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 shadow-xl">
        <button
          type="button"
          onClick={() => handleRotate('left')}
          title="Girar a la izquierda"
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleRotate('right')}
          title="Girar a la derecha"
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => handleZoom('in')}
          title="Acercar cámara"
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom('out')}
          title="Alejar cámara"
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetView}
          title="Restablecer vista"
          className="px-2 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold transition active:scale-95"
        >
          Reset
        </button>
      </div>

      {/* Drag Helper Tip */}
      <div className="absolute top-3 right-3 z-20 hidden sm:block text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded-lg pointer-events-none backdrop-blur-sm">
        Arrastra para girar 360°
      </div>
    </div>
  );
};
