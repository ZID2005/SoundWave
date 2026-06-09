import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

// Rate limit store (In-memory Map)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Periodic cleanup of rate limit store (to avoid memory leaks)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_STORE_SIZE = 5000;

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL || rateLimitStore.size > MAX_STORE_SIZE) {
    rateLimitStore.forEach((entry, key) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    });
    lastCleanup = now;
  }
}

export function middleware(request: NextRequest) {
  const now = Date.now();
  const url = request.nextUrl.pathname;
  const method = request.method;

  // Run store cleanup
  cleanupStore();

  // 1. Get Client Identifier (IP Address or User UID)
  let ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  let userKey = ip;
  // If the request contains a Firebase ID token, decode it to rate-limit by User UID
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7).trim();
      const payload = decodeJwt(token);
      if (payload && payload.sub) {
        userKey = payload.sub; // User UID
      }
    } catch {
      // Fallback to IP if token is malformed
    }
  }

  // 2. Define Rate Limit Parameters
  let limit = 60; // default general limit
  let windowMs = 60 * 1000; // 1 minute window
  let keyPrefix = "gen:";

  if (url.includes("/api/auth/")) {
    // Auth endpoints (login, OTP)
    limit = 5;
    windowMs = 15 * 60 * 1000; // 15 minutes
    keyPrefix = "auth:";
  } else if (url.startsWith("/api/wave-chat")) {
    // WAVE Chatbot endpoint
    limit = 10;
    windowMs = 60 * 1000; // 1 minute
    keyPrefix = "chat:";
  } else if (url.startsWith("/api/whatsapp")) {
    // CallMeBot WhatsApp proxy
    limit = 5;
    windowMs = 60 * 1000; // 1 minute
    keyPrefix = "wa:";
  }

  // If rate limiting by userKey, suffix it to keyPrefix
  const rateLimitKey = `${keyPrefix}${url.startsWith("/api/wave-chat") ? userKey : ip}`;

  // 3. Rate Limit Check
  const currentEntry = rateLimitStore.get(rateLimitKey);
  let isRateLimited = false;
  let resetTime = now + windowMs;
  let currentCount = 1;

  if (currentEntry) {
    if (now < currentEntry.resetTime) {
      currentCount = currentEntry.count + 1;
      resetTime = currentEntry.resetTime;
      if (currentCount > limit) {
        isRateLimited = true;
      }
    } else {
      // Window expired, reset
      currentCount = 1;
      resetTime = now + windowMs;
    }
  }

  // Update rate limit store (unless already rate-limited to prevent window sliding)
  if (!isRateLimited) {
    rateLimitStore.set(rateLimitKey, { count: currentCount, resetTime });
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

  // 4. Handle CORS Origins
  const origin = request.headers.get("origin") || "";
  const isDev = process.env.NODE_ENV === "development";
  const allowedOrigins = isDev
    ? ["http://localhost:3000", "https://soundwave.com"]
    : ["https://soundwave.com"];
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // If rate limited, return 429 response
  if (isRateLimited) {
    const errorResponse = NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
    
    // Add CORS headers to error response
    if (isAllowedOrigin) {
      errorResponse.headers.set("Access-Control-Allow-Origin", origin);
    }
    errorResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    errorResponse.headers.set("Retry-After", String(retryAfterSeconds));
    
    return errorResponse;
  }

  // Handle standard response
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight OPTIONS requests
  if (method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Apply middleware to all API routes
export const config = {
  matcher: "/api/:path*",
};
