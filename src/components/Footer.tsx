import Link from "next/link";
import Image from "next/image";
import { site } from "@/content/site";
import type { SiteSettings } from "@/lib/types";
import type { MenuItem } from "./Header";

export default function Footer({ menu, settings }: { menu: MenuItem[]; settings: SiteSettings }) {
  const col = (label: string) => menu.find((m) => m.label === label);
  const link = "block py-1.5 text-on-purple-muted underline-offset-4 hover:text-on-purple hover:underline";
  const head = "mb-3 text-[0.9rem] font-bold text-on-purple";
  return (
    <footer className="bg-purple-deep pb-24 pt-16 text-on-purple md:pb-12">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="" width={48} height={48} className="size-12 rounded-full" />
              <span className="text-2xl font-extrabold [font-variation-settings:'wdth'_86]">Christhood Ministries</span>
            </Link>
            <p className="mt-6 max-w-sm font-serif text-xl leading-snug text-on-purple-muted">“{site.scripture.text}”<span className="mt-1 block font-sans text-base font-semibold text-on-purple">{site.scripture.ref}</span></p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <nav aria-label="Ministries">
              <h3 className={head}>Ministries</h3>
              {col("Ministries")?.children?.map((c) => <Link key={c.href} href={c.href} className={link}>{c.label}</Link>)}
            </nav>
            <nav aria-label="Programmes and about">
              <h3 className={head}>Programmes</h3>
              {col("Programmes")?.children?.map((c) => <Link key={c.href} href={c.href} className={link}>{c.label}</Link>)}
              <h3 className={`${head} mt-7`}>About</h3>
              {col("About")?.children?.map((c) => <Link key={c.href} href={c.href} className={link}>{c.label}</Link>)}
              <Link href="/humanitarian" className={link}>Humanitarian</Link>
              <Link href="/events" className={link}>Events</Link>
              <Link href="/give" className={link}>Give</Link>
            </nav>
            <address className="not-italic">
              <h3 className={head}>Visit us</h3>
              <p className="text-on-purple-muted">Every {settings.fellowship.day}, {settings.fellowship.display}</p>
              <p className="mt-2 text-on-purple-muted">{settings.fellowship.address}</p>
              <p className="mt-4">{settings.contact.phones.map((p) => <a key={p.tel} href={`tel:${p.tel}`} className={link}>{p.display}</a>)}</p>
              <a href={`mailto:${settings.contact.email}`} className={`${link} break-all`}>{settings.contact.email}</a>
              <h3 className={`${head} mt-7`}>Follow</h3>
              <ul>{site.socials.map((s) => <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>{s.name}</a></li>)}</ul>
            </address>
          </div>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-on-purple/20 pt-6 text-sm text-on-purple-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>{site.fullName} ({site.short})</p>
        </div>
      </div>
    </footer>
  );
}
