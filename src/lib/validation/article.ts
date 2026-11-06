import { z } from "zod";
import { ArticleStatus, ContentLanguage } from "@prisma/client";
import { extractTipTapText } from "@/lib/tiptap-text";

export const articleBodySchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.record(z.any())).optional(),
});

function requireBodyText(body: z.infer<typeof articleBodySchema>, ctx: z.RefinementCtx) {
  const text = extractTipTapText(body);
  if (!text || text.length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Article body is required",
      path: ["body"],
    });
  }
}

export const articleCreateSchema = z
  .object({
    headline: z
      .string()
      .trim()
      .min(3, "Headline is required (min 3 characters)")
      .max(300),
    subheadline: z.string().max(500).optional().nullable(),
    /** Ignored when present — server always derives from headline. */
    slug: z.string().max(200).optional(),
    /** Ignored when present — server derives from body/headline. */
    summary: z.string().max(300).optional(),
    body: articleBodySchema,
    categoryId: z
      .union([z.string().uuid("Invalid category"), z.literal("")])
      .optional(),
    tagIds: z.array(z.string().uuid()).default([]),
    language: z.nativeEnum(ContentLanguage).default(ContentLanguage.en),
    featuredMediaId: z
      .string({ required_error: "Featured image is required" })
      .uuid("Featured image is required"),
    seoTitle: z.string().max(70).optional().nullable(),
    seoDescription: z.string().max(160).optional().nullable(),
    authorProfileId: z.string().uuid().optional().nullable(),
  })
  .superRefine((data, ctx) => requireBodyText(data.body, ctx));

export const articleUpdateSchema = z
  .object({
    headline: z
      .string()
      .trim()
      .min(3, "Headline is required (min 3 characters)")
      .max(300)
      .optional(),
    subheadline: z.string().max(500).optional().nullable(),
    slug: z.string().max(200).optional(),
    summary: z.string().max(300).optional(),
    body: articleBodySchema.optional(),
    categoryId: z
      .union([z.string().uuid("Invalid category"), z.literal("")])
      .optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    language: z.nativeEnum(ContentLanguage).optional(),
    featuredMediaId: z
      .string()
      .uuid("Featured image is required")
      .nullish(),
    seoTitle: z.string().max(70).optional().nullable(),
    seoDescription: z.string().max(160).optional().nullable(),
    authorProfileId: z.string().uuid().optional().nullable(),
    isFeatured: z.boolean().optional(),
    isBreaking: z.boolean().optional(),
    breakingExpiresAt: z.coerce.date().optional().nullable(),
    pinToCategory: z.boolean().optional(),
    hideFromHomepage: z.boolean().optional(),
    scheduledAt: z.coerce.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.body !== undefined) requireBodyText(data.body, ctx);
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
