"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
            Reset Password<br />
            <span className="text-butter italic">Mudah & Aman</span>
          </h2>
          <p className="text-nebula/70 text-base leading-relaxed">
            Masukkan email kamu dan kami akan mengirimkan link untuk mereset password.
          </p>
        </div>

        <p className="text-nebula/30 text-xs relative z-10">
          Institut Teknologi Bandung © {new Date().getFullYear()}
        </p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-ocean text-sm mb-8 transition-colors">
            <ArrowLeft size={14} /> Kembali ke login
          </Link>

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-3">
                Email Terkirim!
              </h1>
              <p className="text-gray-500 text-sm mb-2">
                Link reset password sudah dikirim ke:
              </p>
              <p className="font-medium text-ocean mb-6">{getValues("email")}</p>
              <p className="text-gray-400 text-xs mb-8">
                Cek inbox atau folder spam kamu. Link berlaku selama 1 jam.
              </p>
              <Link
                href="/auth/login"
                className="btn-primary w-full py-3 text-base justify-center flex items-center"
              >
                Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                  Lupa Password?
                </h1>
                <p className="text-gray-500 text-sm">
                  Masukkan email akun kamu dan kami akan mengirimkan link reset password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="mahasiswa@std.itb.ac.id"
                      className="input pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base justify-center flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : "Kirim Link Reset Password"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Ingat password?{" "}
                <Link href="/auth/login" className="text-ocean font-medium hover:underline">
                  Masuk sekarang
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
