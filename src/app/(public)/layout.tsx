import { PublicShell } from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell locale="en">{children}</PublicShell>;
}
