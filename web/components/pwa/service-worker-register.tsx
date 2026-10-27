"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Aplikasi tetap dapat digunakan secara online jika registrasi offline gagal.
    });
  }, [enabled]);
  return null;
}
