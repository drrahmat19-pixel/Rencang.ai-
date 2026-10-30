import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { KangBisa } from "@/components/brand/kang-bisa";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/menu";

const activeFeatures: { icon: IconName; title: string; body: string; detail: string }[] = [
  { icon: "cash", title: "Kasir yang cepat dan aman", body: "Harga dan total dihitung server, transaksi tersimpan satu kali, serta struk siap dicetak.", detail: "Tunai, transfer, QRIS (pencatatan)" },
  { icon: "box", title: "Stok berbasis riwayat", body: "Setiap stok masuk, koreksi, penjualan, dan pembatalan tercatat tanpa menghapus jejak.", detail: "Peringatan stok menipis" },
  { icon: "chart", title: "Laporan yang mudah dibaca", body: "Pantau omzet, transaksi, estimasi laba kotor, dan produk terlaris dalam zona waktu WIB.", detail: "Data selesai, batal dikecualikan" },
  { icon: "users", title: "Tim dengan akses terpisah", body: "Pemilik, admin, kasir, dan staf stok hanya melihat serta mengubah hal yang sesuai perannya.", detail: "Dilengkapi log audit" },
];

const steps = [
  ["01", "Buat usaha", "Daftar, buat profil usaha, lalu akun Anda otomatis menjadi pemilik."],
  ["02", "Masukkan produk", "Tambahkan barang atau jasa, harga jual, modal, serta stok awal."],
  ["03", "Mulai berjualan", "Gunakan kasir, cetak struk, dan pantau usaha dari Beranda."],
];

function ProductPreview() {
  const metrics = [
    ["Omzet hari ini", "Rp1.850.000", "chart"],
    ["Transaksi", "27 struk", "cash"],
    ["Stok perlu dicek", "3 produk", "box"],
    ["Tim aktif", "4 akun", "users"],
  ] as const;

  return (
    <div className="relative mx-auto w-full max-w-[510px] pt-48 sm:pt-56 lg:mr-0">
      <div className="absolute inset-x-4 top-3 h-64 rounded-[32px] bg-[radial-gradient(circle_at_65%_45%,rgb(212_169_86/0.35),transparent_58%),linear-gradient(145deg,#f8eed9,#e4f0e9)] sm:h-72" />
      <div className="absolute right-0 top-0 z-[2] w-[260px] sm:w-[310px]"><KangBisa priority className="w-full drop-shadow-[0_18px_25px_rgb(23_66_54/0.18)]" /></div>
      <div className="absolute left-0 top-16 z-[3] max-w-[190px] rounded-[18px_18px_4px_18px] border border-white bg-white/90 p-3 shadow-card backdrop-blur sm:left-3 sm:top-20"><p className="font-accent text-sm font-bold text-primary-deep">“Tenang, biar Kang Bisa yang bantu.”</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-primary">Sahabat digital usaha</p></div>
      <div className="absolute -inset-8 top-36 rounded-[48px] bg-[radial-gradient(circle_at_center,rgb(213_170_85/0.2),transparent_66%)]" />
      <div className="gentle-float glass-surface relative z-10 rounded-[30px] p-2 sm:p-3">
        <div className="overflow-hidden rounded-[24px] border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-3">
              <BrandLogo className="w-[108px]" />
              <div>
                <p className="text-xs font-extrabold text-primary">Toko Berkah Rencang</p>
                <p className="text-[10px] text-muted">Beranda usaha · Mode demo</p>
              </div>
            </div>
            <span className="rounded-full border border-success/20 bg-primary-soft px-2.5 py-1 text-[9px] font-bold text-success">Aktif</span>
          </div>
          <div className="p-3 sm:p-4">
            <div className="noise-surface overflow-hidden rounded-[20px] p-4 text-white">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-start justify-center overflow-hidden rounded-[14px] bg-accent-soft"><KangBisa className="mt-1 w-14 max-w-none" alt="Kang Bisa" /></span>
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#f4d88e]">Kang Bisa · Ringkasan</p>
                  <p className="mt-1 font-accent text-lg font-bold">Sampurasun, usaha siap berjalan.</p>
                  <p className="mt-1 text-[10px] leading-5 text-white/70">Pekerjaan penting hari ini sudah dirangkum untuk Anda.</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-accent px-3 py-2 text-[10px] font-extrabold text-primary-deep">Buka kasir</span>
                <span className="rounded-full border border-white/25 px-3 py-2 text-[10px] font-bold">Lihat laporan</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {metrics.map(([label, value, icon], index) => (
                <div key={label} className="rounded-[16px] border border-line bg-white p-3 shadow-[0_5px_18px_rgb(6_47_37/0.05)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-medium text-muted">{label}</span>
                    <span className={`rounded-lg p-1.5 ${index === 2 ? "bg-accent-soft text-warning" : "bg-primary-soft text-primary"}`}><Icon name={icon} className="h-3.5 w-3.5" /></span>
                  </div>
                  <p className={`mt-2 text-sm font-extrabold sm:text-base ${index === 2 ? "text-warning" : "text-primary"}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[16px] border border-accent/35 bg-accent-soft p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent/25 text-warning"><Icon name="box" className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-bold">Stok perlu diperiksa</p><p className="text-[9px] text-muted">Tiga produk mencapai batas minimum.</p></div>
              <span className="text-sm text-primary" aria-hidden="true">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen text-ink">
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-white focus:px-4 focus:py-3">Lewati ke konten</a>

      <header className="sticky top-0 z-40 border-b border-white/60 bg-ivory/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="Rencang AI, beranda">
            <BrandLogo priority className="w-[128px] sm:w-[150px]" />
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-xs font-bold text-muted lg:flex">
            <a href="#fitur" className="transition-colors hover:text-primary">Fitur</a>
            <a href="#cara-kerja" className="transition-colors hover:text-primary">Cara kerja</a>
            <Link href="/panduan" className="transition-colors hover:text-primary">Panduan</Link>
            <a href="#roadmap" className="transition-colors hover:text-primary">Roadmap</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/masuk" className="hidden min-h-11 items-center px-3 text-xs font-bold text-primary sm:inline-flex">Masuk</Link>
            <Link href="/demo" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-primary px-4 text-xs font-bold text-white shadow-[0_8px_24px_rgb(11_79_60/0.2)] transition-colors hover:bg-primary-hover sm:px-5">Coba demo <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
        </div>
      </header>

      <main id="konten">
        <section className="relative isolate overflow-hidden">
          <div className="brand-grid pointer-events-none absolute inset-0 -z-10" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[540px] w-[540px] rounded-full bg-accent/10 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.03fr_.97fr] lg:py-28">
            <div>
              <p className="section-kicker">Operasional UMKM, dibuat lebih tenang</p>
              <h1 className="mt-6 max-w-3xl text-balance font-accent text-[2.65rem] font-bold leading-[1.05] tracking-[-0.035em] text-primary-deep sm:text-6xl lg:text-7xl">
                Usaha rapi,<br /><span className="italic text-primary">pikiran lebih ringan.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted sm:text-lg">Kasir, stok, laporan, dan tim menyatu dalam alur kerja yang sederhana—supaya Anda tahu apa yang terjadi dan apa yang perlu dilakukan berikutnya.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow-[0_12px_30px_rgb(11_79_60/0.22)] transition-colors hover:bg-primary-hover">Jelajahi demo interaktif <span className="ml-2" aria-hidden="true">→</span></Link>
                <a href="#cara-kerja" className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white/80 px-6 text-sm font-bold text-primary transition-colors hover:border-primary/40 hover:bg-white">Lihat cara kerjanya</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted">
                {["Mobile-first", "Data demo tidak disimpan", "Dibuat untuk alur UMKM"].map((item) => <span key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{item}</span>)}
              </div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section aria-label="Fondasi keamanan dan data" className="border-y border-line/80 bg-surface/70">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
            {[["Perhitungan server", "Total lebih konsisten"], ["Data per usaha", "Akses tetap terpisah"], ["Riwayat perubahan", "Mudah ditelusuri"], ["Zona waktu WIB", "Laporan lebih relevan"]].map(([title, body], index) => (
              <div key={title} className={`py-6 ${index % 2 ? "pl-5 sm:pl-8" : "pr-5 sm:pr-8"} ${index > 0 ? "md:border-l md:border-line md:pl-8" : ""}`}><p className="text-xs font-extrabold text-primary">{title}</p><p className="mt-1 text-[10px] text-muted">{body}</p></div>
            ))}
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="section-kicker">Satu alur kerja</p>
              <h2 className="mt-5 text-balance font-accent text-4xl font-bold leading-tight text-primary-deep sm:text-5xl">Bukan kumpulan menu. Sebuah ritme usaha.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted">Setiap bagian saling terhubung. Transaksi mengurangi stok, laporan membaca transaksi, dan peran tim menjaga siapa yang boleh melakukan apa.</p>
            </div>
            <div className="divide-y divide-line border-y border-line">
              {activeFeatures.map((feature, index) => (
                <article key={feature.title} className="group grid gap-4 py-7 sm:grid-cols-[64px_1fr_auto] sm:items-start sm:gap-5">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-primary/10 bg-primary-soft text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white"><Icon name={feature.icon} className="h-6 w-6" /></span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">0{index + 1}</p><h3 className="mt-1 text-lg font-extrabold text-ink">{feature.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-muted">{feature.body}</p></div>
                  <span className="self-center rounded-full border border-accent/35 bg-accent-soft px-3 py-1.5 text-[10px] font-bold text-primary sm:max-w-40 sm:text-center">{feature.detail}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="overflow-hidden bg-primary-deep text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div><p className="section-kicker !text-[#f0d58f]">Mulai tanpa alur rumit</p><h2 className="mt-5 max-w-2xl text-balance font-accent text-4xl font-bold leading-tight sm:text-5xl">Dari daftar sampai transaksi pertama, tiga langkah.</h2></div>
              <Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-extrabold text-primary-deep hover:bg-[#e3bd6b]">Coba alurnya <span className="ml-2" aria-hidden="true">→</span></Link>
            </div>
            <div className="mt-12 grid border-t border-white/15 md:grid-cols-3">
              {steps.map(([number, title, body], index) => <article key={number} className={`py-8 md:px-8 ${index > 0 ? "border-t border-white/15 md:border-l md:border-t-0" : "md:pl-0"}`}><span className="font-accent text-5xl italic text-accent">{number}</span><h3 className="mt-6 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/65">{body}</p></article>)}
            </div>
          </div>
        </section>

        <section id="roadmap" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="overflow-hidden rounded-[32px] border border-line bg-surface shadow-float">
            <div className="grid lg:grid-cols-[.85fr_1.15fr]">
              <div className="bg-accent-soft p-7 sm:p-10 lg:p-12"><p className="section-kicker">Roadmap yang jujur</p><h2 className="mt-5 font-accent text-3xl font-bold leading-tight text-primary-deep sm:text-4xl">AI menyusul setelah fondasi operasional stabil.</h2><p className="mt-4 text-sm leading-7 text-muted">Kami memisahkan fitur aktif dari pratinjau agar Anda selalu tahu mana yang sudah dapat dipakai dan mana yang masih disiapkan.</p></div>
              <div className="divide-y divide-line p-7 sm:p-10 lg:p-12">
                {[["chat", "CRM & WhatsApp", "Percakapan dan tindak lanjut pelanggan."], ["spark", "Kang Bisa AI", "Saran operasional dengan persetujuan pemilik."], ["users", "Otomasi pelanggan", "Segmentasi dan pengingat yang terukur."]].map(([icon, title, body]) => <div key={title} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"><span className="rounded-[14px] bg-primary-soft p-3 text-primary"><Icon name={icon as IconName} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{body}</p></div><span className="rounded-full bg-accent-soft px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-primary">Pratinjau</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:pb-28">
          <div className="noise-surface mx-auto max-w-6xl overflow-hidden rounded-[32px] px-6 py-12 text-center text-white shadow-float sm:px-12 sm:py-16">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#f0d58f]">Tanpa database, tanpa risiko</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-balance font-accent text-3xl font-bold sm:text-5xl">Rasakan dulu alurnya sebelum menyiapkan server.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">Mode demo memakai data contoh di browser dan tidak menyimpan perubahan.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/demo" className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-extrabold text-primary-deep">Buka demo interaktif</Link><Link href="/panduan" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-bold hover:bg-white/10">Baca panduan</Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-primary-deep text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_.6fr_.7fr]">
          <div><div className="inline-flex rounded-[14px] bg-ivory px-3 py-2"><BrandLogo className="w-[150px]" /></div><p className="mt-4 max-w-sm text-xs leading-6 text-white/55">Rencang usaha, biar Kang Bisa yang bantu.</p></div>
          <div><p className="text-xs font-bold">Jelajahi</p><div className="mt-4 flex flex-col gap-3 text-xs text-white/55"><Link href="/demo">Demo</Link><Link href="/panduan">Panduan</Link><Link href="/masuk">Masuk</Link></div></div>
          <div><p className="text-xs font-bold">Status produk</p><p className="mt-4 text-xs leading-6 text-white/55">MVP aktif untuk UI dan alur inti. Database produksi VPS disiapkan pada tahap berikutnya.</p></div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-[10px] text-white/40">© 2026 Rencang AI · Dibangun untuk UMKM Indonesia</div>
      </footer>
    </div>
  );
}

/* Legacy landing retained temporarily for visual comparison during this redesign.
export function HomeLegacy() {
  return <div className="min-h-screen bg-ivory text-ink">
    <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-white focus:px-4 focus:py-2">Lewati ke konten</a>
    <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-accent font-bold text-white">R</span><span><strong className="block text-sm text-primary">Rencang AI</strong><span className="block text-[9px] text-muted">Sobat Digital Usaha</span></span></Link>
        <nav aria-label="Navigasi landing" className="hidden items-center gap-6 text-xs font-semibold md:flex"><a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><Link href="/panduan">Panduan</Link><a href="#roadmap">Roadmap</a><a href="#faq">FAQ</a></nav>
        <div className="flex items-center gap-2"><Link href="/masuk" className="hidden rounded-control px-3 py-2 text-xs font-bold text-primary sm:block">Masuk</Link><Link href="/demo" className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-card">Coba Demo</Link></div>
      </div>
    </header>

    <main id="konten">
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d4a956]/15 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="relative z-10"><p className="inline-flex rounded-full border border-[#d4a956] bg-white px-3 py-1.5 text-[10px] font-bold text-primary">Dibangun untuk operasional UMKM Indonesia</p><h1 className="mt-5 max-w-2xl font-accent text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">Usaha lebih rapi.<br/>Keputusan lebih pasti.</h1><p className="mt-3 font-accent text-xl italic text-primary sm:text-2xl">“Biar Kang Bisa yang bantu.”</p><p className="mt-5 max-w-xl text-sm leading-7 text-muted">Rencang AI menyatukan kasir, produk, stok, laporan, dan tim usaha dalam satu aplikasi yang ringan. Mulai dari pekerjaan inti hari ini; otomatisasi pintar menyusul secara bertahap.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/demo" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white">Coba demo interaktif <span>→</span></Link><a href="#cara-kerja" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-bold text-primary"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary text-[9px]">▶</span>Lihat cara kerja</a></div><div className="mt-7 flex flex-wrap items-center gap-3 text-[10px] text-muted"><div className="flex -space-x-2">{["A", "B", "C", "D"].map((letter, index) => <span key={letter} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-ivory font-bold ${index % 2 ? "bg-[#d4a956] text-primary" : "bg-primary text-white"}`}>{letter}</span>)}</div><span>Data pada demo bersifat contoh dan tidak disimpan.</span></div></div>

          <div className="relative mx-auto w-full max-w-[460px]"><div className="absolute -inset-5 rounded-[32px] bg-primary/5 blur-xl"/><div className="relative rounded-[26px] border border-line bg-white p-3 shadow-2xl"><div className="flex items-center justify-between border-b border-line pb-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white">R</span><div><p className="text-[10px] font-bold">Toko Berkah Rencang</p><p className="text-[8px] text-muted">Beranda usaha · Mode demo</p></div></div><span className="h-7 w-7 rounded-full bg-ivory"/></div><div className="mt-3 rounded-[18px] bg-primary p-4 text-white"><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4a956] text-xs font-black text-primary">KB</span><div><p className="text-[8px] font-bold uppercase tracking-widest text-[#e8ca79]">Kang Bisa · Pratinjau</p><p className="mt-1 text-sm font-bold">Sampurasun, usaha Anda siap berjalan!</p><p className="mt-1 text-[9px] leading-relaxed text-white/70">Pantau pekerjaan penting tanpa berpindah aplikasi.</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><span className="rounded-full bg-[#d4a956] py-2 text-center text-[9px] font-bold text-primary">Buka Kasir</span><span className="rounded-full border border-white/30 py-2 text-center text-[9px] font-bold">Lihat Laporan</span></div></div><div className="mt-3 grid grid-cols-2 gap-2">{[["Omzet Hari Ini", "Rp1.850.000"], ["Transaksi", "27 Struk"], ["Stok Kritis", "3 Barang"], ["Tim Aktif", "4 Akun"]].map(([label,value], index) => <div key={label} className="rounded-card border border-line p-3"><div className={`mb-2 h-5 w-5 rounded-full ${index === 2 ? "bg-[#fff0e8]" : "bg-[#e8f3ed]"}`}/><p className="text-[8px] text-muted">{label}</p><p className={`mt-1 text-sm font-extrabold ${index === 2 ? "text-danger" : "text-primary"}`}>{value}</p></div>)}</div><div className="mt-3 flex items-center gap-3 rounded-card border border-[#e7cc80] bg-[#fff9e8] p-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4dfac] font-bold text-warning">!</span><div><p className="text-[10px] font-bold">Stok perlu diperiksa</p><p className="text-[8px] text-muted">Tiga produk sudah mencapai batas minimum.</p></div></div></div></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-5 grid max-w-6xl grid-cols-2 gap-2 px-4 sm:grid-cols-4">{[["Server", "Hitung total"], ["RLS", "Pisahkan data"], ["Audit", "Catat perubahan"], ["WIB", "Laporan lokal"]].map(([value,label]) => <div key={value} className="rounded-card border border-line bg-white p-4 text-center shadow-card"><p className="text-lg font-extrabold text-primary">{value}</p><p className="mt-1 text-[10px] text-muted">{label}</p></div>)}</section>

      <section id="fitur" className="mx-auto max-w-6xl px-4 py-20"><div className="mx-auto max-w-2xl text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Operasional inti yang sudah aktif</p><h2 className="mt-3 font-accent text-3xl font-bold">Satu tempat untuk menjalankan usaha sehari-hari</h2><p className="mt-3 text-sm leading-6 text-muted">Dirancang mobile-first agar mudah digunakan di meja kasir maupun saat memeriksa usaha dari ponsel.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{activeFeatures.map((feature) => <article key={feature.title} className="rounded-[20px] border border-line bg-white p-6 shadow-card"><span className="inline-flex rounded-control bg-[#e8f3ed] p-3 text-primary"><Icon name={feature.icon} className="h-6 w-6"/></span><h3 className="mt-4 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p><p className="mt-5 rounded-control bg-ivory p-3 text-[10px] font-semibold text-primary">✓ {feature.detail}</p></article>)}</div></section>

      <section id="cara-kerja" className="border-y border-line bg-white"><div className="mx-auto max-w-6xl px-4 py-20"><div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Mulai tanpa alur rumit</p><h2 className="mt-3 font-accent text-3xl font-bold">Tiga langkah menuju transaksi pertama</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{steps.map(([number,title,body]) => <article key={number} className="rounded-[20px] border border-line bg-ivory p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a956] text-xs font-black text-primary">{number}</span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></article>)}</div><div className="mt-8 text-center"><Link href="/demo" className="inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-bold text-white">Jelajahi sekarang →</Link></div></div></section>

      <section id="roadmap" className="bg-[#093c30] text-white"><div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-20 md:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e8ca79]">Roadmap setelah MVP</p><h2 className="mt-3 font-accent text-3xl font-bold">Otomatisasi hadir setelah fondasi operasional stabil</h2><p className="mt-4 text-sm leading-6 text-white/70">Kami sengaja memisahkan fitur masa depan dari fitur aktif agar pengalaman demo tetap jujur dan data usaha tetap terkendali.</p></div><div className="grid gap-3 sm:grid-cols-3">{[["chat", "CRM & WhatsApp", "Percakapan dan tindak lanjut pelanggan."], ["spark", "Kang Bisa AI", "Saran operasional dengan persetujuan pemilik."], ["users", "Otomasi pelanggan", "Segmentasi dan pengingat yang terukur."]].map(([icon,title,body]) => <article key={title} className="rounded-[18px] border border-white/15 bg-white/5 p-5"><Icon name={icon as IconName} className="h-6 w-6 text-[#e8ca79]"/><span className="mt-4 inline-block rounded-full bg-[#d4a956] px-2 py-1 text-[8px] font-bold text-primary">SEGERA</span><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/65">{body}</p></article>)}</div></div></section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-20"><div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Pertanyaan umum</p><h2 className="mt-3 font-accent text-3xl font-bold">Yang perlu diketahui sebelum mencoba</h2></div><div className="mt-8 space-y-3">{[["Apakah demo membutuhkan database?", "Tidak. Mode demo memakai data contoh di browser dan tidak menyimpan perubahan."], ["Fitur apa yang sudah menjadi bagian MVP?", "Akun usaha dan tim, produk, ledger stok, kasir, struk, riwayat, pembatalan, laporan, dan log audit."], ["Apakah pembayaran QRIS otomatis terverifikasi?", "Belum. Pada MVP, tunai, transfer, dan QRIS adalah pencatatan metode pembayaran—bukan konfirmasi otomatis dari bank."], ["Kapan CRM dan WhatsApp aktif?", "Setelah backend produksi, UAT, keamanan, dan operasional inti dinyatakan stabil." ]].map(([question,answer]) => <details key={question} className="group rounded-card border border-line bg-white p-4"><summary className="cursor-pointer list-none text-sm font-bold">{question}<span className="float-right text-primary group-open:rotate-45">+</span></summary><p className="mt-3 border-t border-line pt-3 text-sm leading-6 text-muted">{answer}</p></details>)}</div></section>

      <section className="bg-white px-4 py-16"><div className="mx-auto max-w-5xl overflow-hidden rounded-[26px] bg-primary p-8 text-center text-white shadow-2xl sm:p-12"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e8ca79]">Coba tanpa risiko</p><h2 className="mt-3 text-balance font-accent text-3xl font-bold">Lihat sendiri bagaimana Rencang AI bekerja</h2><p className="mx-auto mt-3 max-w-xl text-sm text-white/70">Tidak perlu database dan tidak ada data yang disimpan dalam mode demo.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/demo" className="rounded-full bg-[#d4a956] px-6 py-3 text-sm font-bold text-primary hover:bg-[#e3c270]">Buka Demo Interaktif</Link><Link href="/panduan" className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">Baca Panduan</Link><Link href="/daftar" className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">Daftar Usaha</Link></div></div></section>
    </main>

    <footer className="bg-[#062f24] text-white"><div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3"><div><p className="font-accent text-lg font-bold">Rencang AI</p><p className="mt-2 max-w-xs text-xs leading-5 text-white/60">Sobat digital untuk operasional usaha yang lebih rapi dan dapat ditelusuri.</p></div><div><p className="text-xs font-bold">Navigasi</p><div className="mt-3 flex flex-col gap-2 text-xs text-white/60"><a href="#fitur">Fitur aktif</a><a href="#cara-kerja">Cara kerja</a><Link href="/panduan">Panduan</Link><Link href="/demo">Demo</Link></div></div><div><p className="text-xs font-bold">Status produk</p><p className="mt-3 text-xs leading-5 text-white/60">MVP dalam pengembangan. Database produksi dan UAT dijalankan pada tahap berikutnya.</p></div></div><div className="border-t border-white/10 py-4 text-center text-[9px] text-white/45">© 2026 Rencang AI · Dibangun untuk UMKM Indonesia</div></footer>
  </div>;
}
*/
