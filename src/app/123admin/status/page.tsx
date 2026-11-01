import { CheckCircle2, CircleAlert, CircleDashed } from "lucide-react";
import { requirePerm, systemStatus } from "@/lib/auth";
import { photoHost } from "@/lib/media";
import { Notice, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "System status" };

type Line = { state: "ok" | "todo" | "optional"; title: string; now: string; how?: string };

export default async function StatusPage() {
  await requirePerm("system");
  const s = await systemStatus();
  const lines: Line[] = [
    {
      state: s.storage === "none" ? "todo" : "ok",
      title: "Saving changes (database)",
      now: s.storage === "cloud" ? "Connected. Everything the team saves is kept safely online." : s.storage === "local" ? "Running on this computer. Changes are kept in a local folder." : "Not connected. The site shows its built-in content and nothing can be saved.",
      how: s.storage === "none" ? "In the Vercel dashboard open the project, go to Storage, add the free Upstash Redis database from the Marketplace and connect it to the project. Then redeploy." : undefined,
    },
    {
      state: s.signIn ? "ok" : "todo",
      title: "Sign-in secret",
      now: s.signIn ? "Set." : "Missing. Nobody can sign in until it is added.",
      how: s.signIn ? undefined : "In the Vercel project settings add an environment variable named AUTH_SECRET with a long random value (at least 32 characters). Then redeploy.",
    },
    {
      state: s.setupKey ? "ok" : "todo",
      title: "Setup key for the first administrator",
      now: s.setupKey ? "Set (or not needed on this computer)." : "Missing. It protects the very first sign-up.",
      how: s.setupKey ? undefined : "Add an environment variable named ADMIN_SETUP_KEY with any secret phrase. You will type it once when creating the first administrator.",
    },
    {
      state: "optional",
      title: "Photo storage",
      now: photoHost === "blob" ? "A photo host is connected. Uploaded photos are kept there." : photoHost === "database" ? "Uploaded photos are kept in the database. This is fine for a few hundred photos." : "Uploaded photos are kept on this computer.",
      how: photoHost === "blob" ? undefined : "For a large photo library, add Vercel Blob in the Storage tab. The token (BLOB_READ_WRITE_TOKEN) is added for you.",
    },
    {
      state: "optional",
      title: "Email alerts for new guests and prayer requests",
      now: s.email ? "On. The team gets a short email (without the details) when something arrives." : "Off.",
      how: s.email ? undefined : "Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM and NOTIFY_EMAILS (comma-separated) as environment variables.",
    },
    {
      state: "optional",
      title: "Copy to the church's Google Sheet",
      now: s.sheet ? "On. New guests and prayer requests are also added to the Sheet." : "Off.",
      how: s.sheet ? undefined : "Deploy integrations/google-sheet/Code.gs as a web app from the church's Google account, then add its address as GOOGLE_SHEET_WEBHOOK.",
    },
  ];
  const todo = lines.filter((l) => l.state === "todo").length;
  return (
    <>
      <PageTitle title="System status" icon="activity" lead="What is switched on, and what still needs setting up. These steps are done once in the hosting dashboard, not in code." />
      <div className="mt-8 grid max-w-3xl gap-6">
        {todo > 0 ? <Notice tone="warn" title={`${todo} thing${todo === 1 ? "" : "s"} to finish`}>The site works for visitors, but the team area needs these before it can be used live.</Notice> : <Notice tone="ok" title="Everything needed is switched on">The team can sign in and save changes.</Notice>}
        <ul className="border-t border-rule">
          {lines.map((l) => (
            <li key={l.title} className="flex gap-3 border-b border-rule py-5">
              {l.state === "ok" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-ok" aria-label="Done" /> : l.state === "todo" ? <CircleAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-label="Needs doing" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted" aria-label="Optional" />}
              <div>
                <p className="font-bold">{l.title}{l.state === "optional" && <span className="ml-2 text-[0.85rem] font-normal text-muted">Optional</span>}</p>
                <p className="text-muted">{l.now}</p>
                {l.how && <p className="mt-2">{l.how}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
