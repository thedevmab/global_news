import { prisma } from "@/lib/db";
import { requirePermission, type AuthUser } from "@/lib/rbac";
import { startOfDay, subDays } from "date-fns";

export async function getDashboardMetrics(user: AuthUser) {
  requirePermission(user, "dashboard:view");

  const todayStart = startOfDay(new Date());

  const [
    publishedToday,
    drafts,
    inReview,
    scheduled,
    subscriberCount,
    myDrafts,
    assignedReview,
    returned,
    views7,
    views30,
  ] = await Promise.all([
    prisma.article.count({
      where: {
        status: "PUBLISHED",
        deletedAt: null,
        publishedAt: { gte: todayStart },
      },
    }),
    prisma.article.count({
      where: { status: "DRAFT", deletedAt: null },
    }),
    prisma.article.count({
      where: { status: "IN_REVIEW", deletedAt: null },
    }),
    prisma.article.count({
      where: { status: "SCHEDULED", deletedAt: null },
    }),
    prisma.newsletterSubscriber.count({
      where: { status: "ACTIVE" },
    }),
    prisma.article.findMany({
      where: { authorId: user.id, status: "DRAFT", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        headline: true,
        updatedAt: true,
        status: true,
      },
    }),
    prisma.article.findMany({
      where: { status: "IN_REVIEW", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        headline: true,
        updatedAt: true,
        status: true,
        author: { select: { name: true } },
      },
    }),
    prisma.article.findMany({
      where: {
        authorId: user.id,
        status: "DRAFT",
        deletedAt: null,
        stateLogs: {
          some: {
            fromStatus: "IN_REVIEW",
            toStatus: "DRAFT",
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        headline: true,
        updatedAt: true,
        status: true,
      },
    }),
    prisma.articleViewDaily.aggregate({
      where: { day: { gte: subDays(todayStart, 7) } },
      _sum: { views: true },
    }),
    prisma.articleViewDaily.aggregate({
      where: { day: { gte: subDays(todayStart, 30) } },
      _sum: { views: true },
    }),
  ]);

  const hasViewData =
    (views7._sum.views ?? 0) > 0 || (views30._sum.views ?? 0) > 0;

  return {
    metrics: {
      publishedToday,
      drafts,
      inReview,
      scheduled,
      subscriberCount,
    },
    tasks: {
      myDrafts,
      assignedReview,
      returned,
    },
    views: hasViewData
      ? {
          last7Days: views7._sum.views ?? 0,
          last30Days: views30._sum.views ?? 0,
        }
      : null,
  };
}

export async function listAuditLogs(
  user: AuthUser,
  opts?: { page?: number; q?: string },
) {
  requirePermission(user, "audit:view");
  const page = Math.max(1, opts?.page ?? 1);
  const pageSize = 40;
  const where = opts?.q
    ? {
        OR: [
          { action: { contains: opts.q, mode: "insensitive" as const } },
          { entityType: { contains: opts.q, mode: "insensitive" as const } },
          { entityId: { contains: opts.q, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
