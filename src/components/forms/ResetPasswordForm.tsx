"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  confirmPasswordResetAction,
  requestPasswordResetAction,
} from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isConfirm = Boolean(token);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      if (isConfirm) {
        const result = await confirmPasswordResetAction({
          token,
          password: String(fd.get("password") || ""),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result.data.message);
        return;
      }

      const result = await requestPasswordResetAction({
        email: String(fd.get("email") || ""),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isConfirm ? (
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gvn-navy">
            New password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={10}
            required
            autoComplete="new-password"
            className="border-[#e2e8f0] bg-white text-gvn-navy dark:border-[#e2e8f0] dark:bg-white dark:text-gvn-navy"
          />
          <p className="text-xs text-[#718096]">
            At least 10 characters, with a letter and a number.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gvn-navy">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="border-[#e2e8f0] bg-white text-gvn-navy dark:border-[#e2e8f0] dark:bg-white dark:text-gvn-navy"
          />
        </div>
      )}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full bg-gvn-navy text-white hover:bg-gvn-deep-navy dark:bg-gvn-navy dark:text-white dark:hover:bg-gvn-deep-navy"
        disabled={pending}
      >
        {pending
          ? "Please wait…"
          : isConfirm
            ? "Update password"
            : "Send reset link"}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-gvn-red hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
