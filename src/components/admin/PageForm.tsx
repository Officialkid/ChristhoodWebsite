"use client";

import { useRouter } from "next/navigation";
import { ExternalLink, RotateCcw } from "lucide-react";
import { resetPage, savePage } from "@/app/123admin/actions-content";
import { DeleteButton, SaveButton, TextArea, TextField, useSave } from "./forms";
import BlockEditor from "./BlockEditor";
import { PhotoField } from "./PhotoField";
import { btnClass } from "./ui";
import type { PageDoc } from "@/lib/types";

export default function PageForm({ page, publicHref, focus }: { page: PageDoc; publicHref: string; focus?: string }) {
  const router = useRouter();
  const { run, errors } = useSave(savePage);
  return (
    <form action={run} className="grid max-w-4xl gap-10" noValidate>
      <input type="hidden" name="kind" value={page.kind} />
      <input type="hidden" name="slug" value={page.slug} />
      <input type="hidden" name="heroOriginal" value={page.hero} />

      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">The top of the page</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="title" label="Page title" defaultValue={page.title} error={errors.title} required maxLength={120} />
          <TextField name="audience" label="Who it is for" optional defaultValue={page.audience} maxLength={120} hint="Shown as a small tag. For example “Ages 13–19”." />
        </div>
        <TextArea name="tagline" label="Line under the title" rows={2} defaultValue={page.tagline} maxLength={300} />
        <TextArea name="summary" label="Short summary" rows={2} defaultValue={page.summary} maxLength={400} hint="Used in the lists of ministries and programmes." />
        <PhotoField name="hero" label="Main picture" defaultValue={page.hero} focusName="heroFocus" defaultFocus={focus} hint="The big picture under the title." />
      </fieldset>

      <fieldset className="grid gap-6">
        <legend className="mb-1 text-xl font-bold">Opening words</legend>
        <TextArea name="intro" label="Introduction" rows={8} defaultValue={page.intro.join("\n\n")} hint="The first paragraph is shown larger. Leave a blank line between paragraphs." />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-xl font-bold">Sections of the page</legend>
        <p className="text-muted">Drag the handle, or use the arrows, to change the order. Open a section to edit its words.</p>
        <BlockEditor name="blocks" initial={page.blocks} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        <SaveButton>Save page</SaveButton>
        <a href={publicHref} target="_blank" rel="noopener noreferrer" className={btnClass.ghost}>View the page <ExternalLink className="size-4" aria-hidden /></a>
        <span className="ml-auto">
          <DeleteButton
            label="Back to the original wording"
            confirmText="Yes, put it back"
            action={async (fd) => { const r = await resetPage(fd); if (r.ok) router.refresh(); return r; }}
            fields={{ kind: page.kind, slug: page.slug }}
          />
        </span>
      </div>
      <p className="-mt-4 text-[0.9rem] text-muted"><RotateCcw className="mr-1 inline size-3.5" aria-hidden />“Back to the original wording” removes every change made to this page and its picture.</p>
    </form>
  );
}
