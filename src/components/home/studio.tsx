"use client";

import { createContext, useContext, useEffect, useState } from "react";
import VerseSlot from "@/components/fx/VerseSlot";

/**
 * The home page as shown inside the team area's editor. It is the real page; this file only adds two things:
 * the words being typed in the editor replace the saved words at once, and a click on a part of the page tells the
 * editor which part was chosen (and does not follow links). The editor and this page talk through window messages.
 */

export type HomeDraft = { headline: string; sub: string; verse: string; ref: string; welcome: string };
export type StudioMessage =
  | { source: "ch-studio"; type: "ready" }
  | { source: "ch-studio"; type: "select"; id: string };
export type EditorMessage = { source: "ch-studio"; type: "state"; draft: Partial<HomeDraft>; selected: string | null };

const Ctx = createContext<{ draft: Partial<HomeDraft>; selected: string | null }>({ draft: {}, selected: null });

const tell = (m: StudioMessage) => window.parent !== window && window.parent.postMessage(m, location.origin);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ draft: Partial<HomeDraft>; selected: string | null }>({ draft: {}, selected: null });

  useEffect(() => {
    const onMessage = (e: MessageEvent<EditorMessage>) => {
      if (e.origin !== location.origin || e.source !== window.parent || e.data?.source !== "ch-studio" || e.data.type !== "state") return;
      setState({ draft: e.data.draft, selected: e.data.selected });
    };
    // Every click picks a part of the page and nothing else: links, buttons and forms stay still.
    const onClick = (e: MouseEvent) => {
      const part = (e.target as Element | null)?.closest?.("[data-studio-id]");
      e.preventDefault();
      e.stopPropagation();
      if (part) tell({ source: "ch-studio", type: "select", id: part.getAttribute("data-studio-id")! });
    };
    const onSubmit = (e: Event) => e.preventDefault();
    addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    // The preview is for looking and clicking. Keyboard users choose a part from the editor's list, so nothing in here takes a Tab stop.
    const still = () => document.querySelectorAll("a[href], button, input, select, textarea, iframe, summary, [tabindex]:not([tabindex='-1'])").forEach((el) => el.setAttribute("tabindex", "-1"));
    still();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const watch = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(still, 150); });
    watch.observe(document.body, { childList: true, subtree: true });
    document.documentElement.setAttribute("data-studio", "");
    tell({ source: "ch-studio", type: "ready" });
    return () => {
      removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.documentElement.removeAttribute("data-studio");
      watch.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

/** One part of the page the editor can select. The outline is drawn by `.studio-part` in globals.css. */
export function StudioSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { selected } = useContext(Ctx);
  return <div className="studio-part" data-studio-id={id} data-selected={selected === id ? "" : undefined}>{children}</div>;
}

export function DraftText({ field, children }: { field: keyof HomeDraft; children: string }) {
  const { draft } = useContext(Ctx);
  return <>{draft[field] ?? children}</>;
}

/** The welcome words: a blank line in the editor starts a new paragraph, exactly as when saved. */
export function DraftWelcome({ paragraphs }: { paragraphs: string[] }) {
  const { draft } = useContext(Ctx);
  const list = draft.welcome === undefined ? paragraphs : draft.welcome.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return <>{list.map((p, i) => <p key={i} className="reading">{p}</p>)}</>;
}

export function DraftVerse({ text, reference, photos }: { text: string; reference: string; photos: string[] }) {
  const { draft } = useContext(Ctx);
  return <VerseSlot text={draft.verse?.trim() || text} reference={draft.ref?.trim() || reference} photos={photos} />;
}
