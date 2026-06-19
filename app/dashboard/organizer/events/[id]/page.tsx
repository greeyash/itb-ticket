// PATH: app/dashboard/organizer/events/[id]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Edit, Users, QrCode, Award, Eye, ToggleRight, BarChart2 } from "lucide-react";
import { formatDate, formatCurrency, getEventStatusColor } from "@/lib/utils";
import { PublishToggle } from "@/components/dashboard/publishtoggle";

export default async function OrganizerEventDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single() as any;

  if (!event) notFound();

  // Verify ownership
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any;
  if (event.organizer_id !== user.id && profile?.role !== "admin") redirect("/dashboard/organizer/events");

  // Registrations summary
  const { data: regs } = await supabase
    .from("registrations")
    .select("status, payment_status, created_at")
    .eq("event_id", event.id) as any;

  const regStats = {
    total: regs?.length || 0,
    confirmed: regs?.filter((r?: any) => ["confirmed","attended"].includes(r.status)).length || 0,
    pending: regs?.filter((r?: any) => r.status === "pending").length || 0,
    attended: regs?.filter((r?: any) => r.status === "attended").length || 0,
    pendingPayment: regs?.filter((r?: any) => r.payment_status === "pending").length || 0,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/organizer/events" className="text-ocean text-sm hover:underline">← Event Saya</Link>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 line-clamp-2">{event.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`badge text-xs ${getEventStatusColor(event.status)}`}>{event.status}</span>
            <span className="text-sm text-gray-500">{formatDate(event.start_date, "d MMM yyyy · HH:mm")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/events/${event.slug}`} target="_blank"
            className="btn-ghost flex items-center gap-2 text-sm">
            <Eye size={15} /> Preview
          </Link>
          <Link href={`/dashboard/organizer/events/${event.id}/edit`}
            className="btn-outline flex items-center gap-2 text-sm">
            <Edit size={15} /> Edit
          </Link>
          <PublishToggle eventId={event.id} currentStatus={event.status} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Registrasi", value: regStats.total, color: "text-gray-900", bg: "bg-gray-50" },
          { label: "Terkonfirmasi", value: regStats.confirmed, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending", value: regStats.pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Hadir", value: regStats.attended, color: "text-ocean", bg: "bg-ocean/5" },
          { label: "Belum Bayar", value: regStats.pendingPayment, color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`card p-4 text-center ${s.bg} border-0`}>
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href={`/dashboard/organizer/attendees?event=${event.id}`}
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
          <div className="w-12 h-12 rounded-xl bg-ocean/10 flex items-center justify-center group-hover:bg-ocean group-hover:text-white transition-colors">
            <Users size={20} className="text-ocean group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Kelola Peserta</p>
            <p className="text-xs text-gray-500">Verifikasi pembayaran & kehadiran</p>
          </div>
        </Link>
        <Link href="/dashboard/organizer/scanner"
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
          <div className="w-12 h-12 rounded-xl bg-butter/30 flex items-center justify-center group-hover:bg-copper group-hover:text-white transition-colors">
            <QrCode size={20} className="text-copper group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Scan Tiket</p>
            <p className="text-xs text-gray-500">Check-in peserta dengan QR</p>
          </div>
        </Link>
        <Link href="/dashboard/organizer/certificates"
          className="card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Award size={20} className="text-purple-600 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Sertifikat</p>
            <p className="text-xs text-gray-500">Terbitkan sertifikat digital</p>
          </div>
        </Link>
      </div>

      {/* Event info */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Info Event</h3>
          <div className="space-y-3 text-sm">
            {[
              { label: "Kategori", value: event.category },
              { label: "Mulai", value: formatDate(event.start_date, "d MMM yyyy, HH:mm") },
              { label: "Selesai", value: formatDate(event.end_date, "d MMM yyyy, HH:mm") },
              { label: "Deadline Daftar", value: formatDate(event.registration_deadline, "d MMM yyyy, HH:mm") },
              { label: "Lokasi", value: event.is_online ? "Online" : (event.location_name || "—") },
              { label: "Kapasitas", value: event.max_participants ? `${event.current_participants}/${event.max_participants}` : "Tidak terbatas" },
              { label: "Harga", value: event.price > 0 ? formatCurrency(event.price) : "Gratis" },
              { label: "Poin", value: `+${event.participation_points} poin` },
              { label: "Sertifikat", value: event.has_certificate ? "Ya" : "Tidak" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900 text-right capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ringkasan</h3>
          <div className="space-y-4">
            {/* Capacity visualization */}
            {event.max_participants && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Kapasitas terisi</span>
                  <span>{Math.round((event.current_participants / event.max_participants) * 100)}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-ocean transition-all"
                    style={{ width: `${Math.min((event.current_participants / event.max_participants) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{event.current_participants} terdaftar</span>
                  <span>{event.max_participants - event.current_participants} sisa</span>
                </div>
              </div>
            )}

            {/* Payment breakdown */}
            <div className="bg-saltywater/30 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-3">Status Pembayaran</p>
              {[
                { label: "Sudah Bayar", value: regs?.filter((r?: any) => r.payment_status === "paid").length || 0, color: "text-green-600" },
                { label: "Pending", value: regStats.pendingPayment, color: "text-amber-600" },
                { label: "Gagal/Refund", value: regs?.filter((r?: any) => ["failed","refunded"].includes(r.payment_status)).length || 0, color: "text-red-600" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-400">
              Dibuat: {formatDate(event.created_at, "d MMM yyyy")} · {event.view_count} kali dilihat
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
