"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { ChevronDown, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { Toaster } from "sonner";
import { Icon } from "../icons";

export type AdminNavItem = { href: string; label: string; icon: string; badge?: number; children?: { href: string; label: string; icon: string }[] };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

type Props = {
  groups: AdminNavGroup[];
  user: { name: string; roleLabel: string };
  signOut: () => Promise<void>;
  children: React.ReactNode;
};

export default function Shell({ groups, user, signOut, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
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
  const all = groups.flatMap((g) => g.items.flatMap((i) => [{ href: i.href, label: i.label, icon: i.icon, group: g.title }, ...(i.children ?? []).map((c) => ({ ...c, group: i.label }))]));

  const nav = (
    <nav aria-label="Admin" className="grid gap-7 px-3 pb-8">
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="px-3 pb-2 text-[0.82rem] font-semibold text-on-purple-muted [font-variation-settings:normal]">{g.title}</h2>
          <ul className="grid gap-0.5">
            {g.items.map((item) => {
              const on = active(item.href);
              const link = (
                <Link href={item.href} aria-current={on && !item.children ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-sm px-3 text-[0.95rem] font-semibold ${on ? "bg-on-purple text-purple-deep" : "text-on-purple hover:bg-on-purple/10"}`}>
                  <Icon name={item.icon} className="size-[1.15rem] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.badge ? <span className="rounded-sm bg-gold px-1.5 text-[0.78rem] font-bold text-ink" aria-label={`${item.badge} new`}>{item.badge}</span> : null}
                </Link>
              );
              if (!item.children?.length) return <li key={item.href}>{link}</li>;
              return (
                <li key={item.href}>
                  <details open={on} className="group">
                    <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-sm px-3 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden ${on ? "text-gold" : "text-on-purple hover:bg-on-purple/10"}`}>
                      <Icon name={item.icon} className="size-[1.15rem] shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="ml-[1.35rem] mt-1 grid gap-0.5 border-l border-on-purple/20 pl-2">
                      <li><Link href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-sm px-2.5 text-[0.9rem] ${pathname === item.href ? "bg-on-purple font-semibold text-purple-deep" : "text-on-purple-muted hover:text-on-purple"}`}>All {item.label.toLowerCase()}</Link></li>
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} aria-current={pathname === c.href ? "page" : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-sm px-2.5 text-[0.9rem] ${pathname === c.href ? "bg-on-purple font-semibold text-purple-deep" : "text-on-purple-muted hover:text-on-purple"}`}>
                            <Icon name={c.icon} className="size-4 shrink-0" />
                            <span className="truncate">{c.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-svh bg-paper lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <a href="#admin-main" className="fixed left-4 top-4 z-[90] -translate-y-24 rounded-sm bg-gold px-5 py-3 font-semibold text-ink focus:translate-y-0">Skip to the content</a>

      {/* Sidebar on large screens */}
      <aside className="sticky top-0 hidden h-svh flex-col overflow-y-auto bg-purple-deep text-on-purple lg:flex">
        <Brand />
        <div className="flex-1">{nav}</div>
        <Account user={user} signOut={signOut} />
      </aside>

      {/* Top bar and drawer on smaller screens */}
      <div className="lg:contents">
        <header className="sticky top-0 z-40 flex min-h-14 items-center gap-2 border-b border-rule bg-paper px-3 pt-[env(safe-area-inset-top)] lg:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="admin-drawer" className="inline-flex size-11 items-center justify-center rounded-sm border border-rule"><Menu className="size-5" aria-hidden /></button>
          <Link href="/123admin" className="flex min-h-11 min-w-0 flex-1 items-center gap-2 font-extrabold [font-variation-settings:'wdth'_86]"><Image src="/logo-96.png" alt="" width={32} height={32} className="size-8 rounded-full" /><span className="truncate">Christhood team</span></Link>
          <button type="button" onClick={() => setPalette(true)} aria-label="Jump to a screen" className="inline-flex size-11 items-center justify-center rounded-sm border border-rule"><Search className="size-5" aria-hidden /></button>
        </header>

        {open && <div className="fixed inset-0 z-50 bg-ink/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
        <aside id="admin-drawer" hidden={!open} className="fixed inset-y-0 left-0 z-[60] flex w-[min(20rem,88vw)] flex-col overflow-y-auto bg-purple-deep pb-[env(safe-area-inset-bottom)] text-on-purple lg:hidden">
          <div className="flex items-center justify-between pr-2">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-sm hover:bg-on-purple/10"><X className="size-5" aria-hidden /></button>
          </div>
          <div className="flex-1">{nav}</div>
          <Account user={user} signOut={signOut} />
        </aside>

        <div className="min-w-0">
          <div className="hidden items-center justify-end gap-3 border-b border-rule px-8 py-3 lg:flex">
            <button type="button" onClick={() => setPalette(true)} className="inline-flex min-h-10 items-center gap-3 rounded-sm border border-rule px-3 text-[0.92rem] text-muted hover:border-ink hover:text-ink">
              <Search className="size-4" aria-hidden /> Jump to a screen <kbd className="rounded-sm border border-rule px-1.5 text-[0.78rem]">Ctrl K</kbd>
            </button>
            <Link href="/" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-[0.92rem] font-semibold text-purple hover:bg-purple-tint">View the website <ExternalLink className="size-4" aria-hidden /></Link>
          </div>
          <main id="admin-main" className="mx-auto w-full max-w-[72rem] min-[1700px]:max-w-[88rem] px-4 pb-24 pt-8 sm:px-6 lg:px-8 lg:pt-10">{children}</main>
        </div>
      </div>

      <Command.Dialog open={palette} onOpenChange={setPalette} label="Jump to a screen" className="fixed left-1/2 top-[12vh] z-[100] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 border border-ink/30 bg-paper shadow-2xl">
        <Command.Input placeholder="Type a screen name…" className="w-full border-b border-rule bg-paper px-4 py-4 text-base outline-none" />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-muted">Nothing matches that.</Command.Empty>
          {all.map((a) => (
            <Command.Item key={a.href} value={`${a.group} ${a.label}`} onSelect={() => { setPalette(false); router.push(a.href); }} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 data-[selected=true]:bg-purple-tint">
              <Icon name={a.icon} className="size-4 text-purple" />
              <span className="flex-1">{a.label}</span>
              <span className="text-[0.82rem] text-muted">{a.group}</span>
            </Command.Item>
          ))}
        </Command.List>
      </Command.Dialog>

      <Toaster position="bottom-right" toastOptions={{ classNames: { toast: "!rounded-sm !border !border-rule !font-sans" } }} />
    </div>
  );
}

function Brand() {
  return (
    <Link href="/123admin" className="flex items-center gap-3 px-5 py-6">
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
        <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-[0.95rem] font-semibold hover:bg-on-purple/10"><LogOut className="size-[1.15rem]" aria-hidden /> Sign out</button>
      </form>
    </div>
  );
}
