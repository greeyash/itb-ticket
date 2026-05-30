import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Ticket, Award, Zap, ArrowRight, Users, BarChart2, Shield } from "lucide-react";
import { formatDate, formatRelative } from "@/lib/utils";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;
type Event = Tables<"events">;
type Registration = Tables<"registrations">;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single<Profile>();
  if (!profile) redirect("/auth/login");

  // Fetch data based on role
  let stats: Record<string, number> = {};
  let recentItems: any[] = [];

  if (profile.role === "participant") {
    const { count: totalRegistrations } = await supabase
      .from("registrations").select("*", { count: "exact", head: true }).eq("participant_id", user.id);
    const { count: attended } = await supabase
      .from("registrations").select("*", { count: "exact", head: true })
      .eq("participant_id", user.id).eq("status", "attended");
    const { count: certs } = await supabase
      .from("certificates").select("*", { count: "exact", head: true }).eq("participant_id", user.id);
    const { count: badges } = await supabase
      .from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", user.id);

    stats = {
      totalRegistrations: totalRegistrations || 0,
      attended: attended || 0,
      certificates: certs || 0,
      badges: badges || 0,
    };

    const { data } = await supabase.from("registrations")
      .select("*, event:events(title, start_date, banner_url, status, slug)")
      .eq("participant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentItems = data || [];

  } else if (profile.role === "organizer") {
    const { count: myEvents } = await supabase
      .from("events").select("*", { count: "exact", head: true }).eq("organizer_id", user.id);
    const { data: myEventIds } = await supabase
  .from("events")
  .select("id")
  .eq("organizer_id", user.id)
  .returns<Pick<Event, "id">[]>();
    const ids = myEventIds?.map((e) => e.id) || [];
    const { count: totalParticipants } = ids.length > 0
      ? await supabase.from("registrations").select("*", { count: "exact", head: true }).in("event_id", ids)
      : { count: 0 };
    const { count: pendingPayments } = ids.length > 0
      ? await supabase.from("registrations").select("*", { count: "exact", head: true })
          .in("event_id", ids).eq("payment_status", "pending")
      : { count: 0 };
    const { count: published } = await supabase
      .from("events").select("*", { count: "exact", head: true })
      .eq("organizer_id", user.id).eq("status", "published");

    stats = {
      myEvents: myEvents || 0,
      totalParticipants: totalParticipants || 0,
      pendingPayments: pendingPayments || 0,
      published: published || 0,
    };

    const { data } = await supabase.from("events")
      .select("*").eq("organizer_id", user.id)
      .order("created_at", { ascending: false }).limit(5);
    recentItems = data || [];

  } else if (profile.role === "admin") {
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: totalEvents } = await supabase.from("events").select("*", { count: "exact", head: true });
    const { count: pendingVerifications } = await supabase
      .from("profiles").select("*", { count: "exact", head: true }).eq("is_verified", false);
    const { count: totalRegistrations } = await supabase.from("registrations").select("*", { count: "exact", head: true });

    stats = {
      totalUsers: totalUsers || 0,
      totalEvents: totalEvents || 0,
      pendingVerifications: pendingVerifications || 0,
      totalRegistrations: totalRegistrations || 0,
    };

    const { data } = await supabase.from("events")
      .select("*, organizer:profiles!organizer_id(full_name)")
      .order("created_at", { ascending: false }).limit(5);
    recentItems = data || [];
  }

  // Upcoming events for participant
  let upcomingEvents: Event[] = [];
  if (profile.role === "participant") {
    const { data } = await supabase.from("registrations")
      .select("event:events!inner(*)")
      .eq("participant_id", user.id)
      .eq("status", "confirmed")
      .gte("events.start_date", new Date().toISOString())
      .order("events.start_date")
      .limit(3);
    upcomingEvents = (data?.map((r: any) => r.event) || []) as Event[];
  }

  const participantStats = [
    { label: "Total Registrasi", value: stats.totalRegistrations, icon: Calendar, color: "bg-ocean/10 text-ocean" },
    { label: "Event Dihadiri", value: stats.attended, icon: Award, color: "bg-green-100 text-green-700" },
    { label: "Sertifikat", value: stats.certificates, icon: Ticket, color: "bg-purple-100 text-purple-700" },
    { label: "Badge Earned", value: stats.badges, icon: Zap, color: "bg-butter/60 text-copper" },
  ];

  const organizerStats = [
    { label: "Total Event", value: stats.myEvents, icon: Calendar, color: "bg-ocean/10 text-ocean" },
    { label: "Dipublikasikan", value: stats.published, icon: BarChart2, color: "bg-green-100 text-green-700" },
    { label: "Total Peserta", value: stats.totalParticipants, icon: Users, color: "bg-nebula/40 text-copper" },
    { label: "Pembayaran Pending", value: stats.pendingPayments, icon: Zap, color: "bg-amber-100 text-amber-700" },
  ];

  const adminStats = [
    { label: "Total Pengguna", value: stats.totalUsers, icon: Users, color: "bg-ocean/10 text-ocean" },
    { label: "Total Event", value: stats.totalEvents, icon: Calendar, color: "bg-green-100 text-green-700" },
    { label: "Perlu Verifikasi", value: stats.pendingVerifications, icon: Shield, color: "bg-red-100 text-red-700" },
    { label: "Total Registrasi", value: stats.totalRegistrations, icon: BarChart2, color: "bg-butter/60 text-copper" },
  ];

  const currentStats = profile.role === "admin" ? adminStats :
    profile.role === "organizer" ? organizerStats : participantStats;

  console.log("PAGE RENDER");
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="bg-ocean-pattern rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-butter/10 blur-3xl" />
        <div className="relative z-10">
          <p className="text-nebula/70 text-sm mb-1">Dashboard {profile.role === "admin" ? "Administrator" : profile.role === "organizer" ? "Organizer" : "Peserta"}</p>
          <h1 className="font-display text-2xl font-bold text-white mb-1">{profile.full_name}</h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="text-butter text-sm font-medium"> {profile.points} poin</span>
            {profile.nim && <span className="text-nebula/70 text-sm">NIM: {profile.nim}</span>}
            {profile.faculty && <span className="text-nebula/70 text-sm">{profile.faculty}</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {currentStats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Role-specific quick actions */}
      {profile.role === "organizer" && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/dashboard/organizer/create", label: "Buat Event Baru", icon: "➕", desc: "Publikasikan event kamu", color: "bg-ocean text-white" },
            { href: "/dashboard/organizer/scanner", label: "Scan Tiket", icon: "📷", desc: "Validasi kehadiran peserta", color: "bg-butter text-copper" },
            { href: "/dashboard/organizer/attendees", label: "Kelola Peserta", icon: "👥", desc: "Lihat dan verifikasi peserta", color: "bg-nebula/40 text-ocean" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`${a.color} p-5 rounded-2xl flex items-center gap-4 hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {profile.role === "admin" && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/dashboard/admin/verifications", label: "Verifikasi Pengguna", icon: "", desc: "Approve organizer baru", color: "bg-red-500 text-white" },
            { href: "/dashboard/admin/users", label: "Kelola Pengguna", icon: "", desc: "Manage semua akun", color: "bg-ocean text-white" },
            { href: "/dashboard/admin/analytics", label: "Analytics Platform", icon: "", desc: "Statistik & monitoring", color: "bg-copper text-white" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`${a.color} p-5 rounded-2xl flex items-center gap-4 hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {profile.role === "participant" && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/events", label: "Jelajahi Event", icon: "", desc: "Temukan event baru", color: "bg-ocean text-white" },
            { href: "/dashboard/tickets", label: "Tiket Saya", icon: "", desc: "Lihat tiket QR digital", color: "bg-butter text-copper" },
            { href: "/leaderboard", label: "Leaderboard", icon: "", desc: "Cek ranking kamu", color: "bg-nebula/40 text-ocean" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className={`${a.color} p-5 rounded-2xl flex items-center gap-4 hover:opacity-90 transition-opacity`}>
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-gray-900">
            {profile.role === "participant" ? "Registrasi Terbaru" :
             profile.role === "organizer" ? "Event Terbaru" : "Event Terbaru Platform"}
          </h2>
          <Link href={profile.role === "participant" ? "/dashboard/my-events" : "/dashboard/organizer/events"}
            className="text-sm text-ocean hover:underline flex items-center gap-1">
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        <div className="space-y-3">
          {recentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Belum ada aktivitas</p>
            </div>
          ) : recentItems.map((item, idx) => {
            const event = profile.role === "participant" ? item.event : item;
            return (
              <div key={item.id || idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-saltywater/60 flex items-center justify-center text-lg flex-shrink-0">
                  📅
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event?.title || "Event"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {event?.start_date ? formatDate(event.start_date) : formatRelative(item.created_at)}
                  </p>
                </div>
                <span className={`badge text-xs ${
                  item.status === "attended" || event?.status === "published" ? "bg-green-100 text-green-700" :
                  item.status === "confirmed" ? "bg-ocean/10 text-ocean" :
                  item.status === "cancelled" || event?.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {item.status || event?.status || "pending"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}