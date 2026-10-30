import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Rencang AI", template: "%s | Rencang AI" },
  description: "Kasir, produk, stok, laporan, dan tim usaha untuk UMKM Indonesia.",
  applicationName: "Rencang AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Rencang AI" },
  icons: { icon: "/brand/rencang-app-icon.png", apple: "/brand/rencang-app-icon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e4d3a" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full bg-ivory text-ink">{children}<ServiceWorkerRegister enabled={process.env.NODE_ENV === "production"} /></body>
    </html>
  );
}
