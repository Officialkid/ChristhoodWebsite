import { requireUser } from "@/lib/auth";
import { departmentName } from "@/lib/rbac";
import PasswordForm from "@/components/admin/PasswordForm";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="My account" icon="key" />
      <div className="mt-8 grid max-w-xl gap-8">
        {user.mustChange && <Notice tone="warn" title="Choose your own password">You are using a temporary password. Pick a new one to continue.</Notice>}
        <dl className="grid gap-3 border-b border-rule pb-6">
          <div><dt className="text-[0.85rem] font-semibold text-muted">Name</dt><dd className="font-bold">{user.name}</dd></div>
          <div><dt className="text-[0.85rem] font-semibold text-muted">Email</dt><dd className="font-bold">{user.email}</dd></div>
          <div><dt className="text-[0.85rem] font-semibold text-muted">Access</dt><dd className="font-bold">{user.role === "admin" ? "Administrator" : user.departments.map(departmentName).join(", ")}</dd></div>
        </dl>
        <PasswordForm />
      </div>
    </>
  );
}
