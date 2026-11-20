"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { issueFamilyCode, linkApplicationToFamily, resetFamilyPassword } from "@/app/123admin/actions-family";
import { SaveButton, TextField, useSave } from "./forms";
import { btnClass, Notice } from "./ui";

/** A code or password shown once, with a button to copy it. */
export function Shown({ title, note, value }: { title: string; note: string; value: string }) {
  return (
    <Notice tone="warn" title={title}>
      <p>{note}</p>
      <p className="mt-3 flex flex-wrap items-center gap-3">
        <code className="select-all whitespace-pre-line break-all rounded-sm bg-paper px-3 py-2 text-lg font-bold tracking-wide">{value}</code>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(value); toast.success("Copied."); }} className={btnClass.secondary}><Copy className="size-4" aria-hidden /> Copy</button>
      </p>
    </Notice>
  );
}

/** Makes a one-time code for a returning camper. */
export function CodeButton({ id, name, active }: { id: string; name: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [shown, setShown] = useState<{ message: string; value: string } | null>(null);
  return (
    <span className="grid w-full gap-3">
      <span>
        <button
          type="button"
          disabled={pending}
          aria-label={`${active ? "Make a new" : "Make a"} family code for ${name}`}
          onClick={() =>
            start(async () => {
              const fd = new FormData();
              fd.set("id", id);
              const r = await issueFamilyCode(fd);
              if (r.ok && r.secret) {
                setShown({ message: r.message ?? "", value: r.secret });
                router.refresh();
              } else toast.error(r.message ?? "Could not make a code.");
            })
          }
          className={btnClass.secondary}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <KeyRound className="size-4" aria-hidden />} {active ? "New family code" : "Family code"}
        </button>
      </span>
      {shown && <Shown title={`Family code for ${name}`} note={shown.message} value={shown.value} />}
    </span>
  );
}

/** Resets a parent's password after an explicit confirmation. The temporary password is shown once, here, and never again. */
export function ResetPasswordDialog({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [shown, setShown] = useState<{ message: string; value: string } | null>(null);
  const close = () => { setOpen(false); setShown(null); };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnClass.secondary} aria-haspopup="dialog"><KeyRound className="size-4" aria-hidden /> Reset password</button>
      <Dialog open={open} onOpenChange={(o) => { if (!o && !pending) close(); }}>
        <DialogContent>
          {shown ? (
            <>
              <DialogTitle>Temporary password ready</DialogTitle>
              <DialogDescription>Give this to the parent privately, for example on WhatsApp. It is shown only once, and they choose their own password when they sign in.</DialogDescription>
              <div className="mt-4"><Shown title={shown.message} note="Copy it now. Closing this window hides it for good." value={shown.value} /></div>
              <DialogFooter><button type="button" onClick={close} className={btnClass.primary}>Done</button></DialogFooter>
            </>
          ) : (
            <>
              <DialogTitle>Reset the password for {name}?</DialogTitle>
              <DialogDescription>Their current password stops working at once, and any phone or computer they are signed in on is signed out. You will get a temporary password to give them.</DialogDescription>
              <p className="mt-3 border-l-4 border-gold pl-3 text-[0.93rem]">Reset it only when you are sure you are speaking to this parent.</p>
              <DialogFooter>
                <button type="button" onClick={close} disabled={pending} className={btnClass.secondary}>Keep their password</button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const fd = new FormData();
                      fd.set("id", id);
                      const r = await resetFamilyPassword(fd);
                      if (r.ok && r.secret) setShown({ message: r.message ?? "", value: r.secret });
                      else toast.error(r.message ?? "Could not reset the password.");
                    })
                  }
                  className={btnClass.primary}
                >
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Reset and show the new password
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** The camp office puts an application made without a family page onto the parent's family page. */
export function LinkFamilyForm({ id, childName, phone }: { id: string; childName: string; phone: string }) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<string | null>(null);
  const { run, formRef, errors } = useSave(linkApplicationToFamily, (result) => {
    router.refresh();
    if (result.secret) setCredentials(result.secret);
  });
  return (
    <div className="grid gap-4">
      {credentials && <Shown title="Family access is ready" note="Give these sign-in details privately to the parent. They must choose a new password when they first sign in." value={credentials} />}
      <form ref={formRef} action={run} className="grid max-w-md gap-4" noValidate>
        <input type="hidden" name="id" value={id} />
        <TextField name="phone" label="Phone number on the parent's family page" type="tel" inputMode="tel" autoComplete="off" defaultValue={phone} error={errors.phone} hint={`If no family page exists, this will create one and link the application. Check that this person really is ${childName}'s parent first.`} />
        <label className="flex items-start gap-3 text-[0.95rem]">
          <input type="checkbox" name="verified" value="yes" required aria-invalid={errors.verified ? true : undefined} className="mt-1 size-5 accent-purple" />
          <span>I have confirmed that this person is the child&apos;s parent or legal guardian.</span>
        </label>
        {errors.verified && <p role="alert" className="f-error">{errors.verified}</p>}
        <div><SaveButton>Link application and give access</SaveButton></div>
      </form>
    </div>
  );
}
