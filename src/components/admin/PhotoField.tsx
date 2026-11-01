"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, RotateCcw, Search, Upload, X } from "lucide-react";
import { btnClass } from "./ui";
import type { MediaItem } from "@/lib/types";

/** Small copy of a picture for previews. Church photos are named; uploads and outside pictures carry their own address. */
export const previewSrc = (src?: string) => (!src ? "" : /^(https?:)?\/\//.test(src) || src.startsWith("/media/") ? src.replace(/\.webp$/, "-sm.webp") : src.startsWith("/") ? src : `/img/${src}-sm.webp`);

type Library = { photos: string[]; uploads: MediaItem[]; host: string };
let cache: Library | null = null;
async function loadLibrary(force = false): Promise<Library> {
  if (cache && !force) return cache;
  const res = await fetch("/api/admin/media", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load the photos.");
  return (cache = await res.json());
}

/** Shrinks a picture in the browser so it fits in one upload, keeping it sharp enough for full-width use. */
async function shrink(file: File, longEdge = 2400): Promise<Blob> {
  if (file.size < 1_500_000 && /image\/(jpeg|webp)/.test(file.type)) return file;
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, longEdge / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  for (const q of [0.92, 0.85, 0.75, 0.65]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
    if (blob && blob.size < 3_800_000) return blob;
  }
  throw new Error("That photo is too large even after shrinking.");
}

type Progress = { name: string; state: "working" | "done" | "error"; message?: string };

export function UploadPanel({ onUploaded }: { onUploaded?: (item: MediaItem) => void }) {
  const [level, setLevel] = useState("natural");
  const [list, setList] = useState<Progress[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const send = useCallback(async (files: File[]) => {
    for (const file of files) {
      const mark = (p: Partial<Progress>) => setList((l) => l.map((x) => (x.name === file.name ? { ...x, ...p } : x)));
      setList((l) => [...l.filter((x) => x.name !== file.name), { name: file.name, state: "working" }]);
      try {
        const body = new FormData();
        body.set("file", await shrink(file), file.name);
        body.set("level", level);
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed.");
        cache = null;
        mark({ state: "done", message: json.item.note });
        onUploaded?.(json.item);
      } catch (e) {
        mark({ state: "error", message: e instanceof Error ? e.message : "Upload failed." });
      }
    }
  }, [level, onUploaded]);

  return (
    <div className="grid gap-5">
      <div>
        <label htmlFor="enhance-level" className="f-label">Clean up</label>
        <select id="enhance-level" value={level} onChange={(e) => setLevel(e.target.value)} className="f-input max-w-sm">
          <option value="natural">Natural: brighten, balance colours, sharpen (recommended)</option>
          <option value="strong">Strong: also add depth to flat, dull photos</option>
          <option value="off">Off: keep the photo exactly as it is</option>
        </select>
        <p className="f-hint">Small photos are enlarged with a sharp resize. This never invents faces or details.</p>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); void send([...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"))); }}
        className={`flex flex-col items-center gap-3 border-2 border-dashed px-6 py-10 text-center ${over ? "border-purple bg-purple-tint" : "border-rule"}`}
      >
        <Upload className="size-8 text-purple" aria-hidden />
        <p className="font-bold">Drop photos here</p>
        <button type="button" onClick={() => input.current?.click()} className={btnClass.purple}>Choose photos</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" multiple className="sr-only" aria-label="Choose photos to upload" onChange={(e) => { void send([...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>
      <ul aria-live="polite" className="grid gap-1 text-[0.95rem]">
        {list.map((p) => (
          <li key={p.name} className="flex items-center gap-2">
            {p.state === "working" ? <Loader2 className="size-4 animate-spin text-purple" aria-hidden /> : p.state === "done" ? <Check className="size-4 text-ok" aria-hidden /> : <X className="size-4 text-danger" aria-hidden />}
            <span className="font-semibold">{p.name}</span>
            <span className={p.state === "error" ? "text-danger" : "text-muted"}>{p.state === "working" ? "Cleaning up and saving…" : p.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Tab = "church" | "mine" | "upload";

/** Chooses a picture for a form: from the church's photos, from uploads, or a new upload. Writes the choice into a hidden field. */
export function PhotoField({ name, label, defaultValue, fallback, hint, focusName, defaultFocus, optional, onChange, bare }: { name: string; label: string; defaultValue?: string; fallback?: string; hint?: string; focusName?: string; defaultFocus?: string; optional?: boolean; onChange?: (src: string) => void; /** Only the button: used when the chosen picture is added to a list. */ bare?: boolean }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [focus, setFocus] = useState(defaultFocus ?? "50% 50%");
  const [lib, setLib] = useState<Library | null>(null);
  const [tab, setTab] = useState<Tab>("church");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const current = value || fallback || "";
  const open = async () => {
    dialog.current?.showModal();
    try { setLib(await loadLibrary(true)); setError(""); } catch { setError("The photos could not be loaded. Check your connection and try again."); }
  };
  const choose = (src: string) => { setValue(bare ? "" : src); onChange?.(src); dialog.current?.close(); };

  useEffect(() => {
    const d = dialog.current;
    const onClick = (e: MouseEvent) => { if (e.target === d) d?.close(); };
    d?.addEventListener("click", onClick);
    return () => d?.removeEventListener("click", onClick);
  }, []);

  const onFocusClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!focusName) return;
    const r = e.currentTarget.getBoundingClientRect();
    setFocus(`${Math.round(((e.clientX - r.left) / r.width) * 100)}% ${Math.round(((e.clientY - r.top) / r.height) * 100)}%`);
  };
  const [fx, fy] = focus.split(" ").map((n) => parseFloat(n));

  const church = (lib?.photos ?? []).filter((n) => n.includes(q.toLowerCase().replace(/\s+/g, "-")));
  const mine = (lib?.uploads ?? []).filter((m) => m.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      {!bare && <p id={`${id}-label`} className="f-label">{label} {optional && <span className="font-normal text-muted">(optional)</span>}</p>}
      {hint && !bare && <p className="f-hint">{hint}</p>}
      {!bare && <input type="hidden" name={name} value={value} />}
      {focusName && <input type="hidden" name={focusName} value={focus} />}
      {bare ? (
        <button type="button" onClick={open} className={btnClass.purple}><ImagePlus className="size-4" aria-hidden /> {label}</button>
      ) : (
      <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-start">
        <div onClick={onFocusClick} className={`relative aspect-[16/10] overflow-hidden bg-paper-2 ${focusName ? "cursor-crosshair" : ""}`}>
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview
            <img src={previewSrc(current)} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: focus }} />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-muted">No picture</span>
          )}
          {focusName && current && <span aria-hidden className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-purple/70 ring-2 ring-purple" style={{ left: `${fx}%`, top: `${fy}%` }} />}
        </div>
        <div className="grid justify-items-start gap-2">
          <button type="button" onClick={open} aria-describedby={`${id}-label`} className={btnClass.purple}><ImagePlus className="size-4" aria-hidden /> Choose a picture</button>
          {fallback && value && value !== fallback && <button type="button" onClick={() => { setValue(""); onChange?.(""); }} className={btnClass.ghost}><RotateCcw className="size-4" aria-hidden /> Use the original</button>}
          {focusName && <p className="f-hint max-w-xs">Click the picture to choose which part stays in view when it is cropped (faces, for example).</p>}
        </div>
      </div>
      )}

      <dialog ref={dialog} aria-labelledby={`${id}-title`} className="m-auto w-[min(60rem,calc(100vw-1.5rem))] max-w-none border border-ink/30 bg-paper p-0 text-ink backdrop:bg-ink/60">
        <div className="flex max-h-[88svh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <h2 id={`${id}-title`} className="text-xl">Choose a picture</h2>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="inline-flex size-11 items-center justify-center hover:bg-paper-2"><X className="size-5" aria-hidden /></button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
            <div role="tablist" aria-label="Where the picture comes from" className="flex gap-1">
              {([["church", "Church photos"], ["mine", "Uploaded"], ["upload", "Upload new"]] as const).map(([t, l]) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-11 px-4 text-[0.95rem] font-semibold ${tab === t ? "bg-purple text-on-purple" : "hover:bg-paper-2"}`}>{l}</button>
              ))}
            </div>
            {tab !== "upload" && (
              <label className="relative ml-auto flex min-w-[10rem] flex-1 items-center sm:max-w-xs">
                <span className="sr-only">Search pictures</span>
                <Search className="pointer-events-none absolute left-3 size-4 text-muted" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="f-input !mt-0 !min-h-11 pl-9" />
              </label>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {error && <p role="alert" className="f-error mb-3">{error}</p>}
            {!lib && !error && <p className="flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Loading photos…</p>}
            {lib && tab === "church" && (
              church.length ? (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {church.map((n) => (
                    <li key={n}>
                      <button type="button" onClick={() => choose(n)} className={`group relative block aspect-[4/3] w-full overflow-hidden bg-paper-2 ${value === n ? "ring-4 ring-purple" : ""}`} aria-label={`Use ${n.replace(/-/g, " ")}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                        <img src={`/img/${n}-sm.webp`} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted">No church photo matches “{q}”.</p>
            )}
            {lib && tab === "mine" && (
              mine.length ? (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {mine.map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => choose(m.url)} className={`group relative block aspect-[4/3] w-full overflow-hidden bg-paper-2 ${value === m.url ? "ring-4 ring-purple" : ""}`} aria-label={`Use ${m.name}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                        <img src={m.small} alt="" loading="lazy" className="size-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted">Nothing uploaded yet. Use “Upload new”.</p>
            )}
            {tab === "upload" && <UploadPanel onUploaded={(item) => { setLib((l) => (l ? { ...l, uploads: [item, ...l.uploads] } : l)); setTab("mine"); }} />}
          </div>
        </div>
      </dialog>
    </div>
  );
}
