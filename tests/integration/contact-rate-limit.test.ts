import { afterAll, describe, expect, it } from "vitest";
import {
  dbAvailable,
  disconnectTestPrisma,
  getTestPrisma,
} from "../helpers/db";
import { submitContactMessage } from "@/server/contact/service";
import { RateLimitError } from "@/lib/errors";

const run = await dbAvailable();

(run ? describe : describe.skip)("contact rate limit", () => {
  const prisma = getTestPrisma()!;
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;

  afterAll(async () => {
    await prisma.contactMessage.deleteMany({ where: { ipAddress: ip } });
    await prisma.rateLimitBucket.deleteMany({
      where: { id: { startsWith: `contact:${ip}` } },
    });
    await disconnectTestPrisma();
  });

  it("rejects excessive contact submissions from one IP", async () => {
    const payload = {
      name: "Rate Tester",
      email: "rate@example.com",
      subject: "Hello from tests",
      message: "This is a sufficiently long contact message.",
    };

    for (let i = 0; i < 5; i++) {
      await submitContactMessage({ input: payload, ipAddress: ip });
    }

    await expect(
      submitContactMessage({ input: payload, ipAddress: ip }),
    ).rejects.toBeInstanceOf(RateLimitError);
  });
});
