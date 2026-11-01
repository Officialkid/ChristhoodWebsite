import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import BranchForm from "@/components/BranchForm";
import { getEvents } from "@/lib/content";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Branch registration",
  description: "Register for the Branch Excands mentorship programme for high school leavers.",
  alternates: { canonical: "/programmes/branch/register" },
};

export default async function BranchRegistrationPage() {
  const branch = (await getEvents()).find((e) => e.id.includes("branch") || e.title.toLowerCase().includes("branch"));
  return (
    <>
      <PageHero title="Branch registration" tagline="Building Resilient Achievers Nurturing Character & Hope. For high school leavers, ages 17–19." crumbs={[{ label: "Programmes", href: "/programmes" }, { label: "Branch", href: "/programmes/branch" }, { label: "Register" }]} />
      <section className="bg-paper-2 py-12 sm:py-20"><div className="wrap-narrow"><BranchForm whatsapp="254725968973" fee={branch?.fee ?? 3000} /></div></section>
    </>
  );
}
