"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { googleNonce, googleSignIn } from "@/app/123admin/google-actions";

type GoogleId = {
  initialize: (o: { client_id: string; nonce: string; ux_mode: "popup"; auto_select: boolean; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

function loadGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const found = document.querySelector<HTMLScriptElement>("script[data-gsi]");
    const el = found ?? Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client", async: true });
    el.dataset.gsi = "1";
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", () => reject(new Error("blocked")));
    if (!found) document.head.appendChild(el);
  });
}

/** The same Google sign-in the Institute of Apologetics uses. A person on the team signs in; anyone else leaves a request. */
export default function GoogleSignIn({ clientId }: { clientId: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"ready" | "working" | "requested" | "error">("ready");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const nonce = await googleNonce();
        await loadGoogle();
        const id = window.google?.accounts?.id;
        if (dead || !id || !box.current) return;
        id.initialize({
          client_id: clientId,
          nonce,
          ux_mode: "popup",
          auto_select: false,
          callback: async (r) => {
            setState("working");
            const out = await googleSignIn(r.credential);
            if (out.ok && out.next) window.location.assign(out.next);
            else if (out.ok && out.requested) setState("requested");
            else {
              setMessage(out.message ?? "Google sign-in did not work.");
              setState("error");
            }
          },
        });
        id.renderButton(box.current, { type: "standard", theme: "outline", size: "large", text: "signin_with", shape: "rectangular", logo_alignment: "left", width: Math.min(320, Math.max(200, window.innerWidth - 64)) });
      } catch {
        if (!dead) {
          setMessage("Google sign-in could not load. Check your connection, or use your password below.");
          setState("error");
        }
      }
    })();
    return () => {
      dead = true;
    };
  }, [clientId]);

  if (state === "requested") {
    return (
      <div role="status" className="border border-rule bg-paper-2 p-5">
        <CheckCircle2 className="size-7 text-ok" aria-hidden />
        <p className="mt-3 text-lg font-bold">Your request has been sent.</p>
        <p className="mt-1 text-muted">An administrator will look at it and give you the access you need. There is nothing more to do now. Try again later.</p>
      </div>
    );
  }
  return (
    <div>
      <div ref={box} className={state === "working" ? "pointer-events-none opacity-50" : ""} />
      {state === "working" && <p className="mt-3 flex items-center gap-2 text-muted"><Loader2 className="size-4 animate-spin" aria-hidden /> Checking…</p>}
      {state === "error" && <p role="alert" className="mt-3 border border-danger bg-danger-tint px-4 py-3 font-semibold text-danger">{message}</p>}
    </div>
  );
}
