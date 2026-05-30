  import { createServerClient } from "@supabase/ssr";
  import { NextResponse, type NextRequest } from "next/server";

  export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet : any) {
            cookiesToSet.forEach(({ name, value}: any) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }: any) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;

    // Protected routes
    const protectedRoutes = ["/dashboard"];
    const authRoutes = ["/auth/login", "/auth/register"];

    if (!user && protectedRoutes.some((r) => path.startsWith(r))) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (user && authRoutes.includes(path)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  }