"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Calendar, Ticket, Award, BarChart2,
  Users, Shield, Settings, LogOut, Plus, QrCode,
  FileText, Bell, Menu, X, Star
} from "lucide-react";
import { cn, getRoleLabel } from "@/lib/utils";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;

interface SidebarProps { profile: Profile }

const navByRole = {
  participant: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/my-events", icon: Calendar, label: "Event Saya" },
    { href: "/dashboard/tickets", icon: Ticket, label: "Tiket Digital" },
    { href: "/dashboard/certificates", icon: FileText, label: "Sertifikat" },
    { href: "/dashboard/badges", icon: Award, label: "Badge & Poin" },
    { href: "/dashboard/notifications", icon: Bell, label: "Notifikasi" },
    { href: "/dashboard/profile", icon: Settings, label: "Profil" },
  ],
  organizer: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/organizer/events", icon: Calendar, label: "Event Saya" },
    { href: "/dashboard/organizer/create", icon: Plus, label: "Buat Event" },
    { href: "/dashboard/organizer/attendees", icon: Users, label: "Peserta" },
    { href: "/dashboard/organizer/scanner", icon: QrCode, label: "Scan Tiket" },
    { href: "/dashboard/organizer/certificates", icon: FileText, label: "Sertifikat" },
    { href: "/dashboard/notifications", icon: Bell, label: "Notifikasi" },
    { href: "/dashboard/profile", icon: Settings, label: "Profil" },
  ],
  admin: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    { href: "/dashboard/admin/events", icon: Calendar, label: "Semua Event" },
    { href: "/dashboard/admin/users", icon: Users, label: "Pengguna" },
    { href: "/dashboard/admin/verifications", icon: Shield, label: "Verifikasi" },
    { href: "/dashboard/admin/analytics", icon: BarChart2, label: "Analytics" },
    { href: "/dashboard/organizer/scanner", icon: QrCode, label: "Scan Tiket" },
    { href: "/dashboard/notifications", icon: Bell, label: "Notifikasi" },
    { href: "/dashboard/profile", icon: Settings, label: "Profil" },
  ],
};

// ✅ Didefinisikan di LUAR DashboardSidebar — tidak dibuat ulang setiap render
interface SidebarContentProps {
  profile: Profile;
  nav: { href: string; icon: React.ElementType; label: string }[];
  pathname: string;
  onLinkClick: () => void;
  onSignOut: () => void;
}

function SidebarContent({ profile, nav, pathname, onLinkClick, onSignOut }: SidebarContentProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean to-ocean-light flex items-center justify-center shadow-ocean-sm">
            <span className="text-butter font-display font-bold text-sm">I</span>
          </div>
          <span className="font-display font-bold text-lg text-ocean">
            ITB <span className="text-copper">Ticket</span>
          </span>
        </Link>
      </div>

      {/* Profile summary */}
      <div className="p-4 mx-3 my-3 bg-saltywater/40 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {profile.full_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                profile.role === "admin" ? "bg-red-100 text-red-700" :
                profile.role === "organizer" ? "bg-ocean/10 text-ocean" :
                "bg-nebula/40 text-copper"
              )}>
                {profile.role === "admin" ? "🔴" : profile.role === "organizer" ? "" : ""} {getRoleLabel(profile.role)}
              </span>
              <span className="text-[10px] text-gray-400"> {profile.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-ocean text-white shadow-ocean-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-ocean"
              )}
            >
              <item.icon size={16} className={isActive ? "text-butter" : "text-current"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Leaderboard quick link */}
      <div className="px-3 pb-3">
        <Link href="/leaderboard"
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors">
          <Star size={16} />
          Leaderboard
        </Link>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );
}

export function DashboardSidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []); // ✅ tidak dibuat ulang setiap render
  const nav = navByRole[profile.role] || navByRole.participant;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const sharedProps = {
    profile,
    nav,
    pathname,
    onLinkClick: () => setMobileOpen(false),
    onSignOut: handleSignOut,
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-card border border-gray-100"
      >
        <Menu size={18} className="text-ocean" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-white shadow-ocean-lg">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1 text-gray-500">
              <X size={18} />
            </button>
            <SidebarContent {...sharedProps} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 shadow-sm z-30">
        <SidebarContent {...sharedProps} />
      </aside>
    </>
  );
}