/**
 * Simple in-memory rate limiter.
 * Limits each IP to `maxRequests` per calendar day (server timezone).
 * No login required — uses client IP from request headers.
 */

const MAX_REQUESTS_PER_DAY = 10;

interface UsageEntry {
  count: number;
  date: string; // YYYY-MM-DD
}

const store = new Map<string, UsageEntry>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  const d = today();
  const entry = store.get(ip);

  if (!entry || entry.date !== d) {
    // New day or first request
    store.set(ip, { count: 1, date: d });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1, limit: MAX_REQUESTS_PER_DAY };
  }

  if (entry.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0, limit: MAX_REQUESTS_PER_DAY };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - entry.count, limit: MAX_REQUESTS_PER_DAY };
}

/** Get current usage without incrementing */
export function getUsage(ip: string): { used: number; limit: number } {
  const d = today();
  const entry = store.get(ip);
  if (!entry || entry.date !== d) {
    return { used: 0, limit: MAX_REQUESTS_PER_DAY };
  }
  return { used: entry.count, limit: MAX_REQUESTS_PER_DAY };
}
