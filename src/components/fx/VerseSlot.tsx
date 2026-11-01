"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { VerseProps } from "./VerseComposition";

const VerseCard = dynamic(() => import("./VerseCard"), { ssr: false });

/** Holds the place of the verse film and only fetches the video engine when it is about to be seen. */
export default function VerseSlot(props: VerseProps) {
  const box = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLoad(true), { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={box}>
      {load ? <VerseCard {...props} /> : (
        <figure className="m-0">
          <div className="aspect-[4/3] w-full bg-purple-deep" />
          <figcaption className="sr-only">“{props.text}” {props.reference}</figcaption>
        </figure>
      )}
    </div>
  );
}
