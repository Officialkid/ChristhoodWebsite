import Header, { type MenuItem } from "@/components/Header";
import Footer from "@/components/Footer";
import MobileDock from "@/components/MobileDock";
import { site, nav } from "@/content/site";
import { getAnnouncement, getMinistries, getProgrammes, getSettings } from "@/lib/content";

export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, ministries, programmes, banner] = await Promise.all([getSettings(), getMinistries(), getProgrammes(), getAnnouncement()]);

  const menu: MenuItem[] = nav.map((item) => {
    if (item.label === "Ministries")
      return { ...item, children: ministries.map((m) => ({ label: m.title, href: `/ministries/${m.slug}`, blurb: m.audience })) };
    if (item.label === "Programmes")
      return { ...item, children: programmes.map((p) => ({ label: p.title, href: `/programmes/${p.slug}`, blurb: p.audience })) };
    return item;
  });

  const churchLd = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: site.fullName,
    alternateName: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
    telephone: settings.contact.phones[0]?.tel,
    email: settings.contact.email,
    address: { "@type": "PostalAddress", streetAddress: settings.fellowship.address, addressLocality: "Nairobi", addressCountry: "KE" },
    sameAs: site.socials.map((s) => s.href),
  };

  return (
    <>
      <Header menu={menu} portal={site.portal} banner={banner} />
      <main id="main">{children}</main>
      <Footer menu={menu} settings={settings} />
      <MobileDock />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(churchLd) }} />
    </>
  );
}
