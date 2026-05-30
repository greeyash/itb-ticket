import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/dashboardsidebar";
import { DashboardHeader } from "@/components/dashboard/dashboardheader";
import type { Tables } from "@/types/database";
type Profile = Tables<"profiles">;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  console.log("LAYOUT RENDER")
  return (
    <div className="min-h-screen bg-seashell/50 flex">
      <DashboardSidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardHeader profile={profile as Profile} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}