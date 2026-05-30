// PATH: components/dashboard/AttendeeTable.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Eye, Download, BadgeCheck, UserCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  registrations: any[];
  eventId: string;
}

export function AttendeeTable({ registrations, eventId }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewProof, setViewProof] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const verifyPayment = async (regId: string, approve: boolean) => {
    setLoadingId(regId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("registrations").update({
        payment_status: approve ? "paid" : "failed",
        status: approve ? "confirmed" : "cancelled",
        payment_verified_at: approve ? new Date().toISOString() : null,
        payment_verified_by: approve ? user?.id : null,
      }).eq("id", regId);

      if (error) { toast.error("Gagal: " + error.message); return; }

      // Notify participant
      const reg = registrations.find((r) => r.id === regId);
      if (reg) {
        await supabase.from("notifications").insert({
          user_id: reg.participant_id,
          title: approve ? "Pembayaran Dikonfirmasi ✅" : "Pembayaran Ditolak ❌",
          message: approve
            ? "Pembayaranmu telah dikonfirmasi. Tiket digitalmu sudah aktif!"
            : "Maaf, pembayaranmu tidak dapat dikonfirmasi. Hubungi panitia.",
          type: "payment",
          action_url: "/dashboard/tickets",
        });
      }

      toast.success(approve ? "Pembayaran dikonfirmasi!" : "Pembayaran ditolak");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const markAttended = async (regId: string) => {
    setLoadingId(regId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("registrations").update({
        status: "attended",
        checked_in_at: new Date().toISOString(),
        checked_in_by: user?.id,
      }).eq("id", regId);

      if (error) { toast.error("Gagal: " + error.message); return; }
      toast.success("Peserta ditandai hadir!");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const issueCertificate = async (regId: string, participantId: string) => {
    setLoadingId(regId);
    try {
      const reg = registrations.find((r) => r.id === regId);
      const certNumber = `CERT/${new Date().getFullYear()}/${eventId.slice(0, 8).toUpperCase()}/${regId.slice(0, 6).toUpperCase()}`;
      const verHash = Buffer.from(`${regId}${Date.now()}`).toString("base64url").slice(0, 32);

      const { error } = await supabase.from("certificates").insert({
        registration_id: regId,
        participant_id: participantId,
        event_id: eventId,
        certificate_number: certNumber,
        verification_hash: verHash,
        is_valid: true,
      });

      if (error) {
        if (error.code === "23505") toast("Sertifikat sudah diterbitkan");
        else toast.error("Gagal menerbitkan sertifikat");
        return;
      }

      // Notify participant
      await supabase.from("notifications").insert({
        user_id: participantId,
        title: "Sertifikat Tersedia! 🎓",
        message: "Sertifikat kehadiran eventmu sudah bisa diunduh dari dashboard.",
        type: "certificate",
        action_url: "/dashboard/certificates",
      });

      toast.success("Sertifikat diterbitkan!");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  if (registrations.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">👤</p>
        <p className="text-gray-500 text-sm">Belum ada peserta terdaftar</p>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Peserta</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIM / Fakultas</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode Tiket</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pembayaran</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map((reg) => {
                const p = reg.participant;
                const isLoading = loadingId === reg.id;
                return (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {p?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p?.full_name || "—"}</p>
                          <p className="text-xs text-gray-400">{p?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 font-mono">{p?.nim || "—"}</p>
                      <p className="text-xs text-gray-400">{p?.faculty || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono text-ocean font-bold">{reg.ticket_code}</p>
                      <p className="text-xs text-gray-400">{formatDate(reg.created_at, "d MMM")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${
                          reg.payment_status === "paid" ? "bg-green-100 text-green-700" :
                          reg.payment_status === "failed" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {reg.payment_status}
                        </span>
                        {reg.payment_proof_url && (
                          <button
                            onClick={() => setViewProof(reg.payment_proof_url)}
                            className="text-ocean hover:underline text-xs flex items-center gap-1"
                          >
                            <Eye size={11} /> Bukti
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${
                        reg.status === "attended" ? "bg-blue-100 text-blue-700" :
                        reg.status === "confirmed" ? "bg-green-100 text-green-700" :
                        reg.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {reg.status === "attended" ? "✅ Hadir" :
                         reg.status === "confirmed" ? "✓ Confirmed" :
                         reg.status === "cancelled" ? "✗ Cancelled" : "⏳ Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Verify payment buttons */}
                        {reg.payment_status === "pending" && reg.payment_proof_url && (
                          <>
                            <button
                              onClick={() => verifyPayment(reg.id, true)}
                              disabled={isLoading}
                              title="Konfirmasi Pembayaran"
                              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                            >
                              {isLoading ? <span className="w-3.5 h-3.5 border border-current/30 border-t-current rounded-full animate-spin block" /> : <CheckCircle size={15} />}
                            </button>
                            <button
                              onClick={() => verifyPayment(reg.id, false)}
                              disabled={isLoading}
                              title="Tolak Pembayaran"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}
                        {/* Mark attended */}
                        {reg.status === "confirmed" && (
                          <button
                            onClick={() => markAttended(reg.id)}
                            disabled={isLoading}
                            title="Tandai Hadir"
                            className="p-1.5 rounded-lg hover:bg-ocean/10 text-ocean transition-colors disabled:opacity-50"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}
                        {/* Issue certificate */}
                        {reg.status === "attended" && (
                          <button
                            onClick={() => issueCertificate(reg.id, reg.participant_id)}
                            disabled={isLoading}
                            title="Terbitkan Sertifikat"
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors disabled:opacity-50"
                          >
                            <BadgeCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof modal */}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setViewProof(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Bukti Pembayaran</h3>
              <button onClick={() => setViewProof(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <img src={viewProof} alt="Bukti pembayaran" className="w-full rounded-xl max-h-96 object-contain" />
            <a href={viewProof} target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-sm text-ocean hover:underline">
              <Download size={14} /> Buka di tab baru
            </a>
          </div>
        </div>
      )}
    </>
  );
}