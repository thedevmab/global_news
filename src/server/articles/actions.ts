"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import {
  autosaveArticle,
  bulkTransitionArticles,
  createArticle,
  createPreviewToken,
  transitionArticle,
  updateArticle,
} from "@/server/articles/service";
import { ArticleStatus } from "@prisma/client";
import { z } from "zod";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}

export async function createArticleAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const article = await createArticle(user, input);
    revalidatePath("/admin/articles");
    return ok({ id: article.id });
  } catch (err) {
    return toActionError(err);
  }
}

export async function updateArticleAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string; updatedAt: string }>> {
  try {
    const user = await requireUser();
    const article = await updateArticle(user, id, input);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${id}/edit`);
    return ok({ id: article.id, updatedAt: article.updatedAt.toISOString() });
  } catch (err) {
    return toActionError(err);
  }
}

export async function autosaveArticleAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const user = await requireUser();
    const article = await autosaveArticle(user, id, input);
    return ok({ updatedAt: article.updatedAt.toISOString() });
  } catch (err) {
    return toActionError(err);
  }
}

function revalidatePublicHome() {
  revalidatePath("/");
  revalidatePath("/am");
}

export async function transitionArticleAction(
  input: unknown,
): Promise<ActionResult<{ status: ArticleStatus }>> {
  try {
    const user = await requireUser();
    const article = await transitionArticle(user, input);
    revalidatePath("/admin/articles");
    revalidatePath(`/admin/articles/${article.id}/edit`);
    if (
      article.status === "PUBLISHED" ||
      article.status === "DRAFT" ||
      article.status === "ARCHIVED" ||
      article.status === "TRASH"
    ) {
      revalidatePublicHome();
    }
    return ok({ status: article.status });
  } catch (err) {
    return toActionError(err);
  }
}

export async function bulkArticlesAction(input: unknown): Promise<
  ActionResult<{ count: number }>
> {
  try {
    const user = await requireUser();
    const data = z
      .object({
        ids: z.array(z.string().uuid()).min(1),
        to: z.nativeEnum(ArticleStatus),
        reason: z.string().optional(),
      })
      .parse(input);
    const results = await bulkTransitionArticles(
      user,
      data.ids,
      data.to,
      data.reason,
    );
    revalidatePath("/admin/articles");
    revalidatePublicHome();
    return ok({ count: results.length });
  } catch (err) {
    return toActionError(err);
  }
}

export async function createPreviewTokenAction(
  articleId: string,
): Promise<ActionResult<{ token: string; url: string }>> {
  try {
    const user = await requireUser();
    const { token } = await createPreviewToken(user, articleId);
    return ok({ token, url: `/preview/${token}` });
  } catch (err) {
    return toActionError(err);
  }
}
