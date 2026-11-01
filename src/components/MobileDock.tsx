import Link from "next/link";

/** On phones: the three things people come for, always one tap away. */
export default function MobileDock() {
  const item = "flex min-h-14 flex-1 items-center justify-center text-[0.95rem] font-semibold";
  return (
    <nav aria-label="Quick actions" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      <Link href="/#visit" className={`${item} border-r border-rule`}>Visit</Link>
      <Link href="/events" className={`${item} border-r border-rule`}>Events</Link>
      <Link href="/give" className={`${item} bg-gold`}>Give</Link>
    </nav>
  );
}
