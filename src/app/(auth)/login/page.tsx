import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/rbac";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(isStaffRole(session.user.role) ? "/admin" : "/");
  }

  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-lg bg-white/10" />}>
      <LoginForm />
    </Suspense>
  );
}
