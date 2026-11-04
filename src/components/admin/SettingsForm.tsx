"use client";

import { useState } from "react";
import type { SiteSettings } from "@/server/settings/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(res.ok ? "Saved" : data.error || "Failed");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      {(
        [
          ["siteName", "Site name"],
          ["tagline", "Tagline"],
          ["contactEmail", "Contact email"],
          ["phone", "Phone"],
          ["address", "Address"],
          ["seoTitleTemplate", "SEO title template"],
          ["googleAnalyticsId", "Google Analytics ID"],
          ["searchConsoleVerification", "Search Console verification"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="space-y-2">
          <Label>{label}</Label>
          <Input
            value={String(form[key] ?? "")}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        </div>
      ))}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.maintenanceMode}
          onChange={(e) =>
            setForm({ ...form, maintenanceMode: e.target.checked })
          }
        />
        Maintenance mode
      </label>
      <Button type="submit">Save settings</Button>
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
    </form>
  );
}
