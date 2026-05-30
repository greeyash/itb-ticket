"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, Mail, User, BookOpen, ArrowLeft } from "lucide-react";

const registerSchema = z.object({
  full_name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  nim: z.string().min(8, "NIM tidak valid").optional().or(z.literal("")),
  faculty: z.string().min(1, "Pilih fakultas"),
  role: z.enum(["participant", "organizer"]),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, {
  message: "Password tidak cocok",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const FACULTIES = [
  "FITB", "FMIPA", "FSRD", "FTI", "FTMD", "FTTM", "FTSL", "SAPPK",
  "SBM", "SF", "SITH", "STEI",
];

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "participant" },
  });

  const role = watch("role");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      });
      console.log("authData:", authData);
      console.log("error:", error);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email sudah terdaftar. Coba masuk.");
        } else {
          toast.error(error.message);
        }
        return;
      }

          if (authData.user) {
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      toast.success("Akun berhasil dibuat!");
      router.push("/dashboard");
      router.refresh();
    }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-copper via-copper-dark to-ocean flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-butter/15 blur-3xl" />
        <div className="absolute bottom-20 left-5 w-72 h-72 rounded-full bg-nebula/10 blur-3xl" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-butter/20 border border-butter/30 flex items-center justify-center">
            <span className="text-butter font-display font-bold text-sm">I</span>
          </div>
          <span className="font-display font-bold text-xl text-white">ITB <span className="text-butter">Ticket</span></span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
            Bergabung dengan<br />
            <span className="text-butter italic">Komunitas</span> Aktif
          </h2>
          <p className="text-white/60 text-sm mb-6">
            Ribuan mahasiswa ITB sudah memanfaatkan platform ini untuk memperluas jaringan dan mengembangkan diri.
          </p>

          {/* Role cards */}
          <div className="space-y-3">
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-butter font-semibold text-sm mb-1">👤 Peserta</p>
              <p className="text-white/60 text-xs">Browse event, daftar, tiket digital, kumpulkan poin & badge</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-butter font-semibold text-sm mb-1">🎪 Organizer</p>
              <p className="text-white/60 text-xs">Buat event, kelola peserta, scan tiket, terbitkan sertifikat</p>
            </div>
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">
          Institut Teknologi Bandung © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-ocean text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> Kembali
          </Link>

          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Buat Akun Baru</h1>
            <p className="text-gray-500 text-sm">
              Sudah punya akun?{" "}
              <Link href="/auth/login" className="text-ocean font-medium hover:underline">Masuk</Link>
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: "participant", label: "Peserta", icon: "👤", desc: "Ikuti event" },
              { value: "organizer", label: "Organizer", icon: "🎪", desc: "Buat event" },
            ].map((r) => (
              <label
                key={r.value}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  role === r.value
                    ? "border-ocean bg-ocean/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input {...register("role")} type="radio" value={r.value} className="sr-only" />
                <span className="text-2xl">{r.icon}</span>
                <span className={`text-sm font-semibold ${role === r.value ? "text-ocean" : "text-gray-700"}`}>{r.label}</span>
                <span className="text-xs text-gray-400">{r.desc}</span>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nama Lengkap</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register("full_name")} placeholder="Nama sesuai KTM" className="input pl-10" />
              </div>
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">NIM (Opsional)</label>
                <input {...register("nim")} placeholder="135XXXXX" className="input" />
                {errors.nim && <p className="text-red-500 text-xs mt-1">{errors.nim.message}</p>}
              </div>
              <div>
                <label className="label">Fakultas</label>
                <select {...register("faculty")} className="input">
                  <option value="">Pilih...</option>
                  {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                {errors.faculty && <p className="text-red-500 text-xs mt-1">{errors.faculty.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register("email")} type="email" placeholder="" className="input pl-10" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register("password")} type={showPass ? "text" : "password"} placeholder="Min. 8 karakter" className="input pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register("confirm_password")} type={showPass ? "text" : "password"} placeholder="Ulangi password" className="input pl-10" />
              </div>
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base justify-center flex items-center gap-2 mt-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Membuat akun...</>
              ) : "Buat Akun"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Dengan mendaftar, kamu menyetujui{" "}
            <Link href="/terms" className="underline">Syarat & Ketentuan</Link> platform.
          </p>
        </div>
      </div>
    </div>
  );
}