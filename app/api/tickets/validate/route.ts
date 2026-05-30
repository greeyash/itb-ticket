// PATH: app/api/tickets/validate/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["organizer", "admin"].includes(profile?.role || "")) {
    return NextResponse.json({ error: "Forbidden - organizer only" }, { status: 403 });
  }

  const body = await request.json();
  const { ticket_code } = body;

  if (!ticket_code) return NextResponse.json({ error: "ticket_code is required" }, { status: 400 });

  const { data: reg, error } = await supabase
    .from("registrations")
    .select(`
      *,
      event:events(id, title, organizer_id, start_date, end_date),
      participant:profiles!participant_id(full_name, nim, faculty, email)
    `)
    .eq("ticket_code", ticket_code.trim())
    .single();

  if (error || !reg) {
    return NextResponse.json({ valid: false, message: "Tiket tidak ditemukan" }, { status: 404 });
  }

  // Organizer can only validate their own events
  if (profile?.role === "organizer" && (reg.event as any)?.organizer_id !== user.id) {
    return NextResponse.json({ valid: false, message: "Bukan event kamu" }, { status: 403 });
  }

  if (reg.status === "attended") {
    return NextResponse.json({
      valid: false,
      already_used: true,
      message: "Tiket sudah digunakan",
      participant: reg.participant,
      event: reg.event,
      checked_in_at: reg.checked_in_at,
    });
  }

  if (reg.status === "cancelled") {
    return NextResponse.json({ valid: false, message: "Tiket telah dibatalkan" });
  }

  if (reg.payment_status === "pending") {
    return NextResponse.json({ valid: false, message: "Pembayaran belum dikonfirmasi" });
  }

  // Mark attended
  await supabase.from("registrations").update({
    status: "attended",
    checked_in_at: new Date().toISOString(),
    checked_in_by: user.id,
  }).eq("id", reg.id);

  return NextResponse.json({
    valid: true,
    message: "Check-in berhasil",
    participant: reg.participant,
    event: reg.event,
    ticket_code: reg.ticket_code,
  });
}
