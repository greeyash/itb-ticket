// PATH: app/api/events/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category");
  const status = searchParams.get("status") || "published";
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");

  let query = supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(full_name, faculty, avatar_url)", { count: "exact" });

  if (status !== "all") query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (featured === "true") query = query.eq("is_featured", true);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error, count } = await query
    .order("start_date", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    meta: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["organizer", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const slug = generateSlug(body.title);

  const { data, error } = await supabase.from("events").insert({
    ...body,
    slug,
    organizer_id: user.id,
    status: "draft",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
