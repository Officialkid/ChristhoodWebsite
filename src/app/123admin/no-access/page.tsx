import { requireUser } from "@/lib/auth";
import { LinkButton, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "No access" };

export default async function NoAccess() {
  await requireUser();
  return (
    <>
      <PageTitle title="That part is not for your department" icon="shield" lead="Each department head can change only what their department owns. If you think you should have access, ask your administrator." />
      <div className="mt-8"><LinkButton href="/123admin" variant="purple">Back to the overview</LinkButton></div>
    </>
  );
}
