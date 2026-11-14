"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia } from "@/app/123admin/actions-content";
import { DeleteButton } from "./forms";
import { UploadPanel } from "./PhotoField";
import ImmichWorkspace from "./ImmichWorkspace";
import { formatStamp } from "@/lib/time";
import type { MediaItem } from "@/lib/types";

export default function MediaLibrary({
  items,
  host,
  immichConfigured,
  immichWebUrl,
  cloudinaryConfigured,
  canSave,
}: {
  items: MediaItem[];
  host: string;
  immichConfigured: boolean;
  immichWebUrl: string | null;
  cloudinaryConfigured: boolean;
  canSave: boolean;
}) {
  const router = useRouter();
  const [websitePickerOpen, setWebsitePickerOpen] = useState(false);
  return (
    <div className="grid gap-8">
      {immichWebUrl ? (
        <section aria-labelledby="immich-library-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="immich-library-title" className="text-2xl">Photo archive</h2>
              <p className="mt-1 text-sm text-muted">Manage and browse the full photo library here.</p>
            </div>
            <a href={immichWebUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-purple underline-offset-4 hover:underline">
              Open archive in a new tab <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <iframe
            src={immichWebUrl}
            title="Immich photo archive"
            allow="fullscreen"
            referrerPolicy="no-referrer"
            className="block h-[76dvh] min-h-64 max-h-[72rem] w-full border border-rule bg-paper"
          />
          <p className="mt-2 max-w-3xl text-sm text-muted">Sign in with your photo-library account inside the archive. To use a photo on the website, choose it below and add a copy to Cloudinary.</p>
          {immichConfigured && (
            <details className="mt-5 border-t border-rule pt-4" onToggle={(event) => setWebsitePickerOpen(event.currentTarget.open)}>
              <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-purple">Choose photos for the website</summary>
              {websitePickerOpen && <div className="mt-4">
                <ImmichWorkspace
                  connected
                  canSave={canSave}
                  cloudinaryConfigured={cloudinaryConfigured}
                  onImported={() => router.refresh()}
                />
              </div>}
            </details>
          )}
        </section>
      ) : (
        <ImmichWorkspace
          connected={immichConfigured}
          canSave={canSave}
          cloudinaryConfigured={cloudinaryConfigured}
          onImported={() => router.refresh()}
        />
      )}

      <section aria-labelledby="up">
        <h2 id="up" className="text-2xl">Add a website photo</h2>
        <div className="mt-4 max-w-3xl"><UploadPanel onUploaded={() => router.refresh()} /></div>
        <p className="f-hint mt-4 max-w-3xl">{host === "blob" ? "Photos are kept on the connected photo host." : host === "database" ? "Photos are kept in the church's database. Connect a photo host in the hosting settings if you expect thousands of photos." : "Photos are kept on this computer while the site runs locally."}</p>
      </section>

      <section aria-labelledby="mine">
        <h2 id="mine" className="text-2xl">Website photos <span className="text-muted">({items.length})</span></h2>
        {items.length === 0 ? (
          <p className="mt-4 text-muted">No extra website photos yet. The church&apos;s existing pictures are available when you choose a page picture.</p>
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
