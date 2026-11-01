import "server-only";
import { revalidatePath, updateTag } from "next/cache";
import { CONTENT_TAG } from "./content";

/** Makes the public site pick up a change straight away. Call after every save. */
export function publish() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}
