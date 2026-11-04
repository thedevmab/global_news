import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Sign in | GVN",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gvn-deep-navy via-gvn-navy to-[#1a3358] px-4 py-12">
      <div className="auth-panel w-full max-w-md">{children}</div>
    </div>
  );
}
