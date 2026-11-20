"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteUpdate, postUpdate } from "@/app/123admin/actions-family";
import { UpdateArticle } from "@/components/camps/UpdateArticle";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { DeleteButton, useSave } from "./forms";
import { DataTable } from "./kit/DataTable";
import { EmptyState } from "./kit/EmptyState";
import { Facts, RecordSheet } from "./kit/RecordSheet";
import { StatusIndicator } from "./kit/StatusIndicator";
import { useGuard } from "./workspace";
import { btnClass } from "./ui";

export type Audience = { value: string; label: string; short: string; families: number };
export type UpdateRow = { id: string; title: string; body: string; camp: "all" | "jewels" | "teen-life"; audience: string; by: string; createdAt: string; stamp: string };

const TITLE_MAX = 120;
const BODY_MAX = 3000;

export default function UpdatesWorkspace({ audiences, updates, writable }: { audiences: Audience[]; updates: UpdateRow[]; writable: boolean }) {
  const router = useRouter();
  const guard = useGuard();
  const [camp, setCamp] = useState(audiences[0]?.value ?? "all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [touched, setTouched] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { run, formRef, errors, pending } = useSave(postUpdate, () => {
    setTitle(""); setBody(""); setTouched(false); setConfirming(false);
    router.refresh();
  });

  const audience = audiences.find((a) => a.value === camp) ?? audiences[0];
  const problems = { title: title.trim().length < 3 ? "Give the update a short title." : undefined, body: body.trim().length < 3 ? "Write the update." : undefined };
  const invalid = Boolean(problems.title || problems.body);
  const dirty = title.trim() !== "" || body.trim() !== "";
  useEffect(() => { guard.setDirty(dirty); }, [dirty]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => guard.setDirty(false), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!pending && Object.keys(errors).length) setConfirming(false); }, [pending, errors]);

  const open = updates.find((u) => u.id === openId) ?? null;
  const columns = useMemo<ColumnDef<UpdateRow, any>[]>( // eslint-disable-line @typescript-eslint/no-explicit-any
    () => [
      { id: "title", accessorKey: "title", header: "Title", meta: { label: "Title" }, cell: ({ row: { original: u } }) => <button type="button" aria-haspopup="dialog" onClick={() => setOpenId(u.id)} className="a-go text-left font-bold">{u.title}</button> },
      { id: "audience", accessorKey: "audience", header: "Audience", meta: { label: "Audience", hideable: true }, cell: ({ row: { original: u } }) => <StatusIndicator tone={u.camp === "all" ? "new" : "plain"}>{u.audience}</StatusIndicator> },
      { id: "by", accessorKey: "by", header: "Posted by", meta: { label: "Posted by", hideable: true } },
      { id: "posted", accessorKey: "createdAt", header: "Posted", meta: { label: "Posted", className: "k" }, cell: ({ row: { original: u } }) => <time dateTime={u.createdAt}>{u.stamp}</time> },
    ],
    [],
  );

  return (
    <div className="grid gap-10">
      <section aria-labelledby="write" className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form ref={formRef} action={run} noValidate onSubmit={(e) => { if (!confirming) { e.preventDefault(); setTouched(true); if (!invalid) setConfirming(true); } }} className="grid content-start gap-5">
          <h2 id="write" className="text-[1.15rem]">Write an update</h2>
          <FieldGroup>
            <Field id="f-camp" label="Who is it for?" hint={audience ? `${audience.families} ${audience.families === 1 ? "family page" : "family pages"} will show it.` : undefined} error={errors.camp}>
              {(aria) => (
                <select {...aria} name="camp" value={camp} onChange={(e) => setCamp(e.target.value)} className="f-input">
                  {audiences.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              )}
            </Field>
            <Field id="f-title" label="Title" count={title.length} max={TITLE_MAX} error={errors.title ?? (touched ? problems.title : undefined)}>
              {(aria) => <input {...aria} name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} className="f-input" />}
            </Field>
            <Field id="f-body" label="Message" count={body.length} max={BODY_MAX} hint="Every family in that group can read this. Do not put a child's name or health details in it." error={errors.body ?? (touched ? problems.body : undefined)}>
              {(aria) => <textarea {...aria} name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={BODY_MAX} rows={8} className="f-input" />}
            </Field>
          </FieldGroup>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!writable || pending} className={btnClass.primary}><Send className="size-4" aria-hidden /> Review and post</button>
            {dirty && <button type="button" onClick={() => { setTitle(""); setBody(""); setTouched(false); }} className={btnClass.ghost}>Clear</button>}
          </div>
        </form>

        <div aria-labelledby="preview-h" role="region" className="min-w-0">
          <h2 id="preview-h" className="text-[1.15rem]">As families see it</h2>
          <p className="mt-1 text-[0.9rem] text-muted">This is how the update looks on the family page. It changes as you type.</p>
          <div className="mt-3 border-t border-ink/30">
            {dirty ? <UpdateArticle title={title.trim() || "Your title"} stamp="Just now" audience={camp === "all" ? undefined : audience?.short} body={body.trim() || "Your message"} /> : <p className="border-b border-rule py-7 text-muted">Nothing to preview yet. Start writing and it appears here.</p>}
          </div>
        </div>
      </section>

      <Dialog open={confirming} onOpenChange={(o) => !pending && setConfirming(o)}>
        <DialogContent>
          <DialogTitle>Post this update?</DialogTitle>
          <DialogDescription>
            It goes to <strong className="text-ink">{audience?.label}</strong>: {audience?.families ?? 0} {audience?.families === 1 ? "family page" : "family pages"}. Parents can read it straight away. You can remove it later, but anyone who has read it has read it.
          </DialogDescription>
          <p className="mt-3 border-l-4 border-gold pl-3 text-[0.93rem]">Check that it names no child and gives no health details.</p>
          <DialogFooter>
            <DialogClose className={btnClass.secondary} disabled={pending}>Keep editing</DialogClose>
            <button type="button" disabled={pending} onClick={() => formRef.current?.requestSubmit()} className={btnClass.primary}>{pending ? "Posting…" : "Post update"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-labelledby="history" className="grid gap-3">
        <h2 id="history" className="text-[1.15rem]">Posted so far</h2>
        <DataTable
          data={updates}
          columns={columns}
          getRowId={(u) => u.id}
          caption="Updates posted to families"
          unit={["update", "updates"]}
          initialSort={[{ id: "posted", desc: true }]}
          pageSize={25}
          empty={<EmptyState icon="megaphone" title="Nothing posted yet">Your first update will appear here.</EmptyState>}
        />
      </section>

      <RecordSheet open={Boolean(open)} onClose={() => setOpenId(null)} title={open?.title ?? "Update"} description={open ? `${open.audience} · ${open.stamp}` : undefined}
        footer={open && <DeleteButton label="Remove this update" confirmText="Yes, remove it" fields={{ id: open.id }} action={async (fd) => { const r = await deleteUpdate(fd); if (r.ok) { toast.success(r.message ?? "Removed."); setOpenId(null); router.refresh(); } return r; }} />}
      >
        {open && (
          <div className="grid gap-6">
            <Facts items={[{ label: "Audience", value: open.audience }, { label: "Posted by", value: open.by }, { label: "Posted", value: open.stamp }]} />
            <div>
              <h3 className="text-[1.05rem]">As families see it</h3>
              <div className="mt-2 border-t border-ink/30"><UpdateArticle title={open.title} stamp={open.stamp} audience={open.camp === "all" ? undefined : open.audience} body={open.body} /></div>
            </div>
          </div>
        )}
      </RecordSheet>
    </div>
  );
}
