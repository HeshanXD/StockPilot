import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { company } from "@/config/company";

// Routes anyone can reach without logging in
const PUBLIC_PATHS = ["/login", "/signup"];

// Map disabled feature flags to the routes they gate. A client without
// the "reports" feature can't reach /reports even by typing the URL.
const FEATURE_ROUTES = {
  reports: "/reports",
  customers: "/customers",
};

export async function proxy(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  // Not logged in, trying to reach a protected page -> send to login
  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in, trying to reach login/signup -> send to dashboard
  if (user && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Feature disabled for this client -> block direct URL access too
  for (const [feature, route] of Object.entries(FEATURE_ROUTES)) {
    if (path.startsWith(route) && !company.features[feature]) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};