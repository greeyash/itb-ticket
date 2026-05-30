// PATH: app/api/users/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");

  let query = supabase.from("profiles").select("*", { count: "exact" });
  if (role) query = query.eq("role", role);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, meta: { total: count || 0, page, limit } });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { user_id, ...updates } = body;
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update(updates).eq("id", user_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
