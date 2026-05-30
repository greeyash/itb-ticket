"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Upload, Plus, Info } from "lucide-react";
import { generateSlug } from "@/lib/utils";

const eventSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  short_description: z.string().max(500).optional(),
  description: z.string().min(50, "Deskripsi minimal 50 karakter"),
  category: z.enum(["seminar", "workshop", "competition", "volunteer", "cultural", "sports", "academic", "other"]),
  start_date: z.string().min(1, "Wajib diisi"),
  end_date: z.string().min(1, "Wajib diisi"),
  registration_deadline: z.string().min(1, "Wajib diisi"),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  is_online: z.boolean().default(false),
  online_link: z.string().url().optional().or(z.literal("")),
  max_participants: z.preprocess(
  (val) => (val === "" || val === null || isNaN(Number(val)) ? undefined : Number(val)),
  z.number().min(1).optional()
  ),
  price: z.number().min(0).default(0),
  payment_method: z.enum(["qris", "bank_transfer", "free"]).default("free"),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_account_name: z.string().optional(),
  has_certificate: z.boolean().default(false),
  participation_points: z.number().min(1).max(500).default(10),
  tags: z.string().optional(),
});

type EventForm = z.infer<typeof eventSchema>;

const STEPS = [
  { id: 1, label: "Info Dasar" },
  { id: 2, label: "Jadwal & Lokasi" },
  { id: 3, label: "Tiket & Pembayaran" },
  { id: 4, label: "Pengaturan" },
];

export default function CreateEventPage() {
  const [step, setStep] = useState(1);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      price: 0,
      payment_method: "free",
      participation_points: 10,
      is_online: false,
      has_certificate: false,
    },
  });

  const isOnline = watch("is_online");
  const price = watch("price");
  const paymentMethod = watch("payment_method");

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran maksimal 5MB"); return; }
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sesi habis, silakan login ulang"); return; }

      let banner_url: string | null = null;

      // Upload banner
      if (bannerFile) {
        const ext = bannerFile.name.split(".").pop();
        const path = `events/${user.id}/${Date.now()}.${ext}`;
        const { data: uploaded, error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(path, bannerFile, { upsert: true });
        if (!uploadError && uploaded) {
          const { data: { publicUrl } } = supabase.storage.from("event-banners").getPublicUrl(path);
          banner_url = publicUrl;
        }
      }

      const slug = generateSlug(data.title);
      const tags = data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

      const { data: event, error } = await supabase.from("events").insert({
        organizer_id: user.id,
        title: data.title,
        slug,
        description: data.description,
        short_description: data.short_description || null,
        category: data.category,
        status: "draft",
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        registration_deadline: new Date(data.registration_deadline).toISOString(),
        location_name: data.is_online ? null : data.location_name,
        location_address: data.is_online ? null : data.location_address,
        is_online: data.is_online,
        online_link: data.is_online ? data.online_link || null : null,
        max_participants: data.max_participants || null,
        price: data.price,
        payment_method: data.price > 0 ? data.payment_method : "free",
        bank_name: data.bank_name || null,
        bank_account: data.bank_account || null,
        bank_account_name: data.bank_account_name || null,
        has_certificate: data.has_certificate,
        participation_points: data.participation_points,
        banner_url,
        tags,
      }).select().single();

      if (error) { toast.error("Gagal membuat event: " + error.message); return; }

      toast.success("Event berhasil dibuat sebagai Draft!");
      router.push(`/dashboard/organizer/events`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Buat Event Baru</h1>
        <p className="text-gray-500 text-sm">Isi detail event yang akan kamu selenggarakan</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 ${step >= s.id ? "text-ocean" : "text-gray-400"}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.id ? "bg-ocean text-white" :
                step === s.id ? "bg-ocean text-white ring-4 ring-ocean/20" :
                "bg-gray-200 text-gray-500"
              }`}>
                {step > s.id ? "✓" : s.id}
              </span>
              <span className="hidden sm:block text-sm font-medium">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > s.id ? "bg-ocean" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

          <form onSubmit={handleSubmit(onSubmit, (errors) => {
      console.log("Validation errors:", errors);
      toast.error("Ada field yang belum diisi dengan benar");
    })}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display font-semibold text-gray-900">Informasi Dasar</h2>

            {/* Banner upload */}
            <div>
              <label className="label">Banner Event</label>
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-2xl overflow-hidden transition-colors ${
                  bannerPreview ? "border-ocean/30" : "border-gray-200 hover:border-ocean/30"
                }`}>
                  {bannerPreview ? (
                    <div className="relative h-48">
                      <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Ganti Banner</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Upload size={32} className="opacity-40" />
                      <p className="text-sm">Upload banner (maks. 5MB)</p>
                      <p className="text-xs">JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
              </label>
            </div>

            <div>
              <label className="label">Judul Event <span className="text-red-500">*</span></label>
              <input {...register("title")} placeholder="Contoh: Seminar AI & Machine Learning 2025" className="input" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Kategori <span className="text-red-500">*</span></label>
              <select {...register("category")} className="input">
                <option value="">Pilih kategori...</option>
                {[
                  { value: "seminar", label: "🎤 Seminar" },
                  { value: "workshop", label: "🔧 Workshop" },
                  { value: "competition", label: "🏆 Lomba" },
                  { value: "volunteer", label: "🤝 Volunteer" },
                  { value: "cultural", label: "🎭 Budaya" },
                  { value: "sports", label: "⚽ Olahraga" },
                  { value: "academic", label: "📚 Akademik" },
                  { value: "other", label: "🎪 Lainnya" },
                ].map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="label">Deskripsi Singkat</label>
              <textarea {...register("short_description")} rows={2} placeholder="Deskripsi singkat untuk preview (maks. 500 karakter)" className="input resize-none" />
            </div>

            <div>
              <label className="label">Deskripsi Lengkap <span className="text-red-500">*</span></label>
              <textarea {...register("description")} rows={6} placeholder="Jelaskan detail event, tujuan, pembicara, rundown, dll." className="input resize-none" />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="label">Tags (pisahkan dengan koma)</label>
              <input {...register("tags")} placeholder="HMIF, AI, Machine Learning, Workshop" className="input" />
            </div>

            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3">
              Lanjut →
            </button>
          </div>
        )}

        {/* Step 2: Schedule & Location */}
        {step === 2 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display font-semibold text-gray-900">Jadwal & Lokasi</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Tanggal Mulai <span className="text-red-500">*</span></label>
                <input {...register("start_date")} type="datetime-local" className="input" />
                {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="label">Tanggal Selesai <span className="text-red-500">*</span></label>
                <input {...register("end_date")} type="datetime-local" className="input" />
                {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Deadline Registrasi <span className="text-red-500">*</span></label>
              <input {...register("registration_deadline")} type="datetime-local" className="input" />
              {errors.registration_deadline && <p className="text-red-500 text-xs mt-1">{errors.registration_deadline.message}</p>}
            </div>

            <div>
              <label className="label">Tipe Lokasi</label>
              <div className="flex gap-3">
                {[
                  { value: false, label: "🏢 Offline" },
                  { value: true, label: "💻 Online" },
                ].map((opt) => (
                  <label key={String(opt.value)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer flex-1 justify-center transition-all ${
                    isOnline === opt.value ? "border-ocean bg-ocean/5 text-ocean font-medium" : "border-gray-200 text-gray-600"
                  }`}>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={isOnline === opt.value}
                      onChange={() => setValue("is_online", opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {isOnline ? (
              <div>
                <label className="label">Link Online (Zoom/Meet/dll.)</label>
                <input {...register("online_link")} type="url" placeholder="https://zoom.us/j/..." className="input" />
              </div>
            ) : (
              <>
                <div>
                  <label className="label">Nama Tempat</label>
                  <input {...register("location_name")} placeholder="Aula Barat ITB, GKU Timur, dst." className="input" />
                </div>
                <div>
                  <label className="label">Alamat Lengkap</label>
                  <textarea {...register("location_address")} rows={2} placeholder="Jl. Ganesha No. 10, Bandung..." className="input resize-none" />
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 py-3">
                ← Kembali
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 py-3">
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Tickets & Payment */}
        {step === 3 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display font-semibold text-gray-900">Tiket & Pembayaran</h2>

            <div>
              <label className="label">Maksimal Peserta</label>
              <input
                {...register("max_participants")}
                type="number" min={1} placeholder="Kosongkan jika tidak terbatas"
                className="input"
              />
            </div>

            <div>
              <label className="label">Harga Tiket (Rp)</label>
              <input
                {...register("price", { valueAsNumber: true })}
                type="number" min={0} step={1000} placeholder="0 = Gratis"
                className="input"
              />
            </div>

            {price > 0 && (
              <>
                <div>
                  <label className="label">Metode Pembayaran</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "qris", label: "📱 QRIS" },
                      { value: "bank_transfer", label: "🏦 Transfer Bank" },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === opt.value ? "border-ocean bg-ocean/5 text-ocean font-medium" : "border-gray-200 text-gray-600"
                      }`}>
                        <input {...register("payment_method")} type="radio" value={opt.value} className="sr-only" />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {paymentMethod === "bank_transfer" && (
                  <div className="space-y-3 p-4 bg-saltywater/30 rounded-xl">
                    <div>
                      <label className="label">Nama Bank</label>
                      <input {...register("bank_name")} placeholder="BCA, Mandiri, BNI, dll." className="input" />
                    </div>
                    <div>
                      <label className="label">Nomor Rekening</label>
                      <input {...register("bank_account")} placeholder="1234567890" className="input font-mono" />
                    </div>
                    <div>
                      <label className="label">Nama Pemilik Rekening</label>
                      <input {...register("bank_account_name")} placeholder="Nama sesuai rekening" className="input" />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1 py-3">← Kembali</button>
              <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1 py-3">Lanjut →</button>
            </div>
          </div>
        )}

        {/* Step 4: Settings */}
        {step === 4 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display font-semibold text-gray-900">Pengaturan Tambahan</h2>

            <div>
              <label className="label">Poin Partisipasi</label>
              <div className="flex items-center gap-3">
                <input
                  {...register("participation_points", { valueAsNumber: true })}
                  type="number" min={1} max={500}
                  className="input"
                />
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-butter/30 px-3 py-2 rounded-lg whitespace-nowrap">
                  <Info size={12} /> Poin untuk peserta yang hadir
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 text-sm">Terbitkan Sertifikat</p>
                <p className="text-xs text-gray-500">Peserta yang hadir otomatis mendapat sertifikat digital</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register("has_certificate")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean" />
              </label>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                <Info size={14} /> Event akan disimpan sebagai Draft
              </p>
              <p className="text-amber-700 text-xs mt-1">
                Kamu bisa review dan publish kapan saja dari halaman event.
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className="btn-outline flex-1 py-3">← Kembali</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                ) : "✓ Simpan Event"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}