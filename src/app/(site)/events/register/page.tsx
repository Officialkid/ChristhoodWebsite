import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CampRegistration, { type Camp } from "@/components/CampRegistration";
import { site } from "@/content/site";
import { getEvents } from "@/lib/content";
import { LifeBuoy } from "lucide-react";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Camp registration",
  description: "Register for the Jewels Kids Camp and Teen Life Mentorship Camp, apply to facilitate, or sponsor a camper.",
  alternates: { canonical: "/events/register" },
};

// Same sign-up numbers the team already uses.
const numbers = { camper: site.whatsapp.camps, facilitator: "254732364434", sponsor: "254714545791" };
const facilitatorRoles = ["Matron", "Serving", "Teaching", "Games", "Morning Devotion", "Nurse", "Counselling", "Board Games Master", "Creative Night Support", "Media Team", "Shopping", "Meal Preparation", "Dorms In Charge"];

export default async function CampRegistrationPage() {
  const events = await getEvents();
  const now = Date.now();
  const camps: Camp[] = events
    .filter((e) => e.category === "camp" && new Date(e.end ?? e.start).getTime() >= now)
    .map((e) => ({ id: e.id, title: e.title, ages: e.subtitle ?? "", fee: e.fee ?? 0 }));

  return (
    <>
      <PageHero title="Camp registration" tagline="Register a camper, apply to facilitate, or sponsor a child. It takes about two minutes." crumbs={[{ label: "Events", href: "/events" }, { label: "Camp registration" }]} />
      <section className="bg-paper-2 py-12 sm:py-20">
        <div className="wrap">
          {camps.length > 0 ? (
            <CampRegistration camps={camps} numbers={numbers} depositKes={2000} facilitatorRoles={facilitatorRoles} />
          ) : (
            <p className="mx-auto max-w-xl border border-rule bg-paper p-10 text-center text-lg text-muted">Camp registration is not open right now. New camps are announced on the events page.</p>
          )}
          <p className="mx-auto mt-8 flex max-w-3xl items-start gap-3 border-t border-rule pt-5 text-muted"><LifeBuoy className="mt-1 size-5 shrink-0 text-purple" aria-hidden /><span><strong className="text-ink">Need help?</strong> Call or WhatsApp Lydiah Opwaka on <a className="font-semibold text-purple underline underline-offset-4" href="tel:+254725968973">+254 725 968 973</a>.</span></p>
        </div>
      </section>
    </>
  );
}
