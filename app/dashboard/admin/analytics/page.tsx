// PATH: app/dashboard/admin/analytics/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Calendar, Ticket, Award, TrendingUp, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Analytics Platform" };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any;
  if (me?.role !== "admin") redirect("/dashboard");

  // Platform stats
  const [
    { count: totalUsers },
    { count: totalEvents },
    { count: totalRegistrations },
    { count: totalCertificates },
    { count: activeEvents },
    { count: pendingPayments },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("registrations").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).in("status", ["published", "ongoing"]),
    supabase.from("registrations").select("*", { count: "exact", head: true }).eq("payment_status", "pending"),
  ]);

  // Recent events
  const { data: recentEvents } = await supabase
  .from("events")
  .select("*, organizer:profiles!organizer_id(full_name)")
  .order("created_at", { ascending: false })
  .limit(8) as any;

  // Top organizers
  const { data: topOrganizers } = await supabase
    .from("profiles")
    .select("id, full_name, faculty")
    .eq("role", "organizer")
    .limit(5);

  // Category distribution
  const { data: categoryData } = await supabase
  .from("events")
  .select("category")
  .eq("status", "published") as any;

  const categoryDist: Record<string, number> = {};
  categoryData?.forEach((e: any) => {
    categoryDist[e.category] = (categoryDist[e.category] || 0) + 1;
  });

  // Role distribution
  const { data: roleData } = await supabase.from("profiles").select("role") as any;
  const roleDist: Record<string, number> = {};
  roleData?.forEach((u: any) => {
    roleDist[u.role] = (roleDist[u.role] || 0) + 1;
  });

  const platformStats = [
    { label: "Total Pengguna", value: totalUsers || 0, icon: Users, color: "bg-ocean/10 text-ocean", trend: "+12%" },
    { label: "Total Event", value: totalEvents || 0, icon: Calendar, color: "bg-green-100 text-green-700", trend: "+8%" },
    { label: "Total Registrasi", value: totalRegistrations || 0, icon: Ticket, color: "bg-purple-100 text-purple-700", trend: "+23%" },
    { label: "Sertifikat Diterbitkan", value: totalCertificates || 0, icon: Award, color: "bg-amber-100 text-amber-700", trend: "+5%" },
    { label: "Event Aktif", value: activeEvents || 0, icon: Activity, color: "bg-blue-100 text-blue-700", trend: "" },
    { label: "Pembayaran Pending", value: pendingPayments || 0, icon: TrendingUp, color: "bg-red-100 text-red-700", trend: "" },
  ];

  const categoryColors: Record<string, string> = {
    seminar: "#013F62",
    workshop: "#775537",
    competition: "#FBE29D",
    volunteer: "#C0DDDA",
    cultural: "#024d77",
    sports: "#8a6342",
    academic: "#E8EFFA",
    other: "#F1F1F1",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Analytics Platform</h1>
        <p className="text-gray-500 text-sm mt-0.5">Statistik dan monitoring platform ITB Ticket</p>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {platformStats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
              {s.trend && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  {s.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-display font-bold text-gray-900">{s.value.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Distribusi Kategori Event</h2>
          <div className="space-y-3">
            {Object.entries(categoryDist)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const total = Object.values(categoryDist).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 capitalize">{cat}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: categoryColors[cat] || "#013F62" }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Role distribution */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Distribusi Pengguna</h2>
          <div className="space-y-4">
            {Object.entries(roleDist).map(([role, count]) => {
              const total = Object.values(roleDist).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, string> = {
                admin: "#dc2626",
                organizer: "#013F62",
                participant: "#775537",
              };
              return (
                <div key={role}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 capitalize">{role}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: colors[role] || "#666" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-saltywater/30 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 mb-2">Summary</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {Object.entries(roleDist).map(([role, count]) => (
                <div key={role}>
                  <p className="text-lg font-bold text-ocean">{count}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Event Terbaru di Platform</h2>
        <div className="space-y-3">
          {recentEvents?.map((event: any) => (
            <div key={event.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="w-10 h-10 rounded-xl bg-saltywater/50 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                {event.banner_url
                  ? <img src={event.banner_url} alt="" className="w-full h-full object-cover" />
                  : "📅"
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-400">
                  {(event.organizer as any)?.full_name} · {formatDate(event.created_at, "d MMM yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-500">{event.current_participants} peserta</span>
                <span className={`badge text-xs ${
                  event.status === "published" ? "bg-green-100 text-green-700" :
                  event.status === "draft" ? "bg-gray-100 text-gray-600" :
                  event.status === "completed" ? "bg-purple-100 text-purple-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}