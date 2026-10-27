import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rencang AI — Operasional UMKM",
    short_name: "Rencang AI",
    description: "Kasir, produk, stok, laporan, dan tim usaha untuk UMKM Indonesia.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f5ec",
    theme_color: "#0e4d3a",
    lang: "id-ID",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/rencang-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/rencang-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
