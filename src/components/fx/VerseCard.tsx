"use client";

import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Pause, Play } from "lucide-react";
import VerseComposition, { VERSE_FPS, verseDuration, type VerseProps } from "./VerseComposition";

/**
 * The weekly scripture as a short, looping film. The verse is also written out in plain text for screen readers,
 * the animation pauses when it scrolls out of view, and it can be paused by hand or is still for reduced motion.
 */
export default function VerseCard({ text, reference, photos }: VerseProps) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerRef>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [calm, setCalm] = useState(false);

  useEffect(() => {
    setCalm(matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const frames = verseDuration(photos.length);
  const holding = paused || calm || !inView;
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    if (calm) {
      p.seekTo(Math.min(frames - 20, 110));
      p.pause();
    } else if (holding) p.pause();
    else p.play();
  }, [holding, calm, frames, near]);

  return (
    <figure className="m-0">
      <div ref={box} className="relative aspect-[4/3] w-full overflow-hidden bg-purple-deep">
        {near && (
          <div aria-hidden className="absolute inset-0">
            <Player
              ref={player}
              component={VerseComposition}
              inputProps={{ text, reference, photos }}
              durationInFrames={frames}
              fps={VERSE_FPS}
              compositionWidth={1200}
              compositionHeight={900}
              style={{ width: "100%", height: "100%" }}
              loop
              autoPlay={!calm}
              controls={false}
              initiallyMuted
              clickToPlay={false}
              numberOfSharedAudioTags={0}
              acknowledgeRemotionLicense
            />
          </div>
        )}
        {!calm && (
          <button type="button" onClick={() => setPaused((v) => !v)} aria-pressed={paused} className="absolute bottom-3 right-3 inline-flex min-h-11 items-center gap-2 bg-ink/75 px-4 text-[0.9rem] font-semibold text-paper hover:bg-ink">
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            {paused ? "Play" : "Pause"}
            <span className="sr-only"> the animated verse</span>
          </button>
        )}
      </div>
      <figcaption className="sr-only">“{text}” {reference}</figcaption>
    </figure>
  );
}
