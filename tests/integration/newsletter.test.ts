import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  dbAvailable,
  disconnectTestPrisma,
  getTestPrisma,
} from "../helpers/db";
import {
  createUnsubscribeLinkToken,
  isEligibleForSend,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from "@/server/newsletter/service";
import { normalizeEmail } from "@/lib/utils";

const run = await dbAvailable();

(run ? describe : describe.skip)("newsletter unsubscribe", () => {
  const prisma = getTestPrisma()!;
  const email = `news-${randomUUID()}@example.com`;

  afterAll(async () => {
    await prisma.newsletterSubscriber.deleteMany({
      where: { emailNormalized: normalizeEmail(email) },
    });
    await disconnectTestPrisma();
  });

  it("unsubscribed subscribers are not eligible for sends", async () => {
    const result = await subscribeNewsletter({
      email,
      confirmationRequired: false,
    });
    expect(result.status).toBe("active");

    const subscriber = await prisma.newsletterSubscriber.findUniqueOrThrow({
      where: { emailNormalized: normalizeEmail(email) },
    });
    expect(isEligibleForSend(subscriber.status)).toBe(true);

    const token = createUnsubscribeLinkToken(subscriber.id);
    await unsubscribeNewsletter(token);

    const updated = await prisma.newsletterSubscriber.findUniqueOrThrow({
      where: { id: subscriber.id },
    });
    expect(updated.status).toBe("UNSUBSCRIBED");
    expect(updated.unsubscribedAt).not.toBeNull();
    expect(isEligibleForSend(updated.status)).toBe(false);
  });
});
