import { NextResponse, type NextRequest } from "next/server";

/**
 * Employee portal gatekeeping — optimistic only.
 *
 * This checks for the presence of a session cookie to redirect signed-out
 * visitors to the login page early; it does not and cannot validate the
 * session. Real authentication and authorisation happen in the Data Access
 * Layer (src/crm/auth/dal.ts) on every page, Server Action and Route
 * Handler.
 *
 * It also sets security headers on every /crm response:
 * - no-store: private HR pages must never be cached by browsers or proxies;
 * - no-referrer: set-password URLs carry one-time tokens;
 * - DENY framing: no clickjacking of approval buttons.
 *
 * The public marketing site is untouched (matcher is /crm only).
 */
const SESSION_COOKIE = "midis_crm_session";
const PUBLIC_PATHS = ["/crm/login", "/crm/forgot-password", "/crm/set-password"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isApi = pathname.startsWith("/crm/api/");
  const hasSession = request.cookies.has(SESSION_COOKIE);

  let response: NextResponse;
  if (!isPublic && !isApi && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/crm/login";
    url.search = pathname === "/crm" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/crm", "/crm/:path*"],
};
