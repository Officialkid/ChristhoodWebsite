import { NextStudio } from "next-sanity/studio";
import config from "@/sanity/config";
import { isConnected } from "@/sanity/env";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function AdminPage() {
  if (!isConnected) return <NotConnected />;
  return <NextStudio config={config} />;
}

function NotConnected() {
  const step = "mt-6 flex gap-4 text-left";
  const num = "grid size-8 shrink-0 place-items-center rounded-full bg-[#f3cc3c] font-bold text-[#130a26]";
  return (
    <main style={{ minHeight: "100svh", background: "#130a26", color: "#fff", display: "grid", placeItems: "center", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div className="max-w-xl">
        <p style={{ color: "#f3cc3c", letterSpacing: ".2em", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Christhood admin</p>
        <h1 style={{ fontSize: "2.2rem", margin: ".6rem 0", lineHeight: 1.1 }}>The admin area is ready to be connected</h1>
        <p style={{ color: "#d9cdf1" }}>Until it is connected, the website shows the content that came with it. This takes about five minutes, one time:</p>
        <ol style={{ listStyle: "none", padding: 0 }}>
          <li className={step}><span className={num}>1</span><span>Run <code>npx sanity login</code>, then <code>npx sanity init --env</code> in the project folder to create a free content project.</span></li>
          <li className={step}><span className={num}>2</span><span>Add the project number it prints to the site settings on the hosting dashboard as <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code>.</span></li>
          <li className={step}><span className={num}>3</span><span>Open the project&apos;s API settings and add this site&apos;s web address under allowed origins (with credentials).</span></li>
          <li className={step}><span className={num}>4</span><span>Invite your team by email from the Sanity dashboard. They sign in here with Google or email, no developer needed.</span></li>
        </ol>
      </div>
    </main>
  );
}
