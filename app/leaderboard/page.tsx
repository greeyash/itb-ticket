// PATH: app/leaderboard/page.tsx

import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Crown, Medal } from "lucide-react";

export const metadata = { title: "Leaderboard Mahasiswa Aktif" };

// ─── helpers outside the async component (fixes Turbopack "return not allowed" error) ───

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={20} className="text-yellow-500" />;
  if (rank === 2) return <Medal size={20} className="text-gray-400" />;
  if (rank === 3) return <Medal size={20} className="text-amber-600" />;
  return <span className="text-sm font-bold text-gray-400">#{rank}</span>;
}

function rankBg(rank: number): string {
  if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
  if (rank === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
  if (rank === 3) return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
  return "border-gray-100";
}

function avatarGradient(rank: number): string {
  if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-amber-500 text-white";
  if (rank === 2) return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
  if (rank === 3) return "bg-gradient-to-br from-amber-500 to-orange-600 text-white";
  return "bg-gradient-to-br from-ocean to-nebula text-white";
}

function pointsColor(rank: number): string {
  if (rank === 1) return "text-yellow-600";
  if (rank === 2) return "text-gray-500";
  if (rank === 3) return "text-amber-600";
  return "text-ocean";
}

// ─── page component ───────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser() as any;

  const { data: leaders } = await supabase
    .from("profiles")
    .select("id, full_name, faculty, nim, points, avatar_url, role, user_badges(count)")
    .eq("role", "participant")
    .order("points", { ascending: false })
    .limit(50) as any;

  // Events attended count per user
  const { data: attendanceCounts } = await supabase
    .from("registrations")
    .select("participant_id")
    .eq("status", "attended") as any;

  const attendanceMap: Record<string, number> = {};
  attendanceCounts?.forEach((r: any) => {
    attendanceMap[r.participant_id] = (attendanceMap[r.participant_id] || 0) + 1;
  });

  // Current user rank
  let myRank: number | null = null;
  let myProfile: { id: string; full_name: string; points: number; faculty: string | null } | null = null;

  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("id, full_name, points, faculty")
      .eq("id", user.id)
      .single() as any;

    if (me) {
      myProfile = me;
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("points", me.points)
        .eq("role", "participant") as any;
      myRank = (count || 0) + 1;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-10 bg-ocean-pattern">
        <div className="page-container text-center">
          <div className="inline-flex items-center gap-2 bg-butter/20 border border-butter/30 text-butter px-4 py-1.5 rounded-full text-sm mb-6">
            <Crown size={14} />
            Papan Peringkat
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-white mb-3">
            Mahasiswa Paling Aktif
          </h1>
          <p className="text-nebula/70 text-base max-w-lg mx-auto">
            Kumpulkan poin dari setiap event yang kamu hadiri dan jadilah yang teratas!
          </p>

          {/* My rank card */}
          {myRank !== null && myProfile !== null && (
            <div className="mt-8 inline-flex items-center gap-4 bg-white/10 border border-white/20 rounded-2xl px-6 py-4">
              <div className="w-10 h-10 rounded-full bg-butter/30 flex items-center justify-center text-white font-bold">
                {myProfile.full_name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-white/70 text-xs">Peringkat kamu</p>
                <p className="text-white font-semibold">{myProfile.full_name}</p>
              </div>
              <div className="text-right">
                <p className="text-butter font-display font-bold text-2xl">#{myRank}</p>
                <p className="text-nebula/60 text-xs">{myProfile.points} pts</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard list */}
      <div className="page-container py-10">
        <div className="max-w-3xl mx-auto space-y-3">
          {leaders?.map((leader: any, index: number) => {
            const rank = index + 1;
            const eventsAttended = attendanceMap[leader.id] || 0;
            const isMe = user?.id === leader.id;
            const badgeCount = (leader.user_badges as any)?.[0]?.count || 0;

            return (
              <div
                key={leader.id}
                className={`card p-4 border ${rankBg(rank)} transition-all ${
                  isMe ? "ring-2 ring-ocean/40" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank icon */}
                  <div className="w-10 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={rank} />
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${avatarGradient(rank)}`}
                  >
                    {leader.full_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {leader.full_name}
                      {isMe && (
                        <span className="ml-1 text-xs text-ocean font-medium">
                          (Kamu)
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {leader.faculty && (
                        <span className="text-xs text-gray-400">{leader.faculty}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {eventsAttended} event
                      </span>
                      {badgeCount > 0 && (
                        <span className="text-xs text-copper">
                          🏅 {badgeCount} badge
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-bold text-lg ${pointsColor(rank)}`}>
                      {leader.points.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-gray-400">poin</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CTA for guests */}
          {!user && (
            <div className="card p-8 text-center mt-6">
              <p className="text-3xl mb-3">🏆</p>
              <p className="font-semibold text-gray-900 mb-2">Ingin masuk peringkat?</p>
              <p className="text-gray-500 text-sm mb-5">
                Daftar dan ikuti event untuk mengumpulkan poin!
              </p>
              <Link href="/auth/register" className="btn-primary inline-block px-8">
                Daftar Sekarang
              </Link>
            </div>
          )}

          {leaders?.length === 0 && (
            <div className="card p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">📊</p>
              <p className="text-sm">Belum ada data leaderboard</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}