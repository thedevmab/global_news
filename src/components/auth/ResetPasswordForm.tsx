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
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-white/10 bg-white p-8 shadow-xl"
    >
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gvn-red">
          Global Voice Network
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-gvn-navy">
          {isConfirm ? "Choose a new password" : "Reset password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isConfirm
            ? "Enter a new password for your account."
            : "We’ll email a single-use link that expires in 30 minutes."}
        </p>
      </div>

      <div className="space-y-4">
        {isConfirm ? (
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={10}
              required
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              At least 10 characters, with a letter and a number.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
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

        <Button type="submit" className="w-full" disabled={pending}>
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
      </div>
    </form>
  );
}
