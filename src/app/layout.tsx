import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidAgent - Akıllı Şartname & İhale Dökümanı İnceleme Asistanı",
  description:
    "KOBİ'lerin veya orta ölçekli şirketlerin teknik şartnameleri ve ihale dosyalarını inceleme sürecini kolaylaştıran yapay zeka asistanı.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

