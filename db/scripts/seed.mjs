/* Carga el catálogo de precios v1 si todavía no hay ninguno.
   Si al catálogo le falta algún dato para poder publicarse, se guarda como
   borrador y se informa qué falta, en lugar de publicar algo incompleto.
   Con --publish se publica igual, solo para desarrollo. */
import { query, one } from '../../lib/db.js';
import { PRICE_BOOK_V1 } from '../../lib/pricebook/seed-v1.js';
import { validatePriceBook, readyToPublish } from '../../lib/pricebook/schema.js';
import { sembrarContenido } from '../../lib/contenido/repo.js';

const force = process.argv.includes('--publish');

const check = validatePriceBook(PRICE_BOOK_V1);
if (!check.ok) {
  console.error('El catálogo v1 no valida:');
  for (const e of check.errors) console.error(` · ${e.path}: ${e.message}`);
  process.exit(1);
}

/* Las fichas viven en su propia tabla y no dependen de la versión del
   catálogo, así que se cargan igual. No pisa lo que ya esté cargado. */
const fichasNuevas = await sembrarContenido();
if (fichasNuevas) console.log(`${fichasNuevas} ficha(s) de catálogo cargadas.`);

const existing = await one('select version from price_books order by version desc limit 1');
if (existing) {
  console.log(`Ya hay catálogos cargados (última versión: v${existing.version}). No se hace nada más.`);
  process.exit(0);
}

const publishable = readyToPublish(check.book);
const status = publishable.ready || force ? 'published' : 'draft';

await query(
  `insert into price_books (version, status, model, note, published_at)
   values (1, $1, $2, $3, case when $1 = 'published' then now() else null end)`,
  [status, JSON.stringify(check.book), 'Modelo comercial vigente, trasladado del cotizador anterior.'],
);

if (status === 'published') {
  console.log('Catálogo v1 publicado.' + (force && !publishable.ready ? ' (forzado: faltan datos)' : ''));
} else {
  console.log('Catálogo v1 guardado como BORRADOR. No se publica porque falta:');
  for (const m of publishable.missing) console.log(` · ${m.message}`);
  console.log('\nCargá el dato en el back office y publicá, o usá --publish para desarrollo.');
}
