-- ===========================================================================
-- 001_init.sql — esquema inicial del sistema comercial de Wizor.
--
-- Dos decisiones de diseño gobiernan todo lo demás:
--
--   1. Un catálogo de precios publicado es INMUTABLE. El back office publica
--      versiones nuevas, nunca edita una vigente. Un trigger lo impide a nivel
--      de base de datos, no solo en la aplicación.
--
--   2. Cada cotización y cada suscripción queda CLAVADA a la versión del
--      catálogo con la que se emitió. Subir precios mañana no reprecia a nadie
--      que ya firmó. Sin esto, el programa fundador —precio fijo por 36 meses—
--      no se puede sostener.
-- ===========================================================================

-- gen_random_uuid() es parte del núcleo de Postgres desde la versión 13:
-- no hace falta la extensión pgcrypto.

-- ---------------------------------------------------------------------------
-- Equipo comercial y atribución
-- ---------------------------------------------------------------------------

create table people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  role        text not null check (role in ('conector', 'desarrollador', 'vendedor', 'socio')),
  territory   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index people_email_uq on people (lower(email));

-- El código viaja en el link del vendedor y se guarda en la cotización. Si no
-- se captura en el momento del pago, después no hay forma de reconstruir de
-- quién fue la venta.
create table attribution_codes (
  code        text primary key,
  person_id   uuid not null references people (id),
  label       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index attribution_codes_person_ix on attribution_codes (person_id);

-- ---------------------------------------------------------------------------
-- Usuarios del back office
-- ---------------------------------------------------------------------------

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  name           text not null,
  role           text not null check (role in ('admin', 'comercial', 'lectura')),
  active         boolean not null default true,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now()
);
create unique index users_email_uq on users (lower(email));

-- ---------------------------------------------------------------------------
-- Catálogo de precios versionado
-- ---------------------------------------------------------------------------

-- `model` es el documento completo del modelo comercial: curvas de volumen,
-- factores por categoría, bandas, mínimo anual, productos, dispositivos y
-- escalas de comisión. Se valida contra lib/pricebook/schema.js antes de
-- publicarse. Guardarlo como un documento y no como tablas normalizadas hace
-- que clavar un contrato a una versión sea trivial y que el back office pueda
-- mostrar diferencias entre versiones.
create table price_books (
  id            uuid primary key default gen_random_uuid(),
  version       integer not null,
  status        text not null check (status in ('draft', 'published', 'archived')),
  model         jsonb not null,
  note          text,
  created_by    uuid references users (id),
  created_at    timestamptz not null default now(),
  published_by  uuid references users (id),
  published_at  timestamptz
);

create unique index price_books_version_uq on price_books (version);

-- Un solo borrador a la vez: evita que dos personas editen catálogos
-- paralelos y publiquen pisándose.
create unique index price_books_single_draft on price_books ((status)) where status = 'draft';

-- Un solo catálogo publicado vigente.
create unique index price_books_single_published on price_books ((status)) where status = 'published';

-- Inmutabilidad: una vez publicado, el modelo no se toca nunca más. Lo único
-- permitido es archivarlo cuando se publica su sucesor.
create or replace function price_books_guard() returns trigger as $$
begin
  if old.status = 'published' then
    if new.status = 'archived' and new.model::text = old.model::text then
      return new;
    end if;
    raise exception
      'El catálogo v% está publicado y no se puede modificar. Creá un borrador nuevo y publicalo.',
      old.version;
  end if;

  if old.status = 'archived' then
    raise exception 'El catálogo v% está archivado y es de solo lectura.', old.version;
  end if;

  return new;
end $$ language plpgsql;

create trigger price_books_no_edit
  before update on price_books
  for each row execute function price_books_guard();

create or replace function price_books_no_delete() returns trigger as $$
begin
  if old.status <> 'draft' then
    raise exception
      'El catálogo v% no se puede borrar: hay cotizaciones y contratos que lo referencian.',
      old.version;
  end if;
  return old;
end $$ language plpgsql;

create trigger price_books_delete_guard
  before delete on price_books
  for each row execute function price_books_no_delete();

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------

create table organizations (
  id             uuid primary key default gen_random_uuid(),
  name           text,
  tax_id         text,
  country        text not null,
  industry       text not null,
  headcount      integer not null check (headcount > 0),
  sites          integer not null default 1 check (sites > 0),
  countries      integer not null default 1 check (countries > 0),
  contact_name   text,
  contact_email  text not null,
  created_at     timestamptz not null default now()
);
create index organizations_email_ix on organizations (lower(contact_email));

-- ---------------------------------------------------------------------------
-- Cotizaciones
-- ---------------------------------------------------------------------------

-- `result` se guarda congelado. Una cotización es una oferta: el número que
-- vio el cliente es el que vale, aunque después cambie el catálogo o la
-- cotización del dólar. Nunca se recalcula.
create table quotes (
  id                uuid primary key default gen_random_uuid(),
  public_id         text not null unique,
  price_book_id     uuid not null references price_books (id),
  source            text not null check (source in ('vendedor', 'cliente', 'backoffice')),
  input             jsonb not null,
  result            jsonb not null,
  display_currency  text not null default 'USD',
  fx_rate           numeric(18, 6),
  fx_source         text,
  attribution_code  text references attribution_codes (code),
  organization_id   uuid references organizations (id),
  status            text not null default 'abierta'
                    check (status in ('abierta', 'vencida', 'aceptada', 'perdida')),
  expires_at        timestamptz not null,
  created_at        timestamptz not null default now()
);
create index quotes_created_ix on quotes (created_at desc);
create index quotes_attribution_ix on quotes (attribution_code);
create index quotes_org_ix on quotes (organization_id);

-- ---------------------------------------------------------------------------
-- Suscripciones
-- ---------------------------------------------------------------------------

create table subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references organizations (id),
  quote_id                 uuid not null references quotes (id),

  -- El clavo. Mientras esta suscripción viva, su precio se interpreta contra
  -- esta versión del catálogo y ninguna otra.
  price_book_id            uuid not null references price_books (id),

  stripe_customer_id       text,
  stripe_subscription_id   text unique,
  stripe_checkout_session  text unique,

  status                   text not null default 'pendiente_pago'
                           check (status in ('pendiente_pago', 'activa', 'morosa', 'cancelada')),

  term_months              integer not null default 12,
  -- Programa fundador: fecha hasta la cual el precio no se puede mover.
  price_locked_until       date,

  monthly_amount_usd       numeric(12, 2) not null check (monthly_amount_usd >= 0),
  annual_amount_usd        numeric(12, 2) not null check (annual_amount_usd >= 0),
  devices_amount_usd       numeric(12, 2) not null default 0,

  -- Prueba de que el cliente aceptó el compromiso de 12 meses. Sin esto el
  -- plazo no es exigible frente a una PyME que compró en autoservicio.
  terms_version            text,
  terms_accepted_at        timestamptz,
  terms_accepted_ip        inet,

  started_at               timestamptz,
  renews_at                timestamptz,
  cancelled_at             timestamptz,
  created_at               timestamptz not null default now()
);
create index subscriptions_org_ix on subscriptions (organization_id);
create index subscriptions_status_ix on subscriptions (status);

-- ---------------------------------------------------------------------------
-- Comisiones
-- ---------------------------------------------------------------------------

create table commissions (
  id               uuid primary key default gen_random_uuid(),
  subscription_id  uuid not null references subscriptions (id),
  person_id        uuid not null references people (id),
  role             text not null,
  pct              numeric(6, 4) not null,
  base_amount_usd  numeric(12, 2) not null,
  amount_usd       numeric(12, 2) not null,
  status           text not null default 'devengada'
                   check (status in ('devengada', 'aprobada', 'pagada', 'anulada')),
  note             text,
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index commissions_person_ix on commissions (person_id, status);
create unique index commissions_once_per_role on commissions (subscription_id, person_id, role);

-- ---------------------------------------------------------------------------
-- Alta en la plataforma Wizor
-- ---------------------------------------------------------------------------

-- Mientras la API de alta no exista, el pago deja acá un pendiente que Wizor
-- resuelve a mano. Cuando la API esté, este mismo registro se procesa solo y
-- nada aguas arriba cambia.
create table provisioning_jobs (
  id                   uuid primary key default gen_random_uuid(),
  subscription_id      uuid not null references subscriptions (id),
  status               text not null default 'pendiente'
                       check (status in ('pendiente', 'en_curso', 'listo', 'fallido', 'manual')),
  payload              jsonb not null,
  attempts             integer not null default 0,
  last_error           text,
  external_account_id  text,
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);
create index provisioning_jobs_status_ix on provisioning_jobs (status, created_at);

-- ---------------------------------------------------------------------------
-- Idempotencia de Stripe
-- ---------------------------------------------------------------------------

-- Stripe reintenta los webhooks. Sin esta tabla, un reintento crea la
-- suscripción dos veces y paga la comisión dos veces.
create table stripe_events (
  id            text primary key,
  type          text not null,
  payload       jsonb,
  processed_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------------

-- Todo cambio de precio queda registrado con quién, cuándo y qué cambió.
create table audit_log (
  id           bigserial primary key,
  actor_id     uuid references users (id),
  actor_email  text,
  action       text not null,
  entity       text not null,
  entity_id    text,
  before       jsonb,
  after        jsonb,
  ip           inet,
  at           timestamptz not null default now()
);
create index audit_log_entity_ix on audit_log (entity, entity_id, at desc);
create index audit_log_at_ix on audit_log (at desc);
