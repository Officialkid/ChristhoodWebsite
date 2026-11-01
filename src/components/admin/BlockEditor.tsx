"use client";

import { useId, useMemo, useState } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical, ListChecks, Plus, Quote, Rows3, Image as ImageIcon, Text, Trash2, Type, X } from "lucide-react";
import { btnClass } from "./ui";
import { PhotoField, previewSrc } from "./PhotoField";
import type { Block } from "@/lib/types";

type Keyed = Block & { _k: string };
const uid = () => Math.random().toString(36).slice(2, 9);
const withKeys = (blocks: Block[]): Keyed[] => blocks.map((b) => ({ ...b, _k: uid() }));
const strip = (blocks: Keyed[]): Block[] => blocks.map(({ _k, ...b }) => (void _k, b as Block));

const meta: Record<Block["type"], { label: string; Icon: typeof Type; blank: () => Block }> = {
  statement: { label: "Big statement", Icon: Type, blank: () => ({ type: "statement", label: "", text: "" }) },
  prose: { label: "Paragraphs", Icon: Text, blank: () => ({ type: "prose", title: "", paragraphs: [""] }) },
  cards: { label: "Sections with headings", Icon: Rows3, blank: () => ({ type: "cards", title: "", intro: "", items: [{ title: "", text: "" }] }) },
  list: { label: "Bulleted list", Icon: ListChecks, blank: () => ({ type: "list", title: "", intro: "", items: [""] }) },
  quote: { label: "Quote", Icon: Quote, blank: () => ({ type: "quote", text: "", cite: "" }) },
  gallery: { label: "Photo gallery", Icon: ImageIcon, blank: () => ({ type: "gallery", title: "", photos: [] }) },
};

/** A textarea that edits a list of lines or paragraphs while keeping exactly what was typed. */
function ListField({ label, value, onChange, sep = "\n", rows = 4, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; sep?: "\n" | "\n\n"; rows?: number; hint?: string }) {
  const id = useId();
  const [raw, setRaw] = useState(value.join(sep));
  return (
    <div>
      <label htmlFor={id} className="f-label">{label}</label>
      {hint && <p className="f-hint">{hint}</p>}
      <textarea id={id} rows={rows} value={raw} onChange={(e) => { setRaw(e.target.value); onChange(e.target.value.split(sep === "\n" ? /\n+/ : /\n{2,}/).map((s) => s.replace(/\n/g, " ").trim()).filter(Boolean)); }} className="f-input" />
    </div>
  );
}

function Text1({ label, value, onChange, optional, multiline }: { label: string; value?: string; onChange: (v: string) => void; optional?: boolean; multiline?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="f-label">{label} {optional && <span className="font-normal text-muted">(optional)</span>}</label>
      {multiline ? <textarea id={id} rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="f-input" /> : <input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="f-input" />}
    </div>
  );
}

function BlockBody({ block, set }: { block: Keyed; set: (patch: Partial<Block>) => void }) {
  switch (block.type) {
    case "statement":
      return (<><Text1 label="Small heading" value={block.label} onChange={(v) => set({ label: v })} /><Text1 label="The statement" multiline value={block.text} onChange={(v) => set({ text: v })} /></>);
    case "prose":
      return (<><Text1 label="Heading" optional value={block.title} onChange={(v) => set({ title: v })} /><ListField label="Paragraphs" sep={"\n\n"} rows={8} value={block.paragraphs} onChange={(v) => set({ paragraphs: v })} hint="Leave a blank line between paragraphs." /></>);
    case "list":
      return (<><Text1 label="Heading" value={block.title} onChange={(v) => set({ title: v })} /><Text1 label="Opening line" optional value={block.intro} onChange={(v) => set({ intro: v })} /><ListField label="List items" rows={6} value={block.items} onChange={(v) => set({ items: v })} hint="One item per line." /></>);
    case "quote":
      return (<><Text1 label="Quote" multiline value={block.text} onChange={(v) => set({ text: v })} /><Text1 label="Who said it" optional value={block.cite} onChange={(v) => set({ cite: v })} /></>);
    case "gallery":
      return (
        <>
          <Text1 label="Heading" value={block.title} onChange={(v) => set({ title: v })} />
          <div>
            <p className="f-label">Photos</p>
            {block.photos.length > 0 && (
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {block.photos.map((p, i) => (
                  <li key={`${p}-${i}`} className="relative aspect-square overflow-hidden bg-paper-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    <img src={previewSrc(p)} alt="" className="size-full object-cover" />
                    <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => set({ photos: block.photos.filter((_, j) => j !== i) })} className="absolute right-1 top-1 inline-flex size-8 items-center justify-center bg-ink/80 text-paper hover:bg-danger"><X className="size-4" aria-hidden /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3"><PhotoField name="_gallery" label="Add a photo" bare onChange={(src) => src && set({ photos: [...block.photos, src] })} /></div>
          </div>
        </>
      );
    case "cards":
      return (
        <>
          <Text1 label="Heading" value={block.title} onChange={(v) => set({ title: v })} />
          <Text1 label="Opening line" optional multiline value={block.intro} onChange={(v) => set({ intro: v })} />
          <label className="f-choice"><input type="checkbox" checked={Boolean(block.numbered)} onChange={(e) => set({ numbered: e.target.checked })} /><span>Number the headings (1, 2, 3…)</span></label>
          <ol className="grid gap-4">
            {block.items.map((it, i) => (
              <li key={i} className="grid gap-4 border border-rule p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">Section {i + 1}</p>
                  <div className="flex gap-1">
                    <button type="button" disabled={i === 0} aria-label="Move section up" onClick={() => set({ items: arrayMove(block.items, i, i - 1) })} className="inline-flex size-10 items-center justify-center hover:bg-paper-2 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button>
                    <button type="button" disabled={i === block.items.length - 1} aria-label="Move section down" onClick={() => set({ items: arrayMove(block.items, i, i + 1) })} className="inline-flex size-10 items-center justify-center hover:bg-paper-2 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button>
                    <button type="button" aria-label="Remove section" onClick={() => set({ items: block.items.filter((_, j) => j !== i) })} className="inline-flex size-10 items-center justify-center text-danger hover:bg-danger-tint"><Trash2 className="size-4" aria-hidden /></button>
                  </div>
                </div>
                <Text1 label="Heading" value={it.title} onChange={(v) => set({ items: block.items.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
                <Text1 label="Words" optional multiline value={it.text} onChange={(v) => set({ items: block.items.map((x, j) => (j === i ? { ...x, text: v } : x)) })} />
                <ListField label="Bullet points" value={it.bullets ?? []} rows={3} hint="One per line. Leave empty for none." onChange={(v) => set({ items: block.items.map((x, j) => (j === i ? { ...x, bullets: v.length ? v : undefined } : x)) })} />
              </li>
            ))}
          </ol>
          <div><button type="button" onClick={() => set({ items: [...block.items, { title: "", text: "" }] })} className={btnClass.secondary}><Plus className="size-4" aria-hidden /> Add a section</button></div>
        </>
      );
  }
}

const preview = (b: Block) => (b.type === "statement" ? b.label || b.text : b.type === "quote" ? b.text : b.type === "prose" ? b.title || b.paragraphs[0] : b.title) || "Not filled in yet";

function SortableBlock({ block, index, count, onMove, onRemove, onSet }: { block: Keyed; index: number; count: number; onMove: (to: number) => void; onRemove: () => void; onSet: (patch: Partial<Block>) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block._k });
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const { label, Icon } = meta[block.type];
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`border border-rule bg-paper ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <div className="flex items-center gap-1 px-1 py-1">
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Drag section ${index + 1} to move it`} className="inline-flex size-11 shrink-0 cursor-grab items-center justify-center text-muted hover:text-ink active:cursor-grabbing"><GripVertical className="size-5" aria-hidden /></button>
        <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left">
          <Icon className="size-5 shrink-0 text-purple" aria-hidden />
          <span className="min-w-0 flex-1"><span className="block text-[0.85rem] font-semibold text-muted">{label}</span><span className="block truncate font-bold">{preview(block)}</span></span>
        </button>
        <span className="flex shrink-0">
          <button type="button" disabled={index === 0} aria-label="Move up" onClick={() => onMove(index - 1)} className="inline-flex size-11 items-center justify-center hover:bg-paper-2 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button>
          <button type="button" disabled={index === count - 1} aria-label="Move down" onClick={() => onMove(index + 1)} className="inline-flex size-11 items-center justify-center hover:bg-paper-2 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button>
          <button type="button" aria-label={`Delete ${label.toLowerCase()}`} onClick={onRemove} className="inline-flex size-11 items-center justify-center text-danger hover:bg-danger-tint"><Trash2 className="size-4" aria-hidden /></button>
        </span>
      </div>
      {/* Kept in the page while closed so everything typed is still saved. */}
      <div id={bodyId} hidden={!open} className="grid gap-5 border-t border-rule p-4"><BlockBody block={block} set={onSet} /></div>
    </li>
  );
}

/** Edits the sections of a page. Writes the result as JSON into a hidden field named `name`. */
export default function BlockEditor({ name, initial }: { name: string; initial: Block[] }) {
  const [blocks, setBlocks] = useState<Keyed[]>(() => withKeys(initial));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const json = useMemo(() => JSON.stringify(strip(blocks)), [blocks]);

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    setBlocks((b) => arrayMove(b, b.findIndex((x) => x._k === e.active.id), b.findIndex((x) => x._k === e.over!.id)));
  };

  return (
    <div>
      <input type="hidden" name={name} value={json} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={blocks.map((b) => b._k)} strategy={verticalListSortingStrategy}>
          <ol className="grid gap-2">
            {blocks.map((b, i) => (
              <SortableBlock
                key={b._k}
                block={b}
                index={i}
                count={blocks.length}
                onMove={(to) => setBlocks((l) => arrayMove(l, i, to))}
                onRemove={() => setBlocks((l) => l.filter((x) => x._k !== b._k))}
                onSet={(patch) => setBlocks((l) => l.map((x) => (x._k === b._k ? ({ ...x, ...patch } as Keyed) : x)))}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {blocks.length === 0 && <p className="mb-3 text-muted">This page has no extra sections yet.</p>}
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Add a section">
        {(Object.keys(meta) as Block["type"][]).map((t) => {
          const { label, Icon } = meta[t];
          return <button key={t} type="button" onClick={() => setBlocks((l) => [...l, { ...meta[t].blank(), _k: uid() } as Keyed])} className={btnClass.secondary}><Icon className="size-4" aria-hidden /> {label}</button>;
        })}
      </div>
    </div>
  );
}
