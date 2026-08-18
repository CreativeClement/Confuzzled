const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return {
      ok: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      resetAt: fresh.resetAt,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, MAX_REQUESTS - existing.count);
  return {
    ok: existing.count <= MAX_REQUESTS,
    limit: MAX_REQUESTS,
    remaining,
    resetAt: existing.resetAt,
  };
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.headers.get("x-real-ip") ?? "anonymous";
}
