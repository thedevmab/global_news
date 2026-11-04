import { PublicShell } from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

export default function AmPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell locale="am">{children}</PublicShell>;
}
