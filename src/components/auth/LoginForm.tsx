"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loginAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction({
        email: String(fd.get("email") || ""),
        password: String(fd.get("password") || ""),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const callback = search.get("callbackUrl") || result.data.redirectTo;
      router.push(callback);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="auth-panel rounded-lg border border-white/10 bg-white p-8 text-[#263449] shadow-xl"
    >
      <div className="mb-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex rounded-md bg-gvn-navy p-1.5">
            <Image
              src="/brand/gvn-logo-mark.png"
              alt="Global Voice Network"
              width={48}
              height={48}
              className="h-10 w-10 object-contain"
              priority
            />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gvn-red">
              Global Voice Network
            </p>
            <p className="text-sm text-[#718096]">Newsroom access</p>
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-gvn-navy">
          Editorial sign in
        </h1>
        <p className="mt-1 text-sm text-[#718096]">
          Authorized staff only. Visitors cannot enter the CMS.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gvn-navy">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="border-[#e2e8f0] bg-white text-gvn-navy placeholder:text-[#718096] focus-visible:ring-gvn-navy dark:border-[#e2e8f0] dark:bg-white dark:text-gvn-navy"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-gvn-navy">
              Password
            </Label>
            <Link
              href="/reset-password"
              className="text-xs font-medium text-gvn-red hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="border-[#e2e8f0] bg-white text-gvn-navy placeholder:text-[#718096] focus-visible:ring-gvn-navy dark:border-[#e2e8f0] dark:bg-white dark:text-gvn-navy"
          />
        </div>
        {error ? (
          <p
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full bg-gvn-navy text-white hover:bg-gvn-deep-navy dark:bg-gvn-navy dark:text-white dark:hover:bg-gvn-deep-navy"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
