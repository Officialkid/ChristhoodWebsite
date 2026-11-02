"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser, resetUserPassword, saveUser } from "@/app/123admin/actions-team";
import { DeleteButton, SaveButton, TextField, Toggle, useSave } from "./forms";
import { btnClass, LinkButton, Notice } from "./ui";
import type { Department } from "@/lib/rbac";
import type { StoredUser } from "@/lib/types";

function Secret({ title, value }: { title: string; value: string }) {
  return (
    <Notice tone="warn" title={title}>
      <p>Share this with them privately (for example on WhatsApp). It is shown only once, and they will be asked to choose their own password when they sign in.</p>
      <p className="mt-3 flex flex-wrap items-center gap-3">
        <code className="select-all break-all rounded-sm bg-paper px-3 py-2 text-lg font-bold tracking-wide">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); toast.success("Copied."); }} className={btnClass.secondary}><Copy className="size-4" aria-hidden /> Copy</button>
      </p>
    </Notice>
  );
}

export default function TeamForm({ user, groups, selfId }: { user?: StoredUser; groups: { title: string; items: Department[] }[]; selfId: string }) {
  const router = useRouter();
  const [role, setRole] = useState(user?.role ?? "head");
  const [secret, setSecret] = useState<{ title: string; value: string } | null>(null);
  const [resetting, startReset] = useTransition();
  const { run, formRef, errors } = useSave(saveUser, (r) => {
    if (r.secret) setSecret({ title: r.message ?? "Temporary password", value: r.secret });
    else router.push("/123admin/team");
  });
  const mine = user?.id === selfId;

  return (
    <div className="grid max-w-3xl gap-8">
      {secret && (
        <div className="grid gap-4">
          <Secret {...secret} />
          <div><LinkButton href="/123admin/team" variant="purple">Back to the team</LinkButton></div>
        </div>
      )}
      <form ref={formRef} action={run} className="grid gap-8" noValidate>
        <input type="hidden" name="id" value={user?.id ?? ""} />
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField name="name" label="Name" defaultValue={user?.name} error={errors.name} required maxLength={80} />
          <TextField name="email" label="Email (they sign in with this)" type="email" defaultValue={user?.email} error={errors.email} required maxLength={120} />
        </div>

        <fieldset>
          <legend className="f-label">What kind of access?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="f-choice !items-start !py-3"><input type="radio" name="role" value="head" checked={role === "head"} onChange={() => setRole("head")} className="mt-1" /><span><span className="block font-bold">Department head</span><span className="text-[0.92rem] text-muted">Can change only what their departments own.</span></span></label>
            <label className="f-choice !items-start !py-3"><input type="radio" name="role" value="admin" checked={role === "admin"} onChange={() => setRole("admin")} disabled={mine && user?.role === "admin"} className="mt-1" /><span><span className="block font-bold">Administrator</span><span className="text-[0.92rem] text-muted">Can change everything and add or remove people.</span></span></label>
          </div>
        </fieldset>

        {role === "head" && (
          <fieldset aria-describedby={errors.departments ? "dep-err" : undefined}>
            <legend className="f-label">Which departments do they lead?</legend>
            <p className="f-hint">They can edit their department&apos;s page and events. Web, Media and Pastoral teams carry wider jobs.</p>
            {errors.departments && <p id="dep-err" role="alert" className="f-error">{errors.departments}</p>}
            <div className="mt-4 grid gap-6">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="text-[0.9rem] font-semibold text-muted">{g.title}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {g.items.map((d) => (
                      <label key={d.id} className="f-choice !items-start !py-3">
                        <input type="checkbox" name="departments" value={d.id} defaultChecked={user?.departments.includes(d.id)} className="mt-1" />
                        <span><span className="block font-semibold leading-snug">{d.name}</span><span className="text-[0.88rem] leading-snug text-muted">{d.blurb}</span></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {user && <Toggle name="active" label="Account is active" hint="Switch off to stop them signing in without deleting their account." defaultChecked={user.active} />}

        <div className="a-bar">
          <SaveButton>{user ? "Save changes" : "Add and create password"}</SaveButton>
          <LinkButton href="/123admin/team" variant="ghost">Cancel</LinkButton>
        </div>
      </form>

      {user && (
        <section className="grid gap-4 border-t border-rule pt-8" aria-labelledby="danger">
          <h2 id="danger" className="text-xl">Password and removal</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={resetting}
              className={btnClass.secondary}
              onClick={() => startReset(async () => {
                const fd = new FormData();
                fd.set("id", user.id);
                const r = await resetUserPassword(fd);
                if (r.ok && r.secret) setSecret({ title: r.message ?? "New temporary password", value: r.secret });
                else toast.error(r.message ?? "");
              })}
            >
              {resetting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} Make a new temporary password
            </button>
            {!mine && <DeleteButton action={async (fd) => { const r = await deleteUser(fd); if (r.ok) router.push("/123admin/team"); return r; }} fields={{ id: user.id }} label="Remove from the team" />}
          </div>
        </section>
      )}
    </div>
  );
}
