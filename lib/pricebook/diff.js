/* ==========================================================================
   diff.js — qué cambia entre dos versiones del catálogo.

   Es la pantalla de confirmación antes de publicar. Nadie debería poder
   cambiar un precio sin ver exactamente qué está cambiando: un dedo pesado
   sobre una curva de volumen mueve la facturación de todos los contratos
   nuevos, y el error no se nota hasta que alguien revisa una factura.

   Cada cambio se clasifica por impacto, para que lo que toca plata salte a
   la vista por encima de un retoque de redacción.
   ========================================================================== */

/* Campos cuyo cambio mueve dinero. */
const PRICE_FIELDS = new Set([
  'price', 'baseRate', 'bandMultiplier', 'factor', 'factors',
  'annualMinimum', 'smallBands', 'pct', 'amountUsd', 'tiers',
  'partnerScale', 'roles', 'creditTiersUsd',
]);

/* Campos que solo cambian lo que se lee en pantalla. */
const TEXT_FIELDS = new Set([
  'name', 'label', 'note', 'spec', 'waitlistNote', 'deliveryNote',
  'benefits', 'order',
]);

function impactOf(path) {
  const parts = path.split('.');
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const key = parts[i];
    if (PRICE_FIELDS.has(key)) return 'price';
    if (TEXT_FIELDS.has(key)) return 'text';
  }
  return 'structure';
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/* Colecciones que se comparan por la clave de cada elemento y no por
   posición: mover un producto en la lista no es un cambio. */
const KEYED = { products: 'key', hardware: 'key', curves: 'key', categories: 'key', programs: 'key' };

function walk(before, after, path, out) {
  if (Object.is(before, after)) return;

  if (before === undefined) { out.push({ path, kind: 'added', before: undefined, after }); return; }
  if (after === undefined) { out.push({ path, kind: 'removed', before, after: undefined }); return; }

  if (isObject(before) && isObject(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      walk(before[key], after[key], path ? `${path}.${key}` : key, out);
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    /* Arreglos de valores —curvas, bandas, escalas— se comparan enteros:
       mostrar "el tramo 3 pasó de 0.70 a 0.68" sin el resto confunde. */
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      out.push({ path, kind: 'changed', before, after });
    }
    return;
  }

  if (before !== after) out.push({ path, kind: 'changed', before, after });
}

function diffKeyedList(before = [], after = [], name, idField, out) {
  const byKey = (list) => new Map(list.map((item) => [item[idField], item]));
  const a = byKey(before);
  const b = byKey(after);

  for (const [key, item] of b) {
    if (!a.has(key)) out.push({ path: `${name}[${key}]`, kind: 'added', before: undefined, after: item });
  }
  for (const [key, item] of a) {
    if (!b.has(key)) out.push({ path: `${name}[${key}]`, kind: 'removed', before: item, after: undefined });
  }
  for (const [key, item] of a) {
    if (b.has(key)) walk(item, b.get(key), `${name}[${key}]`, out);
  }
}

/**
 * Compara dos catálogos.
 *
 * @returns {{
 *   changes: Array<{path:string, kind:string, before:*, after:*, impact:string}>,
 *   counts: {price:number, structure:number, text:number, total:number},
 *   priceChanges: Array<object>,
 *   identical: boolean
 * }}
 */
export function diffPriceBooks(before, after) {
  const changes = [];

  for (const [name, idField] of Object.entries(KEYED)) {
    diffKeyedList(before[name], after[name], name, idField, changes);
  }

  /* Todo lo que no es una colección con clave. */
  const rest = (book) => {
    const copy = { ...book };
    for (const name of Object.keys(KEYED)) delete copy[name];
    return copy;
  };
  walk(rest(before), rest(after), '', changes);

  for (const change of changes) change.impact = impactOf(change.path);

  const counts = { price: 0, structure: 0, text: 0, total: changes.length };
  for (const change of changes) counts[change.impact] += 1;

  /* Lo que toca plata primero, y dentro de cada grupo por orden alfabético
     para que la lista no baile entre publicaciones. */
  const rank = { price: 0, structure: 1, text: 2 };
  changes.sort((x, y) => rank[x.impact] - rank[y.impact] || x.path.localeCompare(y.path));

  return {
    changes,
    counts,
    priceChanges: changes.filter((c) => c.impact === 'price'),
    identical: changes.length === 0,
  };
}

/* --- Presentación ------------------------------------------------------- */

const money = (n) => `US$${Number(n).toLocaleString('en-US')}`;

function readableValue(value) {
  if (value === undefined) return '—';
  if (value === null) return 'sin definir';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  if (Array.isArray(value)) return `[${value.map(readableValue).join(', ')}]`;
  if (isObject(value)) return value.name || value.key || JSON.stringify(value);
  return String(value);
}

/** Una línea legible por cambio, para la pantalla de confirmación. */
export function describeChange(change) {
  const { path, kind, before, after, impact } = change;
  const field = path.split('.').pop();

  if (kind === 'added') return `Se agrega ${path}: ${readableValue(after)}`;
  if (kind === 'removed') return `Se quita ${path}: ${readableValue(before)}`;

  if (impact === 'price' && typeof before === 'number' && typeof after === 'number') {
    const pct = before === 0 ? null : ((after - before) / before) * 100;
    const asMoney = field === 'price' || field === 'baseRate' || field === 'annualMinimum' || field === 'amountUsd';
    const shown = asMoney
      ? `${money(before)} → ${money(after)}`
      : `${before} → ${after}`;
    const delta = pct === null ? '' : ` (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)`;
    return `${path}: ${shown}${delta}`;
  }

  return `${path}: ${readableValue(before)} → ${readableValue(after)}`;
}

/** Resumen de una línea para el registro de auditoría y los listados. */
export function summarizeDiff(result) {
  if (result.identical) return 'Sin cambios.';
  const { price, structure, text } = result.counts;
  const parts = [];
  if (price) parts.push(`${price} de precio`);
  if (structure) parts.push(`${structure} de estructura`);
  if (text) parts.push(`${text} de texto`);
  return `${result.counts.total} cambios: ${parts.join(', ')}.`;
}
