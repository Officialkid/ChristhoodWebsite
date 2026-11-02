"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { makeCode, savePhrase, switchCode } from "@/app/123admin/actions-door";
import { SaveButton, TextField, useSave } from "./forms";
import { btnClass } from "./ui";

export function PhraseForm() {
  const { run, formRef, errors } = useSave(savePhrase, () => formRef.current?.reset());
  return (
    <form ref={formRef} action={run} className="grid max-w-md gap-5" noValidate>
      <TextField name="phrase" label="New phrase" type="password" autoComplete="off" required maxLength={64} error={errors.phrase} hint="What the team types on the public pages, then Enter. At least 6 characters, with letters. It is kept scrambled, so nobody can read it back, including you." />
      <div><SaveButton>Change the phrase</SaveButton></div>
    </form>
  );
}

/** The picture a phone reads, and the buttons that make or change the code. */
export function CodeSetup({ url, required }: { url: string | null; required: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const make = () =>
    start(async () => {
      const r = await makeCode();
      (r.ok ? toast.success : toast.error)(r.message ?? "");
      setAsking(false);
      router.refresh();
    });
  const { run, formRef, errors } = useSave(switchCode, () => router.refresh());

  return (
    <div className="grid gap-8">
      {!url ? (
        <div>
          <p className="max-w-xl text-muted">The code is not made yet. Make it, then scan the picture with an authenticator app on a phone (the free Google Authenticator or Microsoft Authenticator both work).</p>
          <div className="mt-4"><button type="button" disabled={pending} onClick={make} className={btnClass.primary}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Make the code</button></div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-8">
            <div className="border border-rule bg-white p-4"><QRCodeSVG value={url} size={176} level="M" marginSize={0} title="Picture to scan with an authenticator app" bgColor="#ffffff" fgColor="#2d0f5a" /></div>
            <div className="max-w-md">
              <p className="font-bold">Scan this with an authenticator app.</p>
              <p className="mt-1 text-muted">It then shows a six-digit number that changes every 30 seconds. Everyone on the team who should be able to open the team sign-in adds the same picture to their own phone. Keep this page private: anyone who scans it can make the code.</p>
              <div className="mt-4">
                {asking ? (
                  <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label="Confirm a new code">
                    <button type="button" disabled={pending} onClick={make} className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-danger px-5 text-[0.95rem] font-semibold text-paper">{pending && <Loader2 className="size-4 animate-spin" aria-hidden />} Yes, make a new one</button>
                    <button type="button" onClick={() => setAsking(false)} className={btnClass.ghost}>Keep it</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setAsking(true)} className={btnClass.secondary}>Make a new code</button>
                )}
                <p className="mt-2 text-[0.9rem] text-muted">A new code stops the old one working on everyone&apos;s phone. Do this if a phone is lost.</p>
              </div>
            </div>
          </div>

          <form ref={formRef} action={run} className="grid max-w-md gap-4 border-t border-rule pt-8" noValidate>
            <input type="hidden" name="on" value={required ? "no" : "yes"} />
            {required ? (
              <>
                <p className="font-bold">The team door asks for the code.</p>
                <div><SaveButton>Stop asking for the code</SaveButton></div>
              </>
            ) : (
              <>
                <p className="font-bold">The team door does not ask for the code yet.</p>
                <TextField name="code" label="Type the six digits your phone shows now" inputMode="numeric" autoComplete="off" maxLength={7} error={errors.code} hint="This proves the code works on your phone before anyone depends on it." />
                <div><SaveButton>Ask for the code</SaveButton></div>
              </>
            )}
          </form>
        </>
      )}
    </div>
  );
}
