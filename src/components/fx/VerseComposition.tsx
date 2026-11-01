"use client";

import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Rect } from "@remotion/shapes";
import { noise2D } from "@remotion/noise";

export type VerseProps = { text: string; reference: string; photos: string[] };

export const VERSE_FPS = 30;
const SCENE = 150;
const FADE = 30;
export const verseDuration = (photos: number) => Math.max(1, photos) * SCENE - (Math.max(1, photos) - 1) * FADE;

/** A slow, steady push in with a little drift, different for each picture. */
function Photo({ src, seed }: { src: string; seed: number }) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, SCENE + FADE], [1.04, 1.13], { easing: Easing.inOut(Easing.quad), extrapolateRight: "clamp" });
  const x = noise2D(`x${seed}`, frame / 140, 0) * 26;
  const y = noise2D(`y${seed}`, 0, frame / 140) * 18;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#2d0f5a" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${x}px, ${y}px) scale(${scale})` }} />
    </AbsoluteFill>
  );
}

/** The verse, one word at a time, then the reference under a gold rule. */
export default function VerseComposition({ text, reference, photos }: VerseProps) {
  const frame = useCurrentFrame();
  const list = photos.length ? photos : [""];
  const total = verseDuration(list.length);
  const words = text.trim().split(/\s+/);
  const size = text.length > 220 ? 46 : text.length > 130 ? 56 : 68;
  const startAt = 14;
  const step = Math.min(5, Math.max(2, Math.floor(110 / words.length)));
  const lastIn = startAt + words.length * step + 16;
  const rule = interpolate(frame, [lastIn, lastIn + 22], [0, 120], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const refOpacity = interpolate(frame, [lastIn + 8, lastIn + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // A soft fade at both ends so the loop never jumps.
  const edge = interpolate(frame, [0, 10, total - 14, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#2d0f5a", opacity: edge }}>
      <TransitionSeries>
        {list.flatMap((src, i) => {
          const scene = (
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={SCENE}>
              <Photo src={src} seed={i} />
            </TransitionSeries.Sequence>
          );
          return i < list.length - 1 ? [scene, <TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />] : [scene];
        })}
      </TransitionSeries>
      <AbsoluteFill style={{ background: "rgba(24, 8, 46, 0.58)" }} />
      <AbsoluteFill style={{ padding: "0 90px", justifyContent: "center" }}>
        <p style={{ margin: 0, color: "#fbf8fd", fontFamily: "var(--font-literata), Georgia, serif", fontSize: size, lineHeight: 1.22, fontWeight: 500, textWrap: "balance" }}>
          {words.map((w, i) => {
            const s = startAt + i * step;
            const o = interpolate(frame, [s, s + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const y = interpolate(frame, [s, s + 14], [22, 0], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span key={i} style={{ display: "inline-block", opacity: o, transform: `translateY(${y}px)`, marginRight: "0.28em" }}>{w}</span>
            );
          })}
        </p>
        <div style={{ marginTop: 40 }}>
          <Rect width={rule} height={4} fill="#f2d45c" />
          <p style={{ margin: "18px 0 0", opacity: refOpacity, color: "#f2d45c", fontFamily: "var(--font-archivo), Arial, sans-serif", fontWeight: 700, fontSize: 34 }}>{reference}</p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
