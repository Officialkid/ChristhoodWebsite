import { resolvePhoto } from "@/lib/images";
import { DirectoryView } from "./Interactive";
import { pageIcon } from "./icons";
import type { PageDoc } from "@/lib/types";

/** Server-side wrapper: resolves photo sizes here so the browser receives only what it shows. */
export default function Directory({ pages, base, showAudience }: { pages: PageDoc[]; base: string; showAudience?: boolean }) {
  return (
    <DirectoryView
      items={pages.map((p) => ({
        href: `${base}/${p.slug}`,
        title: p.title,
        meta: showAudience ? p.audience : undefined,
        summary: p.summary,
        photo: resolvePhoto(p.hero),
        icon: pageIcon[p.slug],
      }))}
    />
  );
}
