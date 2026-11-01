"use client";

import { useEffect, useRef } from "react";

/**
 * Scroll reveals. GSAP is loaded only when something is about to come into view, so it never slows the first screen.
 * The hidden starting state is set by script too, so without scripts (or with reduced motion) everything simply shows.
 */
function useReveal(ref: React.RefObject<HTMLElement | null>, from: (el: HTMLElement) => void, play: (gsap: typeof import("gsap").gsap, el: HTMLElement) => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    from(el);
    let done = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done) return;
        done = true;
        io.disconnect();
        void import("gsap").then(({ gsap }) => play(gsap, el));
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- set up once per element
  }, []);
}

/** A picture that is uncovered from the top as it scrolls into view, settling from a slight zoom. */
export function Wipe({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(
    ref,
    (el) => {
      el.style.clipPath = "inset(0 0 100% 0)";
      const img = el.querySelector("img");
      if (img) img.style.transform = "scale(1.12)";
    },
    (gsap, el) => {
      gsap.to(el, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut", onComplete: () => { el.style.clipPath = ""; } });
      const img = el.querySelector("img");
      if (img) gsap.to(img, { scale: 1, duration: 1.6, ease: "power3.out", onComplete: () => { img.style.transform = ""; } });
    },
  );
  return <div ref={ref} className={className}>{children}</div>;
}

/** Children rise in one after another as the list scrolls into view. */
export function Stagger({ children, className = "", selector = ":scope > *" }: { children: React.ReactNode; className?: string; selector?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(
    ref,
    (el) => el.querySelectorAll<HTMLElement>(selector).forEach((c) => { c.style.opacity = "0"; c.style.transform = "translateY(28px)"; }),
    (gsap, el) => {
      const items = el.querySelectorAll(selector);
      gsap.to(items, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.09, clearProps: "opacity,transform,y" });
    },
  );
  return <div ref={ref} className={className}>{children}</div>;
}
