"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ChevronRight, CircleAlert, CircleCheck, ExternalLink, Loader2, Maximize2, Minimize2, Monitor, PencilLine, RotateCcw, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { resetSlot, saveHome, saveSlot } from "@/app/123admin/actions-content";
import type { EditorMessage, HomeDraft, StudioMessage } from "@/components/home/studio";
import { Icon } from "../icons";
import { Field, FieldGroup } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SaveButton, useSave } from "./forms";
import { PhotoField } from "./PhotoField";
import { btnClass } from "./ui";
import { HeaderSlot, useGuard } from "./workspace";

export type StudioSlot = { key: string; label: string; fallback?: string; focus?: string; src?: string; changed?: string };
type Props = { initial: HomeDraft & { kicker: string }; slots: StudioSlot[]; canSave: boolean };

/* ---------- the parts of the home page ---------- */

type Part = { id: string; label: string; icon: string; note: string; edit?: boolean; slot?: string; link?: { href: string; label: string } };
const PARTS: Part[] = [
  { id: "hero", label: "Top of the page", icon: "home", edit: true, slot: "home.hero", note: "The first thing a visitor reads: the big headline, the line under it and the picture." },
  { id: "schedule", label: "Gathering times", icon: "calendar", note: "The day, time and place come from Church details, so they stay the same everywhere on the website.", link: { href: "/123admin/settings", label: "Open Church details" } },
  { id: "welcome", label: "Welcome", icon: "heart", edit: true, slot: "home.welcome", note: "The words of welcome beside the large picture." },
  { id: "verse", label: "Word for the week", icon: "book", edit: true, note: "The scripture shown as a short film. Change it every week." },
  { id: "ministries", label: "Ministries", icon: "church", note: "The list of ministries is kept with each department's own page.", link: { href: "/123admin/pages", label: "Open the departments" } },
  { id: "programmes", label: "Programmes", icon: "sprout", note: "Programmes are kept with each department's own page.", link: { href: "/123admin/pages", label: "Open the departments" } },
  { id: "events", label: "Upcoming events", icon: "calendar", note: "The next three events are taken from the events list.", link: { href: "/123admin/events", label: "Open Events" } },
  { id: "camps", label: "Camp applications", icon: "tent", note: "This band appears by itself while a camp is taking applications.", link: { href: "/123admin/camps", label: "Open camp applications" } },
  { id: "humanitarian", label: "Humanitarian wing", icon: "helping", slot: "home.humanitarian", note: "The words here are part of the website itself. The picture can be changed." },
  { id: "stories", label: "In their words", icon: "quote", note: "Stories from members and campers.", link: { href: "/123admin/people", label: "Open Leaders and stories" } },
  { id: "watch", label: "Watch online", icon: "play", slot: "home.watch", note: "Shows your latest message when there is one, and the picture below when there is not.", link: { href: "/123admin/messages", label: "Open Messages to watch" } },
  { id: "connect", label: "New here, or need prayer?", icon: "guest", note: "Four fixed ways to get in touch. The wording is part of the website itself." },
  { id: "give", label: "Give", icon: "give", note: "The bank, paybill and account number come from Church details.", link: { href: "/123admin/settings", label: "Open Church details" } },
  { id: "visit", label: "Plan your visit", icon: "map", note: "The address and phone numbers come from Church details.", link: { href: "/123admin/settings", label: "Open Church details" } },
];

const DEVICES = {
  desktop: { label: "Desktop", width: 1280, Icon: Monitor },
  tablet: { label: "Tablet", width: 820, Icon: Tablet },
  mobile: { label: "Mobile", width: 390, Icon: Smartphone },
} as const;
type Device = keyof typeof DEVICES;

/* ---------- checking what was typed ---------- */

const LIMITS = { headline: 60, sub: 240, verse: 400, ref: 60, kicker: 140 } as const;
type Values = HomeDraft & { kicker: string };

function check(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  if (v.headline.trim().length < 3) e.headline = "The big headline cannot be empty. Use at least three letters.";
  else if (v.headline.length > LIMITS.headline) e.headline = `Keep it to ${LIMITS.headline} characters.`;
  if (v.sub.length > LIMITS.sub) e.sub = `Keep it to ${LIMITS.sub} characters.`;
  if (v.kicker.length > LIMITS.kicker) e.kicker = `Keep it to ${LIMITS.kicker} characters.`;
  if (v.verse.length > LIMITS.verse) e.verse = `Keep it to ${LIMITS.verse} characters.`;
  if (v.ref.length > LIMITS.ref) e.ref = `Keep it to ${LIMITS.ref} characters.`;
  if (!v.welcome.trim()) e.welcome = "Write at least one paragraph of welcome.";
  return e;
}

const wide = (cb: () => void) => { const m = matchMedia("(min-width: 1024px)"); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

export default function HomeStudio({ initial, slots, canSave }: Props) {
  const guard = useGuard();
  const router = useRouter();
  const desktop = useSyncExternalStore(wide, () => matchMedia("(min-width: 1024px)").matches, () => true);
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const form = useRef<HTMLFormElement>(null);

  const [saved, setSaved] = useState<Values>(initial);
  const [values, setValues] = useState<Values>(saved);
  const [selected, setSelected] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [full, setFull] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [ready, setReady] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const [discard, setDiscard] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const submitted = useRef<Values>(saved);
  const { run, pending, state, errors: serverErrors } = useSave(saveHome, () => {
    setSaved(submitted.current);
    setSavedAt(new Date());
  });
  const act = (fd: FormData) => { submitted.current = values; run(fd); };

  const dirty = (Object.keys(values) as (keyof Values)[]).some((k) => values[k] !== saved[k]);
  const problems = useMemo(() => check(values), [values]);
  const blocked = Object.keys(problems).length > 0;
  const failed = !pending && !!state.stamp && !state.ok;

  useEffect(() => { guard.setDirty(dirty); }, [dirty]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => guard.setDirty(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const choose = useCallback((id: string | null) => { setSelected(id); if (id) setSheet(true); }, []);

  /* the page in the frame: send it what is typed, hear which part was clicked */
  useEffect(() => {
    const onMessage = (e: MessageEvent<StudioMessage>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.source !== "ch-studio") return;
      if (e.data.type === "ready") setReady(true);
      if (e.data.type === "select") choose(e.data.id);
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [choose]);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const draft: Partial<HomeDraft> = { headline: values.headline, sub: values.sub, verse: values.verse, ref: values.ref, welcome: values.welcome };
      const m: EditorMessage = { source: "ch-studio", type: "state", draft, selected };
      frame.current?.contentWindow?.postMessage(m, location.origin);
    }, 120);
    return () => clearTimeout(t);
  }, [ready, values, selected, frameKey]);

  /* Ctrl S saves; fullscreen follows the browser's own */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !blocked && canSave && !pending) form.current?.requestSubmit();
        else if (blocked) toast.error("Fix the highlighted words first.");
      }
      if (e.key === "Escape" && full) setFull(false);
    };
    const onFull = () => { if (!document.fullscreenElement) setFull(false); };
    addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFull);
    return () => { removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFull); };
  }, [dirty, blocked, canSave, pending, full]);
  const toggleFull = () => {
    const next = !full;
    setFull(next);
    if (next) root.current?.requestFullscreen?.().catch(() => { /* the window-sized view is used instead */ });
    else if (document.fullscreenElement) void document.exitFullscreen();
  };

  const reload = () => { setReady(false); setFrameKey((k) => k + 1); };
  const pictureChanged = () => { reload(); router.refresh(); };
  const part = PARTS.find((p) => p.id === selected) ?? null;

  const controls = (
    <>
      <Sizes device={device} setDevice={setDevice} />
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" onClick={toggleFull} aria-pressed={full} aria-label={full ? "Leave full screen" : "Preview in full screen"} className="inline-flex size-10 items-center justify-center rounded-sm text-ink hover:bg-purple-tint">
            {full ? <Minimize2 className="size-[1.1rem]" aria-hidden /> : <Maximize2 className="size-[1.1rem]" aria-hidden />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{full ? "Leave full screen (Esc)" : "Preview in full screen"}</TooltipContent>
      </Tooltip>
    </>
  );
  const status = <SaveBar dirty={dirty} blocked={blocked} pending={pending} failed={failed} message={state.message} canSave={canSave} savedAt={savedAt} problems={Object.keys(problems).length} onDiscard={() => setDiscard(true)} />;

  const inspector = (
    <Inspector
      part={part}
      values={values}
      set={set}
      errors={{ ...serverErrors, ...problems }}
      slots={slots}
      onChoose={choose}
      onPicture={pictureChanged}
    />
  );

  return (
    <div ref={root} className={cn("relative flex h-full min-h-0 flex-col bg-paper", full && "fixed inset-0 z-[80]")}>
      {!full && <HeaderSlot slot="center"><div className="hidden items-center gap-1 md:flex">{controls}</div></HeaderSlot>}
      {!full && <HeaderSlot slot="end">{status}</HeaderSlot>}

      <form ref={form} id="home-form" action={act} className="hidden">
        <input type="hidden" name="headline" value={values.headline} />
        <input type="hidden" name="sub" value={values.sub} />
        <input type="hidden" name="kicker" value={values.kicker} />
        <input type="hidden" name="verse" value={values.verse} />
        <input type="hidden" name="ref" value={values.ref} />
        <input type="hidden" name="welcome" value={values.welcome} />
      </form>

      {full && (
        <div className="flex min-h-14 items-center gap-2 border-b border-rule bg-paper px-3">
          <p className="min-w-0 flex-1 truncate font-bold">Home page preview</p>
          {controls}
          {status}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {desktop && !full ? (
          <ResizablePanelGroup orientation="horizontal" className="h-full">
            <ResizablePanel defaultSize="72" minSize="45"><Canvas device={device} frameRef={frame} frameKey={frameKey} ready={ready} onReload={reload} /></ResizablePanel>
            <ResizableHandle label="Resize the editing panel" />
            <ResizablePanel defaultSize="28" minSize="22" maxSize="42" className="bg-paper"><div className="h-full overflow-y-auto">{inspector}</div></ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="relative h-full">
            <Canvas device={device} frameRef={frame} frameKey={frameKey} ready={ready} onReload={reload} />
            {!full && (
              <button type="button" onClick={() => setSheet(true)} className={cn(btnClass.purple, "absolute bottom-3 left-3")}>
                <PencilLine className="size-4" aria-hidden /> Edit the page
              </button>
            )}
          </div>
        )}
      </div>

      {!desktop && !full && (
        <Sheet open={sheet} onOpenChange={setSheet}>
          <SheetContent side="bottom" className="overflow-y-auto bg-paper text-ink pb-[env(safe-area-inset-bottom)]" closeLabel="Close the editor">
            <SheetTitle className="sr-only">Edit the home page</SheetTitle>
            <SheetDescription className="sr-only">Choose a part of the page, then change its words or picture.</SheetDescription>
            {inspector}
          </SheetContent>
        </Sheet>
      )}

      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent>
          <DialogTitle>Discard your changes?</DialogTitle>
          <DialogDescription>The words go back to what is on the website now. This cannot be undone.</DialogDescription>
          <DialogFooter>
            <button type="button" onClick={() => setDiscard(false)} className={btnClass.primary} autoFocus>Keep editing</button>
            <button type="button" onClick={() => { setValues(saved); setDiscard(false); toast.success("Changes discarded."); }} className={btnClass.secondary}>Discard changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- header controls ---------- */

function Sizes({ device, setDevice }: { device: Device; setDevice: (d: Device) => void }) {
  return (
    <div role="group" aria-label="Preview size" className="flex items-center border border-rule">
      {(Object.keys(DEVICES) as Device[]).map((d) => {
        const { label, width, Icon: Mark } = DEVICES[d];
        return (
          <Tooltip key={d}>
            <TooltipTrigger asChild>
              <button type="button" aria-pressed={device === d} aria-label={`${label} preview, ${width} pixels wide`} onClick={() => setDevice(d)} className={cn("inline-flex size-10 items-center justify-center", device === d ? "bg-purple text-on-purple" : "text-ink hover:bg-purple-tint")}>
                <Mark className="size-[1.1rem]" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label} · {width}px</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function SaveBar({ dirty, blocked, pending, failed, message, canSave, savedAt, problems, onDiscard }: { dirty: boolean; blocked: boolean; pending: boolean; failed: boolean; message?: string; canSave: boolean; savedAt: Date | null; problems: number; onDiscard: () => void }) {
  let text: React.ReactNode;
  let tone = "text-muted";
  if (!canSave) { text = "Saving is not switched on yet"; tone = "text-danger"; }
  else if (pending) text = <><Loader2 className="size-4 animate-spin" aria-hidden /> Saving…</>;
  else if (blocked) { text = <><CircleAlert className="size-4" aria-hidden /> Fix {problems === 1 ? "1 thing" : `${problems} things`} to save</>; tone = "text-danger"; }
  else if (failed && dirty) { text = <><CircleAlert className="size-4" aria-hidden /> {message ?? "Could not save"}</>; tone = "text-danger"; }
  else if (dirty) { text = <><span aria-hidden className="size-2 rounded-full bg-purple" /> Unsaved changes</>; tone = "text-ink"; }
  else text = <><CircleCheck className="size-4 text-ok" aria-hidden /> {savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "All saved"}</>;
  return (
    <div className="flex items-center gap-2">
      <p role="status" aria-live="polite" className={cn("flex items-center gap-1.5 text-[0.9rem] font-semibold max-md:sr-only", tone)}>{text}</p>
      {dirty && !pending && <button type="button" onClick={onDiscard} className={cn(btnClass.ghost, "max-sm:hidden")}><RotateCcw className="size-4" aria-hidden /> Discard</button>}
      <button type="submit" form="home-form" disabled={!dirty || blocked || pending || !canSave} aria-keyshortcuts="Control+S" className={btnClass.primary}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

/* ---------- the website, as visitors see it ---------- */

function Canvas({ device, frameRef, frameKey, ready, onReload }: { device: Device; frameRef: React.RefObject<HTMLIFrameElement | null>; frameKey: number; ready: boolean; onReload: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [late, setLate] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    setLate(false);
    if (ready) return;
    const t = setTimeout(() => setLate(true), 15000);
    return () => clearTimeout(t);
  }, [ready, frameKey]);

  const dw = DEVICES[device].width;
  const gap = device === "desktop" ? 0 : 20;
  const scale = size.w ? Math.min(1, (size.w - gap * 2) / dw) : 1;
  const height = Math.max(0, size.h - gap * 2);
  return (
    <div ref={box} className="relative flex h-full justify-center overflow-hidden bg-paper-2" style={{ paddingBlock: gap }}>
      <div className={cn("relative shrink-0 overflow-hidden bg-paper", device !== "desktop" && "border border-rule")} style={{ width: dw * scale, height }}>
        <iframe
          key={frameKey}
          ref={frameRef}
          src="/studio/home"
          title="The home page, as visitors see it. Click a part to edit it."
          tabIndex={-1}
          className="absolute left-0 top-0 border-0"
          style={{ width: dw, height: scale ? height / scale : height, transform: `scale(${scale})`, transformOrigin: "0 0" }}
        />
        {!ready && (
          <div role="status" className="absolute inset-0 grid place-content-center justify-items-center gap-3 bg-paper px-6 text-center">
            {late ? (
              <>
                <p className="font-bold">The page is taking a long time to open.</p>
                <button type="button" onClick={onReload} className={btnClass.secondary}>Try again</button>
              </>
            ) : <p className="flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Opening the home page…</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- the properties panel ---------- */

type Errors = Partial<Record<string, string>>;
type InspectorProps = { part: Part | null; values: Values; set: (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; errors: Errors; slots: StudioSlot[]; onChoose: (id: string | null) => void; onPicture: () => void };

function Inspector({ part, values, set, errors, slots, onChoose, onPicture }: InspectorProps) {
  const slot = part?.slot ? slots.find((s) => s.key === part.slot) : undefined;
  return (
    <div className="px-5 pb-10 pt-5">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={part?.id ?? "outline"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
          {!part ? (
            <>
              <h2 className="text-[1.15rem] leading-snug">Home page</h2>
              <p className="mt-1 text-[0.95rem] text-muted">Click a part of the page, or choose one here. Parts with a pencil can be edited right now.</p>
              <ul className="mt-4 border-t border-rule">
                {PARTS.map((p) => (
                  <li key={p.id} className="border-b border-rule">
                    <button type="button" onClick={() => onChoose(p.id)} className="flex min-h-12 w-full items-center gap-3 px-1 text-left hover:bg-paper-2">
                      <Icon name={p.icon} className="size-[1.1rem] shrink-0 text-purple" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{p.label}</span>
                      {p.edit ? <PencilLine className="size-4 shrink-0 text-purple" aria-label="Words can be edited here" /> : p.slot ? <span className="text-[0.82rem] text-muted">Picture</span> : null}
                      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onChoose(null)} className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-sm px-2 text-[0.92rem] font-semibold text-purple hover:bg-purple-tint"><ArrowLeft className="size-4" aria-hidden /> All parts</button>
              <h2 className="mt-2 text-[1.25rem] leading-snug">{part.label}</h2>
              <p className="mt-1 text-[0.95rem] text-muted">{part.note}</p>

              {part.id === "hero" && (
                <FieldGroup className="mt-6">
                  <Field id="s-headline" label="Big headline" max={LIMITS.headline} count={values.headline.length} error={errors.headline} hint="Short and strong. Three words work best.">
                    {(a) => <input {...a} value={values.headline} onChange={set("headline")} className="f-input" autoComplete="off" />}
                  </Field>
                  <Field id="s-sub" label="Line under it" max={LIMITS.sub} count={values.sub.length} error={errors.sub}>
                    {(a) => <textarea {...a} rows={3} value={values.sub} onChange={set("sub")} className="f-input" />}
                  </Field>
                  <Field id="s-kicker" label="Meeting line" optional max={LIMITS.kicker} count={values.kicker.length} error={errors.kicker} hint="Kept for later. The home page builds its meeting line from the gathering dates in Church details, so this line is not shown yet.">
                    {(a) => <input {...a} value={values.kicker} onChange={set("kicker")} className="f-input" autoComplete="off" />}
                  </Field>
                </FieldGroup>
              )}

              {part.id === "verse" && (
                <FieldGroup className="mt-6">
                  <Field id="s-verse" label="Scripture" max={LIMITS.verse} count={values.verse.length} error={errors.verse} hint="Leave it empty to use the default verse.">
                    {(a) => <textarea {...a} rows={5} value={values.verse} onChange={set("verse")} className="f-input" />}
                  </Field>
                  <Field id="s-ref" label="Reference" max={LIMITS.ref} count={values.ref.length} error={errors.ref} hint="For example John 3:16.">
                    {(a) => <input {...a} value={values.ref} onChange={set("ref")} className="f-input" autoComplete="off" />}
                  </Field>
                </FieldGroup>
              )}

              {part.id === "welcome" && (
                <FieldGroup className="mt-6">
                  <Field id="s-welcome" label="Welcome words" error={errors.welcome} hint="Leave a blank line between paragraphs.">
                    {(a) => <textarea {...a} rows={12} value={values.welcome} onChange={set("welcome")} className="f-input" />}
                  </Field>
                </FieldGroup>
              )}

              {slot && <Picture key={slot.key + (slot.src ?? "")} slot={slot} onChanged={onPicture} />}

              {part.link && (
                <p className="mt-6"><Link href={part.link.href} className={btnClass.secondary}>{part.link.label} <ExternalLink className="size-4" aria-hidden /></Link></p>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Changes the picture for one place on the page, from the photo library. A picture is saved on its own, straight away, as on the Page pictures screen. */
function Picture({ slot, onChanged }: { slot: StudioSlot; onChanged: () => void }) {
  const { run, formRef } = useSave(saveSlot, onChanged);
  const [busy, setBusy] = useState(false);
  return (
    <section aria-label="Picture" className="mt-8 border-t border-rule pt-5">
      <h3 className="text-[1.05rem]">Picture</h3>
      <form ref={formRef} action={run} className="mt-3 grid gap-4">
        <input type="hidden" name="key" value={slot.key} />
        <PhotoField name="src" label={slot.label} defaultValue={slot.src ?? ""} fallback={slot.fallback} focusName="focus" defaultFocus={slot.focus} hint="Pictures are saved as soon as you press the button below." />
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton>Use this picture</SaveButton>
          {slot.src && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const fd = new FormData();
                fd.set("key", slot.key);
                const r = await resetSlot(fd);
                setBusy(false);
                (r.ok ? toast.success : toast.error)(r.message ?? "");
                if (r.ok) onChanged();
              }}
              className={btnClass.ghost}
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />} Original picture
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
