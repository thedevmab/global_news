export const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function shouldTouchSession(
  lastActiveAt: Date,
  now: number = Date.now(),
): boolean {
  return now - lastActiveAt.getTime() > TOUCH_INTERVAL_MS;
}
