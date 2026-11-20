"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Download, Upload } from "lucide-react";
import { importCampers } from "@/app/123admin/actions-camps";
import { camperRows, parseCsv } from "@/lib/camper-csv";
import { maskPhone } from "@/lib/mask";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SaveButton, useSave } from "./forms";
import { btnClass } from "./ui";

const TEMPLATE = "id,name,camp,year,age,guardian,location,contact\nJ-001,Example Child,Jewels,2025,9,Example Parent,Example Town,0700000000\n";
const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;
const COLUMNS: [string, string, boolean][] = [
  ["id", "A short code that stays the same for this child every year (letters, numbers, - or _).", true],
  ["name", "The child's full name.", true],
  ["camp", "Jewels or Teen Life.", true],
  ["year", "The year they came. Left blank, 2025 is used.", false],
  ["age", "Age at that camp, a number.", false],
  ["guardian", "Parent or guardian's name.", false],
  ["location", "Where the family lives.", false],
  ["contact", "A phone number the parent can be reached on.", false],
];

/** Administrators bring in last year's register: choose the file, read what was found, confirm. Nothing is saved until the last button. */
export default function CamperImport({ existingIds, writable }: { existingIds: string[]; writable: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [name, setName] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const reset = () => { setCsv(""); setName(""); if (file.current) file.current.value = ""; };
  const { run, formRef } = useSave(importCampers, () => { reset(); setOpen(false); router.refresh(); });

  const check = useMemo(() => {
    if (!csv) return null;
    const table = parseCsv(csv);
    const head = (table[0] ?? []).map((h) => h.trim().toLowerCase());
    const missing = ["id", "name", "camp"].filter((c) => !head.includes(c));
    const { rows, skipped } = camperRows(csv);
    const seen = new Set<string>();
    let repeated = 0;
    for (const r of rows) (seen.has(r.id) ? repeated++ : seen.add(r.id));
    const known = new Set(existingIds);
    const update = [...seen].filter((id) => known.has(id)).length;
    return { missing, rows, skipped, repeated, unique: seen.size, update, fresh: seen.size - update, noPhone: rows.filter((r) => !r.contact).length };
  }, [csv, existingIds]);
  const ready = Boolean(check && !check.missing.length && check.rows.length);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger className={btnClass.secondary}><Upload className="size-4" aria-hidden /> Import a register</DialogTrigger>
      <DialogContent className="top-[5vh] max-h-[90svh] w-[min(46rem,calc(100vw-1.5rem))] overflow-y-auto">
        <DialogTitle>Import returning campers</DialogTitle>
        <DialogDescription>Choose a spreadsheet saved as CSV. You will see what was found before anything is saved. Personal details are sealed when saved, and a camper with the same id is updated rather than added twice.</DialogDescription>

        <details className="mt-4" open={!csv}>
          <summary className="min-h-10 cursor-pointer font-semibold">What the file needs</summary>
          <table className="a-table mt-2" data-labelled="">
            <caption className="sr-only">Columns in the file</caption>
            <thead><tr><th scope="col">Column</th><th scope="col">What goes in it</th><th scope="col">Needed</th></tr></thead>
            <tbody>
              {COLUMNS.map(([c, what, need]) => <tr key={c}><td><code className="font-mono text-[0.9em]">{c}</code></td><td data-label="Holds">{what}</td><td data-label="Needed">{need ? "Yes" : "No"}</td></tr>)}
            </tbody>
          </table>
          <p className="mt-2"><a href={templateHref} download="returning-campers-template.csv" className="inline-flex min-h-10 items-center gap-2 font-semibold text-purple underline underline-offset-4"><Download className="size-4" aria-hidden /> Download a blank template</a></p>
        </details>

        <form ref={formRef} action={run} className="mt-4 grid gap-4">
          <input type="hidden" name="csv" value={csv} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => file.current?.click()} className={btnClass.secondary}><Upload className="size-4" aria-hidden /> {csv ? "Choose a different file" : "Choose the CSV file"}</button>
            <input ref={file} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Choose the CSV file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setName(f.name); setCsv(await f.text()); } }} />
            <span className="text-[0.95rem] text-muted" aria-live="polite">{name || "No file chosen"}</span>
          </div>

          {check && (
            <div className="grid gap-3" aria-live="polite">
              {check.missing.length > 0 ? (
                <p role="alert" className="flex items-start gap-2 font-semibold text-danger"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> The first row is missing: {check.missing.join(", ")}. Nothing can be imported until it has those columns.</p>
              ) : check.rows.length === 0 ? (
                <p role="alert" className="flex items-start gap-2 font-semibold text-danger"><CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> No campers could be read from this file. Check the camp column says Jewels or Teen Life, and every row has an id and a name.</p>
              ) : (
                <>
                  <p className="flex items-start gap-2 font-semibold text-ok"><CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden /> {check.unique} {check.unique === 1 ? "camper" : "campers"} ready: {check.fresh} new, {check.update} already on the list and will be updated.</p>
                  {(check.skipped > 0 || check.repeated > 0 || check.noPhone > 0) && (
                    <ul className="grid list-disc gap-1 pl-5 text-[0.93rem] text-muted">
                      {check.skipped > 0 && <li>{check.skipped} {check.skipped === 1 ? "row was" : "rows were"} left out (no id, no name, or the camp is not Jewels or Teen Life).</li>}
                      {check.repeated > 0 && <li>{check.repeated} {check.repeated === 1 ? "id appears" : "ids appear"} more than once. The last one in the file wins.</li>}
                      {check.noPhone > 0 && <li>{check.noPhone} {check.noPhone === 1 ? "row has" : "rows have"} no phone number.</li>}
                    </ul>
                  )}
                  <div className="overflow-x-auto">
                    <table className="a-table" data-labelled="">
                      <caption className="sr-only">The first rows of the file</caption>
                      <thead><tr>{["Id", "Name", "Camp", "Year", "Age", "Parent", "Phone"].map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
                      <tbody>
                        {check.rows.slice(0, 6).map((r) => (
                          <tr key={r.id}>
                            <td>{r.id}</td><td data-label="Name">{r.name}</td><td data-label="Camp">{r.camp === "jewels" ? "Jewels" : "Teen Life"}</td><td data-label="Year">{r.year}</td><td data-label="Age">{r.age ?? ""}</td><td data-label="Parent">{r.guardian ?? ""}</td><td data-label="Phone" className="tabular-nums">{maskPhone(r.contact)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {check.rows.length > 6 && <p className="text-[0.88rem] text-muted">Showing 6 of {check.rows.length} rows. Phone numbers are hidden here.</p>}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose className={btnClass.secondary}>Cancel</DialogClose>
            {ready && writable && <SaveButton>{`Import ${check!.unique} ${check!.unique === 1 ? "camper" : "campers"}`}</SaveButton>}
            {ready && !writable && <p role="alert" className="font-semibold text-danger">Saving is not switched on yet.</p>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
