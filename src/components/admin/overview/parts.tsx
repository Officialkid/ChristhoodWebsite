import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { Icon } from "@/components/icons";
import Img from "@/components/Img";
import { ago } from "@/lib/ago";
import { cn } from "@/lib/utils";
import { btnClass, Section } from "../ui";
import { CrossArt } from "./CrossArt";

/* ---------- the top band: greeting, one honest line about the day, and the numbers that matter ---------- */

export type Metric = { key: string; label: string; value: number; note?: string; href: string };

export function Band({ date, greeting, name, status, metrics }: { date: string; greeting: string; name: string; status: React.ReactNode; metrics: Metric[] }) {
  return (
    <section aria-labelledby="hello" className="bg-purple text-on-purple">
      <div className="flex items-center justify-between gap-6 px-5 pb-5 pt-6 sm:px-8 sm:pt-7">
        <div className="min-w-0">
          <p className="text-[0.88rem] text-on-purple-muted">{date}</p>
          <h1 id="hello" className="mt-1 break-words text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.05] text-on-purple">{greeting}, {name}</h1>
          <p className="mt-2 max-w-[56ch] text-[1rem] leading-relaxed text-on-purple-muted">{status}</p>
        </div>
        <div className="hidden pr-4 sm:block"><CrossArt /></div>
      </div>
      {metrics.length > 0 && (
        <ul className="grid grid-cols-2 border-t border-on-purple/20 sm:flex sm:flex-wrap">
          {metrics.map((m) => (
            <li key={m.key} className="min-w-0 border-b border-r border-on-purple/20 last:border-r-0 sm:flex-1 sm:basis-40 sm:border-b-0">
              <Link href={m.href} className="group block h-full px-5 py-4 transition-colors hover:bg-on-purple/10 focus-visible:outline-offset-[-3px] focus-visible:outline-on-purple sm:px-6">
                <span className="block text-[0.85rem] font-semibold text-on-purple-muted">{m.label}</span>
                <span className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-[2rem] font-extrabold leading-none tabular-nums [font-variation-settings:'wdth'_86]">{m.value}</span>
                  <ArrowRight className="size-4 -translate-x-1 text-on-purple-muted opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none" aria-hidden />
                </span>
                {m.note && <span className="mt-1 block text-[0.82rem] leading-snug text-on-purple-muted">{m.note}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- waiting for you ---------- */

export type Waiting = { key: string; n: number; href: string; title: string; meta: string };

export function WaitingList({ items, mayWait }: { items: Waiting[]; mayWait: boolean }) {
  if (!items.length && !mayWait) return null;
  return (
    <Section id="waiting" title="Waiting for you">
      {items.length === 0 ? (
        <p className="py-4 text-muted">Nothing is waiting for you right now. New applications, members and prayer requests show up here.</p>
      ) : (
        <ul>
          {items.map((w) => (
            <li key={w.key}>
              <Link href={w.href} className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule px-1 py-3 transition-colors hover:bg-paper-2">
                <span className="text-[1.5rem] font-extrabold leading-none tabular-nums text-purple [font-variation-settings:'wdth'_86]">{w.n}</span>
                <span className="min-w-0">
                  <span className="block font-bold leading-snug">{w.title}</span>
                  <span className="mt-0.5 block text-[0.9rem] leading-snug text-muted">{w.meta}</span>
                </span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------- one camp ---------- */

export type CampSummary = {
  id: string;
  title: string;
  image?: string;
  dates: string;
  /** "Starts in 2 days", "On now, day 2 of 5", "Finished", or empty when the dates are unknown. */
  when: string;
  live: boolean;
  total: number;
  approved: number;
  review: number;
  fix: number;
  declined: number;
  paid: number;
  /** Which programme the applications belong to, to open the application list on that camp. */
  programme?: string;
  /** Where the camp-day register is, for people who run it. */
  dayHref?: string;
  place?: string;
};

const segs = [
  { k: "approved", cls: "bg-ok", label: "approved" },
  { k: "review", cls: "bg-purple", label: "to review" },
  { k: "fix", cls: "bg-gold", label: "need correction" },
  { k: "declined", cls: "bg-rule", label: "declined" },
] as const;

export function CampPanel({ camp, canReview }: { camp: CampSummary; canReview: boolean }) {
  const c = camp;
  const reviewHref = `/123admin/camps?${c.programme ? `camp=${c.programme}&` : ""}status=Pending%20review`;
  const allHref = `/123admin/camps${c.programme ? `?camp=${c.programme}` : ""}`;
  return (
    <li className={cn("grid gap-x-5 gap-y-3 border-b border-rule py-4", c.image && "sm:grid-cols-[9.5rem_minmax(0,1fr)]")}>
      {c.image && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-purple-tint max-sm:aspect-[16/7]">
          <Img src={c.image} alt="" cover sizes="(max-width: 640px) 100vw, 152px" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <h3 className="text-[1.1rem] leading-snug">{canReview ? <Link href={allHref} className="hover:underline">{c.title}</Link> : c.title}</h3>
          {c.when && <span className={cn("text-[0.92rem] font-semibold", c.live ? "text-purple" : "text-ink")}>{c.when}</span>}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[0.9rem] text-muted"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden />{c.dates}</span>{c.place && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden />{c.place}</span>}</p>

        {c.total === 0 ? (
          <p className="mt-3 text-[0.92rem] text-muted">No applications yet.</p>
        ) : (
          <>
            <div role="img" aria-label={`${c.total} applications: ${segs.filter((s) => c[s.k] > 0).map((s) => `${c[s.k]} ${s.label}`).join(", ")}`} className="mt-3 flex h-2 overflow-hidden bg-paper-2">
              {segs.filter((s) => c[s.k] > 0).map((s) => <span key={s.k} className={s.cls} style={{ width: `${(c[s.k] / c.total) * 100}%` }} />)}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.88rem] text-muted">
              <li><strong className="font-bold text-ink">{c.total}</strong> {c.total === 1 ? "application" : "applications"}</li>
              {segs.filter((s) => c[s.k] > 0).map((s) => <li key={s.k} className="inline-flex items-center gap-1.5"><span className={cn("size-2", s.cls)} aria-hidden />{c[s.k]} {s.label}</li>)}
            </ul>
            {c.approved > 0 && (
              <p className="mt-1.5 text-[0.88rem] text-muted">
                Payments checked: <strong className="font-bold text-ink">{c.paid} of {c.approved}</strong> approved {c.approved === 1 ? "camper" : "campers"}
                {c.paid < c.approved ? <span> · {c.approved - c.paid} still to check</span> : <span> · all done</span>}
              </p>
            )}
          </>
        )}

        {(canReview || c.dayHref) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {canReview && c.review > 0 && <Link href={reviewHref} className={cn(btnClass.secondary, "min-h-10")}>Review {c.review}</Link>}
            {canReview && c.total > 0 && <Link href={allHref} className={cn(btnClass.ghost, "min-h-10")}>All applications</Link>}
            {c.dayHref && <Link href={c.dayHref} className={cn(btnClass.ghost, "min-h-10")}>Camp day <ArrowRight className="size-4" aria-hidden /></Link>}
          </div>
        )}
      </div>
    </li>
  );
}

/* ---------- quick actions ---------- */

export type QuickAction = { href: string; label: string; icon: string; count?: number; primary?: boolean };

/** A short, curated list for this person. It is not a second menu: the sidebar has every screen. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (!actions.length) return null;
  return (
    <Section id="quick" title="Quick actions">
      <ul className="mt-2 grid gap-x-4 sm:grid-cols-2 xl:grid-cols-1">
        {actions.map((a) => (
          <li key={a.href + a.label}>
            <Link href={a.href} className={cn("group flex min-h-11 items-center gap-3 border-b border-rule px-1 py-2.5 transition-colors hover:bg-paper-2", a.primary && "font-bold")}>
              <Icon name={a.icon} className="size-[1.15rem] shrink-0 text-purple" />
              <span className="min-w-0 flex-1 leading-snug">{a.label}</span>
              {a.count ? <span className="rounded-sm bg-gold px-1.5 text-[0.8rem] font-bold text-ink" aria-label={`${a.count} waiting`}>{a.count}</span> : null}
              <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- coming up ---------- */

export type Upcoming = { id: string; title: string; dates: string; place?: string; href: string };

export function ComingUp({ items }: { items: Upcoming[] }) {
  if (!items.length) return null;
  return (
    <Section id="coming" title="Coming up" aside={<Link href="/123admin/events" className="font-semibold text-purple hover:underline">Events</Link>}>
      <ul>
        {items.map((e) => (
          <li key={e.id} className="border-b border-rule py-2.5">
            <Link href={e.href} className="font-semibold leading-snug hover:underline">{e.title}</Link>
            <p className="text-[0.88rem] text-muted">{e.dates}{e.place ? ` · ${e.place}` : ""}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------- recent changes ---------- */

const iconFor = (action: string) => {
  const a = action.toLowerCase();
  if (/camp|application|camper/.test(a)) return "tent";
  if (/update|famil/.test(a)) return "megaphone";
  if (/password|code|key|door/.test(a)) return "key";
  if (/prayer/.test(a)) return "prayer";
  if (/member|guest|visitor/.test(a)) return "guest";
  if (/photo|picture|image|media|slot/.test(a)) return "images";
  if (/event/.test(a)) return "calendar";
  if (/home|banner|announcement|page|message|verse|setting/.test(a)) return "home";
  if (/access|team|user|role|department/.test(a)) return "shield";
  return "history";
};

export type Change = { id: string; by: string; action: string; target?: string; at: string };

/** The last few changes as a rail of small marks. A name, what they did, and how long ago. */
export function Timeline({ changes }: { changes: Change[] }) {
  if (!changes.length) return null;
  return (
    <Section id="recent" title="Recent changes" aside={<Link href="/123admin/activity" className="font-semibold text-purple hover:underline">Activity log</Link>}>
      <ol className="mt-3 border-l border-rule pl-0">
        {changes.map((a) => (
          <li key={a.id} className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] items-start py-1.5">
            <span className="relative -left-[0.8rem] mt-0.5 grid size-[1.6rem] place-items-center bg-paper text-purple"><Icon name={iconFor(a.action)} className="size-4" /></span>
            <p className="min-w-0 text-[0.92rem] leading-snug">
              <span className="font-semibold">{a.by}</span> {a.action.toLowerCase()}{a.target ? <>: <span className="text-muted">{a.target}</span></> : null}
              <time dateTime={a.at} className="block text-[0.8rem] text-muted">{ago(a.at)}</time>
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
