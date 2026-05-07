//src>middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_DOMAIN = "goldenaxisadmin.vercel.app";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] || "";
  const pathname = request.nextUrl.pathname;

  const isAdminDomain = host === ADMIN_DOMAIN;

  // Admin control link:
  // goldenaxisadmin.vercel.app -> goldenaxisadmin.vercel.app/admin
  if (isAdminDomain && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Match all routes except:
      - api routes
      - Next.js static files
      - images
      - favicon
      - files with extensions
    */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};