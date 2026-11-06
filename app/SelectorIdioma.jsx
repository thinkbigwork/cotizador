/* Selector ES/EN/PT. Cada opción es un link a la misma página con ?lang=xx:
   el portero guarda la elección en una cookie y desde ahí vale para todo el
   sitio. Conserva los demás parámetros (modo presentación, valores de la
   calculadora de comisión) para que cambiar de idioma no borre lo cargado.

   Son <a> comunes y no <Link> de Next a propósito: Link precarga sus
   destinos, y precargar /?lang=pt pasa por el portero, que guarda la cookie.
   Con Link, solo mostrar el selector podría cambiar el idioma. */

import { IDIOMAS } from '../lib/idioma.js';

const NOMBRE = { es: 'Español', en: 'English', pt: 'Português' };

export default function SelectorIdioma({ lang, ruta, params = {} }) {
  const resto = Object.fromEntries(
    Object.entries(params).filter(([k, v]) => k !== 'lang' && typeof v === 'string'),
  );
  return (
    <span className="g-idiomas">
      {IDIOMAS.map((l) => (
        <a key={l} href={`${ruta}?${new URLSearchParams({ ...resto, lang: l })}`}
           aria-current={l === lang ? 'true' : undefined} title={NOMBRE[l]} hrefLang={l}>
          {l.toUpperCase()}
        </a>
      ))}
    </span>
  );
}
