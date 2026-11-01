import { requirePerm } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { SettingsForm } from "@/components/admin/ContentForms";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Church details" };

export default async function SettingsPage() {
  await requirePerm("settings");
  return (
    <>
      <PageTitle title="Church details" icon="settings" lead="Service times, address, phone numbers and giving details. They update everywhere on the website at once." />
      <div className="mt-8"><SettingsForm settings={await getSettings()} /></div>
    </>
  );
}
