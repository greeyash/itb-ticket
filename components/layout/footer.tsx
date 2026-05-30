import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ocean-dark text-white py-16">
      <div className="page-container">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-butter/20 border border-butter/30 flex items-center justify-center">
                <span className="text-butter font-display font-bold text-sm">I</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                ITB <span className="text-butter">Ticket</span>
              </span>
            </div>
            <p className="text-nebula/70 text-sm leading-relaxed max-w-xs">
              Ekosistem digital resmi untuk event kampus Institut Teknologi Bandung.
              Menghubungkan mahasiswa, penyelenggara, dan komunitas kampus.
            </p>
            <div className="flex gap-3 mt-6">
              {["Instagram", "Twitter", "LinkedIn"].map((social) => (
                <a key={social} href="#"
                  className="text-xs text-nebula/60 hover:text-butter transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-butter/30">
                  {social}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/events", label: "Jelajahi Event" },
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/verify", label: "Verifikasi Sertifikat" },
                { href: "/auth/register", label: "Daftar Akun" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}
                    className="text-sm text-nebula/60 hover:text-butter transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Bantuan</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Hubungi Kami" },
                { href: "/privacy", label: "Kebijakan Privasi" },
                { href: "/terms", label: "Syarat & Ketentuan" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href}
                    className="text-sm text-nebula/60 hover:text-butter transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-nebula/50 text-xs">
            © {new Date().getFullYear()} ITB Ticket. Dikembangkan untuk komunitas kampus ITB.
          </p>
          <p className="text-nebula/40 text-xs font-mono">
            v1.0.0 · Powered by Supabase & Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}