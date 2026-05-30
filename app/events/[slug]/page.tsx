
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { RegistrationButton } from "@/components/events/registrationbutton";
import {
  Calendar, MapPin, Users, Zap, Award, Globe,
  Clock, Tag, Share2, ExternalLink
} from "lucide-react";
import {
  formatDate, formatDateTime, formatCurrency,
 getCategoryLabel,
  isEventFull, isRegistrationOpen, getEventStatusColor
} from "@/lib/utils";
import type { Tables } from "@/types/database";

type Event = Tables<"events">;

import Image from "next/image";
import { ShareButton } from "@/components/events/sharebutton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events").select("title, short_description").eq("slug", slug).single() as any;
  return {
    title: data?.title || "Event",
    description: data?.short_description || "Detail event kampus ITB",
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: eventData } = await supabase
    .from("events")
    .select(`
        *,
        organizer:profiles!organizer_id(id, full_name, faculty, avatar_url, nim)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

    if (!eventData) notFound();

    // Cast sekali di sini, beres semua
    const event = eventData as unknown as Tables<"events"> & {
    organizer: {
        id: string;
        full_name: string | null;
        faculty: string | null;
        avatar_url: string | null;
        nim: string | null;
    } | null;
    };

  // Increment view
    await (supabase as any)
  .from("events")
  .update({ view_count: (Number(event.view_count) || 0) + 1 })
  .eq("id", event.id);

  // Check if current user is registered
 const { data: { user } } = await supabase.auth.getUser();
  let userRegistration = null;
  if (user) {
    const { data: reg } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", event.id)
      .eq("participant_id", user.id)
      .single();
    userRegistration = reg;
  }

  const isFull = isEventFull(event.current_participants ?? 0, event.max_participants);
  const isOpen = isRegistrationOpen(event.registration_deadline);
  const spotsLeft = event.max_participants
    ? event.max_participants - (event.current_participants ?? 0)  : null;
  const organizer = event.organizer;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero banner */}
      <div className="relative h-72 md:h-96 bg-gradient-to-br from-ocean to-ocean-light mt-16">
        {event.banner_url && (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="page-container">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="badge bg-white/20 text-white text-xs border border-white/30">
                {getCategoryLabel(event.category)}
              </span>
              {event.is_online && (
                <span className="badge bg-blue-500/80 text-white text-xs">💻 Online</span>
              )}
              {event.is_featured && (
                <span className="badge bg-butter/90 text-copper text-xs">⭐ Featured</span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-white leading-tight max-w-3xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick info */}
            <div className="card p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-saltywater/30 rounded-xl">
                  <Calendar size={20} className="text-ocean mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-0.5">Mulai</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(event.start_date, "d MMM")}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.start_date, "HH:mm")}</p>
                </div>
                <div className="text-center p-3 bg-saltywater/30 rounded-xl">
                  <Clock size={20} className="text-ocean mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-0.5">Selesai</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(event.end_date, "d MMM")}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.end_date, "HH:mm")}</p>
                </div>
                <div className="text-center p-3 bg-saltywater/30 rounded-xl">
                  <MapPin size={20} className="text-ocean mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-0.5">Lokasi</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {event.is_online ? "Online" : event.location_name || "ITB"}
                  </p>
                </div>
                <div className="text-center p-3 bg-saltywater/30 rounded-xl">
                  <Users size={20} className="text-ocean mx-auto mb-1" />
                  <p className="text-xs text-gray-500 mb-0.5">Peserta</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {event.current_participants}{event.max_participants ? `/${event.max_participants}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-gray-900 text-xl mb-4">Tentang Event</h2>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <Tag size={14} /> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag: string) => (
                    <span key={tag} className="badge bg-ocean/10 text-ocean border border-ocean/20 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-500">
                Diselenggarakan oleh
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {organizer?.full_name?.charAt(0) || "O"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{organizer?.full_name || "Organizer"}</p>
                  {organizer?.faculty && (
                    <p className="text-sm text-gray-500">{organizer.faculty} · ITB</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Registration card */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-20">
              {/* Price */}
              <div className="mb-5">
                {(event.price ?? 0) > 0 ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Harga Tiket</p>
                    <p className="font-display text-3xl font-bold text-ocean">
                      {formatCurrency((event.price ?? 0))}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">via {event.payment_method === "qris" ? "QRIS" : "Transfer Bank"}</p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <span className="text-2xl font-display font-bold text-green-600">GRATIS</span>
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-5 text-center">
                <p className="text-xs text-amber-700 font-medium">Deadline Registrasi</p>
                <p className="text-sm font-bold text-amber-800 mt-0.5">
                  {formatDateTime(event.registration_deadline)}
                </p>
              </div>

              {/* Capacity bar */}
              {event.max_participants && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{event.current_participants} terdaftar</span>
                    <span>{spotsLeft !== null ? `${spotsLeft} sisa` : ""}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? "bg-red-400" : spotsLeft && spotsLeft <= 10 ? "bg-amber-400" : "bg-ocean"}`}
                      style={{ width: `${Math.min(((event.current_participants ?? 0) / event.max_participants) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Registration button */}
              <RegistrationButton
                event={event as Event}
                userId={user?.id}
                existingRegistration={userRegistration}
                isFull={isFull}
                isOpen={isOpen}
              />

              {/* Rewards */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Zap size={15} className="text-butter" />
                  <span>+{event.participation_points ?? 0} poin untuk hadir</span>
                </div>
                {event.has_certificate && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Award size={15} className="text-purple-500" />
                    <span>Sertifikat digital tersedia</span>
                  </div>
                )}
                {event.is_online && event.online_link && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Globe size={15} className="text-blue-500" />
                    <span>Event online (link setelah registrasi)</span>
                  </div>
                )}
              </div>

              {/* Share */}
              <ShareButton title={event.title} />
            </div>
          </div>  
        </div>
      </div>

      <Footer />
    </div>
  );
}