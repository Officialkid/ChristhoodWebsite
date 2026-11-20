"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { revealCamperContact } from "@/app/123admin/actions-camps";
import { CodeButton } from "./FamilyAdmin";
import { DataTable } from "./kit/DataTable";
import { EmptyState } from "./kit/EmptyState";
import { ClearFilters, FilterBar, FilterSelect, FilterTabs, SearchField } from "./kit/FilterBar";
import { Facts, RecordSheet } from "./kit/RecordSheet";
import { StatusIndicator } from "./kit/StatusIndicator";
import { btnClass, Notice } from "./ui";

/** A returning camper as the list needs it. The phone number is never in here, only a masked form: it is opened on request. */
export type CamperRow = {
  id: string;
  name: string;
  camp: "jewels" | "teen-life";
  year: number;
  age?: number;
  guardian?: string;
  location?: string;
  hasContact: boolean;
  contactMask: string;
  /** False when the private details could not be opened (age, guardian, area and phone are then missing). */
  opened: boolean;
  family: "linked" | "code" | "none";
};

const campName = (c: CamperRow["camp"]) => (c === "jewels" ? "Jewels" : "Teen Life");
const FAMILY: Record<CamperRow["family"], { label: string; tone: "ok" | "new" | "plain" }> = { linked: { label: "On a family page", tone: "ok" }, code: { label: "Code ready", tone: "new" }, none: { label: "Not linked", tone: "plain" } };
const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "254")}`;

export default function ReturningCampers({ campers, canIssue }: { campers: CamperRow[]; canIssue: boolean }) {
  const [camp, setCamp] = useState<"all" | CamperRow["camp"]>("all");
  const [q, setQ] = useState("");
  const [year, setYear] = useState("all");
  const [family, setFamily] = useState("all");
  const [phone, setPhone] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const years = useMemo(() => [...new Set(campers.map((c) => c.year))].sort((a, b) => b - a), [campers]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return campers.filter((c) =>
      (!needle || `${c.name} ${c.guardian ?? ""} ${c.location ?? ""}`.toLowerCase().includes(needle)) &&
      (year === "all" || c.year === Number(year)) &&
      (family === "all" || c.family === family) &&
      (phone === "all" || (phone === "has" ? c.hasContact : !c.hasContact)),
    );
  }, [campers, q, year, family, phone]);
  const shown = useMemo(() => (camp === "all" ? filtered : filtered.filter((c) => c.camp === camp)), [filtered, camp]);
  const count = (v: "all" | CamperRow["camp"]) => (v === "all" ? filtered.length : filtered.filter((c) => c.camp === v).length);
  const open = campers.find((c) => c.id === openId) ?? null;
  const dirty = q !== "" || year !== "all" || family !== "all" || phone !== "all";

  const columns = useMemo<ColumnDef<CamperRow, any>[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    () => [
      {
        id: "camper",
        accessorKey: "name",
        header: "Camper",
        meta: { label: "Camper" },
        cell: ({ row: { original: c } }) => <button type="button" aria-haspopup="dialog" onClick={() => setOpenId(c.id)} className="a-go text-left font-bold">{c.name}</button>,
      },
      { id: "camp", accessorFn: (c) => campName(c.camp), header: "Camp", meta: { label: "Camp", hideable: true } },
      { id: "year", accessorKey: "year", header: "Year", meta: { label: "Year", hideable: true } },
      { id: "age", accessorFn: (c) => c.age ?? 0, header: "Age", meta: { label: "Age", hideable: true }, cell: ({ row: { original: c } }) => c.age ?? "" },
      { id: "guardian", accessorFn: (c) => c.guardian ?? "", header: "Parent or guardian", meta: { label: "Parent or guardian", hideable: true } },
      { id: "area", accessorFn: (c) => c.location ?? "", header: "Area", meta: { label: "Area", hideable: true } },
      { id: "phone", accessorFn: (c) => (c.hasContact ? 1 : 0), header: "Phone", meta: { label: "Phone", hideable: true }, cell: ({ row: { original: c } }) => (c.hasContact ? <span className="tabular-nums">{c.contactMask}</span> : <span className="text-muted">None yet</span>) },
      {
        id: "family",
        accessorFn: (c) => FAMILY[c.family].label,
        header: "Family page",
        meta: { label: "Family page", className: "k" },
        cell: ({ row: { original: c } }) => <StatusIndicator tone={FAMILY[c.family].tone}>{FAMILY[c.family].label}</StatusIndicator>,
      },
    ],
    [],
  );

  return (
    <div className="grid gap-4">
      <FilterTabs
        label="Filter by camp"
        value={camp}
        onChange={setCamp}
        items={[{ value: "all", label: "All", count: count("all") }, { value: "jewels", label: "Jewels", count: count("jewels") }, { value: "teen-life", label: "Teen Life", count: count("teen-life") }]}
      />
      <FilterBar>
        <SearchField value={q} onChange={setQ} label="Search returning campers" placeholder="Search name, parent or area" />
        {years.length > 1 && <FilterSelect label="Year" value={year} onChange={setYear} options={[{ value: "all", label: "Any year" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]} />}
        <FilterSelect label="Family page" value={family} onChange={setFamily} options={[{ value: "all", label: "Any" }, { value: "linked", label: "On a family page" }, { value: "code", label: "Code ready" }, { value: "none", label: "Not linked" }]} />
        <FilterSelect label="Phone" value={phone} onChange={setPhone} options={[{ value: "all", label: "Any" }, { value: "has", label: "Has a number" }, { value: "none", label: "No number yet" }]} />
        <ClearFilters show={dirty} onClear={() => { setQ(""); setYear("all"); setFamily("all"); setPhone("all"); }} />
      </FilterBar>

      <DataTable
        data={shown}
        columns={columns}
        getRowId={(c) => c.id}
        caption="Returning campers"
        unit={["camper", "campers"]}
        initialSort={[{ id: "camper", desc: false }]}
        initialHidden={{ area: false, year: false }}
        empty={<EmptyState icon="users" title={campers.length ? "Nothing matches" : "No returning campers yet"}>{campers.length ? "Try a different search or filter." : canIssue ? "Import last year's register to start the list." : "An administrator can import last year's register."}</EmptyState>}
      />

      <RecordSheet
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.name ?? "Camper"}
        description={open ? `${campName(open.camp)} · ${open.year}` : undefined}
      >
        {open && <CamperRecord key={open.id} camper={open} canIssue={canIssue} />}
      </RecordSheet>
    </div>
  );
}

function CamperRecord({ camper, canIssue }: { camper: CamperRow; canIssue: boolean }) {
  const [pending, start] = useTransition();
  const [number, setNumber] = useState<string | null>(null);
  const reveal = () =>
    start(async () => {
      const r = await revealCamperContact(camper.id);
      if (r.ok && r.secret) setNumber(r.secret);
      else toast.error(r.message ?? "Could not open the number.");
    });
  const f = FAMILY[camper.family];
  return (
    <div className="grid gap-6">
      {!camper.opened && <Notice tone="bad" title="Private details could not be opened">The name, camp and year are saved. The age, parent, area and phone number cannot be read with this site&apos;s key.</Notice>}
      <Facts
        items={[
          { label: "Camp", value: campName(camper.camp) },
          { label: "Year", value: camper.year },
          { label: "Age", value: camper.age ? `${camper.age} (from the register, not verified)` : undefined },
          { label: "Parent or guardian", value: camper.guardian },
          { label: "Area", value: camper.location },
          { label: "Family page", value: <StatusIndicator tone={f.tone}>{f.label}</StatusIndicator> },
        ]}
      />

      <section aria-labelledby="reach" className="border-t border-rule pt-5">
        <h3 id="reach" className="text-[1.05rem]">Phone number</h3>
        {!camper.hasContact ? (
          <p className="mt-1 text-[0.92rem] text-muted">No number is saved. Add one by importing an updated register.</p>
        ) : number ? (
          <div className="mt-2 grid gap-3">
            <p className="text-lg font-bold tabular-nums">{number}</p>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${number}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a>
              <a href={wa(number)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="mt-2 grid gap-2">
            <p className="tabular-nums text-muted">{camper.contactMask}</p>
            <div><button type="button" onClick={reveal} disabled={pending} className={btnClass.secondary}>{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Eye className="size-4" aria-hidden />} Show the number</button></div>
            <p className="text-[0.85rem] text-muted">Opening a number is written to the activity log.</p>
          </div>
        )}
      </section>

      {canIssue && camper.family !== "linked" && (
        <section aria-labelledby="code" className="border-t border-rule pt-5">
          <h3 id="code" className="text-[1.05rem]">Family code</h3>
          <p className="mb-3 mt-1 text-[0.92rem] text-muted">Make a code only after you have checked, by phone or in person, that this person is the child&apos;s parent or guardian. The parent types it on the website to put {camper.name} on their family page. It works once.</p>
          <CodeButton id={camper.id} name={camper.name} active={camper.family === "code"} />
        </section>
      )}
    </div>
  );
}
