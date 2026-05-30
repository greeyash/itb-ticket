// PATH: app/api/certificates/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");
  const code = searchParams.get("code");

  if (!hash && !code) return NextResponse.json({ error: "hash or code required" }, { status: 400 });

  let query = supabase
    .from("certificates")
    .select("*, event:events(title, start_date, category), participant:profiles!participant_id(full_name, nim, faculty)");

  if (hash) query = query.eq("verification_hash", hash);
  else if (code) query = query.eq("certificate_number", code);

  const { data, error } = await query.single();

  if (error || !data) return NextResponse.json({ valid: false, error: "Certificate not found" }, { status: 404 });
  return NextResponse.json({ valid: data.is_valid, data });
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
  const { registration_id, event_id, participant_id } = body;

  const certNumber = `CERT/${new Date().getFullYear()}/${event_id.slice(0, 8).toUpperCase()}/${nanoid(6).toUpperCase()}`;
  const verHash = nanoid(32);

  const { data, error } = await supabase.from("certificates").insert({
    registration_id,
    event_id,
    participant_id,
    certificate_number: certNumber,
    verification_hash: verHash,
    is_valid: true,
  }).select().single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Certificate already issued" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify participant
  await supabase.from("notifications").insert({
    user_id: participant_id,
    title: "Sertifikat Tersedia! 🎓",
    message: "Sertifikat kehadiran eventmu sudah bisa diunduh.",
    type: "certificate",
    action_url: "/dashboard/certificates",
  });

  return NextResponse.json({ data }, { status: 201 });
}
