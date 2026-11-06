import { redirect } from "next/navigation";
import { AdsManager } from "@/components/admin/AdsManager";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ensurePrimaryAdSlots, listAdSlots } from "@/server/ads/service";

export const metadata = { title: "Advertisements" };

export default async function AdminAdvertisementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.role, "ad:manage")) redirect("/admin");

  await ensurePrimaryAdSlots();
  const slots = await listAdSlots();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Advertisements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage image ads for below header, middle of page, and above footer.
        </p>
      </div>
      <AdsManager
        slots={slots.map((slot) => ({
          id: slot.id,
          key: slot.key,
          name: slot.name,
          advertisements: slot.advertisements.map((ad) => ({
            id: ad.id,
            slotId: ad.slotId,
            name: ad.name,
            imageUrl: ad.imageUrl,
            destinationUrl: ad.destinationUrl,
            isActive: ad.isActive,
            startsAt: ad.startsAt?.toISOString() ?? null,
            endsAt: ad.endsAt?.toISOString() ?? null,
            createdAt: ad.createdAt.toISOString(),
          })),
        }))}
      />
    </div>
  );
}
