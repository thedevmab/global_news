"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { ok, toActionError, type ActionResult } from "@/lib/action-result";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/categories/service";
import {
  createTag,
  deleteTag,
  mergeTags,
  updateTag,
} from "@/server/tags/service";
import {
  createAuthor,
  deleteAuthor,
  updateAuthor,
} from "@/server/authors/service";
import {
  createUser,
  deleteUser,
  updateUser,
} from "@/server/users/service";
import {
  createBreakingItem,
  deleteBreakingItem,
  updateBreakingItem,
  updateHomepageLayout,
} from "@/server/homepage/service";
import {
  createCampaign,
  sendCampaign,
  testSendCampaign,
  updateCampaign,
} from "@/server/newsletter/service";
import {
  deleteMessage,
  updateMessageStatus,
} from "@/server/messages/service";
import {
  createAdvertisement,
  deleteAdvertisement,
  updateAdvertisement,
} from "@/server/ads/service";
import { updateSiteSettings } from "@/server/settings/service";
import {
  deleteMedia,
  listMedia,
  updateMediaMeta,
} from "@/server/media/service";
import { ContactStatus } from "@prisma/client";
import { z } from "zod";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}

function revalidateMany(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
}

export async function categoryCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createCategory(user, input);
    revalidateMany("/admin/categories");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function categoryUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateCategory(user, id, input);
    revalidateMany("/admin/categories");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function categoryDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteCategory(user, id);
    revalidateMany("/admin/categories");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function tagCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createTag(user, input);
    revalidateMany("/admin/tags");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function tagUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateTag(user, id, input);
    revalidateMany("/admin/tags");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function tagMergeAction(
  sourceId: string,
  targetId: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await mergeTags(user, sourceId, targetId);
    revalidateMany("/admin/tags");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function tagDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteTag(user, id);
    revalidateMany("/admin/tags");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function authorCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createAuthor(user, input);
    revalidateMany("/admin/authors");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function authorUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateAuthor(user, id, input);
    revalidateMany("/admin/authors");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function authorDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteAuthor(user, id);
    revalidateMany("/admin/authors");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function userCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createUser(user, input);
    revalidateMany("/admin/users");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function userUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateUser(user, id, input);
    revalidateMany("/admin/users");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function userDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteUser(user, id);
    revalidateMany("/admin/users");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function homepageUpdateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateHomepageLayout(user, input);
    revalidateMany("/admin/homepage", "/", "/am");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function breakingCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createBreakingItem(user, input);
    revalidateMany("/admin/breaking");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function breakingUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateBreakingItem(user, id, input);
    revalidateMany("/admin/breaking");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function breakingDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteBreakingItem(user, id);
    revalidateMany("/admin/breaking");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function campaignCreateAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const campaign = await createCampaign(user, input);
    revalidateMany("/admin/newsletter");
    return ok({ id: campaign.id });
  } catch (err) {
    return toActionError(err);
  }
}

export async function campaignUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateCampaign(user, id, input);
    revalidateMany("/admin/newsletter");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function campaignTestSendAction(
  id: string,
  testEmail: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await testSendCampaign(user, id, testEmail);
    revalidateMany("/admin/newsletter");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function campaignSendAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await sendCampaign(user, id);
    revalidateMany("/admin/newsletter");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function messageStatusAction(
  id: string,
  status: ContactStatus,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateMessageStatus(user, id, status);
    revalidateMany("/admin/messages");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function messageDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteMessage(user, id);
    revalidateMany("/admin/messages");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function adCreateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await createAdvertisement(user, input);
    revalidateMany("/admin/advertisements", "/", "/am");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function adUpdateAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateAdvertisement(user, id, input);
    revalidateMany("/admin/advertisements", "/", "/am");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function adDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteAdvertisement(user, id);
    revalidateMany("/admin/advertisements", "/", "/am");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function settingsUpdateAction(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateSiteSettings(user, input);
    revalidateMany("/admin/settings");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function mediaMetaAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await updateMediaMeta(
      user,
      id,
      input as {
        altText?: string | null;
        caption?: string | null;
        credit?: string | null;
      },
    );
    revalidateMany("/admin/media");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function mediaDeleteAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await deleteMedia(user, id);
    revalidateMany("/admin/media");
    return ok(undefined);
  } catch (err) {
    return toActionError(err);
  }
}

export async function listRecentMediaAction(limit = 24): Promise<
  ActionResult<
    {
      id: string;
      storageKey: string;
      originalName: string;
      altText: string | null;
    }[]
  >
> {
  try {
    const user = await requireUser();
    const result = await listMedia(user, {
      page: 1,
      pageSize: Math.min(48, Math.max(1, limit)),
    });
    return ok(
      result.items.map((m) => ({
        id: m.id,
        storageKey: m.storageKey,
        originalName: m.originalName,
        altText: m.altText,
      })),
    );
  } catch (err) {
    return toActionError(err);
  }
}

export async function parseFormIds(formData: FormData, key: string) {
  return z.array(z.string()).parse(formData.getAll(key));
}
