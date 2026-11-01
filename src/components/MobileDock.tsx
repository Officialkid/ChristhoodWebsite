"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, HandCoins, HandHeart, UserPlus } from "lucide-react";

const items = [
  { href: "/visit", label: "I'm new", Icon: UserPlus },
  { href: "/events", label: "Events", Icon: CalendarDays },
  { href: "/prayer", label: "Pray", Icon: HandHeart },
  { href: "/give", label: "Give", Icon: HandCoins },
];

/** On phones: the things people come for, always one tap away. */
export default function MobileDock() {
  const path = usePathname();
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ href, label, Icon }) => {
        const active = path === href || path.startsWith(`${href}/`);
        const give = href === "/give";
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[0.78rem] font-semibold leading-none ${give ? "bg-gold text-ink" : active ? "text-purple" : "text-ink"}`}>
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
