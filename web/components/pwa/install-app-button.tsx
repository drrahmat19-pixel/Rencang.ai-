"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (!prompt) return null;
  const install = async () => {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setMessage(choice.outcome === "accepted" ? "Rencang AI berhasil ditambahkan." : "Pemasangan dibatalkan.");
    setPrompt(null);
  };
  return <div className="text-center"><button type="button" onClick={install} className="min-h-11 rounded-full border border-primary px-5 text-sm font-bold text-primary hover:bg-ivory">Pasang Aplikasi</button><p aria-live="polite" className="mt-2 text-xs text-muted">{message}</p></div>;
}
