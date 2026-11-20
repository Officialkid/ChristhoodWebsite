import { notFound } from "next/navigation";
import HomeView from "@/components/home/HomeView";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const metadata = { title: "Home page preview", robots: { index: false, follow: false } };

/** The real home page, shown inside the team area's editor. Anyone who may not edit the home page gets "not found". */
export default async function HomeStudioCanvas() {
  const user = await getUser();
  if (!user || user.mustChange || !can(user, "home")) notFound();
  return <HomeView studio />;
}
