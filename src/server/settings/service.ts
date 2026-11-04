import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { z } from "zod";

export const siteSettingsSchema = z.object({
  siteName: z.string().min(1).max(120),
  tagline: z.string().max(240).optional().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(60).optional().default(""),
  address: z.string().max(300).optional().default(""),
  socialLinks: z
    .object({
      facebook: z.string().optional().default(""),
      x: z.string().optional().default(""),
      youtube: z.string().optional().default(""),
      telegram: z.string().optional().default(""),
      linkedin: z.string().optional().default(""),
    })
    .default({}),
  seoTitleTemplate: z.string().max(120).default("%s | Global Voice Network"),
  defaultOgImage: z.string().optional().default("/brand/gvn-logo-navy.jpg"),
  googleAnalyticsId: z.string().optional().default(""),
  searchConsoleVerification: z.string().optional().default(""),
  maintenanceMode: z.boolean().default(false),
  logoPath: z.string().default("/brand/gvn-logo-navy.jpg"),
  faviconPath: z.string().default("/brand/gvn-logo-navy.jpg"),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

const defaults: SiteSettings = siteSettingsSchema.parse({
  siteName: "Global Voice Network",
});

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!row) return defaults;
  const parsed = siteSettingsSchema.safeParse(row.data);
  return parsed.success ? parsed.data : defaults;
}

export async function updateSiteSettings(
  user: AuthUser,
  input: unknown,
): Promise<SiteSettings> {
  requirePermission(user, "settings:manage");
  const data = siteSettingsSchema.parse(input);
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data },
    update: { data },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "settings.update",
      entityType: "SiteSetting",
      entityId: "default",
    },
  });
  return data;
}
