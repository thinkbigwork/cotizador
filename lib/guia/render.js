/* ==========================================================================
   render.js — arma la guía: lee docs/guia/<idioma>.md, completa los
   marcadores con el catálogo y lo pasa a HTML.

   El archivo se lee en cada pedido, no al compilar: así un cambio en el
   catálogo se ve sin redesplegar. En Vercel los .md tienen que viajar con la
   función; eso lo asegura outputFileTracingIncludes en next.config.mjs. Si
   se saca de ahí, la guía falla en producción aunque funcione en local.

   Solo corre en el servidor.
   ========================================================================== */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import { marcadores, resolver } from './marcadores.js';
import { IDIOMAS } from './textos.js';

export const DIR_GUIA = path.join(process.cwd(), 'docs', 'guia');

export async function leerGuia(lang) {
  if (!IDIOMAS.includes(lang)) throw new Error(`Idioma de la guía desconocido: ${lang}`);
  return readFile(path.join(DIR_GUIA, `${lang}.md`), 'utf8');
}

/* "Cómo se vende" → "como-se-vende". Las anclas del índice salen de acá. */
export const ancla = (texto) => texto
  .replace(/<[^>]+>/g, '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * @returns {{ html: string, titulo: string, secciones: {id:string,titulo:string}[], faltantes: string[] }}
 */
export async function armarGuia({ lang, book, versiones = [], sha = null }) {
  const markdown = await leerGuia(lang);
  const { texto, faltantes } = resolver(markdown, marcadores(book, lang, { versiones, sha }));

  let html = marked.parse(texto, { gfm: true, async: false });

  /* Anclas en los títulos, para el índice lateral y para compartir un link a
     una sección puntual. */
  const secciones = [];
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, nivel, contenido) => {
    const id = ancla(contenido);
    if (nivel === '2') secciones.push({ id, titulo: contenido.replace(/<[^>]+>/g, '') });
    return `<h${nivel} id="${id}">${contenido}</h${nivel}>`;
  });

  /* El título (#) lo muestra la página aparte; se saca del cuerpo. */
  let titulo = '';
  html = html.replace(/<h1>([\s\S]*?)<\/h1>/, (_, t) => { titulo = t.replace(/<[^>]+>/g, ''); return ''; });

  /* Tablas anchas: se envuelven para que hagan scroll horizontal en el
     celular en vez de romper el ancho de la página. */
  html = html.replace(/<table>/g, '<div class="g-tabla"><table>').replace(/<\/table>/g, '</table></div>');

  return { html, titulo, secciones, faltantes };
}
