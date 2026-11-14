/** A semantic wrapper for content that must remain visible before, during and after enhancement. */
export default function Reveal({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}
