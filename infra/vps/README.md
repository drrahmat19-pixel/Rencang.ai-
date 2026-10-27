# PostgreSQL Rencang AI di VPS

## Keputusan arsitektur

Gunakan **self-hosted Supabase** di VPS. Database utamanya tetap PostgreSQL milik sendiri, sementara Supabase menyediakan Auth, REST/RPC API, connection pooler, dan peran database yang sudah dipakai aplikasi.

Jangan memasang PostgreSQL polos untuk versi aplikasi saat ini. Migration Rencang AI memakai `auth.users`, `auth.uid()`, peran `authenticated`, dan RLS Supabase. PostgreSQL polos memerlukan penggantian sistem login dan penulisan ulang lapisan keamanan tersebut.

## Topologi produksi

```text
Pengguna
  | HTTPS
  +-- app.example.com  -> aplikasi Next.js
  +-- api.example.com  -> reverse proxy -> Supabase API gateway :8000
                                           |
                                           +-> Auth / REST / RPC
                                           +-> PostgreSQL (jaringan internal)
```

Port PostgreSQL `5432` dan gateway `8000` tidak boleh dibuka untuk publik. Hanya `22` (SSH, sebaiknya dibatasi IP), `80`, dan `443` yang dibuka di firewall. Studio juga harus dilindungi dengan password kuat dan idealnya dibatasi lewat VPN atau IP allowlist.

## Kebutuhan VPS

Untuk seluruh stack, gunakan minimal 2 CPU, RAM 4 GB, dan SSD 40 GB. Untuk produksi disarankan 4 CPU, RAM 8 GB atau lebih, dan SSD 80 GB atau lebih. Siapkan juga:

- Linux server yang masih mendapat pembaruan keamanan
- domain/subdomain untuk aplikasi dan API
- Git, Docker Engine, serta Docker Compose
- SMTP produksi untuk email daftar/reset password
- lokasi backup di luar VPS (object storage atau server kedua)

## 1. Pasang stack resmi

Masuk ke VPS memakai user non-root yang memiliki akses Docker. Installer cepat resmi mendukung keluarga Debian/Ubuntu dan RHEL/Fedora:

```bash
mkdir -p ~/services/rencang
cd ~/services/rencang
curl -fsSL https://supabase.link/setup.sh -o setup-supabase.sh
less setup-supabase.sh
sh setup-supabase.sh
```

Saat diminta, gunakan nilai seperti berikut:

```dotenv
SUPABASE_PUBLIC_URL=https://api.example.com
API_EXTERNAL_URL=https://api.example.com/auth/v1
SITE_URL=https://app.example.com
PROXY_DOMAIN=api.example.com
```

Installer resmi membuat folder `supabase-project`, menghasilkan secret acak, menyiapkan kunci autentikasi, dan mengambil image Docker yang kompatibel. Simpan `.env` yang dihasilkan hanya di VPS; jangan commit ke Git.

Mulai stack dan pastikan seluruh service sehat:

```bash
cd ~/services/rencang/supabase-project
sh run.sh start
docker compose ps
sh run.sh secrets
```

Jika installer menambahkan user ke grup Docker, logout lalu login kembali sebelum menjalankan perintah Docker.

## 2. Pasang HTTPS dan firewall

Arahkan DNS `api.example.com` ke IP VPS. Stack resmi sudah menyediakan konfigurasi Caddy yang menangani reverse proxy, WebSocket, sertifikat TLS, pembaruan sertifikat, dan pengalihan HTTP ke HTTPS:

```bash
cd ~/services/rencang/supabase-project
sh run.sh config add caddy
sh run.sh start
curl -I https://api.example.com/auth/v1/
```

Respons `401` dari pengecekan terakhir berarti endpoint Auth dapat dijangkau. Jangan memakai sertifikat self-signed untuk produksi.

Contoh aturan firewall Ubuntu (sesuaikan port SSH lebih dahulu agar tidak terkunci):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp
sudo ufw deny 8000/tcp
sudo ufw enable
```

Sebelum mengaktifkan firewall, uji bahwa sesi SSH kedua dapat masuk. Jika proxy berada di container atau server lain, sesuaikan jaringan dan jangan menerapkan contoh ini mentah-mentah.

## 3. Konfigurasi email Auth

Isi SMTP produksi pada `~/services/rencang/supabase-project/.env`:

```dotenv
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=isi-di-vps
SMTP_PASS=isi-di-vps
SMTP_SENDER_NAME=Rencang AI
```

Tambahkan URL aplikasi ke daftar redirect Auth, kemudian terapkan perubahan:

```bash
cd ~/services/rencang/supabase-project
sh run.sh recreate auth
```

Jangan menaruh password SMTP, password database, atau secret key di repository.

## 4. Terapkan migration Rencang AI

Clone repository aplikasi pada VPS, lalu jalankan skrip migration. Argumen pertama adalah folder stack Supabase dan argumen kedua adalah folder migration aplikasi.

```bash
git clone https://github.com/drrahmat19-pixel/Rencang.ai-.git ~/apps/rencang-ai
cd ~/apps/rencang-ai
chmod +x infra/vps/scripts/*.sh
./infra/vps/scripts/apply-migrations.sh \
  ~/services/rencang/supabase-project \
  ~/apps/rencang-ai/supabase/migrations
```

Skrip mencatat nama dan checksum setiap migration. File yang sudah diterapkan akan dilewati; migration yang sudah pernah diterapkan tetapi isinya berubah akan ditolak. Buat file migration baru untuk setiap perubahan skema produksi.

## 5. Hubungkan aplikasi

Ambil nilai dari perintah `sh run.sh secrets`, lalu isi environment aplikasi Next.js:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=nilai-SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=nilai-SUPABASE_SECRET_KEY
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` aman digunakan browser. `SUPABASE_SERVICE_ROLE_KEY` adalah secret dan tidak boleh diberi awalan `NEXT_PUBLIC_`, dicetak ke log, atau dimasukkan ke bundle browser.

Restart deployment aplikasi setelah environment berubah. Uji alur berikut:

1. Daftar dan login.
2. Buat usaha baru.
3. Tambah produk dan stok.
4. Pastikan user dari usaha lain tidak dapat membaca data tersebut.

## 6. Backup harian

Buat folder backup yang hanya dapat dibaca administrator:

```bash
sudo install -d -m 700 /var/backups/rencang-postgres
```

Jalankan backup manual:

```bash
./infra/vps/scripts/backup-postgres.sh \
  ~/services/rencang/supabase-project \
  /var/backups/rencang-postgres
```

Jadwalkan skrip sekali sehari dengan cron/systemd timer, lalu kirim hasilnya ke penyimpanan di luar VPS. Backup yang hanya berada pada VPS yang sama bukan perlindungan dari kehilangan server. Jika fitur Storage dipakai nanti, backup juga isi folder/object storage karena dump PostgreSQL hanya menyimpan metadata Storage. Lakukan uji restore berkala pada instance terpisah.

Contoh restore ke database kosong (perintah ini menimpa objek yang bentrok, jadi jangan jalankan pada produksi tanpa prosedur pemulihan):

```bash
cat /var/backups/rencang-postgres/rencang-YYYYMMDD-HHMMSS.dump \
  | docker compose -f ~/services/rencang/supabase-project/docker-compose.yml \
      exec -T db pg_restore -U postgres -d postgres --clean --if-exists
```

## 7. Operasional rutin

- Pantau ruang disk, RAM, health container, dan masa berlaku TLS.
- Jalankan minor update keamanan secara rutin.
- Sebelum upgrade Supabase atau PostgreSQL, baca catatan rilis dan buat backup teruji.
- Putar ulang secret jika pernah bocor; setelah rotasi, perbarui environment aplikasi.
- Jangan memakai `reset.sh` pada produksi karena perintah itu menghapus data dan volume.

## Checklist sebelum go-live

- [ ] DNS aplikasi dan API aktif
- [ ] HTTPS valid dan HTTP dialihkan ke HTTPS
- [ ] Port `5432` dan `8000` tidak dapat diakses publik
- [ ] Password Studio dan seluruh secret sudah diganti dari contoh
- [ ] SMTP produksi berfungsi
- [ ] Migration berhasil diterapkan
- [ ] Login, tenant, produk, dan stok lolos smoke test
- [ ] Backup otomatis tersimpan di luar VPS
- [ ] Restore backup sudah pernah diuji

