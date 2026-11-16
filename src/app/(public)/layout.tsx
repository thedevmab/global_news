import { PublicShell } from "@/components/layout/PublicShell";

export const revalidate = 300;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell locale="en">{children}</PublicShell>;
}
