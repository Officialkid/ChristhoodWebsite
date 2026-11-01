import { requirePerm } from "@/lib/auth";
import { store } from "@/lib/store";
import MemberForm from "@/components/admin/MemberForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Register a new member" };

export default async function NewMemberPage() {
  await requirePerm("members");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  return (
    <>
      <PageTitle
        title="Register a new member"
        icon="guest"
        lead="Only the protocol team registers new members. Ask them the questions below, then ask whether they agree that we may keep their details."
        crumbs={[{ label: "New members", href: "/123admin/guests" }, { label: "Register" }]}
      />
      <div className="mt-8 grid gap-6">
        {!store.writable && <Notice tone="warn" title="Saving is not switched on yet">Members cannot be saved until the database is connected.</Notice>}
        <MemberForm today={today} />
      </div>
    </>
  );
}
