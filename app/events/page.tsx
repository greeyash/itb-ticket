import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EventCard } from "@/components/events/eventcard";
import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { EventWithOrganizer } from "@/types/relations";

const CATEGORIES = [
  { value: "", label: "Semua" },
  { value: "seminar", label: "Seminar" },
  { value: "workshop", label: "Workshop" },
  { value: "competition", label: "Lomba" },
  { value: "volunteer", label: "Volunteer" },
  { value: "cultural", label: "Budaya" },
  { value: "sports", label: "Olahraga" },
  { value: "academic", label: "Akademik" },
  { value: "other", label: "Lainnya" },
];

export const metadata = { title: "Jelajahi Event" };

interface SearchParams {
  search?: string;
  category?: string;
  page?: string;
  sort?: string;
  featured?: string;
  type?: string;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const sp = await searchParams;

  const page = parseInt(sp.page || "1");
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(full_name, faculty)", { count: "exact" })
    .eq("status", "published");

  if (sp.search) {
    query = query.ilike("title", `%${sp.search}%`);
  }
  if (sp.category) {
    query = query.eq("category", sp.category);
  }
  if (sp.featured === "true") {
    query = query.eq("is_featured", true);
  }
  if (sp.type === "free") {
    query = query.eq("price", 0);
  }
  if (sp.type === "online") {
    query = query.eq("is_online", true);
  }

  const sort = sp.sort || "start_date";
  if (sort === "popular") {
    query = query.order("current_participants", { ascending: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("start_date", { ascending: true });
  }

  query = query.range(from, to);

  const { data, count } = await query;

  const events = (data ?? []) as EventWithOrganizer[];
  const totalPages = Math.ceil((count || 0) / perPage);

  const buildUrl = (params: Record<string, string>) => {
    const current = new URLSearchParams();
    if (sp.search) current.set("search", sp.search);
    if (sp.category) current.set("category", sp.category);
    if (sp.sort) current.set("sort", sp.sort);
    if (sp.type) current.set("type", sp.type);
    Object.entries(params).forEach(([k, v]) => {
      if (v) current.set(k, v);
      else current.delete(k);
    });
    return `/events?${current.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="pt-24 pb-8 bg-ocean-pattern">
        <div className="page-container">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">
            Jelajahi Event Kampus
          </h1>
          <p className="text-nebula/70">
            {count || 0} event tersedia untuk kamu
          </p>

          {/* Search */}
          <form className="mt-6 flex gap-3 max-w-2xl" method="GET" action="/events">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="search"
                defaultValue={sp.search}
                placeholder="Cari nama event, kategori..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-butter/50 shadow-md"
              />
            </div>
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
            <button type="submit" className="btn-secondary px-6 py-3 rounded-xl">Cari</button>
          </form>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="card p-5 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <SlidersHorizontal size={14} /> Filter
              </h3>

              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Kategori</p>
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.value}
                      href={buildUrl({ category: cat.value, page: "1" })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        sp.category === cat.value || (!sp.category && !cat.value)
                          ? "bg-ocean text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Tipe</p>
                <div className="space-y-1">
                  {[
                    { value: "", label: "Semua" },
                    { value: "free", label: "Gratis" },
                    { value: "online", label: "Online" },
                  ].map((t) => (
                    <Link
                      key={t.value}
                      href={buildUrl({ type: t.value, page: "1" })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        sp.type === t.value || (!sp.type && !t.value)
                          ? "bg-ocean text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {t.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Urutkan</p>
                <div className="space-y-1">
                  {[
                    { value: "start_date", label: "Terbaru" },
                    { value: "popular", label: "Terpopuler" },
                    { value: "newest", label: "Baru Ditambah" },
                  ].map((s) => (
                    <Link
                      key={s.value}
                      href={buildUrl({ sort: s.value, page: "1" })}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        sp.sort === s.value || (!sp.sort && s.value === "start_date")
                          ? "bg-ocean text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Events grid */}
          <div className="flex-1">
            {!events || events.length === 0 ? (
              <div className="card p-16 text-center">
                <p className="text-5xl mb-4">🔍</p>
                <h3 className="font-display font-semibold text-gray-900 mb-2">Tidak ada event</h3>
                <p className="text-gray-500 text-sm">Coba ubah filter atau kata kunci pencarian</p>
                <Link href="/events" className="btn-outline mt-6 inline-block">Reset Filter</Link>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link href={buildUrl({ page: String(page - 1) })} className="btn-outline px-4 py-2 text-sm">
                        ← Sebelumnya
                      </Link>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - page) <= 2)
                      .map((p) => (
                        <Link
                          key={p}
                          href={buildUrl({ page: String(p) })}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-ocean text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {p}
                        </Link>
                      ))}
                    {page < totalPages && (
                      <Link href={buildUrl({ page: String(page + 1) })} className="btn-outline px-4 py-2 text-sm">
                        Berikutnya →
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}