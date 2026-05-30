// PATH: app/dashboard/admin/users/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminUserTable } from "@/components/dashboard/adminusertable";

export const metadata = { title: "Kelola Pengguna" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { search?: string; role?: string; verified?: string; page?: string };
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any;

  const page = parseInt(sp.page || "1");
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase.from("profiles").select("*", { count: "exact" });

  if (sp.search) query = query.or(`full_name.ilike.%${sp.search}%,email.ilike.%${sp.search}%,nim.ilike.%${sp.search}%`);
  if (sp.role) query = query.eq("role", sp.role);
  if (sp.verified === "false") query = query.eq("is_verified", false);
  if (sp.verified === "true") query = query.eq("is_verified", true);

  const { data: users, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
        <p className="text-gray-500 text-sm mt-0.5">{count || 0} pengguna terdaftar</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-3" method="GET">
          <input
            name="search"
            defaultValue={sp.search}
            placeholder="Cari nama, email, NIM..."
            className="input flex-1 min-w-48"
          />
          <select name="role" defaultValue={sp.role || ""} className="input w-40">
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="organizer">Organizer</option>
            <option value="participant">Peserta</option>
          </select>
          <select name="verified" defaultValue={sp.verified || ""} className="input w-44">
            <option value="">Semua Status</option>
            <option value="true">Terverifikasi</option>
            <option value="false">Belum Verifikasi</option>
          </select>
          <button type="submit" className="btn-primary px-6">Filter</button>
        </form>
      </div>

      <AdminUserTable users={users || []} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <a
                key={p}
                href={`/dashboard/admin/users?${new URLSearchParams({ ...sp, page: String(p) }).toString()}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  p === page ? "bg-ocean text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {p}
              </a>
            ))}
        </div>
      )}
    </div>
  );
}