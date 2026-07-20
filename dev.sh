#!/usr/bin/env bash
#
# Arranca TODO TechPrice Uruguay con un solo comando: Postgres + API + Web,
# con datos ya cargados. Es idempotente: podés correrlo las veces que quieras.
#
#   ./dev.sh        (o:  pnpm local)
#
# Después abrí:  http://localhost:8080
#
set -euo pipefail
cd "$(dirname "$0")"

info() { printf "\033[1;34m›\033[0m %s\n" "$1"; }
err()  { printf "\033[1;31m✗ %s\033[0m\n" "$1" >&2; }

# --- requisitos ------------------------------------------------------------
command -v pnpm >/dev/null 2>&1 || {
  err "Falta pnpm. Instalá Node ≥20 y ejecutá:  corepack enable"
  exit 1
}
command -v docker >/dev/null 2>&1 || {
  err "Falta Docker. Instalá Docker Desktop y abrilo antes de correr esto."
  exit 1
}
docker info >/dev/null 2>&1 || {
  err "Docker está instalado pero no corriendo. Abrí Docker Desktop y reintentá."
  exit 1
}

# --- configuración ---------------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
  info "Creé el archivo .env"
fi

if [ ! -d node_modules ]; then
  info "Instalando dependencias (solo la primera vez)…"
  pnpm install
fi

# --- base de datos ---------------------------------------------------------
info "Levantando Postgres…"
docker compose up -d

info "Esperando a que Postgres esté listo…"
until docker compose exec -T postgres pg_isready -U techprice >/dev/null 2>&1; do
  sleep 1
done

info "Aplicando migraciones…"
pnpm db:migrate:deploy

info "Cargando datos de demo…"
pnpm db:seed:demo

# --- app -------------------------------------------------------------------
info "Todo listo 🎉  Abrí:  http://localhost:8080   (Ctrl+C para frenar)"
pnpm dev
