"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const motionOk = "(prefers-reduced-motion: no-preference)";

/** The page headline, revealed line by line as it appears. The words are real text from the start, so nothing is lost without scripts. */
export function SplitHeading({ as: Tag = "h1", className = "", style, children }: { as?: "h1" | "h2"; className?: string; style?: React.CSSProperties; children: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(motionOk, () => {
        let split: SplitText | undefined;
        document.fonts.ready.then(() => {
          split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line" });
          gsap.from(split.lines, { yPercent: 105, duration: 1, ease: "expo.out", stagger: 0.12, delay: 0.1 });
          gsap.set(el, { opacity: 1 });
        });
        return () => split?.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as never} className={`split-hide ${className}`} style={style}>
      {children}
    </Tag>
  );
}

/** A picture that is uncovered from the top as it scrolls into view. Still for anyone who prefers reduced motion. */
export function Wipe({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(motionOk, () => {
        gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        const img = el.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return <div ref={ref} className={className}>{children}</div>;
}

/** Children rise in one after another as the list scrolls into view. */
export function Stagger({ children, className = "", selector = ":scope > *" }: { children: React.ReactNode; className?: string; selector?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(motionOk, () => {
        gsap.from(el.querySelectorAll(selector), { y: 28, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return <div ref={ref} className={className}>{children}</div>;
}
