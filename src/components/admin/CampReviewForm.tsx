"use client";

import { useRouter } from "next/navigation";
import { deleteApplication, reviewApplication } from "@/app/123admin/actions-camps";
import { DeleteButton, SaveButton, SelectField, TextArea, Toggle, useSave } from "./forms";
import type { CampApplication } from "@/lib/types";

export default function CampReviewForm({ app, canDelete }: { app: CampApplication; canDelete: boolean }) {
  const router = useRouter();
  const { run, formRef, errors } = useSave(reviewApplication, () => router.refresh());
  return (
    <form ref={formRef} action={run} className="grid gap-6" noValidate>
      <input type="hidden" name="id" value={app.id} />
      <SelectField
        name="status"
        label="Decision"
        defaultValue={app.status}
        error={errors.status}
        options={["Pending review", "Approved", "Needs correction", "Declined"].map((s) => ({ value: s, label: s }))}
        hint="“Needs correction”: tell the parent what to change in the note, then contact them."
      />
      <Toggle name="paymentVerified" label="I have checked the payment" hint="Tick only after the office has seen the money." defaultChecked={app.paymentVerified} />
      <TextArea name="note" label="Note for the camp office" optional rows={4} defaultValue={app.reviewNote} hint="Only the leaders see this. It is never shown to the parent." />
      {app.reviewedBy && <p className="text-[0.9rem] text-muted">Last reviewed by {app.reviewedBy}.</p>}
      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <SaveButton>Save decision</SaveButton>
        {canDelete && <span className="ml-auto"><DeleteButton label="Delete application" action={async (fd) => { const r = await deleteApplication(fd); if (r.ok) router.push("/123admin/camps"); return r; }} fields={{ id: app.id }} /></span>}
      </div>
    </form>
  );
}
