import Link from "next/link";
import { Icon } from "../icons";

/** Small building blocks shared by every admin screen. */

export function PageTitle({ title, lead, icon, actions, crumbs }: { title: string; lead?: React.ReactNode; icon?: string; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return (
    <header className="border-b border-rule pb-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-x-2 text-[0.9rem] text-muted">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden>/</span>}
                {c.href ? <Link href={c.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:text-purple hover:underline">{c.label}</Link> : <span aria-current="page" className="text-ink">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight">
            {icon && <Icon name={icon} className="size-[1.1em] shrink-0 text-purple" />}
            <span className="min-w-0 break-words">{title}</span>
          </h1>
          {lead && <p className="mt-2 max-w-2xl text-[1.02rem] text-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

const tones = {
  info: "border-purple/40 bg-purple-tint text-ink",
  warn: "border-gold bg-[oklch(0.96_0.06_92)] text-ink",
  bad: "border-danger bg-danger-tint text-danger",
  ok: "border-ok bg-ok-tint text-ok",
};

export function Notice({ tone = "info", title, children }: { tone?: keyof typeof tones; title?: string; children: React.ReactNode }) {
  return (
    <div role={tone === "bad" ? "alert" : "status"} className={`border px-4 py-3 ${tones[tone]}`}>
      {title && <p className="font-bold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-rule px-6 py-12 text-center">
      <Icon name={icon} className="mx-auto size-9 text-purple/70" />
      <p className="mt-4 text-lg font-bold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-muted">{children}</div>}
    </div>
  );
}

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
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

/** A list row: icon, title and detail on the left, a status or action on the right. Hairlines between rows, no boxes. */
export function Row({ href, icon, title, meta, aside }: { href?: string; icon?: string; title: React.ReactNode; meta?: React.ReactNode; aside?: React.ReactNode }) {
  const body = (
    <>
      {icon && <Icon name={icon} className="mt-1 size-5 shrink-0 text-purple" />}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{title}</span>
        {meta && <span className="mt-0.5 block text-[0.92rem] text-muted">{meta}</span>}
      </span>
      {aside && <span className="shrink-0 self-center text-[0.92rem]">{aside}</span>}
    </>
  );
  const cls = "flex items-start gap-3 border-b border-rule px-1 py-4";
  return href ? <Link href={href} className={`${cls} hover:bg-paper-2`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Chip({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "new" | "ok" | "warn" }) {
  const t = { plain: "bg-paper-2 text-muted", new: "bg-purple text-on-purple", ok: "bg-ok-tint text-ok", warn: "bg-[oklch(0.94_0.08_92)] text-ink" }[tone];
  return <span className={`inline-block rounded-sm px-2 py-0.5 text-[0.8rem] font-semibold ${t}`}>{children}</span>;
}
