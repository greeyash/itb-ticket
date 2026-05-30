"use client";

import Link from "next/link";
import { Bell, Search } from "lucide-react";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;

interface DashboardHeaderProps { profile: Profile }

export function DashboardHeader({ profile }: DashboardHeaderProps) {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="lg:hidden w-8" /> {/* Spacer for mobile menu button */}
      <div className="hidden md:block">
        <p className="text-sm text-gray-500">{greeting()}, <span className="font-semibold text-gray-900">{profile.full_name.split(" ")[0]}</span></p>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Link href="/events"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-seashell/80 hover:bg-gray-100 rounded-xl text-sm text-gray-500 transition-colors">
          <Search size={14} />
          <span>Cari event...</span>
        </Link>

        <Link href="/dashboard/notifications"
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <Bell size={18} />
        </Link>

        <Link href="/dashboard/profile" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white text-xs font-bold">
            {profile.full_name.charAt(0)}
          </div>
        </Link>
      </div>
    </header>
  );
}