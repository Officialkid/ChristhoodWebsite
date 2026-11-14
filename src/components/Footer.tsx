import Link from "next/link";
import Image from "next/image";
import { Globe2 } from "lucide-react";
import { site } from "@/content/site";
import type { SiteSettings } from "@/lib/types";
import { finalGatheringIsUpcoming } from "@/lib/gathering-schedule";

function SocialMark({ name }: { name: string }) {
  const className = "size-5";
  switch (name.toLowerCase()) {
    case "instagram":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
    case "facebook":
      return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor"><path d="M14.2 21v-7.9h2.7l.4-3.1h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.6V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H8v3.1h2.7V21h3.5Z" /></svg>;
    case "youtube":
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none" /></svg>;
    case "tiktok":
      return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor"><path d="M14 3h3c.2 2.2 1.4 3.8 4 4v3c-1.6 0-3-.5-4-1.3v5.8a5.5 5.5 0 1 1-5.5-5.5c.5 0 1 .1 1.5.2v3.2a2.5 2.5 0 1 0 1 2V3Z" /></svg>;
    case "x":
      return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor"><path d="M18.9 1.2h3.7l-8.1 9.2L24 22.9h-7.4l-5.8-7.6-6.6 7.6H.5l8.6-9.8L0 1.2h7.6l5.2 6.9 6.1-6.9Zm-1.3 19.5h2L6.5 3.2h-2l13.1 17.5Z" /></svg>;
    default:
      return <Globe2 className={className} aria-hidden="true" />;
  }
}

const link = "inline-flex min-h-11 items-center text-on-purple-muted underline-offset-4 hover:text-on-purple hover:underline";
const heading = "mb-1 text-[0.9rem] font-bold text-on-purple";

export default function Footer({ settings }: { settings: SiteSettings }) {
  const protocolEmail = process.env.PROTOCOL_EMAIL?.trim();
  const gatheringUpcoming = finalGatheringIsUpcoming(settings.fellowship);

  return (
    <footer className="bg-purple-deep pb-[calc(4rem+env(safe-area-inset-bottom))] pt-7 text-on-purple md:pb-7">
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-on-purple/20 pb-4">
          <div>
            <Link href="/" className="inline-flex min-h-11 items-center gap-3">
              <Image src="/logo-96.png" alt="" width={40} height={40} className="size-10 rounded-full" />
              <span className="text-xl font-extrabold [font-variation-settings:'wdth'_86]">Christhood Ministries</span>
            </Link>
            <p className="mt-0.5 text-sm text-on-purple-muted">{site.mantra.join(" · ")}</p>
          </div>
          <ul aria-label="Christhood social media" className="flex">
            {site.socials.map((social) => (
              <li key={social.name}>
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Christhood on ${social.name} (${social.handle})`} className="inline-flex size-11 items-center justify-center text-on-purple-muted transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-purple">
                  <SocialMark name={social.name} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-x-10 gap-y-5 py-5 sm:grid-cols-2 lg:grid-cols-[0.85fr_1fr_1.35fr]">
          <nav aria-label="Explore Christhood">
            <h2 className={heading}>Explore</h2>
            <ul className="flex flex-wrap gap-x-5">
              <li><Link href="/ministries" className={link}>Ministries</Link></li>
              <li><Link href="/programmes" className={link}>Programmes</Link></li>
              <li><Link href="/camps" className={link}>Camps</Link></li>
              <li><Link href="/events" className={link}>Events</Link></li>
              <li><Link href="/humanitarian" className={link}>Humanitarian work</Link></li>
            </ul>
          </nav>

          <nav aria-label="Ways to connect">
            <h2 className={heading}>Connect</h2>
            <ul className="flex flex-wrap gap-x-5">
              <li><Link href="/visit" className={link}>Plan your visit</Link></li>
              <li><Link href="/prayer" className={link}>Prayer request</Link></li>
              <li><Link href="/ministries/counselling" className={link}>Counselling</Link></li>
              <li><Link href="/give" className={link}>Give</Link></li>
            </ul>
          </nav>

          <address className="not-italic">
            <h2 className={heading}>Visit us</h2>
            <p className="text-on-purple-muted">{gatheringUpcoming ? `Final gathering · 14 November, ${settings.fellowship.display}` : "We plan to meet again in January"}</p>
            <p className="mt-1 text-on-purple-muted">{settings.fellowship.address}</p>
            <ul className="mt-1 flex flex-wrap gap-x-5">
              {settings.contact.phones.map((phone) => <li key={phone.tel}><a href={`tel:${phone.tel}`} className={link}>{phone.display}</a></li>)}
              <li><a href={`mailto:${settings.contact.email}`} className={`${link} break-all`}>{settings.contact.email}</a></li>
              {protocolEmail && <li><a href={`mailto:${protocolEmail}`} className={link}>Email Protocol</a></li>}
            </ul>
          </address>
        </div>

        <div className="flex flex-col gap-1 border-t border-on-purple/20 pt-3 text-sm text-on-purple-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>{site.fullName} ({site.short})</p>
        </div>
      </div>
    </footer>
  );
}
