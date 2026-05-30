// PATH: app/verify/page.tsx

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Verifikasi Sertifikat" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { hash?: string; code?: string };
}) {
  const supabase = await createClient();
  const sp = await searchParams;
  let certificate: any = null;
  let error = false;

  if (sp.hash || sp.code) {
    let query = supabase
      .from("certificates")
      .select(`
        *,
        event:events(title, start_date, end_date, category, organizer_id,
          organizer:profiles!organizer_id(full_name, faculty)),
        participant:profiles!participant_id(full_name, nim, faculty)
      `);

    if (sp.hash) {
      query = query.eq("verification_hash", sp.hash);
    } else if (sp.code) {
      query = query.eq("certificate_number", sp.code);
    }

    const { data } = await query.single();
    if (data) {
      certificate = data;
    } else {
      error = true;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-10 bg-ocean-pattern">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-1.5 rounded-full text-sm mb-6">
            <Shield size={14} /> Verifikasi Sertifikat
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-3">
            Cek Keaslian Sertifikat
          </h1>
          <p className="text-nebula/70">Masukkan nomor sertifikat atau gunakan link verifikasi</p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Search form */}
          <div className="card p-6">
            <form className="space-y-4" method="GET">
              <div>
                <label className="label">Nomor Sertifikat</label>
                <input
                  name="code"
                  defaultValue={sp.code}
                  placeholder="CERT/2025/XXXXXXXX/XXXXXX"
                  className="input font-mono"
                />
              </div>
              <p className="text-center text-xs text-gray-400">atau</p>
              <div>
                <label className="label">Hash Verifikasi</label>
                <input
                  name="hash"
                  defaultValue={sp.hash}
                  placeholder="Hash dari QR code atau link sertifikat"
                  className="input font-mono"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <Shield size={16} /> Verifikasi Sekarang
              </button>
            </form>
          </div>

          {/* Result */}
          {error && (
            <div className="card p-8 text-center border-2 border-red-200">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h3 className="font-display font-bold text-gray-900 text-xl mb-2">Sertifikat Tidak Ditemukan</h3>
              <p className="text-gray-500 text-sm">
                Sertifikat dengan nomor/hash tersebut tidak ada dalam sistem kami.
                Pastikan kode yang dimasukkan benar.
              </p>
            </div>
          )}

          {certificate && (
            <div className="card p-8 border-2 border-green-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-xl mb-1">Sertifikat Valid ✓</h3>
                <p className="text-green-600 text-sm">Sertifikat ini terverifikasi dan asli</p>
              </div>

              <div className="bg-gradient-to-r from-ocean to-ocean-light rounded-2xl p-6 text-white text-center mb-6">
                <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Diberikan kepada</p>
                <p className="font-display text-2xl font-bold mb-1">{certificate.participant?.full_name}</p>
                {certificate.participant?.nim && (
                  <p className="text-nebula text-sm">{certificate.participant.nim} · {certificate.participant.faculty}</p>
                )}

                <div className="border-t border-white/20 mt-5 pt-5">
                  <p className="text-white/60 text-xs mb-2">atas kehadiran dalam</p>
                  <p className="font-display text-lg font-semibold text-butter">{certificate.event?.title}</p>
                  <p className="text-white/60 text-sm mt-1">
                    {formatDate(certificate.event?.start_date, "d MMMM yyyy")}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Diselenggarakan oleh {certificate.event?.organizer?.full_name}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Nomor Sertifikat</span>
                  <span className="font-mono text-sm font-bold text-ocean">{certificate.certificate_number}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Tanggal Terbit</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(certificate.issued_at, "d MMMM yyyy")}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                    <CheckCircle size={14} /> Valid & Aktif
                  </span>
                </div>
              </div>
            </div>
          )}

          {!sp.hash && !sp.code && (
            <div className="text-center p-8 text-gray-400">
              <Shield size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">Masukkan nomor sertifikat atau hash untuk verifikasi</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}