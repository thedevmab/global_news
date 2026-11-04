"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MediaUploadForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 border border-border bg-background p-4"
      encType="multipart/form-data"
    >
      <div className="space-y-2">
        <Label htmlFor="file">Image (max 5MB)</Label>
        <Input id="file" name="file" type="file" accept="image/*" required />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="altText" placeholder="Alt text" />
        <Input name="caption" placeholder="Caption" />
        <Input name="credit" placeholder="Credit" />
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
