import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { getSessionCookieConfig, revokeInternalSession } from "@/lib/internal-auth";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const sessionValue = cookieHeader
    ?.split(/;\s*/)
    .find((entry) => entry.startsWith(`${APP_SESSION_COOKIE}=`))
    ?.slice(APP_SESSION_COOKIE.length + 1);

  await revokeInternalSession(sessionValue ?? null);

  const response = NextResponse.json({ ok: true });
  const sessionCookie = getSessionCookieConfig();
  response.cookies.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
  return response;
}
