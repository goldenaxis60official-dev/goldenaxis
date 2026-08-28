//src>middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_DOMAINS = ["goldenaxisadmin.vercel.app", "admin.goldenaxis60.company"];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] || "";
  const pathname = request.nextUrl.pathname;
  const isAdminDomain = ADMIN_DOMAINS.includes(host);

  let response = NextResponse.next();

  // Admin control link redirect
  if (isAdminDomain) {
    const url = request.nextUrl.clone();
    
    if (pathname === "/") {
      url.pathname = "/admin";
      response = NextResponse.redirect(url);
    } 
    
    if (pathname === "/login") {
      url.pathname = "/admin/login"; 
      response = NextResponse.rewrite(url); 
    }
  }

  // Apply Security Headers to build trust and prevent attacks
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
