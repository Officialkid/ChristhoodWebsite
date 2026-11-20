import { cn } from "@/lib/utils";

/** shadcn Field: a label, the control, a hint and an error, wired together by id. The control carries the `f-input` look used everywhere. */
export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-5", className)} {...props} />;
}

export function Field({ id, label, hint, error, count, max, optional, children }: { id: string; label: string; hint?: React.ReactNode; error?: string; count?: number; max?: number; optional?: boolean; children: (aria: { id: string; "aria-describedby"?: string; "aria-invalid"?: true }) => React.ReactNode }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="f-label">{label}{optional && <span className="font-normal text-muted"> (optional)</span>}</label>
        {max !== undefined && count !== undefined && <span aria-hidden className={cn("text-[0.8rem] tabular-nums", count > max ? "font-bold text-danger" : "text-muted")}>{count}/{max}</span>}
      </div>
      {hint && <p id={`${id}-hint`} className="f-hint">{hint}</p>}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error && <p id={`${id}-err`} role="alert" className="f-error">{error}</p>}
    </div>
  );
}
