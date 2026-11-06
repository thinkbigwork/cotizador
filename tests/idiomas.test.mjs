/* Todo el sitio está en español, inglés y portugués. Estas pruebas corren
   sin servidor: verifican que ninguna pantalla tenga un texto en un idioma y
   no en los otros (en pantalla se vería "undefined" al cambiar de idioma). */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { STRINGS } from '../lib/i18n.js';
import { IDIOMAS, idiomaValido } from '../lib/idioma.js';
import { TEXTOS_VENTAS } from '../app/ventas/textos.js';
import { TEXTOS_COMISION } from '../app/ventas/comision/textos.js';
import { TEXTOS_ACCESO } from '../app/acceso/textos.js';
import { TEXTOS_ADMIN } from '../app/admin/catalogo/textos.js';

/* Claves en profundidad, con el largo de cada lista: una lista de rasgos con
   un elemento menos en un idioma también es un texto que falta. */
const claves = (obj, prefijo = '') => Object.entries(obj).flatMap(([k, v]) => {
  if (Array.isArray(v)) return [`${prefijo}${k}[${v.length}]`];
  if (v && typeof v === 'object') return claves(v, `${prefijo}${k}.`);
  return [`${prefijo}${k}`];
}).sort();

const vacios = (obj, prefijo = '') => Object.entries(obj).flatMap(([k, v]) => {
  if (v && typeof v === 'object') return vacios(v, `${prefijo}${k}.`);
  return typeof v === 'string' && v.trim() === '' ? [`${prefijo}${k}`] : [];
});

const PANTALLAS = {
  'lib/i18n.js (cotizador)': STRINGS,
  'app/ventas/textos.js': TEXTOS_VENTAS,
  'app/ventas/comision/textos.js': TEXTOS_COMISION,
  'app/acceso/textos.js': TEXTOS_ACCESO,
  'app/admin/catalogo/textos.js': TEXTOS_ADMIN,
};

test('cada pantalla tiene los tres idiomas con las mismas claves', () => {
  for (const [archivo, textos] of Object.entries(PANTALLAS)) {
    assert.deepEqual(Object.keys(textos).sort(), [...IDIOMAS].sort(), `${archivo}: idiomas`);
    const ref = claves(textos.es);
    for (const lang of IDIOMAS) {
      assert.deepEqual(claves(textos[lang]), ref, `${archivo} · ${lang} no tiene las mismas claves que es`);
      assert.deepEqual(vacios(textos[lang]), [], `${archivo} · ${lang} tiene textos vacíos`);
    }
  }
});

test('solo se aceptan los tres idiomas', () => {
  for (const l of IDIOMAS) assert.equal(idiomaValido(l), l);
  for (const l of ['fr', '', 'ES', '../es', undefined]) assert.equal(idiomaValido(l), null);
});

test('las páginas no fijan el idioma a mano', async () => {
  /* Antes /ventas le pasaba lang="es" al cotizador y nunca cambiaba. */
  const raiz = new URL('../app/', import.meta.url).pathname;
  const paginas = [];
  const recorrer = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await recorrer(p);
      else if (/\.(js|jsx)$/.test(e.name)) paginas.push(p);
    }
  };
  await recorrer(raiz);
  for (const p of paginas) {
    const fuente = await readFile(p, 'utf8');
    assert.doesNotMatch(fuente, /lang="(es|en|pt)"/, `${path.relative(raiz, p)} fija el idioma`);
  }
});

test('los textos de comisión solo los usa la página de comisión', async () => {
  /* Describen cómo se paga: no pueden terminar en /ventas ni en la guía. */
  const raiz = new URL('../', import.meta.url).pathname;
  const usos = [];
  for (const dir of ['app', 'lib']) {
    const recorrer = async (d) => {
      for (const e of await readdir(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) await recorrer(p);
        else if (/\.(js|jsx)$/.test(e.name)
                 && (await readFile(p, 'utf8')).includes('TEXTOS_COMISION')) usos.push(path.relative(raiz, p));
      }
    };
    await recorrer(path.join(raiz, dir));
  }
  assert.deepEqual(usos.sort(), ['app/ventas/comision/page.js', 'app/ventas/comision/textos.js']);
});
