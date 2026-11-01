/**
 * A headline that rises into place one word at a time. Pure CSS, so the words are painted straight away
 * (nothing waits for scripts) and the effect is skipped for anyone who prefers reduced motion.
 */
export default function WordReveal({ as: Tag = "h1", className = "", children }: { as?: "h1" | "h2"; className?: string; children: string }) {
  const words = children.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} aria-label={children}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden className="word-mask">
          <span className="word-rise" style={{ ["--i" as string]: i } as React.CSSProperties}>{w}</span>{" "}
        </span>
      ))}
    </Tag>
  );
}
