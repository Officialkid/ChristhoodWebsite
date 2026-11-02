import { requirePerm } from "@/lib/auth";
import { codeRequired, codeSetupUrl, doorConfig } from "@/lib/door";
import { formatStamp } from "@/lib/time";
import { CodeSetup, PhraseForm } from "@/components/admin/DoorAdmin";
import { Chip, Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Team door" };

export default async function TeamDoorPage() {
  const admin = await requirePerm("users");
  const cfg = await doorConfig();
  const url = await codeSetupUrl(admin.email);
  const required = codeRequired(cfg);
  const offByHosting = process.env.DOOR_CODE_OFF === "1";
  const guardOff = process.env.DOOR_OFF === "1";

  return (
    <>
      <PageTitle
        title="Team door"
        icon="key"
        lead="There is no link to the team area anywhere on the website. The team types a secret phrase on any public page (or taps the logo seven times on a phone), and the sign-in opens for half an hour."
        crumbs={[{ label: "Team and access", href: "/123admin/team" }, { label: "Team door" }]}
      />
      <div className="mt-8 grid gap-12">
        {guardOff && <Notice tone="warn" title="The door is switched off in the hosting settings">DOOR_OFF is set, so the team area answers to anyone who finds its address. Remove that setting to switch the door back on.</Notice>}
        <Notice title="What actually keeps the team area safe">The door hides the sign-in, which cuts down guessing and noise. The real protection is that a person must have a Google account (or password) that an administrator has approved. Turn on Google&apos;s 2-step verification for every administrator.</Notice>

        <section aria-labelledby="phrase" className="grid gap-4">
          <h2 id="phrase" className="text-xl">The phrase {cfg.phraseHash ? <Chip tone="ok">Your own phrase</Chip> : <Chip tone="warn">Still the first one</Chip>}</h2>
          <p className="max-w-2xl text-muted">{cfg.phraseHash ? `Changed ${cfg.updatedAt ? formatStamp(cfg.updatedAt) : ""}.` : "The phrase is still the one everyone guesses first. Choose your own, and switch the code on below."}</p>
          <PhraseForm />
        </section>

        <section aria-labelledby="code" className="grid gap-4">
          <h2 id="code" className="text-xl">The rotating code {required ? <Chip tone="ok">On</Chip> : <Chip tone="warn">Off</Chip>}</h2>
          <p className="max-w-2xl text-muted">A six-digit number from a phone app that changes every 30 seconds. With it on, a stranger who guesses the phrase still cannot get in. A code can be used only once.</p>
          {offByHosting && <Notice tone="warn" title="The code is switched off in the hosting settings">DOOR_CODE_OFF is set, so the door ignores the code whatever is chosen here.</Notice>}
          <CodeSetup url={url} required={cfg.requireCode} />
        </section>

        <section aria-labelledby="lost" className="grid gap-3">
          <h2 id="lost" className="text-xl">If you are locked out</h2>
          <p className="max-w-2xl text-muted">Whoever looks after the hosting account can add DOOR_CODE_OFF=1 (the code stops being asked) or DOOR_OFF=1 (the door is removed) in the project&apos;s environment settings, then take it away again once everyone is back in.</p>
        </section>
      </div>
    </>
  );
}
