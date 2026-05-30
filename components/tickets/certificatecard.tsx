// PATH: components/tickets/CertificateCard.tsx
"use client";

import { useState } from "react";
import { Download, ExternalLink, Shield, CheckCircle } from "lucide-react";
import { formatDate, getCategoryIcon, getCategoryLabel } from "@/lib/utils";

interface Props {
  certificate: any;
}

export function CertificateCard({ certificate }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const event = certificate.event;
  const participant = certificate.participant;

  const verifyUrl = `/verify?hash=${certificate.verification_hash}`;

  return (
    <>
      <div className="card overflow-hidden">
        {/* Certificate header */}
        <div className="bg-gradient-to-r from-ocean to-ocean-light p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-butter/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-nebula/10 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-butter/20 border border-butter/30 flex items-center justify-center">
                <span className="text-butter text-xs font-display font-bold">I</span>
              </div>
              <div>
                <p className="text-butter text-xs font-semibold tracking-wider">ITBEVENTS</p>
                <p className="text-white/50 text-[10px]">Sertifikat Digital</p>
              </div>
            </div>

            <p className="text-white/70 text-xs mb-1">DIBERIKAN KEPADA</p>
            <p className="font-display text-xl font-bold text-white">{participant?.full_name}</p>
            {participant?.nim && (
              <p className="text-nebula/70 text-xs mt-0.5">{participant.nim} · {participant.faculty}</p>
            )}
          </div>
        </div>

        {/* Certificate body */}
        <div className="p-5">
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">atas kehadiran dalam</p>
            <p className="font-display font-semibold text-gray-900 text-base leading-snug">{event?.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">{getCategoryIcon(event?.category)}</span>
              <span className="text-xs text-gray-400">{getCategoryLabel(event?.category)} · {formatDate(event?.start_date, "d MMMM yyyy")}</span>
            </div>
          </div>

          {/* Cert number and verification */}
          <div className="border border-dashed border-gray-200 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">No. Sertifikat</p>
                <p className="font-mono text-xs font-bold text-ocean mt-0.5">{certificate.certificate_number}</p>
              </div>
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle size={14} />
                <span className="text-xs font-medium">Valid</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
            <Shield size={12} />
            <span>Diterbitkan: {formatDate(certificate.issued_at, "d MMM yyyy")}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ocean/5 hover:bg-ocean/10 text-ocean text-sm font-medium rounded-xl transition-colors"
            >
              <ExternalLink size={14} /> Lihat Sertifikat
            </button>
            <a
              href={verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
              title="Verifikasi Online"
            >
              <Shield size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)}>
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative certificate */}
            <div className="bg-gradient-to-br from-ocean via-ocean-light to-nebula/60 p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-32 h-32 border-4 border-white rounded-full" />
                <div className="absolute bottom-4 right-4 w-32 h-32 border-4 border-white rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full opacity-50" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-butter/20 border border-butter/30 flex items-center justify-center">
                    <span className="text-butter font-display font-bold text-sm">I</span>
                  </div>
                  <div className="text-left">
                    <p className="text-butter font-bold tracking-wider text-sm">ITB Ticket</p>
                    <p className="text-white/50 text-xs">Institut Teknologi Bandung</p>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-2 tracking-widest uppercase">Sertifikat Kehadiran</p>
                <p className="text-white/60 text-sm mb-6">Diberikan kepada</p>

                <p className="font-display text-3xl font-bold text-white mb-1">{participant?.full_name}</p>
                {participant?.nim && (
                  <p className="text-nebula text-sm mb-8">{participant.nim} — {participant.faculty}</p>
                )}

                <p className="text-white/70 text-sm mb-3">atas partisipasi dan kehadiran dalam</p>
                <p className="font-display text-xl font-bold text-butter mb-2">{event?.title}</p>
                <p className="text-white/60 text-sm">{formatDate(event?.start_date, "d MMMM yyyy")}</p>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-white/40 text-xs font-mono">{certificate.certificate_number}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-nebula">
                    <CheckCircle size={14} />
                    <span className="text-xs">Sertifikat Terverifikasi Digital</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex gap-3 justify-center">
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline flex items-center gap-2"
              >
                <Shield size={15} /> Verifikasi Online
              </a>
              <button onClick={() => setShowPreview(false)} className="btn-primary">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}