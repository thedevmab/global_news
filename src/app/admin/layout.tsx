import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { AdminShell } from "@/components/admin/AdminShell";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "Admin | Global Voice Network",
    template: "%s | GVN Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!isStaffRole(user.role)) redirect("/");

  const h = await headers();
  // Force private caching for admin surfaces
  void h;

  return (
    <AppProviders>
      <div className="admin-root">
        <AdminShell
          user={{ name: user.name, email: user.email, role: user.role }}
        >
          {children}
        </AdminShell>
      </div>
    </AppProviders>
  );
}
