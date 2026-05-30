import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Zap } from "lucide-react";
import { formatDate, getCategoryLabel, formatCurrency, isEventFull, isRegistrationOpen, cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
type Event = Tables<"events">;

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const isFull = isEventFull(
  event.current_participants ?? 0,
  event.max_participants ?? 0
);
  const isOpen = isRegistrationOpen(event.registration_deadline);
  const spotsLeft = event.max_participants
    ? (event.max_participants ?? 0) - (event.current_participants ?? 0)
    : null;

  return (
    <Link href={`/events/${event.slug}`} className="group">
      <div className={cn(
        "card-hover overflow-hidden h-full flex flex-col",
        featured && "ring-2 ring-butter/50"
      )}>
        {/* Banner */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-saltywater to-nebula/40">
          {event.banner_url ? (
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-30"></span>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="badge bg-white/90 text-gray-700 text-[11px] shadow-sm">
              {getCategoryLabel(event.category)}
            </span>
            {featured && (
              <span className="badge bg-butter text-copper text-[11px] shadow-sm">
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Points badge */}
          <div className="absolute top-3 right-3">
            <span className="badge bg-ocean/90 text-butter text-[11px] shadow-sm">
              <Zap size={10} /> +{event.participation_points} pts
            </span>
          </div>

          {/* Status overlay */}
          {!isOpen && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-semibold bg-red-500/80 px-3 py-1.5 rounded-full">
                Pendaftaran Ditutup
              </span>
            </div>
          )}
          {isFull && isOpen && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="text-white text-sm font-semibold bg-gray-900/70 px-3 py-1.5 rounded-full">
                Kuota Penuh
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-display font-semibold text-gray-900 text-base leading-snug mb-3 group-hover:text-ocean transition-colors line-clamp-2">
            {event.title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Calendar size={13} className="text-ocean/60 flex-shrink-0" />
              <span>{formatDate(event.start_date, "d MMM yyyy · HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <MapPin size={13} className="text-ocean/60 flex-shrink-0" />
              <span className="truncate">{event.is_online ? "Online" : event.location_name || "ITB"}</span>
            </div>
            {event.max_participants && (
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <Users size={13} className="text-ocean/60 flex-shrink-0" />
                <span>{event.current_participants ?? 0}/{event.max_participants} peserta</span>
                {spotsLeft !== null && spotsLeft <= 10 && isOpen && !isFull && (
                  <span className="text-red-500 font-medium">({spotsLeft} sisa!)</span>
                )}
              </div>
            )}
          </div>

          {/* Progress bar for capacity */}
          {event.max_participants && (
            <div className="mb-4">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFull ? "bg-red-400" : spotsLeft && spotsLeft <= 10 ? "bg-amber-400" : "bg-ocean"
                  )}
                  style={{ width: `${Math.min(((event.current_participants ?? 0) / event.max_participants) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-auto flex items-center justify-between">
            <div>
              {(event.price ?? 0) > 0 ? (
                <p className="font-semibold text-ocean text-sm">{formatCurrency(event.price ?? 0)}</p>
              ) : (
                <span className="badge bg-green-100 text-green-700 text-xs">Gratis</span>
              )}
            </div>
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              isOpen && !isFull
                ? "bg-ocean/10 text-ocean"
                : "bg-gray-100 text-gray-500"
            )}>
              {isOpen && !isFull ? "Daftar Sekarang →" : "Tutup"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}