// PATH: app/dashboard/certificates/page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CertificateCard } from "@/components/tickets/certificatecard";

export const metadata = { title: "Sertifikat Digital" };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      *,
      event:events(title, start_date, category, organizer_id,
        organizer:profiles!organizer_id(full_name)),
      participant:profiles!participant_id(full_name, nim, faculty)
    `)
    .eq("participant_id", user.id)
    .order("issued_at", { ascending: false }) as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Sertifikat Digital</h1>
        <p className="text-gray-500 text-sm mt-0.5">Sertifikat kehadiran event yang dapat diverifikasi secara online</p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-5xl mb-4">🎓</p>
          <h3 className="font-display font-semibold text-gray-900 mb-2">Belum ada sertifikat</h3>
          <p className="text-gray-500 text-sm mb-6">
            Hadiri event yang memiliki sertifikat untuk mendapatkannya
          </p>
          <a href="/events" className="btn-primary inline-block">Cari Event Bersertifikat</a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.map((cert: any) => (
            <CertificateCard key={cert.id} certificate={cert as any} />
          ))}
        </div>
      )}
    </div>
  );
}