/** The top of a workspace screen: what it is, one line on what it is for, and the few actions that belong to it. The header bar above already shows where you are, so no breadcrumbs here. */
export function PageHeader({ title, description, actions, meta }: { title: string; description?: React.ReactNode; actions?: React.ReactNode; /** A short line of facts under the title (counts, last change). */ meta?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="break-words text-[clamp(1.45rem,2vw,1.75rem)] leading-[1.1]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[68ch] text-[0.95rem] leading-relaxed text-muted">{description}</p>}
        {meta && <p className="mt-1 text-[0.88rem] text-muted">{meta}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
