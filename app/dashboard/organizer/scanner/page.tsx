"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Camera, CheckCircle, XCircle, Search, User, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import jsQR from "jsqr";

interface ScanResult {
  success: boolean;
  message: string;
  participant?: { name: string; nim?: string; faculty?: string };
  event?: { title: string; start_date: string };
  registration?: { ticket_code: string; status: string };
}

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const supabase = createClient();

  const checkIn = useCallback(async (ticketCode: string) => {
    setLoading(true);
    try {
      const { data: reg, error } = await supabase
        .from("registrations")
        .select(`
          *,
          event:events(title, start_date),
          participant:profiles!participant_id(full_name, nim, faculty)
        `)
        .eq("ticket_code", ticketCode.trim())
        .single();

      if (error || !reg) {
        setResult({ success: false, message: "Tiket tidak ditemukan. Pastikan kode benar." });
        return;
      }

      if (reg.status === "attended") {
        setResult({
          success: false,
          message: "Tiket sudah digunakan sebelumnya.",
          participant: { name: (reg.participant as any)?.full_name, nim: (reg.participant as any)?.nim, faculty: (reg.participant as any)?.faculty },
          event: reg.event as any,
          registration: { ticket_code: reg.ticket_code, status: reg.status },
        });
        return;
      }

      if (reg.status === "cancelled") {
        setResult({ success: false, message: "Tiket telah dibatalkan." });
        return;
      }

      if (reg.payment_status === "pending") {
        setResult({ success: false, message: "Pembayaran belum dikonfirmasi." });
        return;
      }

      // Mark as attended
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from("registrations")
        .update({
          status: "attended",
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id,
        })
        .eq("id", reg.id);

      if (updateError) {
        setResult({ success: false, message: "Gagal update status. Coba lagi." });
        return;
      }

      setResult({
        success: true,
        message: "Check-in berhasil! Selamat datang 🎉",
        participant: { name: (reg.participant as any)?.full_name, nim: (reg.participant as any)?.nim, faculty: (reg.participant as any)?.faculty },
        event: reg.event as any,
        registration: { ticket_code: reg.ticket_code, status: "attended" },
      });
      toast.success("Check-in berhasil!");
    } catch {
      setResult({ success: false, message: "Terjadi kesalahan. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        scanFrame();
      }
    } catch {
      toast.error("Tidak dapat mengakses kamera. Gunakan input manual.");
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code) {
      stopCamera();
      try {
        const parsed = JSON.parse(code.data);
        checkIn(parsed.ticketCode || code.data);
      } catch {
        checkIn(code.data);
      }
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Scan Tiket</h1>
        <p className="text-gray-500 text-sm">Scan QR code tiket peserta untuk check-in</p>
      </div>

      {/* Camera scanner */}
      <div className="card overflow-hidden">
        <div className="relative bg-gray-900 aspect-square max-h-80 flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Camera size={48} className="opacity-30 mb-4" />
              <p className="text-sm opacity-60">Kamera tidak aktif</p>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-butter rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-butter rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-butter rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-butter rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-butter rounded-br-xl" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-butter/60 animate-[scan_2s_ease-in-out_infinite]" style={{
                  animation: "scanLine 2s ease-in-out infinite"
                }} />
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes scanLine {
            0% { transform: translateY(0); }
            50% { transform: translateY(224px); }
            100% { transform: translateY(0); }
          }
        `}</style>

        <div className="p-5">
          {!scanning ? (
            <button onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <Camera size={18} /> Aktifkan Kamera
            </button>
          ) : (
            <button onClick={stopCamera} className="btn-outline w-full py-3 text-red-600 border-red-200 hover:bg-red-50">
              Stop Kamera
            </button>
          )}
        </div>
      </div>

      {/* Manual input */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Input Manual</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualCode && checkIn(manualCode)}
              placeholder="ITB-XXXX-XXXXXX"
              className="input pl-10 font-mono text-sm"
            />
          </div>
          <button
            onClick={() => manualCode && checkIn(manualCode)}
            disabled={loading || !manualCode}
            className="btn-primary px-4 flex items-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Cek"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`card p-6 border-2 ${result.success ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${result.success ? "bg-green-100" : "bg-red-100"}`}>
              {result.success
                ? <CheckCircle size={24} className="text-green-600" />
                : <XCircle size={24} className="text-red-600" />
              }
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.message}
              </p>

              {result.participant && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User size={14} className="text-gray-400" />
                    <span className="font-medium">{result.participant.name}</span>
                  </div>
                  {result.participant.nim && (
                    <p className="text-xs text-gray-500 ml-5">NIM: {result.participant.nim} · {result.participant.faculty}</p>
                  )}
                  {result.event && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={12} className="text-gray-400" />
                      {formatDate(result.event.start_date)}
                    </div>
                  )}
                  {result.registration && (
                    <p className="text-xs font-mono text-gray-500 ml-5">{result.registration.ticket_code}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => { setResult(null); setManualCode(""); }}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline w-full text-center"
          >
            Scan berikutnya
          </button>
        </div>
      )}
    </div>
  );
}