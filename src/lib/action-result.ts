import { isAppError } from "@/lib/errors";
import { ZodError } from "zod";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, details?: unknown): ActionResult<never> {
  return { ok: false, error, details };
}

export function toActionError(err: unknown): ActionResult<never> {
  if (err instanceof ZodError) {
    return fail(err.issues[0]?.message || "Validation failed", err.issues);
  }
  if (isAppError(err)) {
    return fail(err.message);
  }
  if (err instanceof Error) {
    return fail(err.message);
  }
  return fail("Something went wrong");
}
