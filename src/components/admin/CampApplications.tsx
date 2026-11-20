"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import CampReviewForm from "./CampReviewForm";
import { DataTable } from "./kit/DataTable";
import { EmptyState } from "./kit/EmptyState";
import { ClearFilters, FilterBar, FilterSelect, FilterTabs, SearchField } from "./kit/FilterBar";
import { Facts, RecordSheet } from "./kit/RecordSheet";
import { StatusIndicator } from "./kit/StatusIndicator";
import { btnClass, Notice } from "./ui";
import { ago } from "@/lib/ago";
import { formatStamp } from "@/lib/time";
import type { CampApplication } from "@/lib/types";

/** Only what the list and the review panel need. The health, family and payment answers stay on the server until someone opens the full application. */
export type AppRow = {
  id: string;
  childName: string;
  age: number;
  ageReview: boolean;
  camp: CampApplication["camp"];
  campLabel: string;
  guardian: string;
  phone: string;
  createdAt: string;
  status: CampApplication["status"];
  paid: boolean;
  note?: string;
  reviewedBy?: string;
};

const DECISIONS: CampApplication["status"][] = ["Pending review", "Needs correction", "Approved", "Declined"];
const tone = (s: CampApplication["status"]) => (s === "Approved" ? "ok" : s === "Pending review" ? "new" : "warn");
const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

type Tab = "all" | CampApplication["status"];

export default function CampApplications({ rows, initialTab, initialCamp, canDelete, writable }: { rows: AppRow[]; initialTab?: string; initialCamp?: string; canDelete: boolean; writable: boolean }) {
  const [tab, setTab] = useState<Tab>(DECISIONS.includes(initialTab as CampApplication["status"]) ? (initialTab as Tab) : "all");
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState(initialCamp && rows.some((r) => r.camp === initialCamp) ? initialCamp : "all");
  const [pay, setPay] = useState("all");
  const [age, setAge] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const camps = useMemo(() => [...new Map(rows.map((r) => [r.camp, r.campLabel])).entries()].map(([value, label]) => ({ value, label })), [rows]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    return rows.filter((r) =>
      (!needle || r.childName.toLowerCase().includes(needle) || r.guardian.toLowerCase().includes(needle) || (digits.length > 2 && r.phone.replace(/\D/g, "").includes(digits))) &&
      (camp === "all" || r.camp === camp) &&
      (pay === "all" || (pay === "paid" ? r.paid : !r.paid && r.status !== "Declined")) &&
      (age === "all" || r.ageReview),
    );
  }, [rows, q, camp, pay, age]);
  const shown = useMemo(() => (tab === "all" ? filtered : filtered.filter((r) => r.status === tab)), [filtered, tab]);
  const count = (s: Tab) => (s === "all" ? filtered.length : filtered.filter((r) => r.status === s).length);
  const open = rows.find((r) => r.id === openId) ?? null;
  const dirty = q !== "" || camp !== "all" || pay !== "all" || age !== "all";

  const choose = (t: Tab) => {
    setTab(t);
    // Keep the address in step so the screen can be shared or reloaded as it is. No new history entry.
    const url = new URL(location.href);
    if (t === "all") url.searchParams.delete("status");
    else url.searchParams.set("status", t);
    history.replaceState(history.state, "", url);
  };

  const columns = useMemo<ColumnDef<AppRow, any>[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    () => [
      {
        id: "child",
        accessorKey: "childName",
        header: "Child",
        meta: { label: "Child" },
        cell: ({ row: { original: a } }) => (
          <>
            <button type="button" aria-haspopup="dialog" onClick={() => setOpenId(a.id)} className="a-go text-left font-bold">{a.childName}</button> <span className="text-muted">· age {a.age}</span>
            {a.ageReview && <span className="ml-3"><StatusIndicator tone="warn">Check age</StatusIndicator></span>}
          </>
        ),
      },
      { id: "camp", accessorKey: "campLabel", header: "Camp", meta: { label: "Camp", hideable: true } },
      { id: "guardian", accessorKey: "guardian", header: "Parent or guardian", meta: { label: "Parent or guardian", hideable: true } },
      {
        id: "received",
        accessorKey: "createdAt",
        header: "Received",
        meta: { label: "Received", hideable: true },
        cell: ({ row: { original: a } }) => <time dateTime={a.createdAt} title={formatStamp(a.createdAt)}>{ago(a.createdAt)}</time>,
      },
      {
        id: "decision",
        accessorFn: (a) => DECISIONS.indexOf(a.status),
        header: "Decision",
        meta: { label: "Decision", className: "k" },
        cell: ({ row: { original: a } }) => <StatusIndicator tone={tone(a.status)}>{a.status}</StatusIndicator>,
      },
      {
        id: "payment",
        accessorFn: (a) => (a.status === "Declined" ? 0 : a.paid ? 2 : 1),
        header: "Payment",
        meta: { label: "Payment", hideable: true },
        cell: ({ row: { original: a } }) => (a.status === "Declined" ? null : a.paid ? <StatusIndicator tone="ok">Paid</StatusIndicator> : <StatusIndicator>Not checked</StatusIndicator>),
      },
    ],
    [],
  );

  return (
    <div className="grid gap-4">
      {!writable && <Notice tone="warn" title="Saving is not switched on yet">Decisions cannot be kept until the database is connected.</Notice>}
      <FilterTabs
        label="Filter by decision"
        value={tab}
        onChange={choose}
        items={[{ value: "all", label: "All", count: count("all") }, ...DECISIONS.map((d) => ({ value: d as Tab, label: d, count: count(d) }))]}
      />
      <FilterBar>
        <SearchField value={q} onChange={setQ} label="Search applications" placeholder="Search child, parent or phone" />
        {camps.length > 1 && <FilterSelect label="Camp" value={camp} onChange={setCamp} options={[{ value: "all", label: "All camps" }, ...camps]} />}
        <FilterSelect label="Payment" value={pay} onChange={setPay} options={[{ value: "all", label: "Any" }, { value: "paid", label: "Paid" }, { value: "unchecked", label: "Not checked" }]} />
        <FilterSelect label="Age" value={age} onChange={setAge} options={[{ value: "all", label: "Any" }, { value: "review", label: "Needs an age check" }]} />
        <ClearFilters show={dirty} onClear={() => { setQ(""); setCamp("all"); setPay("all"); setAge("all"); }} />
      </FilterBar>

      <DataTable
        data={shown}
        columns={columns}
        getRowId={(r) => r.id}
        caption="Camp applications"
        unit={["application", "applications"]}
        initialSort={[{ id: "received", desc: true }]}
        empty={<EmptyState icon="tent" title={rows.length ? "Nothing matches" : "No applications yet"}>{rows.length ? "Try a different search or filter." : "They appear here as soon as a parent sends the camp application."}</EmptyState>}
      />

      <RecordSheet
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        title={open?.childName ?? "Application"}
        description={open ? `${open.campLabel} · received ${formatStamp(open.createdAt)}` : undefined}
        footer={open && <Link href={`/123admin/camps/${open.id}`} className={btnClass.secondary}><ExternalLink className="size-4" aria-hidden /> Open the full application</Link>}
      >
        {open && (
          <div className="grid gap-6">
            {open.ageReview && <Notice tone="warn" title="Check the age">{open.childName} will be {open.age} at camp, outside the usual range. It is not refused automatically: talk to the parent and decide.</Notice>}
            <Facts
              items={[
                { label: "Decision", value: <StatusIndicator tone={tone(open.status)}>{open.status}</StatusIndicator> },
                { label: "Payment", value: open.status === "Declined" ? undefined : open.paid ? <StatusIndicator tone="ok">Checked</StatusIndicator> : <StatusIndicator>Not checked</StatusIndicator> },
                { label: "Age at camp", value: open.age },
                { label: "Parent or guardian", value: open.guardian },
                { label: "Phone", value: open.phone },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${open.phone}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a>
              <a href={wa(open.phone)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a>
            </div>
            <section aria-labelledby="decision-h" className="border-t border-rule pt-5">
              <h3 id="decision-h" className="text-[1.05rem]">Your decision</h3>
              <p className="mb-4 mt-1 text-[0.9rem] text-muted">Health, consent and payment details are on the full application. Read them before you approve.</p>
              <CampReviewForm key={open.id + open.status + String(open.paid)} app={{ id: open.id, status: open.status, paymentVerified: open.paid, reviewNote: open.note, reviewedBy: open.reviewedBy }} canDelete={canDelete} onGone={() => setOpenId(null)} />
            </section>
          </div>
        )}
      </RecordSheet>
    </div>
  );
}
