import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ITB Ticket — Platform Event Kampus ITB",
    template: "%s | ITB Ticket",
  },
  description:
    "Ekosistem digital untuk event kampus ITB. Temukan seminar, workshop, lomba, dan kegiatan kampus lainnya.",
  keywords: ["ITB", "event kampus", "seminar", "workshop", "lomba", "mahasiswa"],
  openGraph: {
    title: "ITB Ticket",
    description: "Platform Event Kampus Institut Teknologi Bandung",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              fontSize: "14px",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(1,63,98,0.15)",
            },
            success: {
              iconTheme: { primary: "#013F62", secondary: "#FBE29D" },
            },
          }}
        />
      </body>
    </html>
  );
}