import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { sealingKey, sealProblem, unseal, type SealProblem } from "@/lib/crypto";
import { maskPhone } from "@/lib/mask";
import { campScope, mayOpenCamp } from "@/lib/rbac";
import { collection, store } from "@/lib/store";
import ReturningCampers, { type CamperRow } from "@/components/admin/ReturningCampers";
import CamperImport from "@/components/admin/CamperImport";
import { PageHeader } from "@/components/admin/kit/PageHeader";
import { btnClass, Notice } from "@/components/admin/ui";
import type { Camper, CamperSealed } from "@/lib/types";

export const metadata = { title: "Returning campers" };

export default async function ReturningCampersPage() {
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const scope = campScope(user);
  if (scope !== "all" && scope.length === 0) redirect(`${ADMIN_PATH}/no-access`);

  const records = (await collection<Camper>("campers").list().catch(() => [])).filter((c) => mayOpenCamp(user, c));
  const problems: Partial<Record<SealProblem, number>> = {};
  const campers: CamperRow[] = [];
  for (const c of records) {
    let d: CamperSealed = {};
    let opened = true;
    try {
      d = await unseal<CamperSealed>(c.sealed);
    } catch (error) {
      opened = false;
      const why = sealProblem(error);
      problems[why] = (problems[why] ?? 0) + 1;
    }
    // The phone number is masked here and opened one camper at a time, on request, by revealCamperContact (which logs it).
    campers.push({ id: c.id, name: c.name, camp: c.camp, year: c.year, age: d.age, guardian: d.guardian, location: d.location, hasContact: Boolean(d.contact), contactMask: maskPhone(d.contact), opened, family: c.familyId ? "linked" : c.code && new Date(c.code.expires).getTime() > Date.now() ? "code" : "none" });
  }
  const failed = campers.filter((c) => !c.opened).length;
  const key = scope === "all" && failed ? await sealingKey() : null;
  const canImport = scope === "all";

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Returning campers"
        description="Children who came to camp before. Call their families to invite them back. Once you have checked someone is the parent, make them a family code so the child joins their family page."
        actions={
          <>
            {canImport && <CamperImport existingIds={campers.map((c) => c.id)} writable={store.writable} />}
            <a href="/api/admin/export?kind=campers" className={btnClass.secondary}><Download className="size-4" aria-hidden /> Download list</a>
          </>
        }
      />
      {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">The list cannot be kept until the database is connected.</Notice>}
      {failed > 0 && <SealNotice failed={failed} total={campers.length} problems={problems} fingerprint={key?.fingerprint} admin={canImport} />}
      <ReturningCampers campers={campers} canIssue={canImport} />
    </div>
  );
}

/** Says what is wrong with the private details and what is safe to do. Never shows the key, only a short fingerprint to compare. */
function SealNotice({ failed, total, problems, fingerprint, admin }: { failed: number; total: number; problems: Partial<Record<SealProblem, number>>; fingerprint?: string; admin: boolean }) {
  const kinds = (Object.keys(problems) as SealProblem[]).sort((a, b) => (problems[b] ?? 0) - (problems[a] ?? 0));
  const main = kinds[0];
  const what: Record<SealProblem, string> = {
    "wrong-key": "They were saved with a different registration key from the one this site has now.",
    "no-key": "This site has no registration key at all.",
    format: "The saved text is not in the expected form, so it looks incomplete or edited.",
  };
  return (
    <Notice tone="bad" title={`Private details could not be opened for ${failed} of ${total} campers`}>
      <p>Names, camps and years are still shown. Nothing has been changed or deleted. {main ? what[main] : ""}</p>
      {admin && (
        <details className="mt-2">
          <summary className="min-h-8 cursor-pointer font-semibold">What is safe to do</summary>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5">
            <li>{fingerprint ? <>This site&apos;s key fingerprint is <code className="font-mono font-bold">{fingerprint}</code>. The import script prints the fingerprint it sealed with; the two must match.</> : "Compare the key fingerprint on System status with the one the import script printed."}</li>
            <li>Do not change the registration key now. Camp applications sealed with the current key would stop opening.</li>
            <li>If the key in Vercel has a stray space, line break or quote, set it again to the exact original value. Plain variants are already tried automatically.</li>
            <li>If the register was sealed with a key that is lost, import the CSV again once the right key is set. Importing replaces campers with the same id, so do it only after the team agrees.</li>
          </ul>
        </details>
      )}
    </Notice>
  );
}
