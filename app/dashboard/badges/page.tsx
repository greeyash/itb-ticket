// PATH: app/dashboard/badges/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Zap, Award, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Badge & Poin" };

const BADGE_ICONS: Record<string, string> = {
  first_event: "🌟",
  five_events: "🔥",
  ten_events: "💎",
  organizer: "🎪",
  volunteer: "🤝",
  top_participant: "👑",
};

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single() as any;

  // User's earned badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false }) as any;

  // All available badges
  const { data: allBadges } = await supabase.from("badges").select("*") as any;
  const earnedBadgeIds = new Set(userBadges?.map((ub: any) => ub.badge_id));
  const unearnedBadges = allBadges?.filter((b: any) => !earnedBadgeIds.has(b.id)) || [];

  // Point transactions
  const { data: transactions } = await supabase
    .from("point_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10) as any;

  // Leaderboard rank
  const { data: betterUsers } = await supabase
  .from("profiles")
  .select("id", { count: "exact" })
  .gt("points", profile?.points || 0) as any;
  const myRank = (betterUsers?.length || 0) + 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Badge & Poin</h1>
        <p className="text-gray-500 text-sm mt-0.5">Kumpulkan badge dan poin dari setiap event</p>
      </div>

      {/* Points overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-ocean to-ocean-light text-white col-span-1">
          <div className="flex items-center justify-between mb-3">
            <Zap size={20} className="text-butter" />
            <span className="text-butter/70 text-xs font-medium">TOTAL POIN</span>
          </div>
          <p className="font-display text-4xl font-bold">{profile?.points || 0}</p>
          <p className="text-nebula/70 text-xs mt-1">poin terkumpul</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <Award size={20} className="text-copper" />
            <span className="text-gray-400 text-xs font-medium">BADGE</span>
          </div>
          <p className="font-display text-4xl font-bold text-gray-900">{userBadges?.length || 0}</p>
          <p className="text-gray-500 text-xs mt-1">badge diperoleh</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={20} className="text-ocean" />
            <span className="text-gray-400 text-xs font-medium">RANKING</span>
          </div>
          <p className="font-display text-4xl font-bold text-gray-900">#{myRank}</p>
          <p className="text-gray-500 text-xs mt-1">di leaderboard</p>
        </div>
      </div>

      {/* Earned badges */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">
          Badge Diperoleh ({userBadges?.length || 0})
        </h2>

        {userBadges && userBadges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userBadges.map((ub: any) => {
              const badge = ub.badge as any;
              return (
                <div key={ub.id} className="flex flex-col items-center p-5 bg-gradient-to-b from-butter/20 to-transparent rounded-2xl border border-butter/30">
                  <div className="w-16 h-16 rounded-2xl bg-butter/40 flex items-center justify-center text-3xl mb-3 shadow-butter-sm">
                    {BADGE_ICONS[badge?.badge_type] || "🏅"}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm text-center">{badge?.name}</p>
                  <p className="text-xs text-gray-400 text-center mt-1">{badge?.description}</p>
                  <p className="text-xs text-copper/70 mt-2">{formatDate(ub.awarded_at, "d MMM yyyy")}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-3">🏅</p>
            <p className="text-sm">Belum ada badge. Ikuti event untuk mendapatkannya!</p>
          </div>
        )}
      </div>

      {/* Locked badges */}
      {unearnedBadges.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-semibold text-gray-900 mb-5">
            Badge Belum Didapat
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unearnedBadges.map((badge: any) => (
              <div key={badge.id} className="flex flex-col items-center p-5 bg-gray-50 rounded-2xl border border-gray-200 opacity-60">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl mb-3 grayscale">
                  {BADGE_ICONS[badge.badge_type] || "🏅"}
                </div>
                <p className="font-semibold text-gray-700 text-sm text-center">{badge.name}</p>
                <p className="text-xs text-gray-400 text-center mt-1">{badge.description}</p>
                {badge.points_required > 0 && (
                  <p className="text-xs text-ocean mt-2">⚡ {badge.points_required} poin</p>
                )}
                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full mt-2">🔒 Terkunci</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Point history */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-5">Riwayat Poin</h2>
        {transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                    tx.points > 0 ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {tx.points > 0 ? "⚡" : "📤"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.created_at, "d MMM yyyy · HH:mm")}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${tx.points > 0 ? "text-green-600" : "text-red-500"}`}>
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">Belum ada transaksi poin</p>
          </div>
        )}
      </div>
    </div>
  );
}