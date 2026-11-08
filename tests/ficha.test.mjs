/* ==========================================================================
   ficha.test.mjs — el panel de detalle no puede tapar el precio.

   La razón de usar un panel lateral en vez de un modal es que el cliente siga
   viendo cuánto cuesta mientras el vendedor le explica qué es. Si el panel
   cubriera el total, no habría ninguna ventaja sobre un modal.

   Comprobar `isVisible()` no alcanza: una caja tapada por otra sigue siendo
   visible para el CSS. Acá se pregunta qué elemento está realmente en el
   punto donde se dibuja el total.
   ========================================================================== */

import base from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';
const CLAVE = process.env.SITE_PASSWORD || '';

const servidorArriba = await fetch(`${BASE}/ventas`, { method: 'HEAD' })
  .then(() => true).catch(() => false);

/* Playwright no es dependencia del proyecto: pesa cientos de megabytes por
   los navegadores y solo hace falta para estas pruebas. Se busca donde esté
   —en el proyecto o instalado aparte— y si no aparece, se saltean. */
async function cargarPlaywright() {
  for (const ruta of ['playwright', process.env.PLAYWRIGHT_PATH, '/opt/npm-tools/node_modules/playwright/index.js']) {
    if (!ruta) continue;
    try {
      const m = await import(ruta);
      /* Playwright es CommonJS: importado por ruta, sus exportaciones quedan
         bajo .default en lugar de sueltas. */
      const c = m.chromium ?? m.default?.chromium;
      if (c) return c;
    } catch { /* probar la siguiente */ }
  }
  return null;
}
const chromium = await cargarPlaywright();

const puede = servidorArriba && chromium;
const test = puede
  ? base
  : (nombre) => base.skip(`${nombre} — necesita el servidor levantado y playwright`);

async function abrir(ancho = 1320) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: ancho, height: 1000 } });
  if (CLAVE) await ctx.addCookies([{ name: 'wizor_acceso', value: CLAVE, url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/ventas`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  return { b, p };
}

test('con la ficha abierta, el total sigue a la vista', async () => {
  const { b, p } = await abrir();
  try {
    await p.locator('.dev:has-text("Smart Desktop") .dev-ficha').click();
    await p.waitForSelector('.ficha', { state: 'visible' });
    await p.waitForTimeout(400);

    const tapado = await p.evaluate(() => {
      const total = document.querySelector('.sum .big');
      if (!total) return 'no hay total en pantalla';
      const r = total.getBoundingClientRect();
      const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return encima && total.contains(encima) ? null : (encima?.className || 'otro elemento');
    });
    assert.equal(tapado, null, `el panel tapa el total: ${tapado}`);
  } finally { await b.close(); }
});

test('la tarjeta no tiene un botón dentro de otro', async () => {
  const { b, p } = await abrir();
  try {
    assert.equal(await p.locator('button button').count(), 0,
      'un botón dentro de otro es HTML inválido y deja el clic ambiguo');
  } finally { await b.close(); }
});

test('elegir el plan no abre la ficha, y abrir la ficha no elige el plan', async () => {
  const { b, p } = await abrir();
  try {
    await p.locator('.plan:has-text("Wizor Core") .plan-elegir').click();
    await p.waitForTimeout(500);
    assert.equal(await p.locator('.ficha').count(), 0, 'elegir el plan abrió la ficha');
    assert.equal(await p.getAttribute('.plan:has-text("Wizor Core")', 'data-on'), '1');

    await p.locator('.plan:has-text("Wizor Lens") .plan-ficha').click();
    await p.waitForTimeout(400);
    assert.equal(await p.locator('.ficha').count(), 1, 'la ficha no se abrió');
    assert.equal(await p.getAttribute('.plan:has-text("Wizor Lens")', 'data-on'), '0',
      'abrir la ficha seleccionó el plan');
  } finally { await b.close(); }
});

test('Escape y el fondo cierran la ficha', async () => {
  const { b, p } = await abrir();
  try {
    await p.locator('.dev:has-text("Smart Pin") .dev-ficha').click();
    await p.waitForSelector('.ficha', { state: 'visible' });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    assert.equal(await p.locator('.ficha').count(), 0, 'Escape no cerró');

    await p.locator('.dev:has-text("Smart Pin") .dev-ficha').click();
    await p.waitForSelector('.ficha', { state: 'visible' });
    await p.mouse.click(1300, 500);          // fondo, a la derecha del panel
    await p.waitForTimeout(400);
    assert.equal(await p.locator('.ficha').count(), 0, 'el fondo no cerró');
  } finally { await b.close(); }
});

test('una ficha sin características lo dice en lugar de verse rota', async () => {
  const { b, p } = await abrir();
  try {
    await p.locator('.dev:has-text("Smart Pin") .dev-ficha').click();
    await p.waitForSelector('.ficha', { state: 'visible' });
    assert.equal(await p.locator('.ficha-rasgos').count(), 0);
    assert.ok((await p.locator('.ficha-vacio').textContent()).trim().length > 10);
  } finally { await b.close(); }
});

test('en teléfono es una hoja desde abajo, no un panel lateral', async () => {
  const { b, p } = await abrir(390);
  try {
    await p.locator('.dev:has-text("Smart Desktop") .dev-ficha').click();
    await p.waitForSelector('.ficha', { state: 'visible' });
    await p.waitForTimeout(400);
    const caja = await p.locator('.ficha').boundingBox();
    assert.ok(caja.width >= 380, `debería ocupar el ancho: ${caja.width}`);
    assert.ok(caja.y > 20, `debería arrancar abajo, no arriba: y=${caja.y}`);
  } finally { await b.close(); }
});
