"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bell, Menu, X, ChevronDown, LogOut, User, Settings, BarChart2 } from "lucide-react";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;
import { cn } from "@/lib/utils";

export function Navbar() {
  const [user, setUser] = useState<Profile | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (data) setUser(data);

        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", authUser.id)
          .eq("is_read", false);
        setUnread(count || 0);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const isLight = !pathname.startsWith("/dashboard") && !scrolled;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || pathname.startsWith("/dashboard") || pathname.startsWith("/events") || pathname.startsWith("/auth")
          ? "bg-white/95 backdrop-blur-md shadow-card border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean to-ocean-light flex items-center justify-center shadow-ocean-sm">
              <span className="text-butter font-display font-bold text-sm">I</span>
            </div>
            <span className={cn(
              "font-display font-bold text-xl transition-colors",
              isLight ? "text-white" : "text-ocean"
            )}>
              ITB <span className={isLight ? "text-butter" : "text-copper"}>Ticket</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/events", label: "Jelajahi" },
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/verify", label: "Verifikasi" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? isLight ? "bg-white/15 text-white" : "bg-ocean/10 text-ocean"
                    : isLight ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-ocean hover:bg-ocean/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications */}
                <Link href="/dashboard/notifications" className={cn(
                  "relative p-2 rounded-lg transition-colors",
                  isLight ? "text-white/80 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
                )}>
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors",
                      isLight ? "hover:bg-white/10" : "hover:bg-gray-100"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ocean to-nebula flex items-center justify-center text-white text-xs font-bold">
                      {user.full_name.charAt(0)}
                    </div>
                    <span className={cn("text-sm font-medium max-w-[100px] truncate", isLight ? "text-white" : "text-gray-700")}>
                      {user.full_name.split(" ")[0]}
                    </span>
                    <ChevronDown size={14} className={isLight ? "text-white/70" : "text-gray-400"} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-ocean-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        <span className="mt-1.5 inline-block text-xs bg-ocean/10 text-ocean px-2 py-0.5 rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <BarChart2 size={15} /> Dashboard
                        </Link>
                        <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <User size={15} /> Profil Saya
                        </Link>
                        <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Settings size={15} /> Pengaturan
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 pt-1">
                        <button onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut size={15} /> Keluar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className={cn(
                  "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
                  isLight ? "text-white/80 hover:text-white hover:bg-white/10" : "text-gray-600 hover:text-ocean"
                )}>
                  Masuk
                </Link>
                <Link href="/auth/register" className="btn-secondary text-sm px-5 py-2">
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn("md:hidden p-2 rounded-lg", isLight ? "text-white" : "text-gray-700")}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white rounded-2xl shadow-ocean-lg border border-gray-100 p-4 mb-4">
            <div className="space-y-1">
              {[
                { href: "/events", label: "Jelajahi Event" },
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/verify", label: "Verifikasi Sertifikat" },
              ].map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">
                    Dashboard
                  </Link>
                  <button onClick={handleSignOut} className="btn-outline flex-1 text-sm text-red-600 border-red-200 hover:bg-red-50">
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 text-center text-sm">
                    Masuk
                  </Link>
                  <Link href="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center text-sm">
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}