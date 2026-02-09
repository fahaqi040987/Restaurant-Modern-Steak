import { createMiddleware } from 'hono/factory';

interface Visitor {
  tokens: number;
  lastVisit: number;
}

class RateLimiter {
  private visitors = new Map<string, Visitor>();
  private maxTokens: number;
  private refillIntervalMs: number;
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, v] of this.visitors) {
      if (now - v.lastVisit > this.refillIntervalMs * 2) {
        this.visitors.delete(ip);
      }
    }
  }

  allow(ip: string): boolean {
    const now = Date.now();
    let v = this.visitors.get(ip);

    if (!v) {
      v = { tokens: this.maxTokens - 1, lastVisit: now };
      this.visitors.set(ip, v);
      return true;
    }

    const elapsed = now - v.lastVisit;
    const tokensToAdd = Math.floor((elapsed / this.refillIntervalMs) * this.maxTokens);
    v.tokens = Math.min(v.tokens + tokensToAdd, this.maxTokens);
    v.lastVisit = now;

    if (v.tokens > 0) {
      v.tokens--;
      return true;
    }
    return false;
  }

  destroy() {
    clearInterval(this.cleanupTimer);
  }
}

function getClientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || 'unknown';
}

export function rateLimitMiddleware(maxTokens: number, refillIntervalMs: number) {
  const limiter = new RateLimiter(maxTokens, refillIntervalMs);
  return createMiddleware(async (c, next) => {
    const ip = getClientIp(c);
    if (!limiter.allow(ip)) {
      return c.json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        error: 'rate_limit_exceeded',
      }, 429);
    }
    await next();
  });
}

export const publicRateLimiter = () => rateLimitMiddleware(30, 60000);
export const strictRateLimiter = () => rateLimitMiddleware(5, 60000);
export const contactFormRateLimiter = () => rateLimitMiddleware(3, 300000);
