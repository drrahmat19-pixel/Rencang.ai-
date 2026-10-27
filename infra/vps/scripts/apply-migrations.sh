#!/usr/bin/env bash
set -Eeuo pipefail

stack_dir="${1:-}"
migrations_dir="${2:-}"

if [[ -z "$stack_dir" || -z "$migrations_dir" ]]; then
  echo "Pemakaian: $0 <folder-supabase-project> <folder-migrations>" >&2
  exit 64
fi

compose_file="$stack_dir/docker-compose.yml"

if [[ ! -f "$compose_file" ]]; then
  echo "docker-compose.yml tidak ditemukan: $compose_file" >&2
  exit 66
fi

if [[ ! -d "$migrations_dir" ]]; then
  echo "Folder migration tidak ditemukan: $migrations_dir" >&2
  exit 66
fi

compose=(docker compose --project-directory "$stack_dir" -f "$compose_file")

if ! "${compose[@]}" exec -T db pg_isready -U postgres -d postgres >/dev/null; then
  echo "PostgreSQL belum siap. Jalankan 'sh run.sh start' dari folder Supabase." >&2
  exit 69
fi

"${compose[@]}" exec -T db psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
create schema if not exists app_meta;
revoke all on schema app_meta from public;
create table if not exists app_meta.schema_migrations (
  version text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
revoke all on app_meta.schema_migrations from public;
SQL

shopt -s nullglob
migration_files=("$migrations_dir"/*.sql)

if [[ ${#migration_files[@]} -eq 0 ]]; then
  echo "Tidak ada file .sql di $migrations_dir" >&2
  exit 66
fi

for migration in "${migration_files[@]}"; do
  version="$(basename "$migration")"
  if [[ ! "$version" =~ ^[0-9A-Za-z._-]+\.sql$ ]]; then
    echo "Nama migration tidak aman: $version" >&2
    exit 65
  fi
  checksum="$(sha256sum "$migration" | awk '{print $1}')"
  recorded_checksum="$(
    "${compose[@]}" exec -T db psql -X -U postgres -d postgres -At \
      -v version="$version" \
      -c "select checksum from app_meta.schema_migrations where version = :'version';"
  )"

  if [[ -n "$recorded_checksum" ]]; then
    if [[ "$recorded_checksum" != "$checksum" ]]; then
      echo "DITOLAK: $version sudah diterapkan tetapi checksum berubah." >&2
      echo "Buat file migration baru; jangan ubah riwayat production." >&2
      exit 65
    fi
    echo "Lewati $version (sudah diterapkan)"
    continue
  fi

  echo "Terapkan $version"
  {
    echo "begin;"
    cat "$migration"
    printf "\ninsert into app_meta.schema_migrations (version, checksum) values ('%s', '%s');\n" \
      "$version" "$checksum"
    echo "commit;"
  } | "${compose[@]}" exec -T db psql -X -U postgres -d postgres -v ON_ERROR_STOP=1
done

echo "Semua migration berhasil diterapkan."

