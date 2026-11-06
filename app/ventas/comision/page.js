/* ==========================================================================
   /ventas/comision — lo que gana el vendedor.

   Ruta aparte a propósito. Es la única pantalla que importa el módulo de
   comisiones, y se abre en otra pestaña desde el cotizador. Así el vendedor
   nunca tiene las dos cosas en la misma vista mientras le muestra la pantalla
   a un cliente.

   Pide usuario identificado o, mientras el cotizador está en prueba con el
   equipo interno, la clave compartida del sitio. Sin ninguna de las dos no
   muestra ni un número.
   ========================================================================== */

import Link from 'next/link';
import { currentUser, accesoConClave } from '../../../lib/auth.js';
import { getPublished } from '../../../lib/pricebook/repo.js';
import { commissionFor } from '../../../lib/pricing/commissions.js';
import { idiomaActual } from '../../../lib/idioma.js';
import SelectorIdioma from '../../SelectorIdioma.jsx';
import { TEXTOS_COMISION } from './textos.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: TEXTOS_COMISION[await idiomaActual()].titulo };
}

const ROLES = ['conector', 'desarrollador', 'vendedor', 'socio'];

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const pct = (n) => `${(n * 100).toFixed(n * 100 % 1 === 0 ? 0 : 1)}%`;
const num = (v, fallback) => {
  const n = Number.parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const llenar = (plantilla, valores) => plantilla.replace(/\{(\w+)\}/g, (_, k) => valores[k] ?? '');

export default async function ComisionPage({ searchParams }) {
  const params = await searchParams;
  const lang = await idiomaActual();
  const T = TEXTOS_COMISION[lang];
  const selector = (
    <div className="c-idioma"><SelectorIdioma lang={lang} ruta="/ventas/comision" params={params} /></div>
  );

  let user = null;
  try {
    user = await currentUser();
  } catch {
    /* Sin usuario identificado (en producción todavía no hay login), basta la
       clave compartida. Si tampoco está, se corta acá, antes de calcular. */
    if (!(await accesoConClave())) {
      return (
        <main className="c-wrap">
          {selector}
          <div className="c-lock"><p>{T.sinAcceso}</p></div>
        </main>
      );
    }
  }

  const book = await getPublished();
  if (!book) return <main className="c-wrap">{selector}<p>{T.sinCatalogo}</p></main>;

  const deal = num(params?.contrato, 153000);
  const ytd = num(params?.acumulado, 0);
  const role = ROLES.includes(params?.rol) ? params.rol : 'vendedor';

  const result = commissionFor(book.model, role, deal, { priorYtdUsd: ytd });
  const config = book.model.commissions.partner;

  return (
    <main className="c-wrap">
      <div className="c-warn">{T.aviso}</div>
      {selector}

      <header className="c-head">
        <h1>{T.h1}</h1>
        <p className="muted">
          {user ? user.name : T.conClave} · {llenar(T.catalogo, { v: book.version })}
        </p>
      </header>

      <form className="panel c-form" method="get">
        <label>
          <span>{T.lContrato}</span>
          <input type="number" name="contrato" min="0" step="1000" defaultValue={deal} />
        </label>
        <label>
          <span>{T.lRol}</span>
          <select name="rol" defaultValue={role}>
            {ROLES.map((k) => <option key={k} value={k}>{T.roles[k][0]}</option>)}
          </select>
        </label>
        <label>
          <span>{T.lAcumulado}</span>
          <input type="number" name="acumulado" min="0" step="1000" defaultValue={ytd} />
          <small>{T.soloSocio}</small>
        </label>
        <button className="btn primary" type="submit">{T.calcular}</button>
      </form>

      <section className="panel c-result">
        <div className="c-amount">
          {money(result.amount)}
          <small>{llenar(T.sobre, { monto: money(deal), pct: pct(result.effectivePct) })}</small>
        </div>

        {role === 'socio' && (
          <>
            <h2>{T.comoSeArma}</h2>
            <p className="muted">{T.explicaSocio}</p>
            <table className="c-table">
              <thead>
                <tr>{T.th.map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {result.slices.map((s, i) => (
                  <tr key={i}>
                    <td>{money(s.from)} – {s.to === null ? T.sinTope : money(s.to)}</td>
                    <td>{money(s.base)}</td>
                    <td>{pct(s.pct)}</td>
                    <td>{money(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.nextTier && (
              <div className="c-next">
                {llenar(T.teFaltan, { monto: money(result.nextTier.missing), pct: pct(result.nextTier.pct) })}
              </div>
            )}

            <p className="muted small">
              {config.resetsAnnually ? T.reinicia : T.noReinicia}
              {config.retroactive ? '' : ` ${T.noRetro}`}
              {' '}{T.absorbe}
            </p>
          </>
        )}

        {role !== 'socio' && <p className="muted">{T.explicaFijo}</p>}
      </section>

      <p className="c-back"><Link href="/ventas">{T.volver}</Link></p>
    </main>
  );
}
