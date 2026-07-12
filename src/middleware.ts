import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "transitops_session";

/** Pages reachable without a session. */
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

/**
 * Edge middleware: gate every page behind a valid session. API routes enforce
 * their own auth (and RBAC) via withAuth, so they are excluded from the matcher.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  let authed = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      authed = true;
    } catch {
      authed = false;
    }
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Unauthenticated users may only reach public auth pages.
  if (!authed && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  // Authenticated users have no business on the auth pages or the bare root.
  if (authed && (isPublic || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except API, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
