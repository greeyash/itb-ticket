// PATH: app/dashboard/my-events/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Ticket, Award } from "lucide-react";
import { formatDate, getCategoryIcon, cn } from "@/lib/utils";

export const metadata = { title: "Event Saya" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: registrations } = await supabase
  .from("registrations")
  .select(`
    *,
    event:events(
      id, title, slug, start_date, end_date,
      location_name, is_online, category, banner_url,
      has_certificate, participation_points, status
    )
  `)
  .eq("participant_id", user.id)
  .order("created_at", { ascending: false }) as any;

  const upcoming = registrations?.filter((r: any) => {
    const event = r.event as any;
    return event && new Date(event.start_date) > new Date() && r.status !== "cancelled";
  }) || [];

  const past = registrations?.filter((r: any) => {
    const event = r.event as any;
    return event && new Date(event.start_date) <= new Date();
  }) || [];

  const renderReg = (reg: any) => {
    const event = reg.event as any;
    if (!event) return null;
    const statusColors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700",
      confirmed: "bg-green-100 text-green-700",
      attended: "bg-blue-100 text-blue-700",
      cancelled: "bg-red-100 text-red-600",
    };
    return (
      <div key={reg.id} className="card-hover overflow-hidden flex">
        {/* Left color bar */}
        <div className={`w-1.5 flex-shrink-0 ${
          reg.status === "attended" ? "bg-blue-400" :
          reg.status === "confirmed" ? "bg-green-400" :
          reg.status === "cancelled" ? "bg-red-300" : "bg-amber-400"
        }`} />

        <div className="flex-1 p-4">
          <div className="flex items-start gap-4">
            {/* Event thumbnail */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-saltywater/50 flex items-center justify-center flex-shrink-0">
              {event.banner_url
                ? <img src={event.banner_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl">{getCategoryIcon(event.category)}</span>
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link href={`/events/${event.slug}`}
                  className="font-display font-semibold text-gray-900 text-sm hover:text-ocean transition-colors line-clamp-2">
                  {event.title}
                </Link>
                <span className={`badge text-[10px] flex-shrink-0 ${statusColors[reg.status] || "bg-gray-100 text-gray-600"}`}>
                  {reg.status === "attended" ? "✅ Hadir" :
                   reg.status === "confirmed" ? "✓ Confirmed" :
                   reg.status === "cancelled" ? "✗ Batal" : "⏳ Pending"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar size={11} />
                  {formatDate(event.start_date, "d MMM yyyy · HH:mm")}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin size={11} />
                  {event.is_online ? "Online" : event.location_name || "ITB"}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                {reg.status !== "cancelled" && (
                  <Link href="/dashboard/tickets"
                    className="flex items-center gap-1 text-xs text-ocean hover:underline">
                    <Ticket size={11} /> Tiket
                  </Link>
                )}
                {reg.status === "attended" && event.has_certificate && (
                  <Link href="/dashboard/certificates"
                    className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                    <Award size={11} /> Sertifikat
                  </Link>
                )}
                {reg.payment_status === "pending" && reg.status === "pending" && (
                  <span className="text-xs text-amber-600 font-medium">
                    💳 Upload bukti bayar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Event Saya</h1>
        <p className="text-gray-500 text-sm mt-0.5">Semua event yang kamu ikuti</p>
      </div>

      {registrations?.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="font-display font-semibold text-gray-900 mb-2">Belum ada event</h3>
          <p className="text-gray-500 text-sm mb-6">Daftar event sekarang dan mulai kumpulkan poin!</p>
          <Link href="/events" className="btn-primary inline-block">Jelajahi Event</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Akan Datang ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(renderReg)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Riwayat ({past.length})
              </h2>
              <div className="space-y-3 opacity-80">
                {past.map(renderReg)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}