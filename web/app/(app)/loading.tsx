export default function AppLoading() {
  return <div aria-busy="true" aria-label="Memuat data usaha" className="animate-pulse space-y-4"><div className="h-8 w-56 rounded-control bg-line"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-card border border-line bg-line/60" />)}</div><div className="h-64 rounded-card border border-line bg-line/60"/><p className="sr-only">Memuat data usaha…</p></div>;
}
