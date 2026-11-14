/** Content wrappers intentionally keep the server-rendered page visible without a scroll trigger. */
export function Wipe({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Lists remain readable in full-page captures, slow connections and reduced-motion settings. */
export function Stagger({ children, className = "", selector: _selector = ":scope > *" }: { children: React.ReactNode; className?: string; selector?: string }) {
  return <div className={className}>{children}</div>;
}
