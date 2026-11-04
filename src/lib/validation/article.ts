import { z } from "zod";
import { ArticleStatus, ContentLanguage } from "@prisma/client";

export const articleBodySchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.record(z.any())).optional(),
});

export const articleCreateSchema = z.object({
  headline: z.string().min(3).max(300),
  subheadline: z.string().max(500).optional().nullable(),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().min(1).max(300),
  body: articleBodySchema,
  categoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).default([]),
  language: z.nativeEnum(ContentLanguage).default(ContentLanguage.en),
  featuredMediaId: z.string().uuid().optional().nullable(),
  seoTitle: z.string().max(70).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  authorProfileId: z.string().uuid().optional().nullable(),
});

export const articleUpdateSchema = articleCreateSchema.partial().extend({
  isFeatured: z.boolean().optional(),
  isBreaking: z.boolean().optional(),
  breakingExpiresAt: z.coerce.date().optional().nullable(),
  pinToCategory: z.boolean().optional(),
  hideFromHomepage: z.boolean().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export const workflowTransitionSchema = z.object({
  articleId: z.string().uuid(),
  to: z.nativeEnum(ArticleStatus),
  reason: z.string().max(1000).optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  urgentOverride: z.boolean().optional(),
});

export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;
