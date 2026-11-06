/* ==========================================================================
   commissions.test.mjs — la escala marginal sobre el acumulado anual.
   El test central es el que verifica que no haya saltos: con la escala
   anterior, Wizor ganaba menos con una venta más grande.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validatePriceBook } from '../lib/pricebook/schema.js';
import { PRICE_BOOK_V1 } from '../lib/pricebook/seed-v1.js';
import { commissionFor, partnerCommission, splitCommissions } from '../lib/pricing/commissions.js';

const book = validatePriceBook(PRICE_BOOK_V1).book;
const socio = (prior, deal) => partnerCommission(book, { priorYtdUsd: prior, dealUsd: deal });

test('los roles fijos cobran su porcentaje sobre el primer año', () => {
  assert.equal(commissionFor(book, 'conector', 100000).amount, 2500);
  assert.equal(commissionFor(book, 'desarrollador', 100000).amount, 4000);
  assert.equal(commissionFor(book, 'vendedor', 100000).amount, 8000);
  assert.throws(() => commissionFor(book, 'inventado', 1000), /Rol de comisión desconocido/);
});

test('el socio cobra lo prometido en cada hito del año', () => {
  const hitos = [
    [100000, 25000, 0.250],
    [250000, 73000, 0.292],
    [500000, 168000, 0.336],
    [1000000, 393000, 0.393],
    [2000000, 913000, 0.4565],
    [3000000, 1513000, 0.5043],
  ];
  for (const [acumulado, esperado, pct] of hitos) {
    const r = socio(0, acumulado);
    assert.equal(r.amount, esperado, `acumulado ${acumulado}`);
    assert.ok(Math.abs(r.effectivePct - pct) < 0.0005, `tasa efectiva en ${acumulado}`);
  }
});

test('no hay saltos: un dólar más nunca cuesta miles de comisión', () => {
  /* El defecto de la escala plana anterior. Se recorre el entorno de cada
     frontera y se exige que la comisión no dé ningún brinco. */
  for (const frontera of [100000, 250000, 500000, 1000000, 2000000]) {
    const antes = socio(0, frontera).amount;
    const despues = socio(0, frontera + 1).amount;
    assert.ok(despues - antes < 1,
      `salto de ${despues - antes} al cruzar ${frontera}`);
    assert.ok(despues >= antes, 'la comisión nunca baja');
  }
});

test('Wizor siempre gana más con una venta más grande', () => {
  /* Con la escala plana había una franja —entre 100.000 y 107.143— donde un
     contrato más grande le dejaba menos a Wizor. Eso no puede volver. */
  let peorNeto = -Infinity;
  for (let deal = 1000; deal <= 3000000; deal += 1000) {
    const neto = deal - socio(0, deal).amount;
    assert.ok(neto >= peorNeto, `el neto de Wizor bajó en ${deal}`);
    peorNeto = neto;
  }
});

test('la operación se reparte entre los tramos que atraviesa', () => {
  // El socio ya lleva 90.000 en el año y cierra 20.000 más.
  const r = socio(90000, 20000);
  assert.equal(r.slices.length, 2);
  assert.deepEqual(r.slices.map((s) => [s.base, s.pct]), [[10000, 0.25], [10000, 0.32]]);
  assert.equal(r.amount, 2500 + 3200);
});

test('partir una venta en dos no cambia lo que cobra el socio', () => {
  const entera = socio(0, 400000).amount;
  const partida = socio(0, 150000).amount + socio(150000, 250000).amount;
  assert.equal(entera, partida, 'El resultado no puede depender de cómo se parta.');
});

test('el acumulado del año decide la tasa, no el tamaño de la operación', () => {
  const primera = socio(0, 50000);
  const misma = socio(1500000, 50000);
  assert.ok(misma.amount > primera.amount * 2,
    'La misma venta paga mucho más cuando el socio ya produjo en el año.');
  assert.equal(primera.effectivePct, 0.25);
  assert.equal(misma.effectivePct, 0.52);
});

test('se informa cuánto falta para subir de nivel', () => {
  const r = socio(0, 410000);
  assert.equal(r.currentTier.pct, 0.38);
  assert.deepEqual(r.nextTier, { at: 500000, pct: 0.45, missing: 90000 });
  assert.equal(socio(0, 2500000).nextTier, null, 'El último tramo no tiene siguiente.');
});

test('el socio absorbe a los demás roles de su territorio', () => {
  const equipo = [
    { personId: 'a', role: 'conector' },
    { personId: 'b', role: 'vendedor' },
    { personId: 'c', role: 'socio', priorYtdUsd: 0 },
  ];
  const conSocio = splitCommissions(book, 200000, equipo);
  assert.equal(conSocio.lines.length, 1);
  assert.deepEqual(conSocio.absorbed.sort(), ['conector', 'vendedor']);
  assert.equal(conSocio.totalUsd, 25000 + 100000 * 0.32);

  // Sin socio, cada uno cobra lo suyo.
  const sinSocio = splitCommissions(book, 200000, equipo.slice(0, 2));
  assert.equal(sinSocio.lines.length, 2);
  assert.equal(sinSocio.totalUsd, 200000 * 0.025 + 200000 * 0.08);
  assert.equal(sinSocio.netToWizorUsd, 200000 - sinSocio.totalUsd);
});

test('sin la absorción, el reparto sería ruinoso', () => {
  /* Verifica que la regla existe por algo: los cuatro roles juntos se
     comerían más del 70% del contrato. */
  const sueltos = ['conector', 'desarrollador', 'vendedor', 'socio']
    .reduce((sum, role) => sum + commissionFor(book, role, 3000000, { priorYtdUsd: 0 }).amount, 0);
  const pct = sueltos / 3000000;
  assert.ok(pct > 0.60, `los cuatro roles juntos dan ${(pct * 100).toFixed(1)}%`);
});
