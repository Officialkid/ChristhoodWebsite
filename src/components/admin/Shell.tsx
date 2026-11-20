"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ChevronsUpDown, ExternalLink, KeyRound, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Toaster } from "sonner";
import { MotionConfig } from "motion/react";
import { Icon } from "../icons";
import { CommandPalette } from "./CommandPalette";
import { GuardProvider, SlotsContext, useGuard } from "./workspace";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  /** The sidebar was folded to icons the last time this person was here. */
  folded?: boolean;
  children: React.ReactNode;
};

const CLOSED_KEY = "ch-admin-nav-closed";
const FOLD_COOKIE = "ch-side";
/** Screens that are a workspace (they fill the window and have their own panels) rather than a page. */
const WORKSPACES = ["/123admin/home"];

export default function Shell(props: Props) {
  return (
    <TooltipProvider>
      <MotionConfig reducedMotion="user">
        <GuardProvider>
          <Frame {...props} />
        </GuardProvider>
      </MotionConfig>
    </TooltipProvider>
  );
}

function Frame({ groups, user, signOut, find = [], folded = false, children }: Props) {
  const pathname = usePathname();
  const { go } = useGuard();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [rail, setRail] = useState(folded);
  const [closed, setClosed] = useState<string[]>([]);
  const [slots, setSlots] = useState<{ center: HTMLElement | null; end: HTMLElement | null }>({ center: null, end: null });
  const setCenter = useCallback((el: HTMLElement | null) => setSlots((s) => (s.center === el ? s : { ...s, center: el })), []);
  const setEnd = useCallback((el: HTMLElement | null) => setSlots((s) => (s.end === el ? s : { ...s, end: el })), []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try { setClosed(JSON.parse(localStorage.getItem(CLOSED_KEY) ?? "[]")); } catch { /* storage blocked: every group stays open */ }
  }, []);
  const fold = useCallback((next: boolean) => {
    setRail(next);
    document.cookie = `${FOLD_COOKIE}=${next ? 1 : 0}; path=/123admin; max-age=31536000; samesite=lax`;
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b" && !typing) {
        e.preventDefault();
        fold(!rail);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [fold, rail]);

  const active = (href: string) => (href === "/123admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const toggle = (title: string) =>
    setClosed((c) => {
      const next = c.includes(title) ? c.filter((t) => t !== title) : [...c, title];
      try { localStorage.setItem(CLOSED_KEY, JSON.stringify(next)); } catch { /* not saved, still works this visit */ }
      return next;
    });

  const screens = useMemo<FindItem[]>(() => groups.flatMap((g) => g.items.flatMap((i) => [{ href: i.href, label: i.label, icon: i.icon, group: "Screens", hint: g.title }, ...(i.children ?? []).map((c) => ({ ...c, group: "Screens", hint: i.label }))])), [groups]);
  const crumbs = useMemo(() => crumbsFor(pathname, groups), [pathname, groups]);
  const searchHint = find.length > 0 ? "Search screens, people and applications" : "Jump to a screen";
  const workspace = WORKSPACES.includes(pathname);
  const totalBadges = groups.reduce((n, g) => n + g.items.reduce((m, i) => m + (i.badge ?? 0), 0), 0);

  const navProps = { groups, active, closed, toggle, pathname };

  return (
    <SlotsContext.Provider value={slots}>
      <div className="admin min-h-svh bg-paper lg:grid lg:grid-cols-[var(--side)_minmax(0,1fr)] lg:transition-[grid-template-columns] lg:duration-200 motion-reduce:transition-none print:block" style={{ "--side": rail ? "4.5rem" : "17rem" } as React.CSSProperties}>
        <a href="#admin-main" className="fixed left-4 top-4 z-[90] -translate-y-24 rounded-sm bg-gold px-5 py-3 font-semibold text-ink focus:translate-y-0">Skip to the content</a>

        {/* Sidebar on large screens: full labels, or a rail of icons with tooltips */}
        <aside aria-label="Team area menu" data-rail={rail || undefined} className="a-side sticky top-0 hidden h-svh flex-col overflow-x-hidden overflow-y-auto bg-purple-deep text-on-purple lg:flex print:!hidden">
          <div className={cn("flex min-h-14 items-center", rail ? "justify-center" : "justify-between pr-2")}>
            {!rail && <Brand />}
            <Tip label={rail ? "Open the menu (Ctrl B)" : "Fold the menu (Ctrl B)"} side="right" show>
              <button type="button" onClick={() => fold(!rail)} aria-label={rail ? "Open the menu" : "Fold the menu to icons"} aria-expanded={!rail} className="inline-flex size-11 items-center justify-center rounded-sm text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple">
                {rail ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
              </button>
            </Tip>
          </div>
          <div className="flex-1"><Nav {...navProps} rail={rail} /></div>
          <Account user={user} signOut={signOut} rail={rail} />
        </aside>

        <div className="min-w-0 lg:contents">
          <div className="min-w-0">
            <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-rule bg-paper px-3 pt-[env(safe-area-inset-top)] box-content lg:px-5 print:!hidden">
              <button type="button" onClick={() => setOpen(true)} aria-label={totalBadges ? `Open the menu, ${totalBadges} new` : "Open the menu"} className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-rule lg:hidden">
                <Menu className="size-5" aria-hidden />
                {totalBadges > 0 && <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-full bg-gold ring-2 ring-paper" />}
              </button>
              <Breadcrumbs crumbs={crumbs} />
              <div ref={setCenter} className="ml-auto flex items-center gap-2" />
              <button type="button" onClick={() => setPalette(true)} aria-label={searchHint} className="inline-flex h-10 shrink-0 items-center gap-3 rounded-sm border border-rule px-3 text-[0.92rem] text-muted transition-colors hover:border-ink hover:text-ink max-lg:w-11 max-lg:justify-center max-lg:px-0 lg:w-44 xl:w-60">
                <Search className="size-4 shrink-0" aria-hidden />
                <span className="hidden min-w-0 flex-1 truncate text-left lg:block">Search</span>
                <kbd className="hidden rounded-sm border border-rule px-1.5 font-sans text-[0.76rem] lg:block">Ctrl K</kbd>
              </button>
              <div ref={setEnd} className="flex items-center gap-2" />
              <Tip label="Open the website in a new tab" side="bottom" show>
                <Link href="/" target="_blank" aria-label="View the website (opens in a new tab)" className="hidden size-10 shrink-0 items-center justify-center rounded-sm text-purple hover:bg-purple-tint xl:inline-flex"><ExternalLink className="size-[1.1rem]" aria-hidden /></Link>
              </Tip>
            </header>
            <main id="admin-main" className={workspace ? "h-[calc(100svh-3.5rem-env(safe-area-inset-top))] min-h-[30rem]" : "mx-auto w-full max-w-[74rem] min-[1700px]:max-w-[90rem] px-4 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-9"}>{children}</main>
          </div>
        </div>

        {/* The same menu as a drawer on a phone or a folded device */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="a-side overflow-y-auto bg-purple-deep pb-[env(safe-area-inset-bottom)] text-on-purple [&>button]:text-on-purple [&>button]:hover:bg-on-purple/10" closeLabel="Close the menu">
            <SheetTitle className="sr-only">Team area menu</SheetTitle>
            <SheetDescription className="sr-only">Choose a screen.</SheetDescription>
            <Brand />
            <div className="flex-1"><Nav {...navProps} rail={false} /></div>
            <Account user={user} signOut={signOut} rail={false} />
          </SheetContent>
        </Sheet>

        <CommandPalette open={palette} onOpenChange={setPalette} screens={screens} find={find} hint={searchHint} go={go} />
        <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "!rounded-sm !border !border-rule !font-sans" } }} />
      </div>
    </SlotsContext.Provider>
  );
}

/** A tooltip around one control. `show` keeps it on even when the label is already visible text. */
function Tip({ label, side = "right", show, children }: { label: string; side?: "right" | "bottom" | "top"; show?: boolean; children: React.ReactElement }) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

type NavProps = { groups: AdminNavGroup[]; active: (h: string) => boolean; closed: string[]; toggle: (t: string) => void; pathname: string; rail: boolean };

function Nav({ groups, active, closed, toggle, pathname, rail }: NavProps) {
  const link = cn("relative flex min-h-10 items-center gap-3 rounded-sm py-1.5 text-[0.93rem] font-semibold leading-tight pointer-coarse:min-h-11", rail ? "mx-auto size-11 justify-center" : "px-3");
  const tone = (on: boolean) => (on ? "bg-on-purple/16 text-on-purple" : "text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple");
  return (
    <nav aria-label="Team area" className={cn("grid gap-1 pb-8", rail ? "px-2" : "px-3")}>
      {groups.map((g, gi) => {
        const headless = g.title === "Start";
        const holdsActive = g.items.some((i) => active(i.href) || i.children?.some((c) => active(c.href)));
        const shut = !rail && !headless && closed.includes(g.title) && !holdsActive;
        const badges = g.items.reduce((n, i) => n + (i.badge ?? 0), 0);
        return (
          <div key={g.title} className={cn(headless ? "pb-2" : rail ? "border-t border-on-purple/15 pt-2" : "pt-3", rail && gi === 0 && "border-0")}>
            {!headless && !rail && (
              <button type="button" aria-expanded={!shut} onClick={() => toggle(g.title)} className="flex min-h-9 w-full items-center gap-2 rounded-sm px-3 text-left text-[0.82rem] font-semibold text-on-purple-muted hover:text-on-purple pointer-coarse:min-h-11">
                <span className="flex-1">{g.title}</span>
                {shut && badges > 0 && <span className="rounded-sm bg-gold px-1.5 text-[0.75rem] font-bold text-ink" aria-label={`${badges} new inside`}>{badges}</span>}
                <ChevronDown className={cn("size-3.5 transition-transform", shut && "-rotate-90")} aria-hidden />
              </button>
            )}
            <ul className="grid gap-0.5" hidden={shut}>
              {g.items.map((item) => {
                const on = active(item.href);
                const content = (
                  <>
                    <Icon name={item.icon} className="size-[1.2rem] shrink-0" />
                    {!rail && <span className="min-w-0 flex-1 break-words">{item.label}</span>}
                    {item.badge ? (rail
                      ? <span className="absolute right-0.5 top-0.5 grid min-w-[1.1rem] place-items-center rounded-sm bg-gold px-1 text-[0.7rem] font-bold leading-[1.1rem] text-ink" aria-label={`${item.badge} new`}>{item.badge}</span>
                      : <span className="rounded-sm bg-gold px-1.5 text-[0.78rem] font-bold text-ink" aria-label={`${item.badge} new`}>{item.badge}</span>) : null}
                  </>
                );
                const a = (
                  <Link href={item.href} aria-current={on && !item.children?.length ? "page" : undefined} aria-label={rail ? `${item.label}${item.badge ? `, ${item.badge} new` : ""}` : undefined} className={cn(link, tone(on))}>
                    {content}
                  </Link>
                );
                if (rail || !item.children?.length) {
                  return (
                    <li key={item.href}>
                      {rail ? <Tooltip><TooltipTrigger asChild>{a}</TooltipTrigger><TooltipContent side="right">{item.label}{item.badge ? ` · ${item.badge} new` : ""}</TooltipContent></Tooltip> : a}
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <details open={on} className="group">
                      <summary className={cn(link, "cursor-pointer list-none [&::-webkit-details-marker]:hidden", tone(on))}>
                        {content}
                        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
                      </summary>
                      <ul className="ml-[1.45rem] mt-0.5 grid gap-0.5 border-l border-on-purple/20 pl-2">
                        {[{ href: item.href, label: `All ${item.label.toLowerCase()}`, icon: "" }, ...item.children].map((c) => {
                          const here = pathname === c.href;
                          return (
                            <li key={c.href}>
                              <Link href={c.href} aria-current={here ? "page" : undefined} className={cn("flex min-h-9 items-center gap-2.5 rounded-sm px-2.5 py-1 text-[0.89rem] leading-tight pointer-coarse:min-h-11", here ? "bg-on-purple/16 font-semibold text-on-purple" : "text-on-purple-muted hover:bg-on-purple/10 hover:text-on-purple")}>
                                {c.icon ? <Icon name={c.icon} className="size-4 shrink-0" /> : null}
                                <span className="min-w-0 break-words">{c.label}</span>
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
}

type Crumb = { label: string; href?: string };

/** Where you are, worked out from the menu: Team area / group / screen / sub-screen. */
function crumbsFor(pathname: string, groups: AdminNavGroup[]): Crumb[] {
  let best: { len: number; trail: Crumb[] } | null = null;
  const consider = (href: string, trail: Crumb[]) => {
    const hit = href === "/123admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
    if (hit && (!best || href.length > best.len)) best = { len: href.length, trail };
  };
  for (const g of groups) {
    for (const i of g.items) {
      const head: Crumb[] = g.title === "Start" ? [] : [{ label: g.title }];
      consider(i.href, [...head, { label: i.label, href: i.href }]);
      for (const c of i.children ?? []) consider(c.href, [...head, { label: i.label, href: i.href }, { label: c.label, href: c.href }]);
    }
  }
  const trail: Crumb[] = (best as { trail: Crumb[] } | null)?.trail ?? [];
  const last = trail.length - 1;
  // The screen you are on is plain text; earlier steps are links, except when you are deeper than the last known screen.
  const deeper = last >= 0 && trail[last].href !== pathname;
  return [{ label: "Team area", href: "/123admin" }, ...trail.map((c, i) => (i === last && !deeper ? { label: c.label } : c))];
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-1 text-[0.92rem]">
        {crumbs.map((c, i) => {
          const lastOne = i === crumbs.length - 1;
          return (
            <li key={`${c.label}${i}`} className={cn("flex items-center gap-1", lastOne ? "min-w-0" : "shrink-0 max-sm:hidden", !lastOne && i > 0 && "max-lg:hidden", lastOne && "max-sm:[&>svg]:hidden")}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden />}
              {c.href && !lastOne ? (
                <Link href={c.href} className="inline-flex min-h-8 items-center truncate rounded-sm px-1 text-muted hover:text-purple hover:underline hover:underline-offset-4">{c.label}</Link>
              ) : (
                <span aria-current={lastOne ? "page" : undefined} className={cn("truncate px-1", lastOne ? "font-bold text-ink" : "text-muted")}>{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/123admin" className="flex items-center gap-3 px-5 py-4">
      <Image src="/logo-96.png" alt="" width={40} height={40} className="size-9 rounded-full" />
      <span className="leading-none">
        <span className="block text-[1.15rem] font-extrabold [font-variation-settings:'wdth'_86]">Christhood</span>
        <span className="mt-1 block text-[0.82rem] font-semibold text-gold">Studio</span>
      </span>
    </Link>
  );
}

function Account({ user, signOut, rail }: { user: { name: string; roleLabel: string }; signOut: () => Promise<void>; rail: boolean }) {
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={cn("border-t border-on-purple/20", rail ? "p-2" : "p-3")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Account menu for ${user.name}`} className={cn("flex min-h-12 w-full items-center gap-3 rounded-sm text-left hover:bg-on-purple/10", rail ? "justify-center" : "px-2")}>
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-on-purple/20 font-bold">{initial}</span>
            {!rail && (
              <>
                <span className="min-w-0 flex-1 leading-tight"><span className="block truncate font-semibold">{user.name}</span><span className="block truncate text-[0.82rem] text-on-purple-muted">{user.roleLabel}</span></span>
                <ChevronsUpDown className="size-4 shrink-0 text-on-purple-muted" aria-hidden />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side={rail ? "right" : "top"} align="end">
          <DropdownMenuLabel>{user.name} · {user.roleLabel}</DropdownMenuLabel>
          <DropdownMenuItem asChild><Link href="/123admin/account"><KeyRound className="size-4" aria-hidden /> My account</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/" target="_blank"><ExternalLink className="size-4" aria-hidden /> View the website</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <form action={signOut} onClick={(e) => e.stopPropagation()} className="contents"><button type="submit" className="flex min-h-10 w-full items-center gap-2.5 px-3 text-left"><LogOut className="size-4" aria-hidden /> Sign out</button></form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
