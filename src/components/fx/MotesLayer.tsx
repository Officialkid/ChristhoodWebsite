"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LightMotes = dynamic(() => import("./LightMotes"), { ssr: false });

/** Decides whether the dust effect is welcome here, then loads it after the page is already usable. */
export default function MotesLayer() {
  const box = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [visible, setVisible] = useState(true);
  const [count, setCount] = useState(320);

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
    if (calm) return;
    try {
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;
    } catch {
      return;
    }
    setCount(innerWidth < 700 ? 140 : 320);
    const start = () => setOn(true);
    const idle = typeof window.requestIdleCallback === "function";
    const id = idle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => (idle ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);

  // Stop drawing when the hero is off screen or the tab is hidden.
  useEffect(() => {
    const el = box.current;
    if (!el || !on) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [on]);

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
      {on && visible && <LightMotes count={count} />}
    </div>
  );
}
