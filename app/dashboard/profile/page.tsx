// PATH: app/dashboard/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Camera, Save, User, Mail, Phone, BookOpen, Hash } from "lucide-react";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;
import { getRoleLabel, getRoleBadgeColor } from "@/lib/utils";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nama minimal 3 karakter"),
  phone: z.string().optional(),
  faculty: z.string().optional(),
  major: z.string().optional(),
  year_of_entry: z.number().min(2000).max(2030).optional().nullable(),
  bio: z.string().max(300).optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const FACULTIES = ["FITB","FMIPA","FSRD","FTI","FTMD","FTTM","FTSL","SAPPK","SBM","SF","SITH","STEI"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });
  const bioValue = watch("bio") || "";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        setAvatarPreview(data.avatar_url);
        reset({ full_name: data.full_name, phone: data.phone || "", faculty: data.faculty || "", major: data.major || "", year_of_entry: data.year_of_entry || null, bio: data.bio || "" });
      }
    })();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Ukuran maksimal 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${profile.id}.${ext}`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      setAvatarPreview(publicUrl);
      toast.success("Foto profil diperbarui!");
    } finally { setUploading(false); }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: data.full_name, phone: data.phone || null,
        faculty: data.faculty || null, major: data.major || null,
        year_of_entry: data.year_of_entry || null, bio: data.bio || null,
      }).eq("id", profile.id);
      if (error) { toast.error("Gagal: " + error.message); return; }
      toast.success("Profil diperbarui!");
      router.refresh();
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast.error("Password minimal 8 karakter"); return; }
    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message); return; }
      toast.success("Password berhasil diubah!"); setNewPassword("");
    } finally { setChangingPass(false); }
  };

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 text-sm mt-0.5">Kelola informasi akun dan profil kamu</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-ocean to-nebula flex items-center justify-center">
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-white font-display font-bold text-3xl">{profile.full_name.charAt(0)}</span>
              }
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-ocean rounded-full flex items-center justify-center cursor-pointer hover:bg-ocean-light transition-colors shadow-ocean-sm">
              {uploading
                ? <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                : <Camera size={13} className="text-white" />
              }
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-gray-900 text-lg">{profile.full_name}</h2>
            <p className="text-gray-500 text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`badge text-xs ${getRoleBadgeColor(profile.role)}`}>{getRoleLabel(profile.role)}</span>
              {profile.is_verified && <span className="badge bg-green-100 text-green-700 text-xs border border-green-200">✓ Terverifikasi</span>}
              <span className="badge bg-butter/40 text-copper text-xs">⚡ {profile.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">Informasi Pribadi</h3>

        <div>
          <label className="label">Nama Lengkap <span className="text-red-500">*</span></label>
          <div className="relative">
            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input {...register("full_name")} className="input pl-10" placeholder="Nama lengkap" />
          </div>
          {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
        </div>

        <div>
          <label className="label">NIM</label>
          <div className="relative">
            <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={profile.nim || ""} disabled className="input pl-10 bg-gray-50 text-gray-400 cursor-not-allowed" placeholder="NIM tidak dapat diubah" />
          </div>
          <p className="text-xs text-gray-400 mt-1">NIM dikunci oleh sistem</p>
        </div>

        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={profile.email} disabled className="input pl-10 bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="label">Nomor HP</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input {...register("phone")} className="input pl-10" placeholder="+62 8xx xxxx xxxx" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fakultas</label>
            <select {...register("faculty")} className="input">
              <option value="">Pilih...</option>
              {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Angkatan</label>
            <input {...register("year_of_entry", { valueAsNumber: true })} type="number" min={2000} max={2030} placeholder="2023" className="input" />
          </div>
        </div>

        <div>
          <label className="label">Program Studi</label>
          <div className="relative">
            <BookOpen size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input {...register("major")} className="input pl-10" placeholder="Teknik Informatika" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Bio</label>
            <span className="text-xs text-gray-400">{bioValue.length}/300</span>
          </div>
          <textarea {...register("bio")} rows={3} placeholder="Ceritakan sedikit tentang dirimu..." className="input resize-none" />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </div>

        <button type="submit" disabled={loading || !isDirty}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
            : <><Save size={16} /> Simpan Perubahan</>}
        </button>
      </form>

      {/* Change password */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ubah Password</h3>
        <div className="flex gap-3">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password baru (min. 8 karakter)" className="input flex-1" />
          <button onClick={handleChangePassword} disabled={changingPass || newPassword.length < 8}
            className="btn-outline px-5 disabled:opacity-50">
            {changingPass ? "..." : "Ubah"}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border border-red-100">
        <h3 className="font-semibold text-red-700 mb-2">Zona Berbahaya</h3>
        <p className="text-sm text-gray-500 mb-4">Tindakan ini tidak dapat dibatalkan</p>
        <button onClick={() => toast.error("Hubungi admin untuk menghapus akun.")}
          className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
          Hapus Akun
        </button>
      </div>
    </div>
  );
}