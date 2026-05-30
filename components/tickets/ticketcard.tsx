"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Download, Maximize2, X } from "lucide-react";
import { formatDate, getCategoryIcon, cn } from "@/lib/utils";
import type { RegistrationWithEvent } from "@/types/relations";
interface TicketCardProps {
  registration: RegistrationWithEvent;
}

export function TicketCard({ registration }: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const event = registration.event as any;
  if (!event) return null;

  const qrValue = JSON.stringify({
    ticketCode: registration.ticket_code,
    eventId: registration.event_id,
    participantId: registration.participant_id,
    qrData: registration.qr_data,
  });

  const isAttended = registration.status === "attended";
  const isPending = registration.payment_status === "pending" && event.price > 0;

  const statusConfig = {
    pending: { label: "Menunggu Konfirmasi", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    confirmed: { label: "Terkonfirmasi", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
    attended: { label: "Sudah Hadir", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
    cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  };
  const s = statusConfig[registration.status] || statusConfig.pending;

  return (
    <>
      {/* Ticket card */}
      <div className={cn(
        "relative bg-white rounded-2xl overflow-hidden border",
        isAttended ? "border-gray-200 opacity-80" : "border-ocean/20 shadow-ocean-sm"
      )}>
        {/* Top colored band */}
        <div className={cn(
          "h-2",
          isAttended ? "bg-gray-300" : isPending ? "bg-amber-400" : "bg-gradient-to-r from-ocean to-ocean-light"
        )} />

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <span className="text-xl">{getCategoryIcon(event.category)}</span>
              <h3 className="font-display font-semibold text-gray-900 mt-1 text-base leading-snug line-clamp-2">
                {event.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{event.organizer?.full_name}</p>
            </div>
            <span className={`badge ml-3 text-[11px] flex items-center gap-1.5 ${s.color} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          </div>

          {/* Event info */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} className="text-ocean/60" />
              {formatDate(event.start_date, "d MMMM yyyy · HH:mm")}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={12} className="text-ocean/60" />
              {event.is_online ? "Online" : event.location_name || "ITB"}
            </div>
          </div>

          {/* Perforated divider */}
          <div className="relative my-4">
            <div className="border-t border-dashed border-gray-200" />
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-seashell/80" />
            <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-seashell/80" />
          </div>

          {/* QR Code + ticket code */}
          <div className="flex items-center gap-5">
            <div className={cn(
              "p-2 rounded-xl border",
              isAttended ? "border-gray-200 grayscale" : "border-ocean/20 bg-white shadow-sm"
            )}>
              <QRCodeSVG
                value={qrValue}
                size={80}
                fgColor={isAttended ? "#9ca3af" : "#013F62"}
                level="M"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Kode Tiket</p>
              <p className="font-mono text-sm font-bold text-ocean">{registration.ticket_code}</p>
              {registration.checked_in_at && (
                <p className="text-[10px] text-green-600 mt-2">
                  ✅ Check-in: {formatDate(registration.checked_in_at, "d MMM, HH:mm")}
                </p>
              )}
              {isPending && (
                <p className="text-[10px] text-amber-600 mt-2">
                  ⏳ Menunggu verifikasi pembayaran
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isAttended && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-ocean/5 hover:bg-ocean/10 text-ocean text-xs font-medium rounded-xl transition-colors"
              >
                <Maximize2 size={12} /> Perbesar QR
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-xl transition-colors">
                <Download size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <button onClick={() => setExpanded(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>

            <h3 className="font-display font-bold text-gray-900 mb-1">{event.title}</h3>
            <p className="text-sm text-gray-400 mb-6">{formatDate(event.start_date)}</p>

            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-2xl shadow-ocean-md border border-ocean/10">
                <QRCodeSVG value={qrValue} size={200} fgColor="#013F62" level="M" />
              </div>
            </div>

            <p className="font-mono font-bold text-ocean text-lg tracking-wider">{registration.ticket_code}</p>
            <p className="text-xs text-gray-400 mt-2">Tunjukkan ke panitia saat check-in</p>
          </div>
        </div>
      )}
    </>
  );
}