/* ==========================================================================
   /ventas/comision — lo que gana el vendedor.

   Ruta aparte a propósito. Es la única pantalla que importa el módulo de
   comisiones, y se abre en otra pestaña desde el cotizador. Así el vendedor
   nunca tiene las dos cosas en la misma vista mientras le muestra la pantalla
   a un cliente.

   Pide usuario identificado. Sin sesión no muestra ni un número.
   ========================================================================== */

import Link from 'next/link';
import { currentUser } from '../../../lib/auth.js';
import { getPublished } from '../../../lib/pricebook/repo.js';
import { commissionFor } from '../../../lib/pricing/commissions.js';

export const dynamic = 'force-dynamic';

const ROLES = [
  ['conector', 'Conector', 'Abre la puerta y presenta.'],
  ['desarrollador', 'Desarrollador de negocios', 'Gestión de influencia, lobby y relaciones.'],
  ['vendedor', 'Vendedor', 'Cierra la venta.'],
  ['socio', 'Socio de negocio', 'Lleva las operaciones de un país o región.'],
];

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const pct = (n) => `${(n * 100).toFixed(n * 100 % 1 === 0 ? 0 : 1)}%`;
const num = (v, fallback) => {
  const n = Number.parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export default async function ComisionPage({ searchParams }) {
  const params = await searchParams;

  let user;
  try {
    user = await currentUser();
  } catch (error) {
    return (
      <main className="c-wrap">
        <div className="c-lock"><p>{error.message}</p></div>
      </main>
    );
  }

  const book = await getPublished();
  if (!book) return <main className="c-wrap"><p>No hay catálogo publicado.</p></main>;

  const deal = num(params?.contrato, 153000);
  const ytd = num(params?.acumulado, 0);
  const role = ROLES.some(([k]) => k === params?.rol) ? params.rol : 'vendedor';

  const result = commissionFor(book.model, role, deal, { priorYtdUsd: ytd });
  const config = book.model.commissions.partner;

  return (
    <main className="c-wrap">
      <div className="c-warn">Vista interna · no mostrar al cliente</div>

      <header className="c-head">
        <h1>Tu comisión</h1>
        <p className="muted">
          {user.name} · catálogo v{book.version}
        </p>
      </header>

      <form className="panel c-form" method="get">
        <label>
          <span>Valor del contrato, primer año</span>
          <input type="number" name="contrato" min="0" step="1000" defaultValue={deal} />
        </label>
        <label>
          <span>Tu rol</span>
          <select name="rol" defaultValue={role}>
            {ROLES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Ya cerrado este año</span>
          <input type="number" name="acumulado" min="0" step="1000" defaultValue={ytd} />
          <small>Solo cuenta para el socio de negocio.</small>
        </label>
        <button className="btn primary" type="submit">Calcular</button>
      </form>

      <section className="panel c-result">
        <div className="c-amount">
          {money(result.amount)}
          <small>sobre {money(deal)} · {pct(result.effectivePct)} efectivo</small>
        </div>

        {role === 'socio' && (
          <>
            <h2>Cómo se arma</h2>
            <p className="muted">
              Escala marginal sobre el acumulado del año. Cada tramo paga su propia tasa:
              no hay saltos, y la tasa que ganás corre para todo lo que cierres después.
            </p>
            <table className="c-table">
              <thead>
                <tr><th>Tramo del acumulado</th><th>Base</th><th>Tasa</th><th>Comisión</th></tr>
              </thead>
              <tbody>
                {result.slices.map((s, i) => (
                  <tr key={i}>
                    <td>{money(s.from)} – {s.to === null ? 'sin tope' : money(s.to)}</td>
                    <td>{money(s.base)}</td>
                    <td>{pct(s.pct)}</td>
                    <td>{money(s.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {result.nextTier && (
              <div className="c-next">
                Te faltan <b>{money(result.nextTier.missing)}</b> de producción para pasar
                al <b>{pct(result.nextTier.pct)}</b>, y esa tasa corre para todo lo que
                cierres después.
              </div>
            )}

            <p className="muted small">
              El acumulado {config.resetsAnnually ? 'vuelve a cero cada año calendario' : 'no se reinicia'}.
              {config.retroactive ? '' : ' Lo ya cobrado a una tasa menor no se recalcula.'}
              {' '}El socio absorbe a los demás roles dentro de su territorio.
            </p>
          </>
        )}

        {role !== 'socio' && (
          <p className="muted">
            Porcentaje fijo sobre el valor del primer año del contrato.
            Si hay un socio de negocio en el territorio, él absorbe esta comisión.
          </p>
        )}
      </section>

      <p className="c-back"><Link href="/ventas">← Volver al cotizador</Link></p>
    </main>
  );
}
