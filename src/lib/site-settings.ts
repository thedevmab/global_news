import { z } from "zod";

/** Official GVN profiles — used as defaults when settings are empty. */
export const GVN_SOCIAL_DEFAULTS = {
  facebook: "https://shorturl.at/h8QsS",
  tiktok: "https://www.tiktok.com/@globalvoicenetwork",
  x: "https://x.com/globalvoicenet",
  instagram: "https://www.instagram.com/globalvoicenetwork_official/",
  youtube: "https://www.youtube.com/@globalvoicenetwork_official",
  telegram: "",
  linkedin: "",
} as const;

export const siteSettingsSchema = z.object({
  siteName: z.string().default("Global Voice Network"),
  tagline: z.string().default(""),
  contactEmail: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  socialLinks: z
    .object({
      facebook: z.string().default(GVN_SOCIAL_DEFAULTS.facebook),
      tiktok: z.string().default(GVN_SOCIAL_DEFAULTS.tiktok),
      x: z.string().default(GVN_SOCIAL_DEFAULTS.x),
      instagram: z.string().default(GVN_SOCIAL_DEFAULTS.instagram),
      youtube: z.string().default(GVN_SOCIAL_DEFAULTS.youtube),
      telegram: z.string().default(""),
      linkedin: z.string().default(""),
    })
    .default({ ...GVN_SOCIAL_DEFAULTS }),
  seoTitleTemplate: z.string().default("%s | Global Voice Network"),
  defaultOgImage: z.string().default("/brand/gvn-logo-navy.jpg"),
  googleAnalyticsId: z.string().default(""),
  searchConsoleVerification: z.string().default(""),
  maintenanceMode: z.boolean().default(false),
  logoPath: z.string().default("/brand/gvn-logo-navy.jpg"),
  faviconPath: z.string().default("/brand/gvn-logo-navy.jpg"),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export type SocialLinksMap = SiteSettings["socialLinks"];

function fillEmptySocial(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

export function parseSiteSettings(data: unknown): SiteSettings {
  const parsed = siteSettingsSchema.safeParse(data ?? {});
  const base = parsed.success
    ? parsed.data
    : siteSettingsSchema.parse({});
  const social = base.socialLinks;
  return {
    ...base,
    socialLinks: {
      facebook: fillEmptySocial(social.facebook, GVN_SOCIAL_DEFAULTS.facebook),
      tiktok: fillEmptySocial(social.tiktok, GVN_SOCIAL_DEFAULTS.tiktok),
      x: fillEmptySocial(social.x, GVN_SOCIAL_DEFAULTS.x),
      instagram: fillEmptySocial(
        social.instagram,
        GVN_SOCIAL_DEFAULTS.instagram,
      ),
      youtube: fillEmptySocial(social.youtube, GVN_SOCIAL_DEFAULTS.youtube),
      telegram: (social.telegram ?? "").trim(),
      linkedin: (social.linkedin ?? "").trim(),
    },
  };
}
