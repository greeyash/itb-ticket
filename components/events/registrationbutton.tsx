// PATH: components/events/RegistrationButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Upload, X, CheckCircle, ExternalLink } from "lucide-react";
import { generateTicketCode } from "@/lib/utils";
import type { Tables } from "@/types/database";
type Event = Tables<"events">;
type Registration = Tables<"registrations">;
import Link from "next/link";

interface Props {
  event: Event;
  userId?: string;
  existingRegistration: Registration | null;
  isFull: boolean;
  isOpen: boolean;
}

export function RegistrationButton({ event, userId, existingRegistration, isFull, isOpen }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"confirm" | "payment" | "success">("confirm");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newReg, setNewReg] = useState<Registration | null>(null);
  const router = useRouter();
  const supabase = createClient();

  if (!isOpen) return (
    <div className="w-full py-3 text-center bg-gray-100 text-gray-400 rounded-xl text-sm font-medium">
      Pendaftaran Ditutup
    </div>
  );

  if (isFull && !existingRegistration) return (
    <div className="w-full py-3 text-center bg-red-50 text-red-500 rounded-xl text-sm font-medium border border-red-100">
      Kuota Penuh
    </div>
  );

  if (existingRegistration) {
    const statusColors: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      confirmed: "bg-green-50 text-green-700 border-green-200",
      attended: "bg-gray-100 text-gray-600 border-gray-200",
      cancelled: "bg-red-50 text-red-600 border-red-200",
    };
    const statusLabels: Record<string, string> = {
      pending: "⏳ Menunggu Konfirmasi",
      confirmed: "✅ Terdaftar",
      attended: "🎉 Sudah Hadir",
      cancelled: "❌ Dibatalkan",
    };
    return (
      <div className="space-y-3">
        <div className={`w-full py-3 text-center rounded-xl text-sm font-medium border ${statusColors[existingRegistration.status] || "bg-gray-100 text-gray-600"}`}>
          {statusLabels[existingRegistration.status] || existingRegistration.status}
        </div>
        {existingRegistration.status !== "cancelled" && (
          <Link href="/dashboard/tickets" className="w-full flex items-center justify-center gap-2 py-2.5 border border-ocean/30 text-ocean rounded-xl text-sm font-medium hover:bg-ocean/5 transition-colors">
            <ExternalLink size={14} /> Lihat Tiket
          </Link>
        )}
      </div>
    );
  }

  if (!userId) return (
    <Link href={`/auth/login?redirectTo=/events/${event.slug}`}
      className="btn-primary w-full text-center py-3 block">
      Masuk untuk Mendaftar
    </Link>
  );

  const handleRegister = async () => {
    setLoading(true);
    try {
      const ticketCode = generateTicketCode();
      const qrData = JSON.stringify({
        ticketCode,
        eventId: event.id,
        participantId: userId,
        ts: Date.now(),
      });

      const { data: reg, error } = await supabase.from("registrations").insert({
        event_id: event.id,
        participant_id: userId,
        status: (event.price ?? 0) > 0 ? "pending" : "confirmed",
        payment_status: (event.price ?? 0) > 0 ? "pending" : "paid",
        ticket_code: ticketCode,
        qr_data: qrData,
      }).select().single();

      if (error) {
        if (error.code === "23505") toast.error("Kamu sudah terdaftar di event ini");
        else toast.error("Gagal mendaftar: " + error.message);
        setShowModal(false);
        return;
      }

      setNewReg(reg);

      // Send notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Registrasi Berhasil! 🎉",
        message: `Kamu berhasil mendaftar ke event "${event.title}". ${(event.price ?? 0) > 0 ? "Segera upload bukti pembayaran." : "Tiketmu sudah siap!"}`,
        type: "registration",
        action_url: "/dashboard/tickets",
      });

      if ((event.price ?? 0) > 0) {
        setStep("payment");
      } else {
        setStep("success");
        // Award badge for first event
        await supabase.from("user_badges").upsert({
          user_id: userId,
          badge_id: (await supabase.from("badges").select("id").eq("badge_type", "first_event").single()).data?.id,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran maksimal 5MB"); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadProof = async () => {
    if (!proofFile || !newReg) return;
    setLoading(true);
    try {
      const ext = proofFile.name.split(".").pop();
      const path = `payment-proofs/${newReg.id}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { upsert: true });

      if (uploadErr) { toast.error("Gagal upload bukti"); return; }

      const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      await supabase.from("registrations").update({ payment_proof_url: publicUrl }).eq("id", newReg.id);

      // Notify organizer
      await supabase.from("notifications").insert({
        user_id: event.organizer_id,
        title: "Bukti Pembayaran Baru",
        message: `Peserta baru mengirim bukti pembayaran untuk event "${event.title}". Silakan verifikasi.`,
        type: "payment",
        action_url: `/dashboard/organizer/attendees?event=${event.id}`,
      });

      setStep("success");
      toast.success("Bukti pembayaran berhasil diupload!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary w-full py-3 text-base font-semibold"
      >
        {(event.price ?? 0) > 0 ? `Daftar — ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(event.price ?? 0)}` : "Daftar Gratis"}
      </button>

      {/* Registration modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-gray-900 text-lg">
                {step === "confirm" && "Konfirmasi Pendaftaran"}
                {step === "payment" && "Upload Bukti Pembayaran"}
                {step === "success" && "Registrasi Berhasil! 🎉"}
              </h3>
              {step !== "success" && (
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Step: Confirm */}
            {step === "confirm" && (
              <div className="space-y-4">
                <div className="bg-saltywater/30 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {" · "}
                    {event.is_online ? "Online" : event.location_name}
                  </p>
                </div>
                <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                  <span className="text-sm text-gray-600">Harga</span>
                  <span className="font-bold text-ocean">
                    {(event.price ?? 0) > 0
                      ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format((event.price ?? 0))
                      : "GRATIS"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                  <span className="text-sm text-gray-600">Poin didapat</span>
                  <span className="font-bold text-butter-soft bg-copper/10 px-2 py-0.5 rounded-lg text-copper">
                    +{event.participation_points} pts
                  </span>
                </div>
                <button onClick={handleRegister} disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</>
                    : "Konfirmasi Pendaftaran"}
                </button>
                <button onClick={() => setShowModal(false)} className="btn-ghost w-full py-2.5 text-gray-500">
                  Batal
                </button>
              </div>
            )}

            {/* Step: Payment */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-800 text-sm font-medium">⚠️ Selesaikan Pembayaran</p>
                  <p className="text-amber-700 text-xs mt-1">Tiket akan aktif setelah pembayaran diverifikasi panitia</p>
                </div>

                    {event.payment_method === "qris" && (
                <div className="text-center p-4 border border-gray-100 rounded-xl">
                    {event.qris_image_url ? (
                    <>
                        <p className="text-sm font-medium text-gray-700 mb-3">Scan QRIS ini</p>
                        <img src={event.qris_image_url} alt="QRIS" className="w-48 h-48 mx-auto object-contain" />
                    </>
                    ) : (
                    <div className="p-3 bg-blue-50 rounded-xl text-left">
                        <p className="text-sm font-semibold text-blue-800 mb-1">📱 Pembayaran via QRIS</p>
                        <p className="text-xs text-blue-700">Hubungi panitia event untuk mendapatkan kode QRIS pembayaran.</p>
                        <p className="text-xs text-blue-600 mt-1">Total: <strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(event.price ?? 0)}</strong></p>
                    </div>
                    )}
                </div>
                )}

                {event.payment_method === "bank_transfer" && (
                  <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                    <p className="text-sm font-semibold text-gray-900">Transfer ke:</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-medium">{event.bank_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">No. Rekening</span>
                      <span className="font-mono font-bold text-ocean">{event.bank_account}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">A/N</span>
                      <span className="font-medium">{event.bank_account_name}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2">
                      <span className="text-gray-500">Jumlah</span>
                      <span className="font-bold text-ocean">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format((event.price ?? 0))}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="label">Upload Bukti Pembayaran</p>
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      proofPreview ? "border-ocean/30 bg-ocean/5" : "border-gray-200 hover:border-ocean/30"
                    }`}>
                      {proofPreview ? (
                        <img src={proofPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                      ) : (
                        <>
                          <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-400">Klik untuk upload (maks. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={handlePaymentProof} className="hidden" />
                  </label>
                </div>

                <button onClick={uploadProof} disabled={!proofFile || loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengupload...</>
                    : "Kirim Bukti Pembayaran"}
                </button>
                <button onClick={() => { setShowModal(false); router.refresh(); }}
                  className="btn-ghost w-full text-gray-500">
                  Upload nanti dari dashboard
                </button>
              </div>
            )}

            {/* Step: Success */}
            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-gray-900 text-xl mb-2">Yeay, Terdaftar!</h4>
                  <p className="text-gray-500 text-sm">
                    {(event.price ?? 0) > 0
                      ? "Bukti pembayaranmu sudah dikirim. Tiket aktif setelah diverifikasi panitia."
                      : "Tiket digitalmu sudah siap. Cek di dashboard!"}
                  </p>
                </div>
                <div className="bg-butter/20 rounded-xl p-4">
                  <p className="text-sm text-copper font-medium">⚡ +{event.participation_points} poin akan kamu dapatkan saat hadir!</p>
                </div>
                <Link href="/dashboard/tickets"
                  className="btn-primary w-full py-3 block text-center"
                  onClick={() => setShowModal(false)}>
                  Lihat Tiket Saya
                </Link>
                <button onClick={() => { setShowModal(false); router.refresh(); }}
                  className="btn-ghost w-full text-gray-500">
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}