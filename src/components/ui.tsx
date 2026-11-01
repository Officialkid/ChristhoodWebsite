import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  /** gold: the one main action on a screen. outline: a second action. text: a quiet link. */
  variant?: "gold" | "outline" | "outline-light" | "purple" | "text";
  external?: boolean;
  className?: string;
  arrow?: boolean;
};

const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-sm px-6 text-[0.95rem] font-semibold transition-colors duration-200";
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  gold: "bg-gold text-ink hover:bg-gold-hover",
  purple: "bg-purple text-on-purple hover:bg-purple-deep",
  outline: "border border-ink/35 text-ink hover:border-ink hover:bg-ink hover:text-paper",
  "outline-light": "border border-on-purple/50 text-on-purple hover:border-on-purple hover:bg-on-purple hover:text-purple-deep",
  text: "min-h-11 px-0 text-purple underline decoration-purple/40 decoration-1 underline-offset-[6px] hover:decoration-purple",
};

export function Button({ href, children, variant = "gold", external, className = "", arrow = true }: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`;
  const Icon = external ? ArrowUpRight : ArrowRight;
  const inner = <>{children}{arrow && <Icon aria-hidden className="size-4" />}</>;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link href={href} className={cls}>{inner}</Link>
  );
}

const tones = {
  paper: "bg-paper text-ink",
  alt: "bg-paper-2 text-ink",
  purple: "bg-purple text-on-purple",
  deep: "bg-purple-deep text-on-purple",
} as const;

/** A full-width band. Vertical space varies by purpose; the content column is shared. */
export function Section({ tone = "paper", children, className = "", id, tight }: { tone?: keyof typeof tones; children: React.ReactNode; className?: string; id?: string; tight?: boolean }) {
  return (
    <section id={id} className={`${tones[tone]} ${tight ? "py-12 md:py-16" : "py-[clamp(4rem,9vw,7.5rem)]"} ${id ? "scroll-mt-20" : ""} ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  );
}

/** Section title with an optional one-line lead. Plain type, no ornament. */
export function SectionHead({ title, lead, tone = "light", className = "" }: { eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode; tone?: "light" | "dark"; align?: "left" | "center"; className?: string }) {
  return (
    <header className={`max-w-3xl ${className}`}>
      <h2 className="t-h2">{title}</h2>
      {lead && <p className={`t-lead mt-4 max-w-2xl ${tone === "dark" ? "text-on-purple-muted" : "text-muted"}`}>{lead}</p>}
    </header>
  );
}
