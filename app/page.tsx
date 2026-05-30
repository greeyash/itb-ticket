// PATH: app/page.tsx

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { EventCard } from "@/components/events/eventcard";
import {
  Mic2,
  Wrench,
  Trophy,
  HandHeart,
  Theater,
  BookOpen,
  Star,
  Flame,
  Search,
  ClipboardList,
  Ticket,
  Medal,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Users,
  CalendarDays,
  Building2,
} from "lucide-react";
import type { Tables } from "@/types/database";
type Event = Tables<"events">;

const categories = [
  { key: "seminar",     label: "Seminar",   Icon: Mic2       },
  { key: "workshop",    label: "Workshop",  Icon: Wrench     },
  { key: "competition", label: "Lomba",     Icon: Trophy     },
  { key: "volunteer",   label: "Volunteer", Icon: HandHeart  },
  { key: "cultural",    label: "Budaya",    Icon: Theater    },
  { key: "academic",    label: "Akademik",  Icon: BookOpen   },
];

const howItWorks = [
  { step: "01", Icon: Search,        title: "Cari Event",       desc: "Browse ratusan event kampus yang aktif"                        },
  { step: "02", Icon: ClipboardList, title: "Daftar",           desc: "Isi form dan selesaikan pembayaran (jika berbayar)"            },
  { step: "03", Icon: Ticket,        title: "Tiket Digital",    desc: "Dapatkan tiket dengan QR code unik"                           },
  { step: "04", Icon: Medal,         title: "Kumpulkan Poin",   desc: "Hadir dan raih badge serta sertifikat"                        },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredEvents } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(full_name, avatar_url, faculty)")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("start_date", { ascending: true })
    .limit(3);

  const { data: latestEvents } = await supabase
    .from("events")
    .select("*, organizer:profiles!organizer_id(full_name, avatar_url, faculty)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  const { count: totalEvents } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ocean-pattern min-h-[90vh] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-butter/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-nebula/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-butter/20 animate-float pointer-events-none" />

        <div className="page-container relative z-10 py-24">
          <div className="max-w-3xl">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-butter/20 border border-butter/30 text-butter px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <Sparkles size={13} className="animate-pulse-slow" />
              Platform Resmi Event Kampus ITB
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Satu Platform,{" "}
              <span className="text-butter italic">Ribuan</span>{" "}
              Pengalaman Kampus
            </h1>

            <p className="text-nebula/90 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              Temukan seminar, workshop, lomba, dan kegiatan kampus ITB. Daftar,
              dapatkan tiket digital, dan kumpulkan poin untuk jadi mahasiswa
              paling aktif!
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className="btn-secondary text-base px-8 py-3 rounded-2xl font-semibold shadow-butter-md inline-flex items-center gap-2"
              >
                Jelajahi Event
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/register"
                className="btn-outline border-white/30 text-white hover:bg-white/10 text-base px-8 py-3 rounded-2xl font-semibold"
              >
                Daftar Gratis
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-14">
              {[
                { label: "Event Aktif",  value: totalEvents || 0, Icon: CalendarDays },
                { label: "Mahasiswa",    value: totalUsers  || 0, Icon: Users        },
                { label: "Fakultas",     value: 12,               Icon: Building2    },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-butter/15 border border-butter/20 flex items-center justify-center flex-shrink-0">
                    <s.Icon size={18} className="text-butter" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-butter leading-none">
                      {s.value.toLocaleString("id-ID")}+
                    </p>
                    <p className="text-nebula/70 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 80L1440 80L1440 40C1320 80 1200 20 1080 40C960 60 840 20 720 40C600 60 480 20 360 40C240 60 120 20 0 40L0 80Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="section-title text-gray-900">Temukan Event Sesuai Minat</h2>
            <p className="text-gray-500 mt-2">Pilih kategori yang kamu minati</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.map(({ key, label, Icon }) => (
              <Link
                key={key}
                href={`/events?category=${key}`}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 hover:border-ocean/20 hover:bg-saltywater/30 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-saltywater/50 group-hover:bg-ocean/10 flex items-center justify-center transition-colors duration-200">
                  <Icon size={20} className="text-ocean/60 group-hover:text-ocean transition-colors duration-200" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-ocean text-center transition-colors duration-200">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Events ───────────────────────────────────────────────── */}
      {featuredEvents && featuredEvents.length > 0 && (
        <section className="py-16 bg-pale/40">
          <div className="page-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-ocean text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Star size={13} className="fill-ocean text-ocean" /> Unggulan
                </p>
                <h2 className="section-title">Event Featured</h2>
              </div>
              <Link href="/events?featured=true" className="btn-ghost text-sm inline-flex items-center gap-1">
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {(featuredEvents as Event[]).map((event) => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Latest Events ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-ocean text-sm font-medium mb-1 flex items-center gap-1.5">
                <Flame size={13} className="text-orange-500" /> Terbaru
              </p>
              <h2 className="section-title">Event Terkini</h2>
            </div>
            <Link href="/events" className="btn-ghost text-sm inline-flex items-center gap-1">
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(latestEvents as Event[])?.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-ocean-pattern">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Cara Kerja Platform
            </h2>
            <p className="text-nebula/80">Mudah, cepat, dan terintegrasi penuh</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map(({ step, Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-4">
                  <Icon size={26} className="text-butter" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-butter bg-ocean-dark px-1.5 py-0.5 rounded-md">
                    {step}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-nebula/70 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-butter/20">
        <div className="page-container text-center">
          <h2 className="section-title mb-4">Siap Jadi Mahasiswa Paling Aktif?</h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Bergabung dengan ribuan mahasiswa ITB yang sudah memanfaatkan platform ini
            untuk mengembangkan diri
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/auth/register"
              className="btn-primary text-base px-8 py-3 rounded-2xl inline-flex items-center gap-2"
            >
              Mulai Sekarang — Gratis
              <ArrowRight size={16} />
            </Link>
            <Link href="/leaderboard" className="btn-outline text-base px-8 py-3 rounded-2xl inline-flex items-center gap-2">
              <Trophy size={16} />
              Lihat Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}