// PATH: app/dashboard/organizer/attendees/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AttendeeTable } from "@/components/dashboard/attendeetable";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Kelola Peserta" };

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: { event?: string; status?: string };
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get organizer's events
  const { data: myEvents } = await supabase
    .from("events")
    .select("id, title, start_date, current_participants, max_participants")
    .eq("organizer_id", user.id)
    .order("start_date", { ascending: false }) as any;

    const selectedEventId = sp.event || myEvents?.[0]?.id;
    const selectedEvent = myEvents?.find((e: any) => e.id === selectedEventId);

  let registrations: any[] = [];
  if (selectedEventId) {
    let regQuery = supabase
      .from("registrations")
      .select(`
        *,
        participant:profiles!participant_id(id, full_name, email, nim, faculty, avatar_url, phone)
      `)
      .eq("event_id", selectedEventId)
      .order("created_at", { ascending: false });

    if (sp.status) regQuery = regQuery.eq("status", sp.status);
    const { data } = await regQuery;
    registrations = data || [];
  }
  

    const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r: any) => r.status === "confirmed" || r.status === "attended").length,
    pending: registrations.filter((r: any) => r.status === "pending").length,
    attended: registrations.filter((r: any) => r.status === "attended").length,
    pendingPayment: registrations.filter((r: any) => r.payment_status === "pending").length,
    };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Kelola Peserta</h1>
        <p className="text-gray-500 text-sm mt-0.5">Verifikasi pembayaran dan kelola kehadiran peserta</p>
      </div>

      {/* Event selector */}
      {myEvents && myEvents.length > 0 && (
        <div className="card p-4">
          <label className="label text-xs">Pilih Event</label>
          <div className="flex flex-wrap gap-2">
            {myEvents.map((event: any) => (
              <a
                key={event.id}
                href={`/dashboard/organizer/attendees?event=${event.id}`}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  event.id === selectedEventId
                    ? "bg-ocean text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {event.title.length > 30 ? event.title.slice(0, 30) + "…" : event.title}
                <span className="ml-2 opacity-70">{event.current_participants}</span>
              </a>
            ))}
          </div>
        </div>
      )}

     {!!selectedEvent && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-gray-900" },
              { label: "Terkonfirmasi", value: stats.confirmed, color: "text-green-600" },
              { label: "Pending", value: stats.pending, color: "text-amber-600" },
              { label: "Hadir", value: stats.attended, color: "text-ocean" },
              { label: "Belum Bayar", value: stats.pendingPayment, color: "text-red-600" },
            ].map((s) => (
              <div key={s.label} className="card p-3.5 text-center">
                <p className={`text-xl font-display font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "", label: "Semua" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Terkonfirmasi" },
              { value: "attended", label: "Hadir" },
              { value: "cancelled", label: "Dibatalkan" },
            ].map((f) => (
              <a
                key={f.value}
                href={`/dashboard/organizer/attendees?event=${selectedEventId}${f.value ? `&status=${f.value}` : ""}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  (sp.status === f.value) || (!sp.status && !f.value)
                    ? "bg-ocean text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label} {f.value ? `(${registrations.filter((r) => r.status === f.value || (f.value === "" && true)).length})` : `(${stats.total})`}
              </a>
            ))}
          </div>

          {/* Table */}
          <AttendeeTable registrations={registrations} eventId={selectedEventId!} />
        </>
      )}

      {(!myEvents || myEvents.length === 0) && (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-gray-500">Belum ada event yang dibuat</p>
        </div>
      )}
    </div>
  );
}