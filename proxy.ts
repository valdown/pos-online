import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEMO_SESSION_COOKIE } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

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

  if (hasSupabaseEnv()) {
    const { response, user } = await refreshSupabaseSession(request);

    if (pathname === "/login") {
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return response;
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const isLoggedIn = request.cookies.get(DEMO_SESSION_COOKIE)?.value === "active";

  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
