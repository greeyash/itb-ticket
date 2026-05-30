// PATH: app/dashboard/notifications/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/dashboard/notificationslist";

export const metadata = { title: "Notifikasi" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark all as read
  await (supabase as any)
  .from("notifications")
  .update({ is_read: true })
  .eq("user_id", user.id)
  .eq("is_read", false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Notifikasi</h1>
        <p className="text-gray-500 text-sm mt-0.5">{notifications?.length || 0} notifikasi</p>
      </div>
      <NotificationsList notifications={notifications || []} />
    </div>
  );
}