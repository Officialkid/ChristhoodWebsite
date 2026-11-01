"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { btnClass } from "./ui";

export type ShareItem = { title: string; blurb: string; url: string };

export default function ShareLinks({ items }: { items: ShareItem[] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-3 print:hidden">
        <button type="button" onClick={() => window.print()} className={btnClass.purple}><Printer className="size-4" aria-hidden /> Print these codes</button>
      </div>
      <ul className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2 print:grid-cols-2">
        {items.map((s) => (
          <li key={s.url} className="break-inside-avoid border-t border-ink pt-5">
            <h2 className="text-2xl">{s.title}</h2>
            <p className="mt-1 text-muted">{s.blurb}</p>
            <div className="mt-4 inline-block bg-white p-3">
              <QRCodeSVG value={s.url} size={176} level="M" marginSize={0} title={`QR code for ${s.title}`} bgColor="#ffffff" fgColor="#2d0f5a" />
            </div>
            <p className="mt-3 break-all font-semibold">{s.url}</p>
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(s.url); toast.success("Link copied."); }} className={`${btnClass.ghost} mt-1 -ml-3 print:hidden`}><Copy className="size-4" aria-hidden /> Copy link</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
