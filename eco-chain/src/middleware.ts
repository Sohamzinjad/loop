import { NextResponse, type NextRequest } from "next/server";

// ─── Simple In-Memory Rate Limiter ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    entry.count++;
    return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, entry] of rateLimitMap) {
            if (now > entry.resetAt) rateLimitMap.delete(ip);
        }
    }, 5 * 60_000);
}

// ─── Security Headers ───
const securityHeaders: Record<string, string> = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "on",
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    // ─── Rate Limiting (all API routes) ───
    if (pathname.startsWith("/api/")) {
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }
    }

    // ─── Sync API Authentication ───
    if (pathname === "/api/sync") {
        const apiKey = request.headers.get("x-api-key");
        const expectedKey = process.env.SYNC_API_KEY;

        if (!expectedKey) {
            console.error("[middleware] SYNC_API_KEY is not configured");
            return NextResponse.json(
                { error: "Service misconfigured" },
                { status: 503 }
            );
        }

        if (apiKey !== expectedKey) {
            return NextResponse.json(
                { error: "Unauthorized — invalid or missing API key" },
                { status: 401 }
            );
        }
    }

    // ─── Apply Security Headers ───
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(securityHeaders)) {
        response.headers.set(key, value);
    }

    return response;
}

export const config = {
    matcher: [
        // Match all API routes and pages, skip static assets
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
