// Loads a returning-campers CSV straight into the database, for the first import or a database the team area cannot reach yet.
// The file stays outside the repository (it holds children's names), and personal details are sealed before they are saved.
//
//   MONGODB_URI=mongodb+srv://... REGISTRATION_KEY=... npx tsx scripts/import-camp-roster.mts "C:\path\camps-roster-2025.csv"
//   DATABASE_URL=postgres://...   REGISTRATION_KEY=... npx tsx scripts/import-camp-roster.mts "C:\path\camps-roster-2025.csv"
//
// The same key must be set as REGISTRATION_KEY on the live site, or the team area cannot open the sealed details.
import fs from "node:fs";
import { MongoClient } from "mongodb";
import { Pool } from "pg";
import { camperRows } from "../src/lib/camper-csv";
import { keyFingerprint, keyFrom, sealWith } from "../src/lib/seal-core";

const file = process.argv[2];
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGO_URL;
const url = (process.env.POSTGRES_URL || process.env.DATABASE_URL)?.replace(/sslmode=(require|prefer|verify-ca)/, "sslmode=verify-full");
const secret = process.env.REGISTRATION_KEY;
if (!file || !(mongoUrl || url) || !secret || secret.length < 24) {
  console.error("Usage: MONGODB_URI=... (or DATABASE_URL=...) REGISTRATION_KEY=(24+ characters) npx tsx scripts/import-camp-roster.mts <file.csv>");
  process.exit(1);
}

const { rows, skipped } = camperRows(fs.readFileSync(file, "utf8"));
const key = keyFrom(secret);
// Compare this with the key fingerprint on the team area's System status screen. If they differ the site cannot open these records.
console.log(`Sealing with key fingerprint ${keyFingerprint(key)}.`);
const record = (r: (typeof rows)[number]) => ({ id: r.id, camp: r.camp, name: r.name, year: r.year, sealed: sealWith(key, { age: r.age, guardian: r.guardian, location: r.location, contact: r.contact }) });

if (mongoUrl) {
  // Same database name rule as the site: the one in the address, else MONGODB_DB, else "christhood".
  const dbName = process.env.MONGODB_DB || /^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/.exec(mongoUrl)?.[1] || "christhood";
  const client = new MongoClient(mongoUrl, { maxPoolSize: 1, serverSelectionTimeoutMS: 45000, connectTimeoutMS: 20000, family: 4 });
  const records = client.db(dbName).collection("ch_records");
  // Update in place: an existing camper keeps the family link and code already issued.
  for (const r of rows) {
    const v = record(r);
    await records.updateOne({ _id: `campers/${r.id}` as never }, { $set: { col: "campers", id: r.id, "value.id": v.id, "value.camp": v.camp, "value.name": v.name, "value.year": v.year, "value.sealed": v.sealed } }, { upsert: true });
  }
  const n = await records.countDocuments({ col: "campers" });
  console.log(`${rows.length} campers imported${skipped ? `, ${skipped} rows skipped` : ""}. The database now holds ${n}.`);
  await client.close();
} else {
  const pool = new Pool({ connectionString: url, max: 1 });
  await pool.query("create table if not exists ch_records (col text not null, id text not null, value jsonb not null, primary key (col, id))");
  for (const r of rows) {
    await pool.query("insert into ch_records (col, id, value) values ('campers', $1, $2) on conflict (col, id) do update set value = ch_records.value || excluded.value", [r.id, JSON.stringify(record(r))]);
  }
  const count = await pool.query("select count(*)::int n from ch_records where col = 'campers'");
  console.log(`${rows.length} campers imported${skipped ? `, ${skipped} rows skipped` : ""}. The database now holds ${count.rows[0].n}.`);
  await pool.end();
}
