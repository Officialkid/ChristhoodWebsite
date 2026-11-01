"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X, ArrowUpRight, ArrowRight } from "lucide-react";
import { Icon } from "./icons";

export type MenuLink = { label: string; href: string; blurb?: string; icon?: string };
export type MenuItem = { label: string; href: string; icon?: string; children?: MenuLink[] };

type Props = {
  menu: MenuItem[];
  portal: { label: string; href: string };
  banner?: { message: string; href?: string; label?: string } | null;
};

export default function Header({ menu, portal, banner }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <a href="#main" className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-sm bg-gold px-5 py-3 font-semibold text-ink focus:translate-y-0">Skip to the content</a>
      {banner && (
        <div className="bg-purple text-on-purple">
          <div className="wrap flex min-h-11 flex-wrap items-center justify-center gap-x-4 py-2 text-center text-[0.95rem]">
            <span>{banner.message}</span>
            {banner.href && <Link href={banner.href} className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">{banner.label || "Learn more"} <ArrowUpRight className="size-4" aria-hidden /></Link>}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-rule bg-paper">
        <nav aria-label="Main" className="wrap flex h-[4.5rem] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-96.png" alt="" width={44} height={44} className="size-10 rounded-full" priority />
            <span className="leading-none">
              <span className="block text-[1.35rem] font-extrabold tracking-tight [font-variation-settings:'wdth'_86]">Christhood</span>
              <span className="mt-0.5 block text-[0.8rem] font-semibold text-purple">Ministries<span className="sr-only"> (home)</span></span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 xl:flex">
            {menu.map((item) => (
              <li key={item.href} className="group relative">
                <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-1 px-3.5 text-[0.95rem] font-semibold underline-offset-[10px] hover:underline decoration-2 ${isActive(item.href) ? "text-purple underline" : "text-ink"}`}>
                  <Icon name={item.icon} className="size-4 text-purple" />{item.label}
                  {item.children && <ChevronDown className="size-3.5" aria-hidden />}
                </Link>
                {item.children && (
                  <div className="invisible absolute left-0 top-full z-10 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className={`border border-rule bg-paper p-2 ${item.children.length > 6 ? "grid w-[36rem] grid-cols-2" : "w-[21rem]"}`}>
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="group/i flex items-start gap-3 rounded-sm px-3 py-2.5 hover:bg-paper-2">
                            <Icon name={c.icon} className="mt-0.5 size-[1.15rem] shrink-0 text-purple" />
                            <span><span className="block text-[0.95rem] font-semibold leading-snug group-hover/i:text-purple">{c.label}</span>{c.blurb && <span className="mt-0.5 block text-[0.82rem] leading-snug text-muted">{c.blurb}</span>}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <a href={portal.href} target="_blank" rel="noopener noreferrer" className="hidden min-h-11 items-center gap-1 whitespace-nowrap text-[0.9rem] font-semibold text-muted underline-offset-4 hover:text-purple hover:underline min-[1600px]:inline-flex">{portal.label} <ArrowUpRight className="size-3.5" aria-hidden /></a>
            <Link href="/give" className="hidden min-h-11 items-center rounded-sm bg-gold px-5 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-gold-hover sm:inline-flex">Give</Link>
            <button type="button" className="inline-flex size-11 items-center justify-center rounded-sm border border-rule xl:hidden" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <div id="mobile-menu" hidden={!open} className="absolute inset-x-0 top-full max-h-[calc(100svh-4.5rem)] overflow-y-auto overscroll-contain border-b border-rule bg-paper px-5 pb-28 pt-2 xl:hidden">
          <ul className="mx-auto max-w-lg">
            {menu.map((item) => (
              <li key={item.href} className="border-b border-rule">
                {item.children ? (
                  <details className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-2xl font-extrabold [font-variation-settings:'wdth'_86] [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-3"><Icon name={item.icon} className="size-6 text-purple" />{item.label}</span><ChevronDown className="size-5 transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="grid pb-3">
                      <li><Link href={item.href} className="flex min-h-11 items-center gap-3 font-semibold text-purple"><ArrowRight className="size-4" aria-hidden />All {item.label.toLowerCase()}</Link></li>
                      {item.children.map((c) => <li key={c.href}><Link href={c.href} className="flex min-h-11 items-center gap-3 text-muted"><Icon name={c.icon} className="size-4 shrink-0 text-purple" />{c.label}</Link></li>)}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="flex min-h-14 items-center gap-3 text-2xl font-extrabold [font-variation-settings:'wdth'_86]"><Icon name={item.icon} className="size-6 text-purple" />{item.label}</Link>
                )}
              </li>
            ))}
            <li className="py-5"><a href={portal.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-purple">{portal.label} <ArrowUpRight className="size-4" aria-hidden /></a></li>
          </ul>
        </div>
      </header>
    </>
  );
}
