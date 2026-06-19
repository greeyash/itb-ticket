"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Cek apakah ada session dari link reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true);
      } else {
        toast.error("Link reset tidak valid atau sudah kadaluarsa");
        router.push("/auth/forgot-password");
      }
    });
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setDone(true);
      toast.success("Password berhasil diubah!");
      setTimeout(() => router.push("/dashboard"), 2000);
    } finally {
      setLoading(false);
    }
  };

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-ocean/30 border-t-ocean rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-ocean-pattern flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-butter/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-nebula/10 blur-3xl" />

        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-butter/20 border border-butter/30 flex items-center justify-center">
            <span className="text-butter font-display font-bold text-sm">I</span>
          </div>
          <span className="font-display font-bold text-xl text-white">
            ITB <span className="text-butter">Ticket</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            Buat Password<br />
            <span className="text-butter italic">Baru</span>
          </h2>
          <p className="text-nebula/70 text-base leading-relaxed">
            Pastikan password baru kamu kuat dan mudah diingat.
          </p>
        </div>

        <p className="text-nebula/30 text-xs relative z-10">
          Institut Teknologi Bandung © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
                Password Berhasil Diubah!
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Kamu akan diarahkan ke dashboard secara otomatis...
              </p>
              <Link
                href="/dashboard"
                className="btn-primary w-full py-3 text-base justify-center flex items-center"
              >
                Ke Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-ocean text-sm mb-8 transition-colors">
                <ArrowLeft size={14} /> Kembali ke login
              </Link>

              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                  Buat Password Baru
                </h1>
                <p className="text-gray-500 text-sm">
                  Masukkan password baru kamu di bawah ini.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">Password Baru</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="label">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      className="input pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base justify-center flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : "Simpan Password Baru"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
