import Reveal from "./Reveal";
import PhotoGallery from "./PhotoGallery";
import { Section } from "./ui";
import type { Block } from "@/lib/types";

type Statement = Extract<Block, { type: "statement" }>;
type Group = { kind: "statements"; items: Statement[] } | { kind: "block"; block: Exclude<Block, Statement> };

/** Statements that sit next to each other (vision and mission) read better together. */
function group(blocks: Block[]): Group[] {
  const out: Group[] = [];
  for (const b of blocks) {
    if (b.type === "statement") {
      const last = out[out.length - 1];
      if (last?.kind === "statements") last.items.push(b);
      else out.push({ kind: "statements", items: [b] });
    } else out.push({ kind: "block", block: b });
  }
  return out;
}

/** Heading on the left, the content on the right. The shared shape of most sections. */
function Split({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
      <header className="lg:sticky lg:top-28 lg:self-start">
        <h2 className="t-h2">{title}</h2>
        {intro && <p className="reading mt-5 text-muted">{intro}</p>}
      </header>
      <div>{children}</div>
    </div>
  );
}

export default function Blocks({ blocks }: { blocks: Block[] }) {
  let alt = false;
  return (
    <>
      {group(blocks).map((g, gi) => {
        if (g.kind === "statements") {
          return (
            <Section key={gi} tone="purple">
              <div className={`grid gap-12 ${g.items.length > 1 ? "lg:grid-cols-2 lg:gap-20" : "max-w-4xl"}`}>
                {g.items.map((s) => (
                  <Reveal key={s.label}>
                    <p className="text-[0.95rem] font-bold text-gold">{s.label}</p>
                    <p className="mt-3 font-serif text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.35]">{s.text}</p>
                  </Reveal>
                ))}
              </div>
            </Section>
          );
        }
        const b = g.block;
        switch (b.type) {
          case "cards": {
            alt = !alt;
            return (
              <Section key={gi} tone={alt ? "paper" : "alt"}>
                <Split title={b.title} intro={b.intro}>
                  <ol className="border-t border-rule">
                    {b.items.map((c, i) => (
                      <Reveal as="li" key={c.title} className="grid gap-x-6 gap-y-2 border-b border-rule py-7 sm:grid-cols-[3rem_1fr]">
                        <span aria-hidden className="text-[0.95rem] font-bold text-purple">{b.numbered ? String(i + 1).padStart(2, "0") : ""}</span>
                        <div>
                          <h3 className="text-[1.3rem]">{c.title}</h3>
                          {c.text && <p className="reading mt-2 text-muted">{c.text}</p>}
                          {c.bullets && <ul className="mt-3 grid gap-1.5">{c.bullets.map((x) => <li key={x} className="reading flex gap-3 text-ink"><span aria-hidden className="select-none text-purple">–</span>{x}</li>)}</ul>}
                        </div>
                      </Reveal>
                    ))}
                  </ol>
                </Split>
              </Section>
            );
          }
          case "list":
            alt = !alt;
            return (
              <Section key={gi} tone={alt ? "paper" : "alt"}>
                <Split title={b.title} intro={b.intro}>
                  <ul className="border-t border-rule">{b.items.map((it) => <li key={it} className="reading border-b border-rule py-4 text-ink">{it}</li>)}</ul>
                </Split>
              </Section>
            );
          case "prose":
            alt = !alt;
            return (
              <Section key={gi} tone={alt ? "paper" : "alt"}>
                <Split title={b.title ?? ""} >
                  <div className="grid gap-5 text-muted">{b.paragraphs.map((p) => <p key={p.slice(0, 24)} className="reading">{p}</p>)}</div>
                </Split>
              </Section>
            );
          case "quote":
            return (
              <Section key={gi} tone="alt">
                <Reveal className="mx-auto max-w-3xl">
                  <blockquote className="font-serif text-[clamp(1.5rem,2.8vw,2.3rem)] italic leading-[1.35]">{b.text}</blockquote>
                  {b.cite && <p className="mt-5 font-semibold text-purple">{b.cite}</p>}
                </Reveal>
              </Section>
            );
          case "gallery":
            return (
              <Section key={gi} tone="paper" tight>
                <h2 className="mb-6 text-2xl">{b.title}</h2>
                <PhotoGallery title={b.title} photos={b.photos} />
              </Section>
            );
        }
      })}
    </>
  );
}
