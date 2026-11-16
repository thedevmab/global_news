import { PublicShell } from "@/components/layout/PublicShell";

export const revalidate = 300;

export default function AmPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell locale="am">{children}</PublicShell>;
}
