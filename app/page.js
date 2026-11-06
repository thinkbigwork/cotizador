/* ==========================================================================
   /  — guía del cotizador.

   Uso interno: vive detrás del portero, como todo el sitio. Muestra el
   modelo comercial completo por decisión de Wizor (6 nov 2026). Antes de
   abrirla al público, ver CLAUDE.md, invariante 2.

   El contenido es docs/guia/<idioma>.md; las cifras salen del catálogo
   publicado. Esta página no importa el módulo de comisiones.
   ========================================================================== */

import Link from 'next/link';
import Marca from './Marca.jsx';
import { getPublished, listVersions } from '../lib/pricebook/repo.js';
import { armarGuia } from '../lib/guia/render.js';
import { IDIOMAS, TEXTOS } from '../lib/guia/textos.js';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wizor · Guía del cotizador', robots: { index: false, follow: false } };

export default async function GuiaPage({ searchParams }) {
  const params = await searchParams;
  const lang = IDIOMAS.includes(params?.lang) ? params.lang : 'es';
  const T = TEXTOS[lang];

  const [book, versiones] = await Promise.all([getPublished(), listVersions()]);

  const barra = (
    <header className="g-bar">
      <Marca rotulo={lang === 'en' ? 'Guide' : lang === 'pt' ? 'Guia' : 'Guía'} />
      <nav>
        <span className="g-idiomas">
          {IDIOMAS.map((l) => (
            <Link key={l} href={l === 'es' ? '/' : `/?lang=${l}`} aria-current={l === lang ? 'true' : undefined}
                  title={TEXTOS[l].idioma}>
              {l.toUpperCase()}
            </Link>
          ))}
        </span>
        <Link className="btn primary" href="/ventas">{T.irVentas} →</Link>
      </nav>
    </header>
  );

  if (!book) {
    return <>{barra}<main className="g-wrap"><p className="muted">{T.sinCatalogo}</p></main></>;
  }

  const guia = await armarGuia({
    lang, book, versiones, sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  });

  const indice = (
    <ol>
      {guia.secciones.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.titulo}</a></li>)}
    </ol>
  );

  return (
    <>
      {barra}
      <div className="g-wrap" lang={lang}>
        <aside className="g-indice">
          <details open>
            <summary>{T.indice}</summary>
            {indice}
          </details>
        </aside>
        <main className="g-cuerpo">
          <h1>{guia.titulo}</h1>
          {/* El HTML sale de docs/guia (del repositorio) y de valores del
              catálogo que marcadores.js escapa celda por celda. */}
          <article dangerouslySetInnerHTML={{ __html: guia.html }} />
          <p className="g-pie">
            <Link className="btn primary" href="/ventas">{T.irVentas} →</Link>
          </p>
        </main>
      </div>
    </>
  );
}
