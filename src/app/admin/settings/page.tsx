import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/server/settings/service";
import { requirePermission } from "@/lib/rbac";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  try {
    requirePermission(session.user, "settings:manage");
  } catch {
    redirect("/admin");
  }
  const settings = await getSiteSettings();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Site settings</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
