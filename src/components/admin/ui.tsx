import Link from "next/link";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Icon } from "../icons";

/** Small building blocks shared by every admin screen. */

/** The top of a screen: where you are, what this screen is, and the few things you can do from it. */
export function PageTitle({ title, lead, actions, crumbs }: { title: string; lead?: React.ReactNode; /** Kept so older screens still compile; the menu already shows each screen's icon. */ icon?: string; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="border-b border-rule pb-5">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-x-2 text-[0.9rem] text-muted">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? <Link href={c.href} className="inline-flex min-h-8 items-center underline-offset-4 hover:text-purple hover:underline pointer-coarse:min-h-11">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="break-words text-[clamp(1.6rem,2.4vw,1.95rem)] leading-[1.1]">{title}</h1>
          {lead && <p className="mt-2 max-w-[62ch] text-[0.98rem] leading-relaxed text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** A named part of a screen. The heading sits on a rule so the page reads as a list of jobs. */
export function Section({ id, title, aside, children }: { id: string; title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/30 pb-2">
        <h2 id={id} className="text-[1.15rem] leading-snug">{title}</h2>
        {aside && <div className="text-[0.92rem] text-muted">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

const tones = {
  info: { box: "border-purple/40 bg-purple-tint text-ink", icon: Info },
  warn: { box: "border-gold bg-[oklch(0.96_0.06_92)] text-ink", icon: TriangleAlert },
  bad: { box: "border-danger bg-danger-tint text-danger", icon: CircleAlert },
  ok: { box: "border-ok bg-ok-tint text-ok", icon: CircleCheck },
};

export function Notice({ tone = "info", title, children }: { tone?: keyof typeof tones; title?: string; children: React.ReactNode }) {
  const { box, icon: Mark } = tones[tone];
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`flex gap-3 border px-4 py-3 ${box}`}>
      <Mark className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? "mt-0.5" : ""}>{children}</div>
      </div>
    </div>
  );
}

/** Nothing here yet: say why, and what makes something appear. */
export function Empty({ icon, title, children, action }: { icon: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1 border border-dashed border-rule px-6 py-10 sm:flex-row sm:items-center sm:gap-5">
      <Icon name={icon} className="size-8 shrink-0 text-purple/70" />
      <div className="min-w-0 flex-1">
        <p className="text-[1.05rem] font-bold">{title}</p>
        {children && <div className="mt-0.5 max-w-[56ch] text-muted">{children}</div>}
      </div>
      {action && <div className="mt-3 sm:mt-0">{action}</div>}
    </div>
  );
}

const btn = "inline-flex min-h-10 items-center justify-center gap-2 rounded-sm px-4 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:min-h-11 pointer-coarse:px-5";
export const btnClass = {
  primary: `${btn} bg-gold text-ink hover:bg-gold-hover`,
  secondary: `${btn} border border-ink/35 text-ink hover:border-ink hover:bg-ink hover:text-paper`,
  purple: `${btn} bg-purple text-on-purple hover:bg-purple-deep`,
  danger: `${btn} border border-danger text-danger hover:bg-danger hover:text-paper`,
  ghost: `${btn} px-3 text-purple hover:bg-purple-tint`,
};

export function LinkButton({ href, variant = "secondary", icon, children }: { href: string; variant?: keyof typeof btnClass; icon?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={btnClass[variant]}>
      {icon && <Icon name={icon} />}
      {children}
    </Link>
  );
}

/** A list row: title and detail on the left, a status or action on the right. Hairlines between rows, no boxes. */
export function Row({ href, icon, title, meta, aside }: { href?: string; icon?: string; title: React.ReactNode; meta?: React.ReactNode; aside?: React.ReactNode }) {
  const body = (
    <>
      {icon && <Icon name={icon} className="mt-0.5 size-[1.15rem] shrink-0 text-purple" />}
      <span className="min-w-0 flex-1 basis-48">
        <span className="block font-bold leading-snug">{title}</span>
        {meta && <span className="mt-0.5 block text-[0.92rem] leading-snug text-muted">{meta}</span>}
      </span>
      {aside && <span className="ml-auto max-w-full self-center text-[0.92rem]">{aside}</span>}
    </>
  );
  const cls = "flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-rule px-1 py-3.5";
  return href ? <Link href={href} className={`${cls} transition-colors hover:bg-paper-2`}>{body}</Link> : <div className={cls}>{body}</div>;
}

type Tone = "plain" | "new" | "ok" | "warn" | "bad";
const dot = { plain: "quiet", new: "new", ok: "ok", warn: "warn", bad: "bad" } as const;

/** A state in a word with a small mark: new, done, needs a look. */
export function Status({ children, tone = "plain" }: { children: React.ReactNode; tone?: Tone }) {
  return <span className="a-status" data-tone={dot[tone]}>{children}</span>;
}

/** Older name for Status, kept so every screen speaks the same way. */
export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: Tone }) {
  return <Status tone={tone}>{children}</Status>;
}

/** Filters as links (the page reloads with the filter in the address). */
export function FilterLinks({ label, items }: { label: string; items: { href: string; label: string; count?: number; current: boolean }[] }) {
  return (
    <nav aria-label={label} className="a-tabs">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.current ? "page" : undefined} className="a-tab">
          {i.label}
          {i.count !== undefined && <span className="n">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** A table that stacks into short entries on a phone. Put `data-label` on each cell after the first so the stacked entry still says what it is. */
export function DataTable({ caption, head, children }: { caption: string; head: { label: string; className?: string }[]; children: React.ReactNode }) {
  return (
    <table className="a-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>{head.map((h) => <th key={h.label} scope="col" className={h.className}>{h.label}</th>)}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
