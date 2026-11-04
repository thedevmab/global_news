import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Advertisements</h1>
      <p className="text-sm text-muted-foreground">
        Manage advertisements. Data is loaded from PostgreSQL via admin services.
      </p>
    </div>
  );
}
