import { execSync } from "node:child_process";

const FAILED_MIDDLE = "20261106120000_add_middle_ad_slot";

function run(command, { allowFail = false } = {}) {
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    if (allowFail) return false;
    throw error;
  }
}

function migrateDeploy() {
  return run("npx prisma migrate deploy", { allowFail: true });
}

function seedDatabase() {
  console.log("[migrate-deploy] Seeding categories, admin, and starter articles if needed...");
  return run("npx prisma db seed", { allowFail: true });
}

if (!migrateDeploy()) {
  console.warn(
    `[migrate-deploy] prisma migrate deploy failed; clearing known failed migration ${FAILED_MIDDLE} if present, then retrying once.`,
  );
  run(`npx prisma migrate resolve --rolled-back "${FAILED_MIDDLE}"`, {
    allowFail: true,
  });
  if (!migrateDeploy()) {
    console.error(
      "[migrate-deploy] prisma migrate deploy still failed after resolve. Check _prisma_migrations in the production database.",
    );
    process.exit(1);
  }
}

if (!seedDatabase()) {
  console.error(
    "[migrate-deploy] prisma db seed failed. Production homepage cannot match localhost without categories/articles.",
  );
  process.exit(1);
}
