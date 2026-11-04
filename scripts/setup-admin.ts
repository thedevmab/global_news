import { PrismaClient, Role, UserStatus } from "@prisma/client";
import argon2 from "argon2";
import { z } from "zod";

const prisma = new PrismaClient();

const passwordSchema = z
  .string()
  .min(10)
  .regex(/[A-Za-z]/)
  .regex(/[0-9]/);

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "GVN Super Admin";

  if (!email || !password) {
    throw new Error(
      "Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in the environment.",
    );
  }

  passwordSchema.parse(password);

  const existingSuper = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN, deletedAt: null },
  });
  if (existingSuper) {
    console.log(
      `A Super Admin already exists (${existingSuper.email}). Refusing to create another via setup.`,
    );
    return;
  }

  const emailNormalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { emailNormalized },
  });
  if (existing) {
    throw new Error(
      `User ${email} already exists but is not Super Admin. Promote manually if intended.`,
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: {
      email,
      emailNormalized,
      passwordHash,
      name,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      authorProfile: {
        create: {
          displayName: name,
          username: "gvn-admin",
          bio: "Platform administrator",
          isPublic: false,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.setup_super_admin",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email },
    },
  });

  console.log(`Super Admin created: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
