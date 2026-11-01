import Img from "./Img";
import { getSlot } from "@/lib/content";

type Props = Omit<React.ComponentProps<typeof Img>, "src" | "focus"> & { slot: string; fallback: string; focus?: string };

/** A photo for a named place on a page. Shows what the team chose in the admin area, or the original photo. */
export default async function SlotImg({ slot, fallback, focus, ...rest }: Props) {
  const chosen = await getSlot(slot, fallback);
  return <Img {...rest} src={chosen.src ?? fallback} focus={chosen.focus ?? focus} />;
}
