import { resolvePhoto } from "@/lib/images";

type Props = {
  /** Photo name from the photo library, or a full web address. */
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Fill the parent box and crop to fit. */
  cover?: boolean;
  /** Where the crop should centre, e.g. "50% 30%" to keep faces in frame. */
  focus?: string;
};

/** A photo with a soft blur while it loads, sized files for each screen, and no layout jump. */
export default function Img({ src, alt, className = "", sizes = "100vw", priority, cover, focus }: Props) {
  const p = resolvePhoto(src);
  const style: React.CSSProperties = {
    ...(p.blur ? { backgroundImage: `url(${p.blur})`, backgroundSize: "cover" } : {}),
    ...(focus ? { objectPosition: focus } : {}),
  };
  return (
    // eslint-disable-next-line @next/next/no-img-element -- photos are prepared ahead of time
    <img
      src={p.full}
      srcSet={p.small !== p.full ? `${p.small} 720w, ${p.full} 1800w` : undefined}
      sizes={sizes}
      width={p.w}
      height={p.h}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={`${cover ? "absolute inset-0 h-full w-full object-cover" : "h-auto w-full"} ${className}`}
      style={style}
    />
  );
}
