// PATH: components/dashboard/NotificationsList.tsx
"use client";

import Link from "next/link";
import { formatRelative } from "@/lib/utils";
import type { Tables } from "@/types/database";
type Notification = Tables<"notifications">;

const typeIcons: Record<string, string> = {
  registration: "🎫",
  payment: "💳",
  certificate: "🎓",
  event: "📅",
  badge: "🏅",
  info: "ℹ️",
};

interface Props { notifications: Notification[] }

export function NotificationsList({ notifications }: Props) {
  if (notifications.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">🔔</p>
        <p className="font-semibold text-gray-900 mb-1">Belum ada notifikasi</p>
        <p className="text-gray-500 text-sm">Notifikasi akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden divide-y divide-gray-100">
      {notifications.map((notif) => (
        <div key={notif.id} className={`p-4 flex gap-4 items-start transition-colors ${!notif.is_read ? "bg-saltywater/20" : "hover:bg-gray-50"}`}>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
            {typeIcons[notif.type ?? "info"] || "🔔"}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!notif.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-800"}`}>
              {notif.title}
            </p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
            <p className="text-xs text-gray-400 mt-1.5">{formatRelative(notif.created_at ?? "")}</p>
          </div>
          {notif.action_url && (
            <Link href={notif.action_url} className="text-xs text-ocean hover:underline flex-shrink-0 mt-1">
              Lihat →
            </Link>
          )}
          {!notif.is_read && (
            <div className="w-2 h-2 rounded-full bg-ocean mt-1.5 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}