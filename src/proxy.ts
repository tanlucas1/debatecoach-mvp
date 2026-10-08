import { NextResponse, type NextRequest } from "next/server";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { isSameSite } from "@/lib/security/same-site";

const TEN_MINUTES = 10 * 60 * 1000;

// Generous per-client limits for the routes that spend paid credits. A school sharing one
// internet connection can still run several rounds at once; only bursts from bots stop here.
const LIMITS: { prefix: string; take: ReturnType<typeof createRateLimiter> }[] = [
  {
    prefix: "/api/avatar/anam/preview",
    take: createRateLimiter({ limit: 60, windowMs: TEN_MINUTES }),
  },
  { prefix: "/api/avatar/tavus/end", take: () => ({ allowed: true, retryAfterMs: 0 }) },
  { prefix: "/api/avatar", take: createRateLimiter({ limit: 15, windowMs: TEN_MINUTES }) },
  { prefix: "/api/debate/turn", take: createRateLimiter({ limit: 60, windowMs: TEN_MINUTES }) },
  { prefix: "/api/debate/grade", take: createRateLimiter({ limit: 15, windowMs: TEN_MINUTES }) },
  { prefix: "/api/speech/session", take: createRateLimiter({ limit: 60, windowMs: TEN_MINUTES }) },
  { prefix: "/api/speech/speak", take: createRateLimiter({ limit: 600, windowMs: TEN_MINUTES }) },
];

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function proxy(request: NextRequest) {
  if (!isSameSite(request.headers)) {
    return NextResponse.json({ error: "Requests must come from the app." }, { status: 403 });
  }

  const { pathname } = request.nextUrl;
  const rule = LIMITS.find(({ prefix }) => pathname.startsWith(prefix));
  if (!rule) return NextResponse.next();

  const { allowed, retryAfterMs } = rule.take(`${rule.prefix}|${clientKey(request)}`);
  if (allowed) return NextResponse.next();
  return NextResponse.json(
    { error: "Too many requests. Please try again in a few minutes." },
    { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
  );
}

export const config = {
  matcher: "/api/:path*",
};
