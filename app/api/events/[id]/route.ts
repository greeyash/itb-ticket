// PATH: app/api/events/[id]/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(*)")
    .eq("id", params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: event } = await supabase.from("events").select("organizer_id").eq("id", params.id).single();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (event?.organizer_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await supabase.from("events").update(body).eq("id", params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: event } = await supabase.from("events").select("organizer_id").eq("id", params.id).single();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (event?.organizer_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("events").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
