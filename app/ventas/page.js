/* ==========================================================================
   /ventas — cotizador de vendedores.

   Esta página es SEGURA FRENTE AL CLIENTE: no contiene ni una sola cifra de
   comisión. El módulo de comisiones no se importa acá ni en nada de lo que
   esta página carga, y hay un test que descarga el HTML y verifica que no
   aparezca nada de eso.

   La comisión vive en /ventas/comision, que se abre en otra pestaña.
   ========================================================================== */

import Link from 'next/link';
import { currentUser } from '../../lib/auth.js';
import { getPublished } from '../../lib/pricebook/repo.js';
import { publicCatalog } from '../../lib/pricing/public-catalog.js';
import { fichas } from '../../lib/contenido/repo.js';
import Quoter from './Quoter.jsx';
import Marca from '../Marca.jsx';
import SelectorIdioma from '../SelectorIdioma.jsx';
import { idiomaActual } from '../../lib/idioma.js';
import { TEXTOS_VENTAS } from './textos.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: TEXTOS_VENTAS[await idiomaActual()].titulo };
}

export default async function VentasPage({ searchParams }) {
  const params = await searchParams;
  /* Modo presentación: oculta todo el cromo interno para mostrar la pantalla
     a un cliente sin nada que delate que es una herramienta de vendedores. */
  const presentation = params?.modo === 'cliente';
  const lang = await idiomaActual();
  const T = TEXTOS_VENTAS[lang];

  let user = null;
  try { user = await currentUser(); } catch { /* el precio es público; la comisión no */ }

  const [book, contenido] = await Promise.all([getPublished(), fichas()]);
  if (!book) {
    return <main className="q-empty"><p>{T.sinCatalogo}</p></main>;
  }

  return (
    <>
      {!presentation && (
        <header className="q-bar">
          <Marca rotulo={T.rotulo} />
          <nav>
            {user && <span className="who">{user.name}</span>}
            <SelectorIdioma lang={lang} ruta="/ventas" params={params} />
            <Link className="btn ghost" href="/">{T.guia}</Link>
            <Link className="btn ghost" href="/ventas?modo=cliente">{T.presentacion}</Link>
            <a className="btn ghost" href="/ventas/comision" target="_blank" rel="noopener">
              {T.miComision}
            </a>
          </nav>
        </header>
      )}

      {presentation && (
        <div className="q-exit">
          <Link href="/ventas">{T.salir}</Link>
          {/* El cliente puede necesitar la pantalla en su idioma. */}
          <SelectorIdioma lang={lang} ruta="/ventas" params={params} />
        </div>
      )}

      <Quoter catalog={publicCatalog(book.model, contenido)} lang={lang} presentation={presentation} />
    </>
  );
}
