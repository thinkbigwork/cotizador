/* La guía del cotizador (/) no puede quedar desalineada ni con el catálogo
   ni entre idiomas. Estas pruebas corren sin servidor. */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PRICE_BOOK_V1 } from '../lib/pricebook/seed-v1.js';
import { armarGuia, leerGuia } from '../lib/guia/render.js';
import { TEXTOS, IDIOMAS } from '../lib/guia/textos.js';

const BOOK = { model: PRICE_BOOK_V1, version: 1, published_at: '2026-11-06T00:00:00Z' };
const VERSIONES = [{ version: 1, status: 'published', published_at: '2026-11-06T00:00:00Z', note: 'v1' }];

const claves = (obj, prefijo = '') => Object.entries(obj).flatMap(([k, v]) =>
  (v && typeof v === 'object' && !Array.isArray(v) ? claves(v, `${prefijo}${k}.`) : [`${prefijo}${k}`])).sort();

const marcadoresDe = (md) => [...md.matchAll(/\{\{\s*([\w.ñ]+)\s*\}\}/g)].map((m) => m[1]).sort();

test('los tres idiomas de textos.js tienen las mismas claves', () => {
  const ref = claves(TEXTOS.es);
  for (const lang of IDIOMAS) assert.deepEqual(claves(TEXTOS[lang]), ref, `textos.js · ${lang}`);
});

test('cada marcador de la guía existe en el catálogo, en los tres idiomas', async () => {
  for (const lang of IDIOMAS) {
    const { faltantes } = await armarGuia({ lang, book: BOOK, versiones: VERSIONES });
    assert.deepEqual(faltantes, [], `docs/guia/${lang}.md usa marcadores que no existen`);
  }
});

test('los tres idiomas usan los mismos marcadores y las mismas secciones', async () => {
  const es = await leerGuia('es');
  const guiaEs = await armarGuia({ lang: 'es', book: BOOK, versiones: VERSIONES });
  for (const lang of ['en', 'pt']) {
    const md = await leerGuia(lang);
    assert.deepEqual(marcadoresDe(md), marcadoresDe(es), `${lang}.md no usa los mismos marcadores que es.md`);
    const guia = await armarGuia({ lang, book: BOOK, versiones: VERSIONES });
    assert.equal(guia.secciones.length, guiaEs.secciones.length, `${lang}.md no tiene las mismas secciones`);
  }
});

test('la guía no escribe cifras a mano: todo importe sale de un marcador', async () => {
  /* Un "US$" o un "$1.234" escrito en el .md quedaría desactualizado en la
     próxima versión del catálogo. */
  for (const lang of IDIOMAS) {
    const md = await leerGuia(lang);
    assert.doesNotMatch(md, /US\$|\$\s?\d/, `docs/guia/${lang}.md tiene un importe escrito a mano`);
  }
});

test('la guía no toca el módulo de comisiones', async () => {
  for (const archivo of ['lib/guia/marcadores.js', 'lib/guia/render.js', 'app/page.js']) {
    const fuente = await readFile(new URL(`../${archivo}`, import.meta.url), 'utf8');
    assert.doesNotMatch(fuente, /commissions/, `${archivo} importa o nombra el módulo de comisiones`);
  }
  for (const lang of IDIOMAS) {
    const { html } = await armarGuia({ lang, book: BOOK, versiones: VERSIONES });
    for (const tasa of ['0.025', '0.038', '0.38', '0.52']) {
      assert.ok(!html.includes(tasa), `La guía (${lang}) contiene la tasa de comisión ${tasa}`);
    }
  }
});

test('los casos resueltos coinciden con el cotizador', async () => {
  /* Educación (factor 75 %), 80 personas → banda de 100 (US$ 6.080) × Core ×2. */
  const { html } = await armarGuia({ lang: 'es', book: BOOK, versiones: VERSIONES });
  assert.match(html, /US\$\s9\.120/);
});
