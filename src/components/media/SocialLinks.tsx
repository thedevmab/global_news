import type { ComponentType } from "react";
import { Facebook, Linkedin, Send, Youtube } from "lucide-react";
import {
  GVN_SOCIAL_DEFAULTS,
  type SocialLinksMap,
} from "@/lib/site-settings";
import { cn } from "@/lib/utils";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm8.75 1.25a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .55.04.81.1V9.01a6.24 6.24 0 0 0-.81-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.2 8.2 0 0 0 4.76 1.52V6.84a4.85 4.85 0 0 1-1-.15z" />
    </svg>
  );
}

type SocialKey =
  | "facebook"
  | "tiktok"
  | "x"
  | "instagram"
  | "youtube"
  | "telegram"
  | "linkedin";

const NETWORKS: {
  key: SocialKey;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { key: "x", label: "X", Icon: XIcon },
  { key: "instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "youtube", label: "YouTube", Icon: Youtube },
  { key: "telegram", label: "Telegram", Icon: Send },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin },
];

function normalizeHref(href: string): string {
  const t = href.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/\//, "")}`;
}

export function SocialLinks({
  links,
  tone = "onDark",
  size = "md",
  className,
}: {
  links?: Partial<SocialLinksMap> | null;
  tone?: "onDark" | "onLight";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const merged: SocialLinksMap = {
    ...GVN_SOCIAL_DEFAULTS,
    ...(links ?? {}),
  };

  const entries = NETWORKS.map((n) => ({
    ...n,
    href: normalizeHref(merged[n.key] || ""),
  })).filter((e) => Boolean(e.href));

  if (entries.length === 0) return null;

  const box =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon =
    size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {entries.map(({ key, label, href, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={cn(
              "group inline-flex items-center justify-center rounded-full border transition-all duration-300",
              box,
              tone === "onDark"
                ? "border-white/30 bg-white/10 text-white hover:-translate-y-0.5 hover:border-gvn-red hover:bg-gvn-red hover:shadow-lg hover:shadow-gvn-red/25 focus-visible:!outline-white"
                : "border-border bg-muted text-foreground hover:-translate-y-0.5 hover:border-gvn-red hover:bg-gvn-red hover:text-white hover:shadow-lg hover:shadow-gvn-red/20",
            )}
          >
            <Icon
              className={cn(
                icon,
                "shrink-0 transition-transform duration-300 group-hover:scale-110",
              )}
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
