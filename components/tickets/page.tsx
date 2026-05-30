import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TicketCard } from "@/components/tickets/ticketcard";
import type { RegistrationWithEvent } from "@/types/relations";
interface TicketCardProps {
  registration: RegistrationWithEvent;
}

export const metadata = { title: "Tiket Digital" };

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

const { data: registrations } = await supabase
  .from("registrations")
  .select(`
    *,
    event:events(
      id, title, slug, start_date, end_date,
      location_name, location_address, is_online,
      banner_url, category, organizer_id,
      organizer:profiles!organizer_id(full_name, faculty)
    )
  `)
  .eq("participant_id", user.id)
  .neq("status", "cancelled")
  .order("created_at", { ascending: false })
  .returns<RegistrationWithEvent[]>();

  const active = registrations?.filter((r) => r.status !== "attended") || [];
  const past = registrations?.filter((r) => r.status === "attended") || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Tiket Digital</h1>
        <p className="text-gray-500 text-sm">Tunjukkan QR code ini saat check-in event</p>
      </div>

      {registrations?.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">🎫</p>
          <h3 className="font-display font-semibold text-gray-900 mb-2">Belum ada tiket</h3>
          <p className="text-gray-500 text-sm mb-6">Daftar event untuk mendapatkan tiket digital</p>
          <a href="/events" className="btn-primary inline-block">Jelajahi Event</a>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Tiket Aktif ({active.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {active.map((reg) => (
                <TicketCard key={reg.id} registration={reg} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Riwayat ({past.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-6 opacity-75">
                {past.map((reg) => (
                <TicketCard key={reg.id} registration={reg} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}