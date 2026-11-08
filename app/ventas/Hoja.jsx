/* ==========================================================================
   Hoja.jsx — la cotización que se descarga en PDF.

   No es la pantalla impresa. Imprimir la pantalla tal cual daba un PDF con
   textos blancos del tema oscuro convertidos en gris claro sobre blanco,
   cuadros cortados al azar entre páginas y el servicio elegido casi igual a
   los demás. Esta hoja se arma aparte, para papel, y solo se ve al imprimir
   (ver `.hoja` en globals.css).

   Tres páginas fijas, cada una con su salto:
     1. Portada, organización y servicios.
     2. Dispositivos y paneles.
     3. Resumen de la inversión.

   Lo elegido se destaca y lo que no se eligió se atenúa: el cliente ve todo
   lo que existe, pero sin dudar de qué está cotizado.

   Como el cotizador, no conoce comisiones ni el modelo comercial: usa los
   números que ya devolvió /api/quote. Tampoco muestra la versión del
   catálogo, que es un dato interno.
   ========================================================================== */

import { NOTE_KEYS, SEGMENT_KEYS, DATE_LOCALE } from '../../lib/i18n.js';

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const money2 = (n) => `$${n.toFixed(2)}`;

export default function Hoja({ t, lang, unit, catalog, form, selected, result, empresa, gruposEquipos }) {
  const h = t.hoja;
  const fecha = new Date().toLocaleDateString(DATE_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' });
  const lineas = new Map((result?.hardwareLines ?? []).map((l) => [l.key, l]));
  const paginas = 3;
  const pie = (n) => (
    <footer className="hoja-pie">
      <span>Wizor · {h.titulo}{empresa ? ` · ${empresa}` : ''}</span>
      <span>{h.pagina.replace('{n}', n).replace('{t}', paginas)}</span>
    </footer>
  );
  const checkout = result?.checkout;

  return (
    <div className="hoja" aria-hidden="true">
      {/* --- Página 1: portada, organización y servicios --- */}
      <section className="hoja-pag">
        <header className="hoja-tapa">
          {/* El logo es blanco: va sobre la franja azul, que se imprime con
              print-color-adjust:exact. Sobre papel blanco no se vería. */}
          <img src="/logo-wizor.png" alt="Wizor" width={840} height={278} />
          <div>
            <h1>{h.titulo}</h1>
            {empresa && <p className="hoja-para">{h.para} <b>{empresa}</b></p>}
            <p className="hoja-fecha">{h.fecha}: {fecha}</p>
          </div>
        </header>

        <p className="hoja-intro">{h.intro}</p>

        <h2>{h.org}</h2>
        <div className="hoja-org">
          <Dato label={t.lInd} value={t.i[form.industry] ?? form.industry} />
          <Dato label={t.lHc} value={Number(form.headcount).toLocaleString('en-US')} />
          <Dato label={t.lEst} value={form.sites} />
          <Dato label={t.lCtn} value={form.countries} />
        </div>

        <h2>{h.servicios}</h2>
        <div className="hoja-servicios">
          {catalog.products.map((p) => {
            const on = Boolean(selected[p.key]);
            const plan = result?.plans?.[p.key];
            return (
              <article key={p.key} className={`hoja-serv${on ? ' on' : ''}`}>
                {p.ficha?.imagen && <img src={p.ficha.imagen} alt="" width="1200" height="900" />}
                <div>
                  <div className="hoja-serv-cab">
                    <h3>{p.name}</h3>
                    <span className={`hoja-marca${on ? ' on' : ''}`}>{on ? `✓ ${h.incluido}` : h.noIncluido}</span>
                  </div>
                  <p className="hoja-precio">
                    {result?.free ? '—' : plan ? `${money2(plan.perPersonMonth)} /${unit}` : '—'}
                    {p.preOrder && <span className="hoja-pre"> · {t.pre}</span>}
                  </p>
                  <p>{t.p[p.key]?.d}</p>
                  {on && t.p[p.key]?.f && (
                    <ul>{t.p[p.key].f.map((f) => <li key={f}>{f}</li>)}</ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {pie(1)}
      </section>

      {/* --- Página 2: dispositivos y paneles --- */}
      <section className="hoja-pag">
        <h2 className="hoja-titulo-pag">{h.equipos}</h2>
        {lineas.size === 0 && <p className="hoja-vacio">{h.sinEquipos}</p>}
        {gruposEquipos.map(([grupo, items]) => (
          <div key={grupo} className="hoja-grupo">
            <h3>{grupo === 'panel' ? t.panelT : t.t3}</h3>
            <table className="hoja-tabla">
              <thead>
                <tr><th colSpan={2}></th><th>{h.unit}</th><th>{h.cant}</th><th>{h.subtotal}</th></tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const l = lineas.get(it.key);
                  return (
                    <tr key={it.key} className={l ? 'on' : ''}>
                      <td className="hoja-mini">
                        {it.ficha?.imagen && <img src={it.ficha.imagen} alt="" width="1200" height="900" />}
                      </td>
                      <td>
                        <b>{it.name}</b>
                        <small>{it.spec?.[lang]}{it.preOrder && <span className="hoja-pre"> · {t.pre}</span>}</small>
                      </td>
                      <td>{money(it.price)}</td>
                      <td>{l ? l.qty : 0}</td>
                      <td>{l ? money(l.subtotal) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {pie(2)}
      </section>

      {/* --- Página 3: resumen de la inversión --- */}
      <section className="hoja-pag">
        <h2 className="hoja-titulo-pag">{h.resumen}</h2>
        <div className="hoja-total">
          <span>{t.sT}</span>
          <b>{result?.monthlyTotal ? money(result.monthlyTotal) : '—'} <small>{t.mLab}</small></b>
        </div>

        {result && !result.unlisted && (
          <table className="hoja-filas">
            <tbody>
              <Fila label={t.rAnnual} value={money(result.platformAnnual)} />
              <Fila label={t.rPepm} value={result.free ? '—' : money2(result.perPersonMonth)} />
              {form.countries > 1 && <Fila label={t.rCtn} value={String(form.countries)} />}
              <Fila label={t.rRep} value={String(result.reports)} />
              <Fila label={t.rUsr} value={String(result.users)} />
              <Fila label={t.rIdx} value={result.index ? t.yes : t.no} />
              {result.hardwareLines?.map((l) => (
                <Fila key={l.key} label={`${l.name} × ${l.qty}`} value={money(l.subtotal)} />
              ))}
              <Fila label={t.rTot} value={money(result.firstYear)} total />
            </tbody>
          </table>
        )}

        {result?.notes?.length > 0 && (
          <p className="hoja-notas">{result.notes.map((n) => t[NOTE_KEYS[n]]).join(' ')}</p>
        )}

        {checkout && (
          <div className="hoja-cierre">
            <b>{t[SEGMENT_KEYS[result.segment]?.[0]] ?? ''}</b>
            <span>{(t.ck[checkout.mode] || '').replace('{monto}', money(checkout.depositUsd ?? 0))}</span>
          </div>
        )}

        <p className="hoja-legal">{t.taxAll} {t.foot}</p>
        {pie(3)}
      </section>
    </div>
  );
}

function Dato({ label, value }) {
  return <div className="hoja-dato"><span>{label}</span><b>{value}</b></div>;
}

function Fila({ label, value, total }) {
  return <tr className={total ? 'tot' : ''}><td>{label}</td><td>{value}</td></tr>;
}
