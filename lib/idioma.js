/* ==========================================================================
   idioma.js — qué idioma ve cada persona, en todo el sitio.

   El idioma se elige una vez (con ?lang=xx, desde el selector ES/EN/PT) y
   queda en la cookie wizor_idioma. El portero (middleware.js) es quien la
   escribe, así que el mismo pedido que trae ?lang ya sale en ese idioma, y
   los que siguen lo heredan aunque no lo repitan en la URL. Sin cookie ni
   parámetro, español.

   No importa nada pesado: lo usa también el middleware, que corre en el
   borde.
   ========================================================================== */

export const IDIOMAS = ['es', 'en', 'pt'];
export const COOKIE_IDIOMA = 'wizor_idioma';
export const LOCALE = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' };

export const idiomaValido = (v) => (IDIOMAS.includes(v) ? v : null);

/* Solo en el servidor (páginas y layouts). */
export async function idiomaActual() {
  const { cookies } = await import('next/headers');
  return idiomaValido((await cookies()).get(COOKIE_IDIOMA)?.value) ?? 'es';
}
