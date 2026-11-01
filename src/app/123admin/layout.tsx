import type { Metadata, Viewport } from "next";
import Shell from "@/components/admin/Shell";
import { getUser } from "@/lib/auth";
import { buildNav } from "@/lib/admin-nav";
import { can, canReadPrayer, departmentName } from "@/lib/rbac";
import { collection } from "@/lib/store";
import type { Prayer, Visitor } from "@/lib/types";
import { logout } from "./auth-actions";

export const metadata: Metadata = {
  title: { default: "Team area", template: "%s | Team area" },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#2d0f5a", width: "device-width", initialScale: 1 };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) return <div className="min-h-svh bg-paper">{children}</div>;

  const [guests, prayers] = await Promise.all([
    can(user, "visitors") ? collection<Visitor>("visitors").list().catch(() => []) : [],
    can(user, "prayers") ? collection<Prayer>("prayers").list().catch(() => []) : [],
  ]);
  const roleLabel = user.role === "admin" ? "Administrator" : user.departments.map(departmentName).join(", ") || "Department head";
  return (
    <Shell
      groups={buildNav(user, { guests: guests.filter((g) => g.status === "new").length, prayers: prayers.filter((p) => p.status === "new" && canReadPrayer(user, p)).length })}
      user={{ name: user.name, roleLabel }}
      signOut={logout}
    >
      {children}
    </Shell>
  );
}
