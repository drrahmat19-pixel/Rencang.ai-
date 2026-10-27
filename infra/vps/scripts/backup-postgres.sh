#!/usr/bin/env bash
set -Eeuo pipefail

stack_dir="${1:-}"
backup_dir="${2:-}"

if [[ -z "$stack_dir" || -z "$backup_dir" ]]; then
  echo "Pemakaian: $0 <folder-supabase-project> <folder-backup>" >&2
  exit 64
fi

compose_file="$stack_dir/docker-compose.yml"

if [[ ! -f "$compose_file" ]]; then
  echo "docker-compose.yml tidak ditemukan: $compose_file" >&2
  exit 66
fi

if [[ ! -d "$backup_dir" ]]; then
  echo "Folder backup tidak ditemukan: $backup_dir" >&2
  exit 66
fi

timestamp="$(date -u +%Y%m%d-%H%M%S)"
destination="$backup_dir/rencang-$timestamp.dump"
temporary="$destination.part"
compose=(docker compose --project-directory "$stack_dir" -f "$compose_file")

umask 077

cleanup() {
  rm -f -- "$temporary"
}
trap cleanup EXIT

"${compose[@]}" exec -T db pg_dump \
  -U postgres \
  -d postgres \
  --format=custom \
  --no-owner \
  --no-privileges >"$temporary"

if [[ ! -s "$temporary" ]]; then
  echo "Backup gagal atau file kosong." >&2
  exit 74
fi

mv -- "$temporary" "$destination"
trap - EXIT

echo "Backup selesai: $destination"

