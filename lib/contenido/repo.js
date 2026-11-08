/* ==========================================================================
   repo.js — lectura y escritura de las fichas.

   A diferencia del catálogo de precios, acá no hay borradores ni
   publicación: el contenido se edita y se guarda. Lo que sí hay es el sello
   `borrador`, que marca una ficha cuyo texto todavía no revisó nadie de
   Wizor, y que la pantalla muestra como tal.
   ========================================================================== */

import { query, one } from '../db.js';
import { CONTENIDO_INICIAL } from './seed.js';

/**
 * Todas las fichas, indexadas por clave.
 *
 * Si la tabla todavía no existe —la migración 003 no corrió en ese entorno—
 * devuelve vacío en lugar de fallar. Una ficha es material de apoyo; el
 * cotizador es el negocio. Un deploy al que le falta la migración tiene que
 * quedarse sin fichas, no sin cotizador.
 *
 * Se atrapa SOLO 42P01 (undefined_table). Cualquier otro error de base sí
 * sube: una conexión caída o un permiso mal puesto no se disimulan.
 */
export async function fichas() {
  try {
    const { rows } = await query(
      'select clave, tipo, imagen, textos, borrador from contenido_catalogo');
    return Object.fromEntries(rows.map((r) => [r.clave, r]));
  } catch (e) {
    if (e?.code === '42P01') {
      console.warn('[contenido] falta la tabla contenido_catalogo: corré npm run db:migrate');
      return {};
    }
    throw e;
  }
}

export async function ficha(clave) {
  return one(
    'select clave, tipo, imagen, textos, borrador from contenido_catalogo where clave = $1',
    [clave]);
}

/** Guarda una ficha. Crea la fila si no existía. */
export async function guardarFicha({ clave, tipo, imagen, textos, borrador, usuario }) {
  await query(
    `insert into contenido_catalogo (clave, tipo, imagen, textos, borrador, actualizado_por)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (clave) do update set
       tipo = excluded.tipo, imagen = excluded.imagen, textos = excluded.textos,
       borrador = excluded.borrador, actualizado_por = excluded.actualizado_por`,
    [clave, tipo, imagen ?? null, JSON.stringify(textos ?? {}), borrador !== false, usuario ?? null]);
}

/** Carga el contenido inicial. No pisa lo que ya esté cargado. */
export async function sembrarContenido() {
  let nuevas = 0;
  for (const f of CONTENIDO_INICIAL) {
    const { rowCount } = await query(
      `insert into contenido_catalogo (clave, tipo, imagen, textos)
       values ($1, $2, $3, $4) on conflict (clave) do nothing`,
      [f.clave, f.tipo, f.imagen, JSON.stringify(f.textos)]);
    nuevas += rowCount ?? 0;
  }
  return nuevas;
}

/**
 * Qué claves del catálogo todavía no tienen ficha, y cuáles la tienen
 * incompleta. Lo usa el back office para mostrar la deuda de contenido.
 */
export function faltantes(catalogo, cargadas) {
  const claves = [
    ...catalogo.products.map((p) => ({ clave: p.key, nombre: p.name, tipo: 'producto' })),
    ...catalogo.hardware.map((h) => ({ clave: h.key, nombre: h.name, tipo: 'equipo' })),
  ];
  return claves.flatMap(({ clave, nombre, tipo }) => {
    const f = cargadas[clave];
    if (!f) return [{ clave, nombre, tipo, falta: 'ficha' }];
    const problemas = [];
    if (!f.imagen) problemas.push('imagen');
    if (!f.textos?.es?.resumen) problemas.push('resumen');
    if (!f.textos?.es?.rasgos?.length) problemas.push('características');
    if (f.borrador) problemas.push('sin revisar');
    return problemas.length ? [{ clave, nombre, tipo, falta: problemas.join(', ') }] : [];
  });
}
