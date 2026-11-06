#!/usr/bin/env bash
# Levanta el Postgres de desarrollo si no está corriendo.
# En Vercel esto no se usa: ahí la base la provee la plataforma.
set -e
export PATH=/usr/lib/postgresql/16/bin:$PATH
DATA=/tmp/pgdata
if su claude -s /bin/bash -c "PATH=$PATH pg_ctl -D $DATA status" >/dev/null 2>&1; then
  echo "Postgres ya está corriendo."
else
  su claude -s /bin/bash -c \
    "PATH=$PATH setsid pg_ctl -D $DATA -o '-p 5433 -k /tmp/pgrun -c listen_addresses=127.0.0.1' -l $DATA/log start" \
    >/dev/null 2>&1
  sleep 3
  echo "Postgres levantado en 5433."
fi
