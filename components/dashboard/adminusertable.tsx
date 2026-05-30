// PATH: components/dashboard/AdminUserTable.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Shield, ShieldCheck, UserX, ChevronDown } from "lucide-react";
import { formatDate, getRoleLabel, getRoleBadgeColor } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Profile = Tables<"profiles">;

interface Props {
  users: Profile[];
}

export function AdminUserTable({ users }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const changeRole = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole as any }).eq("id", userId);
      if (error) { toast.error("Gagal mengubah role"); return; }
      toast.success(`Role diubah menjadi ${getRoleLabel(newRole)}`);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const toggleVerify = async (userId: string, current: boolean) => {
    setLoadingId(userId);
    try {
      const { error } = await supabase.from("profiles").update({ is_verified: !current }).eq("id", userId);
      if (error) { toast.error("Gagal"); return; }
      toast.success(current ? "Verifikasi dicabut" : "Pengguna diverifikasi!");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-gray-500 text-sm">Tidak ada pengguna ditemukan</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengguna</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIM</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Poin</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bergabung</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Verifikasi</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const isLoading = loadingId === u.id;
              return (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-mono text-gray-700">{u.nim || "—"}</p>
                    <p className="text-xs text-gray-400">{u.faculty}</p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={isLoading}
                      className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 cursor-pointer ${getRoleBadgeColor(u.role)}`}
                    >
                      <option value="participant">Peserta</option>
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-copper">⚡ {u.points}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-gray-500">{formatDate(u.created_at ?? "", "d MMM yyyy")}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleVerify(u.id, u.is_verified ?? false)}
                      disabled={isLoading}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        u.is_verified
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {u.is_verified ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {u.is_verified ? "Verified" : "Unverified"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        if (confirm(`Nonaktifkan akun ${u.full_name}?`)) {
                          supabase.from("profiles").update({ is_verified: false }).eq("id", u.id).then(() => {
                            toast.success("Akun dinonaktifkan");
                            router.refresh();
                          });
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Nonaktifkan"
                    >
                      <UserX size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}