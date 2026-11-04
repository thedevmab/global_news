import type { Metadata } from "next";
import { absoluteUrl, excerpt } from "@/lib/utils";

const SITE_NAME = "Global Voice Network";
const DEFAULT_DESCRIPTION =
  "Global Voice Network — independent international news covering politics, business, technology, sports, and more.";

export type BuildPageMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  authors?: string[];
  noIndex?: boolean;
  locale?: string;
};

function toIso(value?: string | Date | null): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const title = input.title.trim() || SITE_NAME;
  const description = excerpt(
    (input.description || DEFAULT_DESCRIPTION).trim(),
    160,
  );
  const canonical = absoluteUrl(input.path);
  const image = absoluteUrl(input.image || "/brand/gvn-logo-navy.jpg");
  const ogType = input.type ?? "website";

  return {
    title,
    description,
    alternates: { canonical },
    robots: input.noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: ogType,
      locale: input.locale || "en_US",
      images: [{ url: image, alt: title }],
      ...(ogType === "article"
        ? {
            publishedTime: toIso(input.publishedTime),
            modifiedTime: toIso(input.modifiedTime),
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function adminNoIndexMetadata(title: string): Metadata {
  return buildPageMetadata({
    title,
    path: "/admin",
    noIndex: true,
    description: "GVN editorial CMS — private.",
  });
}

export { SITE_NAME, DEFAULT_DESCRIPTION };
