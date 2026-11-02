"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { ChevronDown, CornerDownLeft, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { Toaster } from "sonner";
import { Icon } from "../icons";

export type AdminNavItem = { href: string; label: string; icon: string; badge?: number; children?: { href: string; label: string; icon: string }[] };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };
/** One thing the search bar can open: a screen, a quick action, or a person or application. */
export type FindItem = { href: string; label: string; group: string; hint?: string; icon?: string };

type Props = {
  groups: AdminNavGroup[];
  user: { name: string; roleLabel: string };
  signOut: () => Promise<void>;
  /** Quick actions and the people and applications this person may open. */
  find?: FindItem[];
  children: React.ReactNode;
};

const CLOSED_KEY = "ch-admin-nav-closed";

export default function Shell({ groups, user, signOut, find = [], children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [closed, setClosed] = useState<string[]>([]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try { setClosed(JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "[]")); } catch { /* storage blocked: every group stays open */ }
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const active = (href: string) => (href === "/123admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const toggle = (title: string) =>
    setClosed((c) => {
      const next = c.includes(title) ? c.filter((t) => t !== title) : [...c, title];
      try { localStorage.setItem(CLOSED_KEY, JSON.stringify(next)); } catch { /* not saved, still works this visit */ }
      return next;
    });

  const screens = useMemo<FindItem[]>(() => groups.flatMap((g) => g.items.flatMap((i) => [{ href: i.href, label: i.label, icon: i.icon, group: "Screens", hint: g.title }, ...(i.children ?? []).map((c) => ({ ...c, group: "Screens", hint: i.label }))])), [groups]);
  const quick = find.filter((f) => f.group === "Do");
  const records = find.filter((f) => f.group !== "Do");

  const link = "flex min-h-10 items-center gap-3 rounded-sm px-3 text-[0.93rem] font-semibold pointer-coarse:min-h-11";
  const nav = (
    <nav aria-label="Admin" className="grid gap-1 px-3 pb-8">
      {groups.map((g) => {
        const headless = g.title === "Start";
        const holdsActive = g.items.some((i) => active(i.href) || i.children?.some((c) => active(c.href)));
        const shut = !headless && closed.includes(g.title) && !holdsActive;
        const badges = g.items.reduce((n, i) => n + (i.badge ?? 0), 0);
        return (
          <div key={g.title} className={headless ? "pb-2" : "pt-3"}>
            {!headless && (
              <button type="button" aria-expanded={!shut} onClick={() => toggle(g.title)} className="group/h flex min-h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-[0.82rem] font-semibold text-on-purple-muted hover:text-on-purple pointer-coarse:min-h-11">
                <span className="flex-1">{g.title}</span>
                {shut && badges > 0 && <span className="rounded-sm bg-gold px-1.5 text-[0.75rem] font-bold text-ink" aria-label={`${badges} new inside`}>{badges}</span>}
                <ChevronDown className={`size-3.5 transition-transform ${shut ? "-rotate-90" : ""}`} aria-hidden />
              </button>
            )}
            <ul className="grid gap-0.5" hidden={shut}>
              {g.items.map((item) => {
                const on = active(item.href);
                const a = (
                  <Link href={item.href} aria-current={on && !item.children ? "page" : undefined} className={`${link} ${on ? "bg-on-purple/16 text-on-purple" : "text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple"}`}>
                    <Icon name={item.icon} className="size-[1.1rem] shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? <span className="rounded-sm bg-gold px-1.5 text-[0.78rem] font-bold text-ink" aria-label={`${item.badge} new`}>{item.badge}</span> : null}
                  </Link>
                );
                if (!item.children?.length) return <li key={item.href}>{a}</li>;
                return (
                  <li key={item.href}>
                    <details open={on} className="group">
                      <summary className={`${link} cursor-pointer list-none [&::-webkit-details-marker]:hidden ${on ? "text-on-purple" : "text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple"}`}>
                        <Icon name={item.icon} className="size-[1.1rem] shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge ? <span className="rounded-sm bg-gold px-1.5 text-[0.78rem] font-bold text-ink" aria-label={`${item.badge} new`}>{item.badge}</span> : null}
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <ul className="ml-[1.3rem] mt-0.5 grid gap-0.5 border-l border-on-purple/20 pl-2">
                        {[{ href: item.href, label: `All ${item.label.toLowerCase()}`, icon: "" }, ...item.children].map((c) => {
                          const here = pathname === c.href;
                          return (
                            <li key={c.href}>
                              <Link href={c.href} aria-current={here ? "page" : undefined} className={`flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 text-[0.89rem] pointer-coarse:min-h-11 ${here ? "bg-on-purple/16 font-semibold text-on-purple" : "text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple"}`}>
                                {c.icon ? <Icon name={c.icon} className="size-4 shrink-0" /> : null}
                                <span className="truncate">{c.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const searchHint = find.length > 0 ? "Search screens, people and applications" : "Jump to a screen";

  return (
    <div className="admin min-h-svh bg-paper lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <a href="#admin-main" className="fixed left-4 top-4 z-[90] -translate-y-24 rounded-sm bg-gold px-5 py-3 font-semibold text-ink focus:translate-y-0">Skip to the content</a>

      {/* Sidebar on large screens */}
      <aside className="a-side sticky top-0 hidden h-svh flex-col overflow-y-auto bg-purple-deep text-on-purple lg:flex">
        <Brand />
        <div className="flex-1">{nav}</div>
        <Account user={user} signOut={signOut} />
      </aside>

      {/* Top bar and drawer on smaller screens */}
      <div className="lg:contents">
        <header className="sticky top-0 z-40 flex min-h-14 items-center gap-2 border-b border-rule bg-paper px-3 pt-[env(safe-area-inset-top)] lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-drawer" className="inline-flex size-11 items-center justify-center rounded-sm border border-rule"><Menu className="size-5" aria-hidden /></button>
          <Link href="/123admin" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 font-extrabold [font-variation-settings:'wdth'_86]"><Image src="/logo-96.png" alt="" width={32} height={32} className="size-8 rounded-full" /><span className="truncate">Christhood team</span></Link>
          <button type="button" onClick={() => setPalette(true)} aria-label={searchHint} className="inline-flex size-11 items-center justify-center rounded-sm border border-rule"><Search className="size-5" aria-hidden /></button>
        </header>

        {open && <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
        <aside id="admin-drawer" hidden={!open} className="a-side fixed inset-y-0 left-0 z-[60] flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-purple-deep pb-[env(safe-area-inset-bottom)] text-on-purple lg:hidden">
          <div className="flex items-center justify-between pr-2">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-on-purple/10"><X className="size-5" aria-hidden /></button>
          </div>
          <div className="flex-1">{nav}</div>
          <Account user={user} signOut={signOut} />
        </aside>

        <div className="min-w-0">
          <div className="sticky top-0 z-30 hidden h-14 items-center gap-4 border-b border-rule bg-paper px-8 lg:flex">
            <button type="button" onClick={() => setPalette(true)} className="inline-flex h-10 w-full max-w-[28rem] items-center gap-3 rounded-sm border border-rule px-3 text-left text-[0.92rem] text-muted transition-colors hover:border-ink hover:text-ink">
              <Search className="size-4 shrink-0" aria-hidden /> <span className="min-w-0 flex-1 truncate">{searchHint}</span> <kbd className="rounded-sm border border-rule px-1.5 font-sans text-[0.76rem]">Ctrl K</kbd>
            </button>
            <Link href="/" target="_blank" className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-[0.92rem] font-semibold text-purple hover:bg-purple-tint">View the website <ExternalLink className="size-4" aria-hidden /></Link>
          </div>
          <main id="admin-main" className="mx-auto w-full max-w-[74rem] min-[1700px]:max-w-[90rem] px-4 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-9">{children}</main>
        </div>
      </div>

      <Command.Dialog open={palette} onOpenChange={setPalette} label={searchHint} overlayClassName="fixed inset-0 z-[99] bg-ink/45" className="fixed left-1/2 top-[10vh] z-[100] w-[min(38rem,calc(100vw-1.5rem))] -translate-x-1/2 border border-ink/30 bg-paper shadow-2xl">
        <Command.Input placeholder={searchHint} className="w-full border-b border-rule bg-paper px-4 py-4 text-base outline-none placeholder:text-muted" />
        <Command.List className="max-h-[56vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[0.8rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted">
          <Command.Empty className="px-3 py-8 text-center text-muted">Nothing matches that.</Command.Empty>
          {[["Do", quick], ["Screens", screens], ...groupBy(records)].map(([heading, items]) => (items as FindItem[]).length === 0 ? null : (
            <Command.Group key={heading as string} heading={heading === "Do" ? "Do something" : (heading as string)}>
              {(items as FindItem[]).map((a) => (
                <Command.Item key={`${a.group}${a.href}${a.label}`} value={`${a.label} ${a.hint ?? ""} ${a.group}`} onSelect={() => { setPalette(false); router.push(a.href); }} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 data-[selected=true]:bg-purple-tint">
                  <Icon name={a.icon} className="size-4 shrink-0 text-purple" />
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                  {a.hint && <span className="shrink-0 text-[0.82rem] text-muted">{a.hint}</span>}
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
        <p className="flex items-center gap-4 border-t border-rule px-4 py-2 text-[0.8rem] text-muted"><span>Up and down to choose</span><span className="inline-flex items-center gap-1"><CornerDownLeft className="size-3.5" aria-hidden /> to open</span><span>Esc to close</span></p>
      </Command.Dialog>

      <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "!rounded-sm !border !border-rule !font-sans" } }} />
    </div>
  );
}

function groupBy(items: FindItem[]): [string, FindItem[]][] {
  const m = new Map<string, FindItem[]>();
  for (const i of items) m.set(i.group, [...(m.get(i.group) ?? []), i]);
  return [...m.entries()];
}

function Brand() {
  return (
    <Link href="/123admin" className="flex items-center gap-3 px-5 py-5">
      <Image src="/logo-96.png" alt="" width={40} height={40} className="size-10 rounded-full" />
      <span className="leading-none">
        <span className="block text-[1.2rem] font-extrabold [font-variation-settings:'wdth'_86]">Christhood</span>
        <span className="mt-1 block text-[0.82rem] font-semibold text-gold">Team area</span>
      </span>
    </Link>
  );
}

function Account({ user, signOut }: { user: { name: string; roleLabel: string }; signOut: () => Promise<void> }) {
  return (
    <div className="border-t border-on-purple/20 p-3">
      <div className="px-3 pb-2">
        <p className="truncate font-semibold">{user.name}</p>
        <p className="truncate text-[0.85rem] text-on-purple-muted">{user.roleLabel}</p>
      </div>
      <form action={signOut}>
        <button type="submit" className="flex min-h-10 w-full items-center gap-3 rounded-sm px-3 text-[0.93rem] font-semibold text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple pointer-coarse:min-h-11"><LogOut className="size-[1.1rem]" aria-hidden /> Sign out</button>
      </form>
    </div>
  );
}
