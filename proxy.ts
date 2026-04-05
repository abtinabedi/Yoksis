import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin rotaları koru (/dashboard, /events, vs. — /login hariç)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/events") || pathname.startsWith("/attend")) {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      const url = new URL("/login", request.url);
      if (pathname.startsWith("/attend")) url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    const payload = await verifyToken(token);
    if (!payload) {
      const url = new URL("/login", request.url);
      if (pathname.startsWith("/attend")) url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if ((pathname.startsWith("/dashboard") || pathname.startsWith("/events")) && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/participant", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/events/:path*", "/attend/:path*"],
};
