"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Reply = { ok?: boolean; needCode?: boolean; next?: string };

async function send(url: string, body: Record<string, string>): Promise<Reply> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
    return res.ok ? ((await res.json()) as Reply) : {};
  } catch {
    return {};
  }
}

/**
 * The hidden way in. Nothing on the page mentions it. A team member types their phrase (outside any box) and presses Enter,
 * or taps the logo seven times on a phone. The page only asks the server; the phrase is never in this file.
 */
export default function TeamDoor() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState<"phrase" | "code">("phrase");
  const [phrase, setPhrase] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const open = useCallback((to: "phrase" | "code") => {
    setStep(to);
    setMessage("");
    setCode("");
    setShown(true);
  }, []);

  // The dialog is not even in the page until someone knocks.
  useEffect(() => {
    if (shown && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [shown]);

  const knock = useCallback(
    async (typed: string, visible: boolean) => {
      const r = await send("/api/door", { phrase: typed });
      if (r.ok && r.next) window.location.assign(r.next);
      else if (r.ok && r.needCode) open("code");
      else if (visible) setMessage("That did not work.");
      return r;
    },
    [open],
  );

  useEffect(() => {
    let typed = "";
    let timer: number | undefined;
    let taps = 0;
    let tapTimer: number | undefined;
    const reset = () => { typed = ""; };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, dialog, [contenteditable]:not([contenteditable=false])")) return;
      if (e.key === "Enter") {
        const word = typed;
        reset();
        if (word.length >= 4) void knock(word, false);
        return;
      }
      if (e.key.length === 1) {
        typed = (typed + e.key).slice(-40);
        window.clearTimeout(timer);
        timer = window.setTimeout(reset, 4000);
      } else if (e.key === "Escape" || e.key === "Backspace") reset();
    };

    // A phone has no keyboard to type on, so seven quick taps on the logo open the same door.
    const onClick = (e: MouseEvent) => {
      const logo = (e.target as HTMLElement | null)?.closest("header a[href='/']");
      if (!logo) return;
      taps += 1;
      window.clearTimeout(tapTimer);
      tapTimer = window.setTimeout(() => { taps = 0; }, 3500);
      if (taps >= 7) {
        taps = 0;
        e.preventDefault();
        e.stopPropagation();
        setPhrase("");
        open("phrase");
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(timer);
      window.clearTimeout(tapTimer);
    };
  }, [knock, open]);

  if (!shown) return null;

  const close = () => {
    dialog.current?.close();
    setShown(false);
    setPhrase("");
    setCode("");
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="door-title"
      onClose={() => setShown(false)}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] border border-ink/30 bg-paper p-6 text-ink backdrop:bg-ink/60"
    >
      <form
        className="grid gap-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          if (step === "phrase") await knock(phrase, true);
          else {
            const r = await send("/api/door/code", { code });
            if (r.ok && r.next) window.location.assign(r.next);
            else setMessage("That did not work.");
          }
          setBusy(false);
        }}
      >
        <h2 id="door-title" className="text-xl font-extrabold">Team sign-in</h2>
        {step === "phrase" ? (
          <label className="block">
            <span className="f-label">Your phrase</span>
            <input className="f-input" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} autoFocus value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          </label>
        ) : (
          <label className="block">
            <span className="f-label">The six digits on your phone</span>
            <input className="f-input" inputMode="numeric" pattern="[0-9]*" maxLength={7} autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
        )}
        <p role="status" aria-live="polite" className="min-h-6 font-semibold text-danger">{message}</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy || (step === "phrase" ? phrase.trim().length < 4 : code.replace(/\s/g, "").length < 6)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-gold px-6 font-bold text-ink hover:bg-gold-hover disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Continue
          </button>
          <button type="button" onClick={close} className="inline-flex min-h-12 items-center px-4 font-semibold text-purple underline underline-offset-4">Close</button>
        </div>
      </form>
    </dialog>
  );
}
