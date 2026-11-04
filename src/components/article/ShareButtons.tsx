"use client";

import { useState } from "react";
import { Facebook, Link as LinkIcon, Linkedin, Send } from "lucide-react";
import type { Dictionary } from "@/i18n/en";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M20.5 3.5A11 11 0 0 0 12 1a11 11 0 0 0-9.4 16.6L1 23l5.6-1.5A11 11 0 0 0 12 23a11 11 0 0 0 8.5-19.5zM12 21a9 9 0 0 1-4.6-1.3l-.3-.2-3.3.9.9-3.2-.2-.3A9 9 0 1 1 12 21zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.4.2-.4a.5.5 0 0 0 0-.5c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.5h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9c.6.2 1 .4 1.5.5a3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.2c-.1-.2-.3-.2-.6-.3z" />
    </svg>
  );
}

const circle =
  "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-gvn-red hover:text-gvn-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ShareButtons({
  url,
  title,
  dict,
}: {
  url: string;
  title: string;
  dict?: Dictionary;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: Send,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: WhatsAppIcon,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
    },
  ] as const;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">{dict?.article.share ?? "Share"}</span>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button
            key={link.label}
            type="button"
            className={circle}
            aria-label={link.label}
            onClick={() =>
              window.open(link.href, "_blank", "noopener,noreferrer")
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
      <button
        type="button"
        className={cn(circle, copied && "border-gvn-red text-gvn-red")}
        onClick={copyLink}
        aria-label={
          copied
            ? (dict?.article.copied ?? "Copied")
            : (dict?.article.copyLink ?? "Copy link")
        }
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </button>
      <span className="sr-only" role="status">
        {copied ? (dict?.article.copied ?? "Copied") : ""}
      </span>
    </div>
  );
}
