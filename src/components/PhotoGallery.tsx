import { resolvePhoto } from "@/lib/images";
import { Gallery } from "./Interactive";

/** Server-side wrapper: looks up sizes here so the browser only receives what it needs. */
export default function PhotoGallery({ title, photos }: { title: string; photos: string[] }) {
  return <Gallery title={title} photos={photos.map((p) => resolvePhoto(p))} />;
}
