import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div className="text-center">
        <p className="font-accent text-3xl font-bold text-primary">Rencang AI</p>
        <p className="mt-1 text-sm text-muted">Kasir, produk, dan stok untuk usaha Anda.</p>
      </div>
      <Card className="p-6">{children}</Card>
    </main>
  );
}
