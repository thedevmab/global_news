import { z } from "zod";

export const siteSettingsSchema = z.object({
  siteName: z.string().default("Global Voice Network"),
  tagline: z.string().default(""),
  contactEmail: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  socialLinks: z
    .object({
      facebook: z.string().default(""),
      x: z.string().default(""),
      youtube: z.string().default(""),
      telegram: z.string().default(""),
      linkedin: z.string().default(""),
    })
    .default({}),
  seoTitleTemplate: z.string().default("%s | Global Voice Network"),
  defaultOgImage: z.string().default("/brand/gvn-logo-navy.jpg"),
  googleAnalyticsId: z.string().default(""),
  searchConsoleVerification: z.string().default(""),
  maintenanceMode: z.boolean().default(false),
  logoPath: z.string().default("/brand/gvn-logo-navy.jpg"),
  faviconPath: z.string().default("/brand/gvn-logo-navy.jpg"),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export function parseSiteSettings(data: unknown): SiteSettings {
  const parsed = siteSettingsSchema.safeParse(data ?? {});
  if (parsed.success) return parsed.data;
  return siteSettingsSchema.parse({});
}
