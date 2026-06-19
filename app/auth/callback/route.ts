import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // 🛠️ AMBIL DOMAIN ASLI DARI CLOUDFLARE HEADERS
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const realOrigin = `${protocol}://${host}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 🚀 Gunakan realOrigin, bukan origin bawaan request.url
      return NextResponse.redirect(`${realOrigin}${next}`);
    }
  }
  
  return NextResponse.redirect(`${realOrigin}/auth/login?error=auth_failed`);
}
