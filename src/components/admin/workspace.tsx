"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { btnClass } from "./ui";

/* ---------- places in the header that a screen can fill ---------- */

type Slots = { center: HTMLElement | null; end: HTMLElement | null };
export const SlotsContext = createContext<Slots>({ center: null, end: null });

/** Puts a screen's own controls (preview sizes, save status) into the workspace header. */
export function HeaderSlot({ slot, children }: { slot: keyof Slots; children: React.ReactNode }) {
  const target = useContext(SlotsContext)[slot];
  return target ? createPortal(children, target) : null;
}

/* ---------- unsaved changes ---------- */

type Guard = {
  dirty: boolean;
  /** A screen reports whether it holds changes that are not saved yet. */
  setDirty: (v: boolean) => void;
  /** Go somewhere: straight away, or after asking when there are unsaved changes. */
  go: (href: string) => void;
};
const GuardContext = createContext<Guard>({ dirty: false, setDirty: () => {}, go: () => {} });
export const useGuard = () => useContext(GuardContext);

/**
 * Stops people losing work. While a screen has unsaved changes: closing or reloading the tab asks first, a click on any
 * link on the page asks first, and the browser's Back button asks first. Next's router has no hook for this, so the
 * clicks are caught in the capture phase and the Back button is held with one spare history entry. That entry exists
 * only while there is something to lose: it is taken away again after a save or a discard, and before following a link,
 * so Back always takes one press.
 */
export function GuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [dirty, setDirtyState] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  /** The address the spare entry was added at, while it exists. */
  const spare = useRef<string | null>(null);
  /** What the next popstate is for: dropping the spare entry, or dropping it and then going to a link. */
  const after = useRef<{ kind: "drop" } | { kind: "go"; href: string } | null>(null);

  /** Takes the spare entry away (only while still on the page that added it), then goes on to `href` if given. */
  const dropSpare = useCallback((href?: string) => {
    if (spare.current === null || spare.current !== location.href) {
      spare.current = null;
      return false;
    }
    spare.current = null;
    after.current = href ? { kind: "go", href } : { kind: "drop" };
    history.back();
    return true;
  }, []);

  const setDirty = useCallback((v: boolean) => {
    dirtyRef.current = v;
    setDirtyState(v);
    if (v && spare.current === null) {
      spare.current = location.href;
      history.pushState(history.state, "", location.href);
    } else if (!v) dropSpare();
  }, [dropSpare]);

  const go = useCallback((href: string) => {
    if (dirtyRef.current) setAsking(href);
    else router.push(href);
  }, [router]);

  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      e.preventDefault();
      e.stopPropagation();
      setAsking(url.pathname + url.search + url.hash);
    };
    const onPop = () => {
      const next = after.current;
      if (next) {
        after.current = null;
        // Let the router finish restoring this page from the Back step before it is sent on, or it drops the move.
        if (next.kind === "go") setTimeout(() => router.push(next.href), 60);
        return;
      }
      if (spare.current === null) return;
      if (dirtyRef.current) {
        // Back was pressed with unsaved work: stay here, then ask.
        history.pushState(history.state, "", location.href);
        setAsking("back");
      } else spare.current = null;
    };
    addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    addEventListener("popstate", onPop);
    return () => {
      removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
      removeEventListener("popstate", onPop);
    };
  }, [router]);

  const leave = () => {
    const target = asking;
    setAsking(null);
    dirtyRef.current = false;
    setDirtyState(false);
    if (target === "back") {
      // The spare entry and this page are both behind us.
      spare.current = null;
      history.go(-2);
    } else if (target && !dropSpare(target)) router.push(target);
  };

  return (
    <GuardContext.Provider value={{ dirty, setDirty, go }}>
      {children}
      <Dialog open={asking !== null} onOpenChange={(o) => !o && setAsking(null)}>
        <DialogContent>
          <DialogTitle>Leave without saving?</DialogTitle>
          <DialogDescription>You changed something on this screen and have not saved it. If you leave now, those changes are lost.</DialogDescription>
          <DialogFooter>
            <button type="button" onClick={() => setAsking(null)} className={btnClass.primary} autoFocus>Stay and keep editing</button>
            <button type="button" onClick={leave} className={btnClass.secondary}>Leave and lose changes</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GuardContext.Provider>
  );
}
