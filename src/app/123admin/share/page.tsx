import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import ShareLinks from "@/components/admin/ShareLinks";
import { PageTitle } from "@/components/admin/ui";
import { site } from "@/content/site";

export const metadata = { title: "Share links and QR codes" };

export default async function SharePage() {
  await requireUser();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (host ? `${proto}://${host}` : site.url);
  const items = [
    { title: "Plan your visit", blurb: "What to expect, and who will welcome you. For the bulletin and invitations.", url: `${base}/visit` },
    { title: "Prayer request", blurb: "For the prayer corner and the screen after service.", url: `${base}/prayer` },
    { title: "Thanksgiving", blurb: "For testimonies and thanksgiving Sundays.", url: `${base}/prayer?type=thanksgiving` },
    { title: "Events", blurb: "Camps, mentorship seasons and gatherings.", url: `${base}/events` },
    { title: "Give", blurb: "Paybill and account details.", url: `${base}/give` },
    { title: "The church website", blurb: "For posters and social media.", url: base },
  ];
  return (
    <>
      <PageTitle title="Share links and QR codes" icon="qr" lead="Print a code and put it where people will see it. Visitors scan it with their phone camera and land on the right page." />
      <div className="mt-8"><ShareLinks items={items} /></div>
    </>
  );
}
