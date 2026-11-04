import { PublicShell } from "@/components/layout/PublicShell";

export default function AmPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell locale="am">{children}</PublicShell>;
}
