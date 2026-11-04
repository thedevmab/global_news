import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="auth-panel rounded-lg border border-white/10 bg-white p-8 text-[#263449] shadow-xl">
      <h1 className="mb-2 font-serif text-3xl font-semibold text-gvn-navy">
        Reset password
      </h1>
      <p className="mb-6 text-sm text-[#718096]">
        Enter your email to receive a reset link, or set a new password with a
        valid token.
      </p>
      <ResetPasswordForm token={token} />
    </div>
  );
}
