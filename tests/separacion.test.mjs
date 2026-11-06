/* ==========================================================================
   separacion.test.mjs — el cotizador no puede filtrar comisiones.

   El vendedor puede estar usando /ventas sentado al lado del cliente.
   Ocultar la comisión con CSS no sirve: quedaría en el HTML. Este test
   descarga todo lo que el navegador recibe —la página y cada script que
   carga— y busca cualquier rastro del modelo de comisiones.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';

/* Identificadores que solo existen en el módulo de comisiones. Si alguno
   aparece en lo que recibe el navegador, el módulo se empaquetó por error. */
const IDENTIFICADORES = [
  'partnerCommission', 'splitCommissions', 'commissionFor',
  'priorYtdUsd', 'effectivePct', 'nextTier', 'netToWizorUsd',
  'acumulado_anual', 'partnerScale',
];

/* Tasas propias del esquema de comisiones. Se dejan afuera las que son
   números corrientes en cualquier hoja de estilos o animación —0.25, 0.6—
   porque buscarlas da coincidencias por azar, no fugas. */
const TASAS_DISTINTIVAS = ['0.025', '0.038', '0.38', '0.52'];

const PALABRAS = ['comision', 'comisión', 'commission', 'conector',
                  'desarrollador', 'socio de negocio'];

async function descargarTodo(ruta) {
  const res = await fetch(BASE + ruta);
  assert.equal(res.status, 200, `${ruta} respondió ${res.status}`);
  const html = await res.text();

  /* Todos los scripts que la página manda a buscar. */
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const scripts = await Promise.all(
    srcs.map(async (src) => {
      const r = await fetch(src.startsWith('http') ? src : BASE + src);
      return r.ok ? r.text() : '';
    }),
  );

  return { html, todo: html + '\n' + scripts.join('\n'), scripts: srcs.length };
}

test('el cotizador en modo presentación no nombra comisiones', async () => {
  const { html } = await descargarTodo('/ventas?modo=cliente');
  const bajo = html.toLowerCase();
  for (const palabra of PALABRAS) {
    assert.ok(!bajo.includes(palabra.toLowerCase()),
      `El HTML que ve el cliente contiene "${palabra}".`);
  }
});

test('el módulo de comisiones no se empaqueta en el cotizador', async () => {
  const { todo, scripts } = await descargarTodo('/ventas');
  assert.ok(scripts > 0, 'La página debería cargar al menos un script.');

  const filtrados = IDENTIFICADORES.filter((id) => todo.includes(id));
  assert.deepEqual(filtrados, [],
    `El navegador recibió código de comisiones: ${filtrados.join(', ')}`);

  const tasas = TASAS_DISTINTIVAS.filter((tasa) => {
    const re = new RegExp(`(^|[^\\d.])${tasa.replace('.', '\\.')}([^\\d]|$)`);
    return re.test(todo);
  });
  assert.deepEqual(tasas, [], `Tasas de comisión encontradas: ${tasas.join(', ')}`);

  /* Tampoco la escala como secuencia, en ninguna notación. */
  for (const forma of ['100000,0.25', '1e5,.25', '[100000,0.25]', '2000000,0.52']) {
    assert.ok(!todo.replace(/\s/g, '').includes(forma),
      `Se encontró la escala de comisiones: ${forma}`);
  }
});

test('la vista de comisión sí la tiene, para probar que el test sirve', async () => {
  /* Control negativo: si este test pasara también en /ventas, el anterior
     no estaría comprobando nada. */
  const { html } = await descargarTodo('/ventas/comision');
  assert.match(html.toLowerCase(), /comisión/);
  assert.match(html, /socio de negocio/i);
});

test('tampoco viaja el modelo de precios', async () => {
  const { todo } = await descargarTodo('/ventas');
  /* Las curvas y el mínimo anual se calculan en el servidor. */
  for (const constante of ['0.833', '0.583', '0.433', '17640', '24000', '4800']) {
    assert.ok(!todo.includes(constante),
      `El navegador recibió la constante del modelo "${constante}".`);
  }
});

test('el modo presentación saca todo el cromo interno', async () => {
  const { html } = await descargarTodo('/ventas?modo=cliente');
  const bajo = html.toLowerCase();
  assert.ok(!bajo.includes('mi comisión'), 'En modo presentación no puede quedar el link a comisiones.');
  assert.ok(!bajo.includes('cotizador</span>'), 'Tampoco el rótulo interno.');
  assert.ok(!bajo.includes('catálogo v'), 'Ni la versión del catálogo.');
  assert.ok(bajo.includes('tu inversión') || bajo.includes('tu organización'),
    'Pero el cotizador sí tiene que verse.');
});

test('la vista de comisión avisa que es interna', async () => {
  const { html } = await descargarTodo('/ventas/comision');
  assert.match(html, /no mostrar al cliente/i);
});

test('el precio se calcula en el servidor y vuelve ya resuelto', async () => {
  const res = await fetch(BASE + '/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      industry: 'constr', headcount: 850, sites: 4, countries: 1,
      selected: { w360: true }, hardware: { mach: 5 },
    }),
  });
  assert.equal(res.status, 200);
  const q = await res.json();
  assert.ok(q.hardwareTotal > 0, 'Cinco Smart Machine tienen que costar algo.');
  assert.equal(q.checkout.mode, 'deposit');
  assert.equal(q.checkout.depositUsd, q.hardwareTotal,
    'La seña de preventa es el 100% del equipamiento.');
  assert.ok(q.platformAnnual > 0 && q.checkout.depositUsd < q.firstYear,
    'La plataforma no entra en la seña.');

  /* La respuesta trae números, no el modelo. */
  const texto = JSON.stringify(q);
  for (const constante of ['0.833', '0.583', 'smallBands', 'categories', 'curves']) {
    assert.ok(!texto.includes(constante), `La respuesta filtró "${constante}".`);
  }
});
