"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

type Photo = { id: string; caption?: string; createdAt: string; by: string; src: string };

export function CampPhotoManager({ applicationId, childName, canShare }: { applicationId: string; childName: string; canShare: boolean }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/camps/photos?applicationId=${encodeURIComponent(applicationId)}`, { cache: "no-store" });
      const body = await res.json() as { photos?: Photo[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Photos could not be loaded.");
      setPhotos(body.photos ?? []);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Photos could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void refresh(); }, [refresh]);

  async function addPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage("");
    const data = new FormData(form);
    data.set("applicationId", applicationId);
    try {
      const res = await fetch("/api/admin/camps/photos", { method: "POST", body: data });
      const body = await res.json() as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "The photo could not be saved.");
      form.reset();
      await refresh();
      setMessage("Private photo added to the family page.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photo: Photo) {
    if (!window.confirm(`Remove this photo from ${childName}'s family page?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/camps/photos/${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      const body = await res.json() as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "The photo could not be removed.");
      setMessage("Photo removed from the family page.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The photo could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="private-photos" className="border-t border-rule pt-8">
      <h2 id="private-photos" className="text-xl">Photos for this family</h2>
      <p className="mt-2 max-w-2xl text-muted">Photos are resized, encrypted in the camp database and shown only to this child&apos;s signed-in family. They are not added to the public website photo library.</p>
      {!canShare ? (
        <p className="mt-5 border border-rule p-4 text-muted">The parent must first link this application to a verified family page and allow photos.</p>
      ) : (
        <form onSubmit={addPhoto} className="mt-5 grid max-w-xl gap-4">
          <label className="grid gap-2 text-[0.95rem] font-semibold">Choose a photo
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="f-input file:mr-3 file:rounded-sm file:border-0 file:bg-paper file:px-3 file:py-2 file:font-semibold" />
          </label>
          <label className="grid gap-2 text-[0.95rem] font-semibold">Optional caption
            <input name="caption" maxLength={160} className="f-input" placeholder="A moment from camp" />
          </label>
          <div><button disabled={busy} className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-gold px-5 font-bold text-ink disabled:opacity-60"><ImagePlus className="size-4" aria-hidden />{busy ? "Saving…" : "Share privately with this family"}</button></div>
        </form>
      )}
      {message && <p role="status" className="mt-4 text-muted">{message}</p>}
      {loading ? <p className="mt-5 text-muted">Loading family photos…</p> : photos.length === 0 ? <p className="mt-5 text-muted">No photos have been shared yet.</p> : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden border border-rule">
              <img src={photo.src} alt={photo.caption || `${childName} at camp`} className="aspect-square w-full object-cover" />
              <div className="flex items-start justify-between gap-2 p-3">
                <p className="min-w-0 text-sm">{photo.caption || "Camp photo"}<span className="block text-muted">Shared by {photo.by}</span></p>
                <button type="button" disabled={busy} onClick={() => void removePhoto(photo)} aria-label={`Remove photo of ${childName}`} className="inline-flex size-10 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-danger-tint hover:text-danger disabled:opacity-50"><Trash2 className="size-4" aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
