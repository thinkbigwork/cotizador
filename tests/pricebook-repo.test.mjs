/* ==========================================================================
   pricebook-repo.test.mjs — el ciclo de vida del catálogo contra una base
   Postgres real, incluidas las defensas que no deben poder saltearse.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

process.env.PGLITE_DIR = '';           // base efímera en memoria
delete process.env.DATABASE_URL;

const { query, one, exec } = await import('../lib/db.js');
const repo = await import('../lib/pricebook/repo.js');
const { PRICE_BOOK_V1 } = await import('../lib/pricebook/seed-v1.js');
const { diffPriceBooks, describeChange, summarizeDiff } = await import('../lib/pricebook/diff.js');

const MIG = path.join(import.meta.dirname, '..', 'db', 'migrations');
for (const f of readdirSync(MIG).filter((x) => x.endsWith('.sql')).sort()) {
  await exec(readFileSync(path.join(MIG, f), 'utf8'));
}

const admin = (await query(
  `insert into users (email, name, role) values ('admin@wizor.io', 'Admin', 'admin')
   returning id, email`)).rows[0];

await query(
  `insert into price_books (version, status, model, published_at)
   values (1, 'published', $1, now())`, [JSON.stringify(PRICE_BOOK_V1)]);

/* ------------------------------------------------------------------------ */

test('se abre un borrador a partir del catálogo vigente', async () => {
  const { draft, created } = await repo.createDraft({ user: admin, note: 'Suba de tarifas 2027' });
  assert.equal(created, true);
  assert.equal(draft.version, 2);
  assert.deepEqual(draft.model.products.length, PRICE_BOOK_V1.products.length);
});

test('pedir otro borrador devuelve el que ya está abierto', async () => {
  const { draft, created } = await repo.createDraft({ user: admin });
  assert.equal(created, false);
  assert.equal(draft.version, 2);
  const { rows } = await query(`select count(*)::int as n from price_books where status='draft'`);
  assert.equal(rows[0].n, 1);
});

test('un borrador con errores no se guarda', async () => {
  const roto = structuredClone(PRICE_BOOK_V1);
  roto.products[0].curve = 'no-existe';
  await assert.rejects(
    () => repo.saveDraft({ user: admin, model: roto }),
    (e) => e.name === 'PriceBookError' && Array.isArray(e.details),
  );
});

test('se guarda un cambio de precio y queda en auditoría', async () => {
  const model = structuredClone(PRICE_BOOK_V1);
  model.products.find((p) => p.key === 'core').baseRate = 9;      // 8 -> 9
  model.hardware.find((h) => h.key === 'panel_expert').price = 79000;  // 72.000 -> 79.000

  const r = await repo.saveDraft({ user: admin, model, note: 'Suba 2027' });
  assert.equal(r.version, 2);
  assert.equal(r.diff.counts.price, 2);

  const log = await one(
    `select actor_email, action from audit_log where action='guardar_borrador' order by at desc limit 1`);
  assert.equal(log.actor_email, 'admin@wizor.io');
});

test('la vista previa muestra exactamente qué cambia', async () => {
  const p = await repo.previewPublish();
  assert.equal(p.ready, true);
  assert.equal(p.fromVersion, 1);
  assert.equal(p.toVersion, 2);
  assert.equal(p.diff.counts.price, 2);
  const textos = p.diff.priceChanges.map(describeChange);
  assert.ok(textos.some((t) => t.includes('US$8 → US$9') && t.includes('+12.5%')), textos.join(' | '));
  assert.ok(textos.some((t) => t.includes('US$72,000 → US$79,000')), textos.join(' | '));
});

test('no se publica si el borrador cambió desde que se revisó', async () => {
  await assert.rejects(
    () => repo.publishDraft({ user: admin, expectedDiffCount: 99 }),
    (e) => /volvé a mirar las diferencias/i.test(e.message),
  );
});

test('publicar archiva el anterior y deja registro', async () => {
  const r = await repo.publishDraft({ user: admin, expectedDiffCount: 2 });
  assert.equal(r.version, 2);

  const vigente = await repo.getPublished();
  assert.equal(vigente.version, 2);
  assert.equal(vigente.model.products.find((p) => p.key === 'core').baseRate, 9);

  const anterior = await one('select status from price_books where version = 1');
  assert.equal(anterior.status, 'archived');

  const log = await one(
    `select actor_email, after from audit_log where action='publicar_catalogo' order by at desc limit 1`);
  assert.equal(log.actor_email, 'admin@wizor.io');
  assert.ok(log.after.cambios_de_precio.length === 2);
});

test('el catálogo viejo sigue intacto para los contratos que lo tienen clavado', async () => {
  const v1 = await one(`select model from price_books where version = 1`);
  assert.equal(v1.model.products.find((p) => p.key === 'core').baseRate, 8,
    'Una suscripción firmada con v1 se sigue calculando a 8, no a 9.');
});

test('ni el repositorio ni la base dejan tocar un catálogo publicado', async () => {
  const vigente = await repo.getPublished();
  await assert.rejects(
    () => query(`update price_books set model = '{}' where id = $1`, [vigente.id]),
    /publicado y no se puede modificar/,
  );
});

test('publicar exige un usuario identificado', async () => {
  await repo.createDraft({ user: admin });
  await assert.rejects(
    () => repo.publishDraft({ user: null }),
    /usuario identificado/,
  );
});

test('descartar un borrador lo borra y lo deja asentado', async () => {
  const r = await repo.discardDraft({ user: admin });
  assert.equal(r.version, 3);
  assert.equal(await repo.getDraft(), null);
  const log = await one(`select action from audit_log order by at desc limit 1`);
  assert.equal(log.action, 'descartar_borrador');
});

test('el diff ignora el orden y distingue el impacto', async () => {
  const a = structuredClone(PRICE_BOOK_V1);
  const b = structuredClone(PRICE_BOOK_V1);
  b.products.reverse();                                    // solo reordenado
  assert.equal(diffPriceBooks(a, b).identical, true, 'Reordenar no es un cambio.');

  b.products.find((p) => p.key === 'lens').name = 'Wizor Lens Plus';   // texto
  b.products.find((p) => p.key === 'lens').baseRate = 5;               // precio
  b.hardware = b.hardware.filter((h) => h.key !== 'panel_start');      // estructura

  const d = diffPriceBooks(a, b);
  assert.equal(d.counts.price, 1);
  assert.equal(d.counts.text, 1);
  assert.equal(d.counts.structure, 1);
  assert.equal(d.changes[0].impact, 'price', 'Lo que toca plata va primero.');
  assert.match(summarizeDiff(d), /3 cambios/);
});
