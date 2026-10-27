import type { Metadata } from "next";
import { DemoApp } from "./demo-app";

export const metadata: Metadata = {
  title: "Demo Tampilan",
  description: "Pratinjau interaktif Rencang AI tanpa koneksi database.",
};

export default function DemoPage() {
  return <DemoApp />;
}
