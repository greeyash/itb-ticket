// PATH: app/dashboard/organizer/events/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const editSchema = z.object({
  title: z.string().min(5, "Minimal 5 karakter"),
  short_description: z.string().max(500).optional(),
  description: z.string().min(50, "Minimal 50 karakter"),
  category: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  registration_deadline: z.string(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  is_online: z.boolean().default(false),
  online_link: z.string().optional(),
  max_participants: z.number().optional().nullable(),
  price: z.number().min(0).default(0),
  payment_method: z.string().default("free"),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_account_name: z.string().optional(),
  has_certificate: z.boolean().default(false),
  participation_points: z.number().min(1).max(500).default(10),
  tags: z.string().optional(),
  status: z.string(),
});

type EditForm = z.infer<typeof editSchema>;

const FACULTIES = ["seminar","workshop","competition","volunteer","cultural","sports","academic","other"];

export default function EditEventPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });

  const isOnline = watch("is_online");
  const price = watch("price");
  const paymentMethod = watch("payment_method");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data, error } = await supabase
        .from("events").select("*").eq("id", params.id).single();

      if (error || !data) { toast.error("Event tidak ditemukan"); router.push("/dashboard/organizer/events"); return; }
      if (data.organizer_id !== user.id) {
        const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (me?.role !== "admin") { toast.error("Akses ditolak"); router.push("/dashboard/organizer/events"); return; }
      }

      setEvent(data);
      reset({
        title: data.title,
        short_description: data.short_description || "",
        description: data.description,
        category: data.category,
        start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : "",
        end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
        registration_deadline: data.registration_deadline ? new Date(data.registration_deadline).toISOString().slice(0, 16) : "",
        location_name: data.location_name || "",
        location_address: data.location_address || "",
        is_online: data.is_online,
        online_link: data.online_link || "",
        max_participants: data.max_participants || null,
        price: data.price,
        payment_method: data.payment_method,
        bank_name: data.bank_name || "",
        bank_account: data.bank_account || "",
        bank_account_name: data.bank_account_name || "",
        has_certificate: data.has_certificate,
        participation_points: data.participation_points,
        tags: data.tags?.join(", ") || "",
        status: data.status,
      });
      setLoading(false);
    };
    load();
  }, [params.id]);

  const onSubmit = async (data: EditForm) => {
    setSaving(true);
    try {
      const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from("events").update({
        title: data.title,
        short_description: data.short_description || null,
        description: data.description,
        category: data.category as any,
        status: data.status as any,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        registration_deadline: new Date(data.registration_deadline).toISOString(),
        location_name: data.is_online ? null : data.location_name || null,
        location_address: data.is_online ? null : data.location_address || null,
        is_online: data.is_online,
        online_link: data.is_online ? data.online_link || null : null,
        max_participants: data.max_participants || null,
        price: data.price,
        payment_method: data.price > 0 ? data.payment_method as any : "free",
        bank_name: data.bank_name || null,
        bank_account: data.bank_account || null,
        bank_account_name: data.bank_account_name || null,
        has_certificate: data.has_certificate,
        participation_points: data.participation_points,
        tags,
      }).eq("id", params.id as string);

      if (error) { toast.error("Gagal menyimpan: " + error.message); return; }
      toast.success("Event berhasil diperbarui!");
      router.push("/dashboard/organizer/events");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Hapus event "${event?.title}"? Ini tidak dapat dibatalkan.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", params.id as string);
    if (error) { toast.error("Gagal menghapus"); return; }
    toast.success("Event dihapus");
    router.push("/dashboard/organizer/events");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/organizer/events" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-500 text-sm mt-0.5 truncate max-w-xs">{event?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/events/${event?.slug}`} target="_blank"
            className="btn-ghost flex items-center gap-2 text-sm">
            <Eye size={15} /> Preview
          </Link>
          <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors" title="Hapus event">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Informasi Dasar</h3>

          {event?.banner_url && (
            <div className="relative h-40 rounded-xl overflow-hidden bg-gray-100">
              <img src={event.banner_url} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-end p-3">
                <span className="text-white text-xs bg-black/40 px-2 py-1 rounded-lg">Banner (tidak bisa diubah di sini)</span>
              </div>
            </div>
          )}

          <div>
            <label className="label">Judul Event <span className="text-red-500">*</span></label>
            <input {...register("title")} className="input" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Status</label>
            <select {...register("status")} className="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label">Kategori</label>
            <select {...register("category")} className="input">
              {["seminar","workshop","competition","volunteer","cultural","sports","academic","other"]
                .map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Deskripsi Singkat</label>
            <textarea {...register("short_description")} rows={2} className="input resize-none" />
          </div>

          <div>
            <label className="label">Deskripsi Lengkap <span className="text-red-500">*</span></label>
            <textarea {...register("description")} rows={6} className="input resize-none" />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Tags (pisahkan koma)</label>
            <input {...register("tags")} placeholder="HMIF, AI, Workshop" className="input" />
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Jadwal & Lokasi</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Mulai</label>
              <input {...register("start_date")} type="datetime-local" className="input" />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input {...register("end_date")} type="datetime-local" className="input" />
            </div>
          </div>
          <div>
            <label className="label">Deadline Registrasi</label>
            <input {...register("registration_deadline")} type="datetime-local" className="input" />
          </div>
          <div className="flex gap-3">
            {[{value: false, label: "🏢 Offline"}, {value: true, label: "💻 Online"}].map((opt) => (
              <label key={String(opt.value)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer flex-1 justify-center transition-all ${
                isOnline === opt.value ? "border-ocean bg-ocean/5 text-ocean font-medium" : "border-gray-200 text-gray-600"
              }`}>
                <input type="radio" className="sr-only" checked={isOnline === opt.value} onChange={() => setValue("is_online", opt.value)} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
          {isOnline ? (
            <div>
              <label className="label">Link Online</label>
              <input {...register("online_link")} type="url" placeholder="https://zoom.us/j/..." className="input" />
            </div>
          ) : (
            <>
              <div>
                <label className="label">Nama Tempat</label>
                <input {...register("location_name")} className="input" />
              </div>
              <div>
                <label className="label">Alamat</label>
                <textarea {...register("location_address")} rows={2} className="input resize-none" />
              </div>
            </>
          )}
        </div>

        {/* Tickets */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Tiket & Pembayaran</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Maksimal Peserta</label>
              <input {...register("max_participants", { valueAsNumber: true })} type="number" min={1} className="input" placeholder="Tak terbatas" />
            </div>
            <div>
              <label className="label">Harga (Rp)</label>
              <input {...register("price", { valueAsNumber: true })} type="number" min={0} step={1000} className="input" />
            </div>
          </div>
          {price > 0 && (
            <>
              <div>
                <label className="label">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{value:"qris",label:"📱 QRIS"},{value:"bank_transfer",label:"🏦 Transfer Bank"}].map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === opt.value ? "border-ocean bg-ocean/5 text-ocean font-medium" : "border-gray-200 text-gray-600"}`}>
                      <input {...register("payment_method")} type="radio" value={opt.value} className="sr-only" />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              {paymentMethod === "bank_transfer" && (
                <div className="space-y-3 p-4 bg-saltywater/30 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nama Bank</label>
                      <input {...register("bank_name")} placeholder="BCA" className="input" />
                    </div>
                    <div>
                      <label className="label">No. Rekening</label>
                      <input {...register("bank_account")} className="input font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="label">A/N Rekening</label>
                    <input {...register("bank_account_name")} className="input" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Settings */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-gray-900">Pengaturan</h3>
          <div>
            <label className="label">Poin Partisipasi</label>
            <input {...register("participation_points", { valueAsNumber: true })} type="number" min={1} max={500} className="input" />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 text-sm">Terbitkan Sertifikat</p>
              <p className="text-xs text-gray-500">Peserta hadir otomatis dapat sertifikat digital</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register("has_certificate")} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean" />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/organizer/events" className="btn-outline flex-1 py-3 text-center">
            Batal
          </Link>
          <button type="submit" disabled={saving || !isDirty}
            className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
              : <><Save size={16} /> Simpan Perubahan</>}
          </button>
        </div>
      </form>
    </div>
  );
}
