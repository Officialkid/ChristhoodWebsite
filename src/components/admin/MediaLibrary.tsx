"use client";

import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia } from "@/app/123admin/actions-content";
import { DeleteButton } from "./forms";
import { UploadPanel } from "./PhotoField";
import { formatStamp } from "@/lib/time";
import type { MediaItem } from "@/lib/types";

export default function MediaLibrary({ items, host }: { items: MediaItem[]; host: string }) {
  const router = useRouter();
  return (
    <div className="grid gap-12">
      <section aria-labelledby="up">
        <h2 id="up" className="text-2xl">Add photos</h2>
        <div className="mt-4 max-w-3xl"><UploadPanel onUploaded={() => router.refresh()} /></div>
        <p className="f-hint mt-4 max-w-3xl">{host === "blob" ? "Photos are kept on the connected photo host." : host === "database" ? "Photos are kept in the church's database. Connect a photo host in the hosting settings if you expect thousands of photos." : "Photos are kept on this computer while the site runs locally."}</p>
      </section>

      <section aria-labelledby="mine">
        <h2 id="mine" className="text-2xl">Uploaded photos <span className="text-muted">({items.length})</span></h2>
        {items.length === 0 ? (
          <p className="mt-4 text-muted">Nothing uploaded yet. The church&apos;s own photos are always available when you choose a picture.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-8 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <li key={m.id}>
                <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                  <img src={m.small} alt="" loading="lazy" className="size-full object-cover" />
                </div>
                <p className="mt-2 truncate font-bold">{m.name}</p>
                <p className="text-[0.88rem] text-muted">{m.w}×{m.h} · {Math.round(m.bytes / 1024)} KB · {m.note}</p>
                <p className="text-[0.88rem] text-muted">{m.by}, {formatStamp(m.createdAt)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={async () => { await navigator.clipboard.writeText(m.url.startsWith("/") ? `${location.origin}${m.url}` : m.url); toast.success("Link copied."); }} className="inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-[0.95rem] font-semibold text-purple hover:bg-purple-tint"><Copy className="size-4" aria-hidden /> Copy link</button>
                  <DeleteButton action={async (fd) => { const r = await deleteMedia(fd); if (r.ok) { toast.success(r.message ?? ""); router.refresh(); } return r; }} fields={{ id: m.id }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
