import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { resolveInternalSessionUser, touchInternalSession } from "@/lib/internal-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(APP_SESSION_COOKIE)?.value ?? null;
  const session = await resolveInternalSessionUser(sessionCookie);

  if (pathname === "/login") {
    if (session) {
      void touchInternalSession(session);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    if (sessionCookie) {
      response.cookies.set(APP_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    }

    return response;
  }

  void touchInternalSession(session);

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
