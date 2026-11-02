import { notFound, redirect } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { ADMIN_PATH, requireUser } from "@/lib/auth";
import { unseal } from "@/lib/crypto";
import { families } from "@/lib/family";
import { campScope, mayOpenCamp } from "@/lib/rbac";
import { collection } from "@/lib/store";
import { formatStamp } from "@/lib/time";
import CampReviewForm from "@/components/admin/CampReviewForm";
import { LinkFamilyForm } from "@/components/admin/FamilyAdmin";
import { btnClass, Chip, Notice, PageTitle } from "@/components/admin/ui";
import type { CampApplication, CampSealed } from "@/lib/types";

export const metadata = { title: "Camp application" };

const wa = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;
const Fact = ({ label, value }: { label: string; value?: React.ReactNode }) => (value ? <div><dt className="text-[0.85rem] font-semibold text-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-wrap break-words">{value}</dd></div> : null);

export default async function CampApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (user.mustChange) redirect(`${ADMIN_PATH}/account`);
  const app = await collection<CampApplication>("camp-applications").get(id);
  if (!app) notFound();
  if (!mayOpenCamp(user, app)) redirect(`${ADMIN_PATH}/no-access`);

  let d: CampSealed | null = null;
  try {
    d = await unseal<CampSealed>(app.sealed);
  } catch {
    d = null;
  }
  const onFamily = app.familyId ? await families.get(app.familyId).catch(() => null) : null;
  const canLink = campScope(user) === "all";
  return (
    <>
      <PageTitle title={app.childName} icon="tent" lead={`${app.eventTitle} · received ${formatStamp(app.createdAt)}`} crumbs={[{ label: "Camp applications", href: "/123admin/camps" }, { label: app.childName }]} actions={<><Chip tone={app.status === "Approved" ? "ok" : app.status === "Pending review" ? "new" : "warn"}>{app.status}</Chip>{app.paymentVerified && <Chip tone="ok">Payment checked</Chip>}</>} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="grid gap-10">
          {app.ageReview && <Notice tone="warn" title="Check the age">{app.childName} will be {app.ageAtCamp} at camp, outside the usual range for this camp. It is not refused automatically: talk to the parent and decide.</Notice>}
          {!d && <Notice tone="bad" title="The private details could not be opened">The registration key may have changed. The contact details below are still available.</Notice>}

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-xl">Parent or guardian</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Fact label="Name" value={app.guardian} />
              <Fact label="Phone" value={app.phone} />
              <Fact label="Email" value={app.email} />
              <Fact label="Residence" value={[d?.residence, d?.house].filter(Boolean).join(", ")} />
              <Fact label="ID number" value={d?.guardianId} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2"><a href={`tel:${app.phone}`} className={btnClass.secondary}><Phone className="size-4" aria-hidden /> Call</a><a href={wa(app.phone)} target="_blank" rel="noopener noreferrer" className={btnClass.secondary}><MessageCircle className="size-4" aria-hidden /> WhatsApp</a></div>
          </section>

          {d && (
            <>
              <section aria-labelledby="child">
                <h2 id="child" className="text-xl">The child</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Fact label="Date of birth" value={`${d.dob} (age ${app.ageAtCamp} at camp)`} />
                  <Fact label="Preferred name" value={d.nickname} />
                  <Fact label="Gender" value={d.gender} />
                  <Fact label="School" value={d.school} />
                  <Fact label="Class or grade" value={d.grade} />
                  <Fact label="Swimming" value={d.swimming} />
                </dl>
              </section>
              <section aria-labelledby="em">
                <h2 id="em" className="text-xl">Emergency contacts</h2>
                <ul className="mt-4 border-t border-rule">
                  {d.emergencies.map((e, i) => <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-rule py-3"><span><span className="font-bold">{e.name}</span>{e.relationship ? <span className="text-muted"> · {e.relationship}</span> : null}</span><a href={`tel:${e.phone}`} className="inline-flex min-h-11 items-center font-semibold text-purple underline underline-offset-4">{e.phone}</a></li>)}
                </ul>
              </section>
              <section aria-labelledby="health">
                <h2 id="health" className="text-xl">Health and care <span className="text-[0.9rem] font-normal text-muted">(confidential)</span></h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Fact label="Allergies" value={d.allergies} />
                  <Fact label="Existing conditions" value={d.conditions} />
                  <Fact label="Medication" value={d.medication} />
                  <Fact label="Special needs" value={d.specialNeeds} />
                  <Fact label="Physical disabilities or support" value={d.disabilities} />
                  <Fact label="Other conditions" value={d.otherConditions} />
                  <Fact label="Doctor" value={[d.doctor, d.doctorPhone].filter(Boolean).join(" · ")} />
                  <Fact label="Hospital" value={d.hospital} />
                  <Fact label="Blood group" value={d.blood} />
                  <Fact label="Insurance" value={[d.insurer, d.policy].filter(Boolean).join(" · ")} />
                </dl>
              </section>
              <section aria-labelledby="consent">
                <h2 id="consent" className="text-xl">Consent</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Fact label="Signed by (typed)" value={d.signature} />
                  <Fact label="When" value={formatStamp(d.consentAt)} />
                  <Fact label="Photos and videos" value={d.mediaConsent === "Yes" ? "Allowed" : "Not allowed. Do not photograph or film this child."} />
                  <Fact label="Wording agreed" value={d.consentVersion} />
                </dl>
              </section>
              <section aria-labelledby="pay">
                <h2 id="pay" className="text-xl">Payment declared by the parent</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Fact label="Payment made" value={d.paymentType} />
                  <Fact label="Amount" value={d.amount ? `KES ${d.amount.toLocaleString("en-KE")}` : undefined} />
                  <Fact label="Method" value={d.paymentMode} />
                  <Fact label="Reference" value={d.paymentReference} />
                  <Fact label="Payment date" value={d.paymentDate} />
                  <Fact label="Balance to be cleared by" value={d.balanceDate} />
                  <Fact label="Pocket money" value={d.pocketMoney ? `KES ${d.pocketMoney.toLocaleString("en-KE")}` : undefined} />
                </dl>
              </section>
            </>
          )}
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-xl">Your decision</h2>
          <div className="mt-4"><CampReviewForm app={app} canDelete={user.role === "admin"} /></div>
          {(onFamily || canLink) && (
            <div className="mt-12 border-t border-rule pt-8">
              <h2 className="text-xl">Family page</h2>
              {onFamily ? (
                <p className="mt-3 text-muted">On the family page of <span className="font-semibold text-ink">{onFamily.name}</span> ({onFamily.phone}). They see the status, the timetable and any notes you share.</p>
              ) : (
                <>
                  <p className="mt-3 text-muted">This application was made without a family page, so the parent cannot see notes or the timetable yet.</p>
                  <div className="mt-5"><LinkFamilyForm id={app.id} childName={app.childName} /></div>
                </>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
