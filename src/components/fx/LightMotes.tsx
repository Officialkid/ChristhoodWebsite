"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Dust drifting in a beam of light, like a sanctuary in the late afternoon.
 * Small hard-edged specks at different depths rise slowly and lean toward the pointer.
 * Decorative only: it sits behind the words, takes no clicks and is not drawn at all
 * for anyone who prefers reduced motion or whose device cannot spare the power.
 */
function Motes({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const camera = useThree((s) => s.camera);

  const { positions, speeds, texture } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = (Math.random() - 0.5) * 9;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8;
      s[i] = 0.12 + Math.random() * 0.34;
    }
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(16, 16, 12, 0, Math.PI * 2);
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { positions: p, speeds: s, texture: t };
  }, [count]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / innerWidth - 0.5) * 2;
      pointer.current.ty = -(e.clientY / innerHeight - 0.5) * 2;
    };
    addEventListener("pointermove", onMove, { passive: true });
    return () => removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const pts = points.current;
    if (!pts) return;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
      arr[i * 3] += Math.sin(t * 0.3 + i) * 0.04 * delta;
      if (arr[i * 3 + 1] > 4.6) arr[i * 3 + 1] = -4.6;
    }
    attr.needsUpdate = true;
    const p = pointer.current;
    p.x += (p.tx - p.x) * 0.04;
    p.y += (p.ty - p.y) * 0.04;
    camera.position.x = p.x * 0.7;
    camera.position.y = p.y * 0.4;
    camera.lookAt(0, 0, 0);
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial map={texture} color="#fff3c4" size={0.055} sizeAttenuation transparent opacity={0.5} depthWrite={false} alphaTest={0.2} />
    </points>
  );
}

export default function LightMotes({ count = 320 }: { count?: number }) {
  const [slow, setSlow] = useState(false);
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 50 }} gl={{ antialias: false, alpha: true, powerPreference: "low-power" }} frameloop="always" style={{ pointerEvents: "none" }}>
      {/* If the device struggles, draw fewer specks at a lower sharpness instead of stuttering. */}
      <PerformanceMonitor onDecline={() => setSlow(true)} />
      <AdaptiveDpr pixelated />
      <Motes count={slow ? Math.round(count / 3) : count} />
    </Canvas>
  );
}
