// PATH: app/api/notifications/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  let query = supabase.from("notifications").select("*").eq("user_id", user.id);
  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { notification_id, mark_all } = body;

  if (mark_all) {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    return NextResponse.json({ success: true });
  }

  if (notification_id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notification_id).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "notification_id or mark_all required" }, { status: 400 });
}
