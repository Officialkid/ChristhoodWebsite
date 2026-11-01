"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone, Search, Upload } from "lucide-react";
import { importCampers } from "@/app/123admin/actions-camps";
import { SaveButton, useSave } from "./forms";
import { btnClass, Chip, Empty } from "./ui";

export type CamperView = { id: string; name: string; camp: "jewels" | "teen-life"; year: number; age?: number; guardian?: string; location?: string; contact?: string };

const label = (c: CamperView["camp"]) => (c === "jewels" ? "Jewels" : "Teen Life");

export function CamperList({ campers }: { campers: CamperView[] }) {
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState<"all" | "jewels" | "teen-life">("all");
  const shown = useMemo(
    () => campers.filter((c) => (camp === "all" || c.camp === camp) && (!q || `${c.name} ${c.guardian ?? ""} ${c.location ?? ""}`.toLowerCase().includes(q.toLowerCase()))),
    [campers, q, camp],
  );
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Filter by camp" className="flex flex-wrap gap-1">
          {([["all", "All"], ["jewels", "Jewels"], ["teen-life", "Teen Life"]] as const).map(([v, l]) => (
            <button key={v} type="button" aria-pressed={camp === v} onClick={() => setCamp(v)} className={`min-h-11 px-4 text-[0.95rem] font-semibold ${camp === v ? "bg-purple text-on-purple" : "border border-rule hover:border-ink"}`}>{l} <span className="opacity-75">{v === "all" ? campers.length : campers.filter((c) => c.camp === v).length}</span></button>
          ))}
        </div>
        <label className="relative ml-auto flex w-full items-center sm:w-72">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, guardian, area" className="f-input !mt-0 !min-h-11 pl-9" />
        </label>
      </div>
      {shown.length === 0 ? (
        <Empty icon="users" title={campers.length ? "Nothing matches" : "No returning campers yet"}>{campers.length ? "Try a different search." : "An administrator can import last year's register."}</Empty>
      ) : (
        <ul className="border-t border-rule">
          {shown.map((c) => (
            <li key={c.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-rule px-1 py-4">
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{c.name} <span className="font-normal text-muted">· {c.year}{c.age ? `, age ${c.age}` : ""}</span></span>
                <span className="mt-0.5 block text-[0.92rem] text-muted">{[c.guardian && `Guardian: ${c.guardian}`, c.location].filter(Boolean).join(" · ")}</span>
              </span>
              <Chip>{label(c.camp)}</Chip>
              {c.contact && (
                <span className="flex gap-2">
                  <a href={`tel:${c.contact}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a>
                  <a href={`https://wa.me/${c.contact.replace(/\D/g, "").replace(/^0/, "254")}`} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Administrators bring in last year's register: choose the CSV file, check, import. */
export function CamperImport() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [name, setName] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const { run, formRef } = useSave(importCampers, () => { setCsv(""); setName(""); router.refresh(); });
  return (
    <form ref={formRef} action={run} className="grid max-w-2xl gap-4 border border-rule p-5">
      <h2 className="text-xl">Import returning campers</h2>
      <p className="text-muted">A spreadsheet saved as CSV with the columns <code className="font-mono text-[0.9em]">id, name, camp, year, age, guardian, location, contact</code>. Personal details are encrypted when saved. Campers with the same id are updated.</p>
      <input type="hidden" name="csv" value={csv} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => file.current?.click()} className={btnClass.secondary}><Upload className="size-4" aria-hidden /> Choose the CSV file</button>
        <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Choose the CSV file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setName(f.name); setCsv(await f.text()); } }} />
        <span className="text-[0.95rem] text-muted" aria-live="polite">{name ? `${name} (${csv.split(/\r?\n/).filter(Boolean).length - 1} rows)` : "No file chosen"}</span>
      </div>
      {csv && <SaveButton>Import campers</SaveButton>}
    </form>
  );
}
