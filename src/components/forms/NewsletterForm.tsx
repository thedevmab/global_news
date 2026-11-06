"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, type Locale } from "@/i18n";
import type { Dictionary } from "@/i18n/en";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  dict: dictProp,
  locale = "en",
  compact = false,
  variant,
  tone = "default",
}: {
  dict?: Dictionary;
  locale?: Locale;
  compact?: boolean;
  variant?: "default" | "inline" | "stacked";
  tone?: "default" | "onDark" | "onChrome";
}) {
  const dict = dictProp ?? getDictionary(locale);
  const uid = useId();
  const layout = variant ?? (compact ? "inline" : "default");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "ok" | "pending" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          website: honeypot,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        pending?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }
      if (data.pending) {
        setStatus("pending");
        setMessage(dict.newsletter.pending);
      } else {
        setStatus("ok");
        setMessage(dict.newsletter.success);
      }
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  const inputTone =
    tone === "onDark"
      ? "h-11 border-transparent bg-white text-[#263449] placeholder:text-[#718096]"
      : tone === "onChrome"
        ? "h-11 border-chrome-border bg-background text-foreground"
        : "h-11";

  return (
    <form onSubmit={onSubmit} className="relative space-y-3">
      {layout === "default" ? (
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-name`}>{dict.newsletter.name}</Label>
          <Input
            id={`${uid}-name`}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-email`} className="sr-only">
          {dict.newsletter.email}
        </Label>
        <div className={layout === "inline" ? "flex gap-2" : "space-y-3"}>
          <Input
            id={`${uid}-email`}
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict.newsletter.placeholder}
            autoComplete="email"
            className={cn(inputTone, layout === "inline" && "min-w-0 flex-1")}
          />
          <Button
            type="submit"
            variant="accent"
            disabled={status === "loading"}
            className={cn(
              layout === "stacked" && "h-11 w-full",
              layout === "inline" && "h-11 shrink-0",
            )}
          >
            {dict.newsletter.submit}
          </Button>
        </div>
      </div>
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <Label htmlFor={`${uid}-website`}>Website</Label>
        <Input
          id={`${uid}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      {message ? (
        <p
          className={
            status === "error"
              ? "text-sm text-gvn-red"
              : tone === "onDark"
                ? "text-sm text-emerald-300"
                : "text-sm text-emerald-700 dark:text-emerald-400"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
