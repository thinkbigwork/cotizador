/* ==========================================================================
   contenido.test.mjs — las fichas, contra una base de verdad.

   La prueba que importa es la primera: un entorno al que le falta la
   migración 003 tiene que quedarse sin fichas y seguir cotizando. Si
   `fichas()` dejara subir el error, /ventas devolvería 500 completo y el
   cotizador se caería por no poder mostrar una descripción.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

process.env.PGLITE_DIR = '';           // base efímera en memoria
delete process.env.DATABASE_URL;

const { query, exec } = await import('../lib/db.js');
const { fichas, guardarFicha, sembrarContenido, faltantes } =
  await import('../lib/contenido/repo.js');
const { CONTENIDO_INICIAL } = await import('../lib/contenido/seed.js');

const MIG = path.join(import.meta.dirname, '..', 'db', 'migrations');
const migraciones = readdirSync(MIG).filter((x) => x.endsWith('.sql')).sort();

/* --- Antes de migrar: la tabla no existe todavía. ------------------------ */

test('sin la tabla, fichas() devuelve vacío en lugar de fallar', async () => {
  /* Corre primero a propósito, con la base sin migrar. */
  assert.deepEqual(await fichas(), {});
});

test('cualquier otro error de base sí sube', async () => {
  /* La red de contención es solo para 42P01. Una consulta con un error de
     sintaxis tiene que explotar, no devolver vacío disimuladamente. */
  await assert.rejects(() => query('select * from'), /syntax/i);
});

/* --- Con la tabla creada. ------------------------------------------------ */

test('el ciclo de vida de una ficha', async () => {
  for (const f of migraciones) await exec(readFileSync(path.join(MIG, f), 'utf8'));

  assert.deepEqual(await fichas(), {}, 'la tabla arranca vacía');

  const nuevas = await sembrarContenido();
  assert.equal(nuevas, CONTENIDO_INICIAL.length, 'siembra todas las fichas');
  assert.equal(await sembrarContenido(), 0, 'sembrar dos veces no duplica');

  const cargadas = await fichas();
  assert.equal(Object.keys(cargadas).length, CONTENIDO_INICIAL.length);
  for (const f of CONTENIDO_INICIAL) {
    assert.ok(cargadas[f.clave], `falta ${f.clave}`);
    assert.equal(cargadas[f.clave].borrador, true, `${f.clave} tiene que nacer borrador`);
    for (const lang of ['es', 'en', 'pt']) {
      assert.ok(cargadas[f.clave].textos[lang]?.resumen, `${f.clave} sin resumen en ${lang}`);
    }
  }
});

test('guardarFicha crea y después actualiza la misma clave', async () => {
  await guardarFicha({
    clave: 'prueba', tipo: 'equipo', imagen: '/a.svg',
    textos: { es: { resumen: 'uno' } }, borrador: true,
  });
  assert.equal((await fichas()).prueba.textos.es.resumen, 'uno');

  await guardarFicha({
    clave: 'prueba', tipo: 'equipo', imagen: '/b.svg',
    textos: { es: { resumen: 'dos' } }, borrador: false,
  });
  const f = (await fichas()).prueba;
  assert.equal(f.textos.es.resumen, 'dos', 'actualiza en lugar de duplicar');
  assert.equal(f.imagen, '/b.svg');
  assert.equal(f.borrador, false, 'se puede aprobar una ficha');

  await query('delete from contenido_catalogo where clave = $1', ['prueba']);
});

test('la tabla solo acepta producto o equipo', async () => {
  await assert.rejects(
    () => query(`insert into contenido_catalogo (clave, tipo) values ('x', 'servicio')`),
    /tipo/,
    'un tipo inventado lo rechaza la base, no la aplicación');
});

/* --- La deuda de contenido se ve. ---------------------------------------- */

test('faltantes() reporta la deuda de contenido, incluida la que dejamos a propósito', async () => {
  const { PRICE_BOOK_V1 } = await import('../lib/pricebook/seed-v1.js');
  const { publicCatalog } = await import('../lib/pricing/public-catalog.js');
  const catalogo = publicCatalog(PRICE_BOOK_V1);
  const deuda = faltantes(catalogo, await fichas());

  /* Todas están sembradas como borrador, así que todas deben figurar. */
  assert.ok(deuda.length > 0, 'con todo en borrador la deuda no puede estar vacía');
  for (const d of deuda) assert.match(d.falta, /sin revisar/);

  /* Smart Machine y Smart Pin no tienen características porque la web no
     publica ninguna y no se inventaron. Tiene que figurar como deuda, no
     pasar inadvertido. */
  for (const clave of ['mach', 'pin']) {
    const fila = deuda.find((d) => d.clave === clave);
    assert.ok(fila, `${clave} tendría que estar en la deuda`);
    assert.match(fila.falta, /características/, `${clave} declara que le faltan características`);
  }

  /* Una clave del catálogo sin ficha ninguna se reporta como tal. */
  const sinFicha = faltantes(catalogo, {});
  assert.equal(sinFicha.length, catalogo.products.length + catalogo.hardware.length);
  for (const d of sinFicha) assert.equal(d.falta, 'ficha');
});
