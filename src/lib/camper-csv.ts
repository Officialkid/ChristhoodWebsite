/** Reads the returning-campers list (a spreadsheet saved as CSV). Plain code, shared by the team area and the import script. */
export type CamperRow = { id: string; camp: "jewels" | "teen-life"; name: string; year: number; age?: number; guardian?: string; location?: string; contact?: string };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const campOf = (v: string): CamperRow["camp"] | null => (/jewel/i.test(v) ? "jewels" : /teen/i.test(v) ? "teen-life" : null);

export function camperRows(text: string): { rows: CamperRow[]; skipped: number } {
  const [head, ...body] = parseCsv(text);
  if (!head) return { rows: [], skipped: 0 };
  const col = (name: string) => head.findIndex((h) => h.trim().toLowerCase() === name);
  const at = { id: col("id"), name: col("name"), camp: col("camp"), year: col("year"), age: col("age"), guardian: col("guardian"), location: col("location"), contact: col("contact") };
  if (at.id < 0 || at.name < 0 || at.camp < 0) return { rows: [], skipped: body.length };
  const rows: CamperRow[] = [];
  let skipped = 0;
  for (const r of body) {
    const camp = campOf(r[at.camp] ?? "");
    const id = (r[at.id] ?? "").trim().slice(0, 40);
    const name = (r[at.name] ?? "").trim().slice(0, 120);
    if (!camp || !/^[A-Za-z0-9_-]{2,40}$/.test(id) || name.length < 2) { skipped++; continue; }
    const age = Number(r[at.age] ?? "");
    rows.push({
      id,
      camp,
      name,
      year: Number(r[at.year] ?? "") || 2025,
      age: Number.isFinite(age) && age > 0 && age < 30 ? age : undefined,
      guardian: (r[at.guardian] ?? "").trim().slice(0, 120) || undefined,
      location: (r[at.location] ?? "").trim().slice(0, 120) || undefined,
      contact: (r[at.contact] ?? "").trim().slice(0, 30) || undefined,
    });
  }
  return { rows, skipped };
}
