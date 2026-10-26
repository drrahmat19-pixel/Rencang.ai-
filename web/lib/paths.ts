/** Rute yang boleh dibuka tanpa login. */
export const PUBLIC_PATHS = ["/masuk", "/daftar"];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

/** Terima hanya path internal ("/x"), tolak URL luar ("//evil.com", "https://..."). */
export function safeNext(next: string | null | undefined, fallback = "/beranda"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
