// PATH: app/api/registrations/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateTicketCode } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  let query = supabase
    .from("registrations")
    .select("*, event:events(*), participant:profiles!participant_id(*)");

  if (profile?.role === "participant") {
    query = query.eq("participant_id", user.id);
  } else if (profile?.role === "organizer" && eventId) {
    query = query.eq("event_id", eventId);
  } else if (profile?.role === "admin") {
    if (eventId) query = query.eq("event_id", eventId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { event_id } = body;

  // Check event exists and is open
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", event_id)
    .eq("status", "published")
    .single();

  if (!event) return NextResponse.json({ error: "Event not found or not published" }, { status: 404 });
  if (new Date(event.registration_deadline) < new Date()) {
    return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
  }
  if (event.max_participants && event.current_participants >= event.max_participants) {
    return NextResponse.json({ error: "Event is full" }, { status: 400 });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", event_id)
    .eq("participant_id", user.id)
    .single();

  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 409 });

  const ticketCode = generateTicketCode();
  const qrData = JSON.stringify({ ticketCode, eventId: event_id, participantId: user.id, ts: Date.now() });

  const { data, error } = await supabase.from("registrations").insert({
    event_id,
    participant_id: user.id,
    status: event.price > 0 ? "pending" : "confirmed",
    payment_status: event.price > 0 ? "pending" : "paid",
    ticket_code: ticketCode,
    qr_data: qrData,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
