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
import Quoter from './Quoter.jsx';
import Marca from '../Marca.jsx';

export const dynamic = 'force-dynamic';

export default async function VentasPage({ searchParams }) {
  const params = await searchParams;
  /* Modo presentación: oculta todo el cromo interno para mostrar la pantalla
     a un cliente sin nada que delate que es una herramienta de vendedores. */
  const presentation = params?.modo === 'cliente';

  let user = null;
  try { user = await currentUser(); } catch { /* el precio es público; la comisión no */ }

  const book = await getPublished();
  if (!book) {
    return <main className="q-empty"><p>No hay un catálogo publicado todavía.</p></main>;
  }

  return (
    <>
      {!presentation && (
        <header className="q-bar">
          <Marca rotulo="Cotizador" />
          <nav>
            {user && <span className="who">{user.name}</span>}
            <Link className="btn ghost" href="/ventas?modo=cliente">Modo presentación</Link>
            <a className="btn ghost" href="/ventas/comision" target="_blank" rel="noopener">
              Mi comisión
            </a>
          </nav>
        </header>
      )}

      {presentation && (
        <div className="q-exit">
          <Link href="/ventas">Salir del modo presentación</Link>
        </div>
      )}

      <Quoter catalog={publicCatalog(book.model)} lang="es" presentation={presentation} />
    </>
  );
}
