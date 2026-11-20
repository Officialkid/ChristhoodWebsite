"use client";

import { useMemo, useState, useTransition } from "react";
import { Eye, Loader2, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { revealFamilyContact } from "@/app/123admin/actions-family";
import { ResetPasswordDialog } from "./FamilyAdmin";
import { DataTable } from "./kit/DataTable";
import { EmptyState } from "./kit/EmptyState";
import { ClearFilters, FilterBar, FilterSelect, SearchField } from "./kit/FilterBar";
import { Facts, RecordSheet } from "./kit/RecordSheet";
import { StatusIndicator } from "./kit/StatusIndicator";
import { btnClass } from "./ui";

/** A family account as the list needs it. Phone and email are masked; the full details are opened on request. */
export type FamilyRow = {
  id: string;
  name: string;
  phoneMask: string;
  emailMask: string;
  children: { name: string; camp?: string }[];
  createdAt: string;
  joined: string;
  active: boolean;
  mustChange: boolean;
  smsUpdates: boolean;
};

const state = (f: FamilyRow): { label: string; tone: "ok" | "new" | "bad" } => (!f.active ? { label: "Switched off", tone: "bad" } : f.mustChange ? { label: "Must choose a password", tone: "new" } : { label: "Active", tone: "ok" });
const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

export default function FamilyAccounts({ rows }: { rows: FamilyRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kids, setKids] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((f) =>
      (!needle || f.name.toLowerCase().includes(needle) || f.children.some((c) => c.name.toLowerCase().includes(needle))) &&
      (status === "all" || (status === "active" ? f.active && !f.mustChange : status === "pending" ? f.active && f.mustChange : !f.active)) &&
      (kids === "all" || (kids === "some" ? f.children.length > 0 : f.children.length === 0)),
    );
  }, [rows, q, status, kids]);
  const open = rows.find((f) => f.id === openId) ?? null;
  const dirty = q !== "" || status !== "all" || kids !== "all";

  const columns = useMemo<ColumnDef<FamilyRow, any>[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    () => [
      { id: "guardian", accessorKey: "name", header: "Parent or guardian", meta: { label: "Parent or guardian" }, cell: ({ row: { original: f } }) => <button type="button" aria-haspopup="dialog" onClick={() => setOpenId(f.id)} className="a-go text-left font-bold">{f.name}</button> },
      { id: "phone", accessorKey: "phoneMask", header: "Phone", enableSorting: false, meta: { label: "Phone", hideable: true }, cell: ({ row: { original: f } }) => <span className="tabular-nums">{f.phoneMask}</span> },
      { id: "children", accessorFn: (f) => f.children.length, header: "Children", meta: { label: "Children", hideable: true }, cell: ({ row: { original: f } }) => (f.children.length ? `${f.children.length} · ${f.children.map((c) => c.name.split(/\s+/)[0]).join(", ")}` : <span className="text-muted">None yet</span>) },
      { id: "registered", accessorKey: "createdAt", header: "Registered", meta: { label: "Registered", hideable: true }, cell: ({ row: { original: f } }) => <time dateTime={f.createdAt}>{f.joined}</time> },
      { id: "status", accessorFn: (f) => state(f).label, header: "Account", meta: { label: "Account", className: "k" }, cell: ({ row: { original: f } }) => <StatusIndicator tone={state(f).tone}>{state(f).label}</StatusIndicator> },
    ],
    [],
  );

  return (
    <div className="grid gap-4">
      <FilterBar>
        <SearchField value={q} onChange={setQ} label="Search family accounts" placeholder="Search parent or child" />
        <FilterSelect label="Account" value={status} onChange={setStatus} options={[{ value: "all", label: "Any" }, { value: "active", label: "Active" }, { value: "pending", label: "Must choose a password" }, { value: "off", label: "Switched off" }]} />
        <FilterSelect label="Children" value={kids} onChange={setKids} options={[{ value: "all", label: "Any" }, { value: "some", label: "Has children" }, { value: "none", label: "None yet" }]} />
        <ClearFilters show={dirty} onClear={() => { setQ(""); setStatus("all"); setKids("all"); }} />
      </FilterBar>

      <DataTable
        data={shown}
        columns={columns}
        getRowId={(f) => f.id}
        caption="Family accounts"
        unit={["family", "families"]}
        initialSort={[{ id: "registered", desc: true }]}
        empty={<EmptyState icon="users" title={rows.length ? "Nothing matches" : "No family accounts yet"}>{rows.length ? "Try a different search or filter." : "Parents make one from the Camps menu on the website."}</EmptyState>}
      />

      <RecordSheet open={Boolean(open)} onClose={() => setOpenId(null)} title={open?.name ?? "Family"} description={open ? `Registered ${open.joined}` : undefined}>
        {open && <FamilyRecord key={open.id} family={open} />}
      </RecordSheet>
    </div>
  );
}

function FamilyRecord({ family }: { family: FamilyRow }) {
  const [pending, start] = useTransition();
  const [contact, setContact] = useState<{ phone: string; email?: string } | null>(null);
  const reveal = () =>
    start(async () => {
      const r = await revealFamilyContact(family.id);
      if (r.ok && r.secret) {
        const [phone, email] = r.secret.split("\n");
        setContact({ phone, email: email || undefined });
      } else toast.error(r.message ?? "Could not open the contact details.");
    });
  const s = state(family);
  return (
    <div className="grid gap-6">
      <Facts items={[{ label: "Account", value: <StatusIndicator tone={s.tone}>{s.label}</StatusIndicator> }, { label: "Registered", value: family.joined }, { label: "Text updates", value: family.smsUpdates ? "Wants them" : "Not asked for" }]} />

      <section aria-labelledby="contact-h" className="border-t border-rule pt-5">
        <h3 id="contact-h" className="text-[1.05rem]">Contact</h3>
        {contact ? (
          <div className="mt-2 grid gap-3">
            <p className="text-lg font-bold tabular-nums">{contact.phone}</p>
            {contact.email && <p className="break-all">{contact.email}</p>}
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${contact.phone}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a>
              <a href={wa(contact.phone)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
            </div>
          </div>
        ) : (
          <div className="mt-2 grid gap-2">
            <p className="text-muted"><span className="tabular-nums">{family.phoneMask}</span>{family.emailMask ? ` · ${family.emailMask}` : ""}</p>
            <div><button type="button" onClick={reveal} disabled={pending} className={btnClass.secondary}>{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Eye className="size-4" aria-hidden />} Show contact details</button></div>
            <p className="text-[0.85rem] text-muted">Opening contact details is written to the activity log.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="kids-h" className="border-t border-rule pt-5">
        <h3 id="kids-h" className="text-[1.05rem]">Children on this family page</h3>
        {family.children.length === 0 ? (
          <p className="mt-1 text-muted">None yet. A child appears here after an application is linked or a family code is used.</p>
        ) : (
          <ul className="mt-2 border-t border-rule">
            {family.children.map((c, i) => <li key={`${c.name}${i}`} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule py-2.5"><span className="font-semibold">{c.name}</span>{c.camp && <span className="text-[0.9rem] text-muted">{c.camp}</span>}</li>)}
          </ul>
        )}
      </section>

      <section aria-labelledby="sec-h" className="border-t border-rule pt-5">
        <h3 id="sec-h" className="text-[1.05rem]">Sign-in</h3>
        <p className="mb-3 mt-1 text-[0.92rem] text-muted">Passwords are never shown. If this parent forgot theirs, give them a temporary one. They choose their own when they next sign in.</p>
        <ResetPasswordDialog id={family.id} name={family.name} />
      </section>
    </div>
  );
}
