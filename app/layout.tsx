import type { Metadata } from "next";
import { Outfit, Syne, DM_Serif_Display, JetBrains_Mono } from "next/font/google";

import { PageTransitionLoader } from "@/components/page-transition-loader";
import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap"
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  title: "DocuVerify UNY — Sistem Verifikasi Keaslian Dokumen Akademik",
  description: "Sistem Verifikasi Keaslian Dokumen Akademik Universitas Negeri Yogyakarta. Pastikan keaslian dokumen akademik Anda melalui hash kriptografis yang aman dan transparan."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${outfit.variable} ${syne.variable} ${dmSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <PageTransitionLoader />
        {children}
      </body>
    </html>
  );
}
