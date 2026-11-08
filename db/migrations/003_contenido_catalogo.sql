-- ===========================================================================
-- 003_contenido_catalogo.sql — fichas de productos y equipamiento.
--
-- La imagen, la descripción y las características que ve el cliente cuando el
-- vendedor abre la ficha de un servicio o de un equipo.
--
-- POR QUÉ NO VA EN EL CATÁLOGO DE PRECIOS
-- El catálogo es inmutable y versionado porque los contratos dependen de él.
-- Una descripción no cambia lo que nadie paga. Si el contenido viviera ahí,
-- corregir una errata obligaría a publicar una versión nueva del catálogo y
-- el historial de precios se llenaría de cambios que no son precios.
--
-- Acá se edita y se guarda, sin ceremonia. La clave apunta a un producto o a
-- un equipo del catálogo vigente, pero sin llave foránea a propósito: el
-- contenido sobrevive a los cambios de versión del catálogo.
-- ===========================================================================

create table contenido_catalogo (
  clave        text primary key,
  tipo         text not null check (tipo in ('producto', 'equipo')),

  -- Ruta de la imagen bajo public/. Null mientras no haya foto definitiva.
  imagen       text,

  -- { es: {...}, en: {...}, pt: {...} }, cada uno con resumen, rasgos y datos.
  -- Se guarda como documento porque los tres idiomas se editan juntos y
  -- siempre se leen juntos.
  textos       jsonb not null default '{}'::jsonb,

  -- Mientras es true, la ficha se muestra marcada como borrador: el texto
  -- salió de la web y nadie de Wizor lo revisó todavía.
  borrador     boolean not null default true,

  actualizado_por  uuid references users (id),
  actualizado_en   timestamptz not null default now()
);

create index contenido_catalogo_tipo_ix on contenido_catalogo (tipo);

-- Toda edición de contenido queda registrada igual que un cambio de precio.
create or replace function contenido_marca_tiempo() returns trigger as $$
begin
  new.actualizado_en := now();
  return new;
end $$ language plpgsql;

create trigger contenido_catalogo_tocado
  before update on contenido_catalogo
  for each row execute function contenido_marca_tiempo();
