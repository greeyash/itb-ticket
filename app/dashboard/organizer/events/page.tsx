// PATH: app/dashboard/organizer/events/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Eye, Edit, Users, BarChart2, ToggleRight, Trash2 } from "lucide-react";
import { formatDate, formatCurrency, getEventStatusColor, getCategoryIcon } from "@/lib/utils";
import { PublishToggle } from "@/components/dashboard/publishtoggle";

export const metadata = { title: "Event Saya" };

export default async function OrganizerEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single() as any;

  const { data: events } = await supabase
  .from("events")
  .select("*")
  .eq("organizer_id", user.id)
  .order("created_at", { ascending: false }) as any;

  const stats = {
    total: events?.length || 0,
    published: events?.filter((e : any) => e.status === "published").length || 0,
    draft: events?.filter((e : any) => e.status === "draft").length || 0,
    completed: events?.filter((e : any) => e.status === "completed").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Event Saya</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kelola semua event yang kamu buat</p>
        </div>
        <Link href="/dashboard/organizer/create" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Buat Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900" },
          { label: "Dipublikasikan", value: stats.published, color: "text-green-600" },
          { label: "Draft", value: stats.draft, color: "text-amber-600" },
          { label: "Selesai", value: stats.completed, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Events table */}
      {!events || events.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">📅</p>
          <h3 className="font-display font-semibold text-gray-900 mb-2">Belum ada event</h3>
          <p className="text-gray-500 text-sm mb-6">Buat event pertamamu sekarang</p>
          <Link href="/dashboard/organizer/create" className="btn-primary inline-flex items-center gap-2">
            <Plus size={16} /> Buat Event Pertama
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Peserta</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event : any) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-saltywater/50 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                          {event.banner_url
                            ? <img src={event.banner_url} alt="" className="w-full h-full object-cover" />
                            : getCategoryIcon(event.category)
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm line-clamp-1">{event.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{event.view_count} views</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">{formatDate(event.start_date, "d MMM yyyy")}</p>
                      <p className="text-xs text-gray-400">{formatDate(event.start_date, "HH:mm")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {event.current_participants}
                          {event.max_participants ? `/${event.max_participants}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {event.price > 0 ? formatCurrency(event.price) : <span className="text-green-600">Gratis</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${getEventStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/events/${event.slug}`} title="Preview"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                          <Eye size={15} />
                        </Link>
                        <Link href={`/dashboard/organizer/events/${event.id}/edit`} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-ocean/10 text-ocean transition-colors">
                          <Edit size={15} />
                        </Link>
                        <Link href={`/dashboard/organizer/attendees?event=${event.id}`} title="Peserta"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                          <Users size={15} />
                        </Link>
                        <PublishToggle eventId={event.id} currentStatus={event.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}