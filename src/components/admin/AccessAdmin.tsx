"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approveRequest, declineRequest, deleteRequest, reopenRequest } from "@/app/123admin/actions-access";
import { DeleteButton, SaveButton, useSave } from "./forms";
import type { Result } from "./forms";
import { btnClass } from "./ui";
import type { Department } from "@/lib/rbac";

/** Gives a person who asked for access the role and departments they need. */
export function ApproveForm({ id, name, groups }: { id: string; name: string; groups: { title: string; items: Department[] }[] }) {
  const router = useRouter();
  const [role, setRole] = useState<"head" | "admin">("head");
  const { run, formRef, errors } = useSave(approveRequest, () => router.refresh());
  return (
    <form ref={formRef} action={run} className="grid gap-5" noValidate>
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="f-label">What can {name.split(" ")[0]} do?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="f-choice !items-start !py-3"><input type="radio" name="role" value="head" checked={role === "head"} onChange={() => setRole("head")} className="mt-1" /><span><span className="block font-bold">Department head</span><span className="text-[0.92rem] text-muted">Only what their departments own. Pick them below.</span></span></label>
          <label className="f-choice !items-start !py-3"><input type="radio" name="role" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} className="mt-1" /><span><span className="block font-bold">Administrator</span><span className="text-[0.92rem] text-muted">Everything, including adding and removing people.</span></span></label>
        </div>
      </fieldset>
      {role === "head" && (
        <fieldset aria-describedby={errors.departments ? `dep-err-${id}` : undefined}>
          <legend className="f-label">Departments</legend>
          {errors.departments && <p id={`dep-err-${id}`} role="alert" className="f-error">{errors.departments}</p>}
          <div className="mt-3 grid gap-5">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="text-[0.9rem] font-semibold text-muted">{g.title}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {g.items.map((d) => (
                    <label key={d.id} className="f-choice !items-start !py-3">
                      <input type="checkbox" name="departments" value={d.id} className="mt-1" />
                      <span><span className="block font-semibold leading-snug">{d.name}</span><span className="text-[0.88rem] leading-snug text-muted">{d.blurb}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      <div><SaveButton>Give access</SaveButton></div>
    </form>
  );
}

function useAction(action: (fd: FormData) => Promise<Result>, id: string) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const r = await action(fd);
      (r.ok ? toast.success : toast.error)(r.message ?? "");
      router.refresh();
    });
  return { pending, run };
}

export function DeclineButton({ id, name }: { id: string; name: string }) {
  const { pending, run } = useAction(declineRequest, id);
  return <button type="button" disabled={pending} onClick={run} aria-label={`Decline ${name}`} className={btnClass.secondary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Decline</button>;
}

export function ReopenButton({ id, name }: { id: string; name: string }) {
  const { pending, run } = useAction(reopenRequest, id);
  return <button type="button" disabled={pending} onClick={run} aria-label={`Reopen ${name}`} className={btnClass.secondary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Reopen</button>;
}

export function RemoveRequest({ id }: { id: string }) {
  const router = useRouter();
  return <DeleteButton label="Remove" confirmText="Yes, remove it" fields={{ id }} action={async (fd) => { const r = await deleteRequest(fd); if (r.ok) router.refresh(); return r; }} />;
}
