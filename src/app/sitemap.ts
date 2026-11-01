import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getMinistries, getProgrammes } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ministries, programmes] = await Promise.all([getMinistries(), getProgrammes()]);
  const fixed = ["", "/about", "/about/mission", "/about/apostle-dennis", "/about/leadership", "/ministries", "/programmes", "/events", "/events/register", "/programmes/branch/register", "/humanitarian", "/give", "/visit", "/prayer"];
  const paths = [...fixed, ...ministries.map((m) => `/ministries/${m.slug}`), ...programmes.map((p) => `/programmes/${p.slug}`)];
  return paths.map((p) => ({ url: `${site.url}${p}`, changeFrequency: p === "" || p === "/events" ? "weekly" : "monthly", priority: p === "" ? 1 : p.split("/").length > 2 ? 0.6 : 0.8 }));
}
