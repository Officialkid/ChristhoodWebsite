"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

export type MenuLink = { label: string; href: string; blurb?: string; icon?: string };
export type MenuItem = { label: string; href: string; icon?: string; children?: MenuLink[] };

type Props = {
  menu: MenuItem[];
  portal: { label: string; href: string };
  banner?: { message: string; href?: string; label?: string } | null;
};

/** The first few menus open to the right of their word, the rest open to the left so they never run off the screen. */
const opensLeft = (i: number, count: number) => i >= count - 3;

export default function Header({ menu, portal, banner }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

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

  // Smart hide/show scroll effect
  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > lastScrollTop && scrollTop > 100) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <header className={`sticky top-0 z-50 border-b border-rule bg-paper transition-transform duration-300 ease-in-out ${isHeaderHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <nav aria-label="Main" className="wrap flex h-[4.5rem] items-stretch justify-between gap-6 xl:gap-10">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image src="/logo-96.png" alt="" width={44} height={44} className="size-10 rounded-full" priority />
            <span className="leading-none">
              <span className="block text-[1.35rem] font-extrabold tracking-tight [font-variation-settings:'wdth'_86]">Christhood</span>
              <span className="mt-0.5 block text-[0.8rem] font-semibold text-purple">Ministries<span className="sr-only"> (home)</span></span>
            </span>
          </Link>

          <ul className="hidden items-stretch xl:flex">
            {menu.map((item, i) => {
              const active = isActive(item.href);
              const wide = (item.children?.length ?? 0) > 6;
              return (
                <li key={item.href} className="group relative flex">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative inline-flex items-center gap-1.5 px-3.5 text-[0.95rem] font-semibold transition-colors after:absolute after:inset-x-3.5 after:-bottom-px after:h-[3px] after:origin-left after:bg-purple after:transition-transform after:duration-200 after:ease-out ${active ? "text-purple after:scale-x-100" : "text-ink after:scale-x-0 group-focus-within:text-purple group-focus-within:after:scale-x-100 group-hover:text-purple group-hover:after:scale-x-100"}`}
                  >
                    {item.label}
                    {item.children && <ChevronDown className="size-3.5 opacity-60 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180" aria-hidden />}
                  </Link>
                  {item.children && (
                    <div className={`invisible absolute top-full z-10 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${opensLeft(i, menu.length) ? "right-0" : "left-0"}`}>
                      <div className={`border border-t-[3px] border-rule border-t-purple bg-paper ${wide ? "w-[40rem]" : "w-[23rem]"}`}>
                        <ul className={`grid gap-x-1 p-2 ${wide ? "grid-cols-2" : ""}`}>
                          {item.children.map((c) => (
                            <li key={c.href}>
                              <Link href={c.href} className="block rounded-sm px-3.5 py-2.5 hover:bg-paper-2 focus-visible:bg-paper-2">
                                <span className="block text-[0.95rem] font-semibold leading-snug text-ink">{c.label}</span>
                                {c.blurb && <span className="mt-0.5 block text-[0.84rem] leading-snug text-muted">{c.blurb}</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <Link href={item.href} className="flex items-center justify-between border-t border-rule px-5 py-3 text-[0.9rem] font-semibold text-purple hover:bg-paper-2">
                          All {item.label.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex shrink-0 items-center gap-5 self-center">
            <a href={portal.href} target="_blank" rel="noopener noreferrer" className="hidden min-h-11 items-center gap-1 whitespace-nowrap text-[0.9rem] font-semibold text-muted underline-offset-4 hover:text-purple hover:underline min-[1536px]:inline-flex">{portal.label} <ArrowUpRight className="size-3.5" aria-hidden /></a>
            <Link href="/give" className="hidden min-h-11 items-center rounded-sm bg-gold px-5 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-gold-hover sm:inline-flex">Give</Link>
            
            {/* Upgraded Mobile Menu Toggle Button */}
            <button 
              type="button" 
              className="inline-flex h-11 items-center gap-2 rounded-full border border-purple/20 bg-purple/5 px-4 font-semibold text-purple transition-colors hover:bg-purple/10 xl:hidden" 
              aria-expanded={open} 
              aria-controls="mobile-menu" 
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5 transition-transform duration-200 rotate-90" aria-hidden /> : <Menu className="size-5 transition-transform duration-200" aria-hidden />}
              <span className="text-sm tracking-wide">{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </nav>

        <div id="mobile-menu" hidden={!open} className="absolute inset-x-0 top-full max-h-[calc(100svh-4.5rem)] overflow-y-auto overscroll-contain border-b border-rule bg-paper px-5 pb-28 pt-2 xl:hidden shadow-xl">
          <ul className="mx-auto max-w-lg">
            {menu.map((item) => (
              <li key={item.href} className="border-b border-rule">
                {item.children ? (
                  <details className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-2xl font-extrabold [font-variation-settings:'wdth'_86] [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <ChevronDown className="size-5 text-purple transition group-open:rotate-180" aria-hidden />
                    </summary>
                    <ul className="grid pb-4">
                      <li><Link href={item.href} className="flex min-h-11 items-center gap-2 font-semibold text-purple">All {item.label.toLowerCase()} <ArrowRight className="size-4" aria-hidden /></Link></li>
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block py-2.5">
                            <span className="block font-semibold leading-snug">{c.label}</span>
                            {c.blurb && <span className="mt-0.5 block text-[0.9rem] leading-snug text-muted">{c.blurb}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link href={item.href} className="flex min-h-14 items-center text-2xl font-extrabold [font-variation-settings:'wdth'_86]">{item.label}</Link>
                )}
              </li>
            ))}
            
            {/* Upgraded Mobile Drawer Action Buttons */}
            <li className="grid gap-3 py-8">
              <Link href="/give" className="inline-flex min-h-13 items-center justify-center rounded-md bg-gold px-6 text-base font-bold text-ink shadow-sm transition-transform active:scale-[0.98] hover:bg-gold-hover">
                Give Online / Tithes &amp; Offerings
              </Link>
              <a href={portal.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-between rounded-md border border-purple/20 bg-purple/5 px-6 font-semibold text-purple transition-colors hover:bg-purple/10">
                <span>{portal.label}</span> <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </li>
          </ul>
        </div>
      </header>
    </>
  );
}