import { requirePerm } from "@/lib/auth";
import { getSettings, getSlots } from "@/lib/content";
import { store } from "@/lib/store";
import { defaultSettings } from "@/content/site";
import { slotGroups } from "@/content/slots";
import HomeStudio, { type StudioSlot } from "@/components/admin/HomeStudio";

export const metadata = { title: "Home page" };

/** The home page as a workspace: the real page in the middle, the properties of the chosen part at the side. */
export default async function HomeEditor() {
  await requirePerm("home");
  const [settings, slots] = await Promise.all([store.writable ? getSettings() : Promise.resolve(defaultSettings), store.writable ? getSlots() : Promise.resolve({})]);
  const home = slotGroups.find((g) => g.id === "home")!.slots;
  const pictures: StudioSlot[] = home.map((s) => {
    const chosen = (slots as Record<string, { src?: string; focus?: string }>)[s.key];
    return { key: s.key, label: s.label, fallback: s.fallback, focus: chosen?.focus ?? s.focus, src: chosen?.src };
  });
  return (
    <HomeStudio
      canSave={store.writable}
      slots={pictures}
      initial={{ headline: settings.hero.headline, sub: settings.hero.sub, kicker: settings.hero.kicker, verse: settings.verse.text, ref: settings.verse.ref, welcome: settings.welcome.join("\n\n") }}
    />
  );
}
