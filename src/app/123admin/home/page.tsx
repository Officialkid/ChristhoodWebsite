import { requirePerm } from "@/lib/auth";
import { getSettings } from "@/lib/content";
import { store } from "@/lib/store";
import { defaultSettings } from "@/content/site";
import { HomeForm } from "@/components/admin/ContentForms";
import { LinkButton, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Home page" };

export default async function HomeEditor() {
  await requirePerm("home");
  const settings = store.writable ? await getSettings() : defaultSettings;
  return (
    <>
      <PageTitle title="Home page" icon="home" lead="The words at the top of the home page, the weekly scripture and the welcome." actions={<LinkButton href="/123admin/pictures" icon="image-plus">Change the pictures</LinkButton>} />
      <div className="mt-8"><HomeForm settings={settings} /></div>
    </>
  );
}
