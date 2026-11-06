-- ===========================================================================
-- 002_preorder_requests.sql — solicitudes que no terminan en un cobro.
--
-- Tres caminos llegan acá, y los tres son interés comercial real que no puede
-- perderse en un mail:
--
--   preventa    alguien eligió un producto en preventa (hoy Wizor 360) y pidió
--               sumarse. Trae la cotización completa: qué configuró y cuánto
--               habría pagado.
--   sin_cargo   una fundación u ONG de neurodivergencia. No hay nada que
--               cobrar, hay que activarle la plataforma.
--   demo        excede el autoservicio por dotación o por operar en varios
--               países. Necesita una demo o una propuesta.
--
-- La cotización ya está guardada en `quotes` con su catálogo clavado: acá solo
-- vive el seguimiento comercial.
-- ===========================================================================

create table requests (
  id               uuid primary key default gen_random_uuid(),
  public_id        text not null unique,

  kind             text not null check (kind in ('preventa', 'sin_cargo', 'demo')),

  quote_id         uuid not null references quotes (id),
  organization_id  uuid references organizations (id),

  contact_name     text,
  contact_email    text not null,
  contact_phone    text,
  message          text,

  -- Productos pedidos, para no tener que abrir la cotización en el listado.
  products         text[] not null default '{}',

  status           text not null default 'nueva'
                   check (status in ('nueva', 'contactada', 'aceptada', 'rechazada', 'convertida')),

  -- Cuando una solicitud de preventa se convierte en contrato.
  subscription_id  uuid references subscriptions (id),

  assigned_to      uuid references users (id),
  internal_note    text,
  decided_at       timestamptz,
  decided_by       uuid references users (id),

  source_ip        inet,
  created_at       timestamptz not null default now()
);

create index requests_status_ix on requests (kind, status, created_at);
create index requests_quote_ix on requests (quote_id);
create index requests_email_ix on requests (lower(contact_email));

-- Una cotización genera una sola solicitud: evita duplicados si el cliente
-- aprieta el botón dos veces.
create unique index requests_one_per_quote on requests (quote_id);
