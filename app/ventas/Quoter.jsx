'use client';

/* ==========================================================================
   Quoter.jsx — el cotizador que usa el vendedor.

   SEPARACIÓN DE COMISIONES
   Este componente no sabe nada de comisiones. No las importa, no las calcula
   y no las recibe. Es deliberado: el vendedor puede estar usando esta
   pantalla sentado al lado del cliente, y ocultar la comisión con CSS no
   sirve —queda en el HTML, a un "ver código fuente" de distancia—. La
   comisión vive en otra ruta, que se abre en otra pestaña.

   Tampoco baja el modelo comercial: cada cambio se cotiza en /api/quote y de
   vuelta vienen números, no curvas.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Ficha from './Ficha.jsx';
import Hoja from './Hoja.jsx';
import { STRINGS, NOTE_KEYS, SEGMENT_KEYS, PER_PERSON_UNIT } from '../../lib/i18n.js';

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
const money2 = (n) => `$${n.toFixed(2)}`;

export default function Quoter({ catalog, lang = 'es', presentation }) {
  const t = STRINGS[lang];
  const unit = PER_PERSON_UNIT[lang];

  const [form, setForm] = useState({ industry: catalog.industries[0], headcount: 850, sites: 3, countries: 1 });
  const [selected, setSelected] = useState({});
  const [hardware, setHardware] = useState({});
  const [result, setResult] = useState(null);
  const [failed, setFailed] = useState(false);

  const seq = useRef(0);

  /* Clave del ítem cuya ficha está abierta, o null. */
  const [fichaDe, setFichaDe] = useState(null);

  /* Empresa a la que va dirigida la cotización. Se pide antes de imprimir y
     sale en la portada del PDF. */
  const [empresa, setEmpresa] = useState('');
  const dialogo = useRef(null);
  const [imprimir, setImprimir] = useState(false);

  /* Se imprime en el render siguiente al de confirmar, para que la hoja ya
     tenga el nombre. El título de la pestaña pasa a ser el del archivo: es el
     nombre que el navegador propone al guardar el PDF. */
  useEffect(() => {
    if (!imprimir) return;
    setImprimir(false);
    const antes = document.title;
    document.title = [t.hoja.archivo, empresa.trim()].filter(Boolean).join(' · ');
    const volver = () => { document.title = antes; window.removeEventListener('afterprint', volver); };
    window.addEventListener('afterprint', volver);
    window.print();
  }, [imprimir, empresa, t.hoja.archivo]);

  function confirmarPdf(e) {
    e.preventDefault();
    dialogo.current?.close();
    setImprimir(true);
  }

  const byGroup = useMemo(() => {
    const groups = new Map();
    for (const item of catalog.hardware) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group).push(item);
    }
    return groups;
  }, [catalog.hardware]);

  const hardwareCount = useMemo(
    () => Object.values(hardware).reduce((s, n) => s + (n || 0), 0), [hardware],
  );

  /* Cada cambio se cotiza en el servidor. Se descarta la respuesta que llega
     tarde para que no pise una configuración más nueva. */
  const recalc = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, selected, hardware }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (mine === seq.current) { setResult(data); setFailed(false); }
    } catch {
      if (mine === seq.current) setFailed(true);
    }
  }, [form, selected, hardware]);

  useEffect(() => { const id = setTimeout(recalc, 120); return () => clearTimeout(id); }, [recalc]);

  /* Los equipos solo sirven con un producto que los admita; elegirlos lo
     activa, y apagarlo los quita. */
  function toggleProduct(key) {
    const product = catalog.products.find((p) => p.key === key);
    setSelected((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (next[key]) for (const absorbed of product.absorbs) next[absorbed] = false;
      for (const other of catalog.products) {
        if (other.key !== key && next[other.key] && other.absorbs.includes(key) && next[key]) {
          next[other.key] = false;
        }
      }
      return next;
    });
    if (!product.supportsHardware) setHardware({});
  }

  function setQty(key, value) {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    setHardware((prev) => ({ ...prev, [key]: qty }));
    if (qty > 0) {
      const holder = catalog.products.find((p) => p.supportsHardware);
      if (holder) {
        setSelected((prev) => {
          if (prev[holder.key]) return prev;
          const next = { ...prev, [holder.key]: true };
          for (const absorbed of holder.absorbs) next[absorbed] = false;
          return next;
        });
      }
    }
  }

  /* El ítem de la ficha puede ser un servicio o un equipo. El precio se
     muestra distinto: por persona y por mes uno, pago único el otro. */
  const itemDeFicha = fichaDe
    ? catalog.products.find((p) => p.key === fichaDe) ?? catalog.hardware.find((h) => h.key === fichaDe)
    : null;

  let precioDeFicha = null;
  if (itemDeFicha) {
    if (itemDeFicha.group) {
      precioDeFicha = `${money(itemDeFicha.price)} · ${t.ficha.pago}`;
    } else if (!result?.free && result?.plans?.[itemDeFicha.key]) {
      precioDeFicha = `${money2(result.plans[itemDeFicha.key].perPersonMonth)} /${unit}`;
    }
  }

  const checkout = result?.checkout;
  const checkoutNote = checkout
    ? (t.ck[checkout.mode] || '').replace('{monto}', money(checkout.depositUsd ?? 0))
    : '';

  return (
    <>
    <div className="q-wrap">
      <main>
        <section className="panel">
          <h2>{t.t1}</h2>
          <p className="hint">{t.h1h}</p>
          <div className="grid2">
            <label>
              <span>{t.lInd}</span>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                {catalog.industries.map((k) => <option key={k} value={k}>{t.i[k] ?? k}</option>)}
              </select>
            </label>
            <label>
              <span>{t.lHc}</span>
              <input type="number" min="1" step="10" value={form.headcount}
                onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
            </label>
            <label>
              <span>{t.lEst}</span>
              <input type="number" min="1" step="1" value={form.sites}
                onChange={(e) => setForm({ ...form, sites: e.target.value })} />
            </label>
            <label>
              <span>{t.lCtn}</span>
              <input type="number" min="1" step="1" value={form.countries}
                onChange={(e) => setForm({ ...form, countries: e.target.value })} />
            </label>
          </div>
        </section>

        <section className="panel">
          <h2>{t.t2}</h2>
          <p className="hint">{t.h2h}</p>
          <div className="plans">
            {catalog.products.map((p) => {
              const on = Boolean(selected[p.key]);
              const plan = result?.plans?.[p.key];
              return (
                /* La tarjeta NO es un botón: adentro hay dos acciones
                   distintas —elegir el plan y abrir la ficha— y un botón
                   dentro de otro es HTML inválido y un clic ambiguo. */
                <div key={p.key} className={p.ficha?.imagen ? 'plan con-mini' : 'plan'} data-on={on ? 1 : 0}>
                  {/* La misma miniatura que los equipos: sin ella, el "Ver
                      detalle" de los servicios pasaba desapercibido. */}
                  {p.ficha?.imagen && (
                    <button type="button" className="dev-mini plan-mini" onClick={() => setFichaDe(p.key)}
                      aria-label={`${t.ficha.ver}: ${p.name}`}>
                      <img src={p.ficha.imagen} alt="" width="1200" height="900" />
                    </button>
                  )}
                  <button type="button" className="plan-elegir" aria-pressed={on}
                    onClick={() => toggleProduct(p.key)}>
                    <h3>
                      {p.name}
                      <span className={`tag ${p.preOrder ? 'pre' : 'ok'}`}>
                        {p.preOrder ? t.pre : t.avail}
                      </span>
                      <span className="price">
                        {result?.free ? '—' : plan ? `${money2(plan.perPersonMonth)} /${unit}` : '…'}
                      </span>
                    </h3>
                    {p.preOrder && p.waitlistNote?.[lang] && (
                      <p className="prenote">{p.waitlistNote[lang]}</p>
                    )}
                  </button>
                  {p.ficha && (
                    <button type="button" className="plan-ficha" onClick={() => setFichaDe(p.key)}>
                      {t.ficha.ver}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {[...byGroup.entries()].map(([group, items]) => (
          <section className="panel" key={group}>
            <h2>{group === 'panel' ? t.panelT : t.t3}</h2>
            {items.map((h) => (
              <div className="dev" key={h.key}>
                {h.ficha?.imagen && (
                  <button type="button" className="dev-mini" onClick={() => setFichaDe(h.key)}
                    aria-label={`${t.ficha.ver}: ${h.name}`}>
                    <img src={h.ficha.imagen} alt="" width="1200" height="900" />
                  </button>
                )}
                <div className="n">
                  <b>{h.name}</b>
                  <small>
                    {h.spec?.[lang]} · {money(h.price)}
                    {h.preOrder && <> · <span className="pre-mark">{t.pre.toLowerCase()}</span></>}
                  </small>
                  {h.ficha && (
                    <button type="button" className="dev-ficha" onClick={() => setFichaDe(h.key)}>
                      {t.ficha.ver}
                    </button>
                  )}
                </div>
                <input type="number" min="0" step="1" value={hardware[h.key] ?? 0}
                  aria-label={h.name} onChange={(e) => setQty(h.key, e.target.value)} />
              </div>
            ))}
          </section>
        ))}
      </main>

      <aside>
        <div className="sum">
          <h2>{t.sT}</h2>
          <div className="big">
            {result?.monthlyTotal ? money(result.monthlyTotal) : '—'}{' '}
            <small>{t.mLab}</small>
          </div>
          <p className="taxline">{t.taxAll}</p>

          {failed && <p className="warnline">{t.quoteFail}</p>}

          {result && !result.unlisted && (
            <div className="rows">
              <Row label={t.rAnnual} value={money(result.platformAnnual)} />
              <Row label={t.rPepm} value={result.free ? '—' : money2(result.perPersonMonth)} />
              {form.countries > 1 && <Row label={t.rCtn} value={String(form.countries)} />}
              <Row label={t.rRep} value={String(result.reports)} />
              <Row label={t.rUsr} value={String(result.users)} />
              <Row label={t.rIdx} value={result.index ? t.yes : t.no} />
              {result.hardwareLines?.map((l) => (
                <Row key={l.key} label={`${l.name} × ${l.qty}`} value={money(l.subtotal)} />
              ))}
              <Row label={t.rTot} value={money(result.firstYear)} total />
            </div>
          )}

          {result?.notes?.length > 0 && (
            <p className="muted">{result.notes.map((n) => t[NOTE_KEYS[n]]).join(' ')}</p>
          )}

          {checkout && (
            <div className={`segbox ${checkout.mode}`}>
              <b>{t[SEGMENT_KEYS[result.segment]?.[0]] ?? ''}</b>
              <span>{checkoutNote}</span>
            </div>
          )}

          <button className="btn primary wide" type="button" onClick={() => dialogo.current?.showModal()}>
            {t.ctaPdf}
          </button>

          {!presentation && hardwareCount >= 0 && (
            <p className="internal-note">
              Precios de lista en dólares, catálogo v{result?.priceBookVersion ?? '—'}.
            </p>
          )}
        </div>
      </aside>
    </div>

    {/* La ficha va FUERA de .q-wrap: es una capa superpuesta, no una columna
        de la grilla. Adentro, al ser también un <aside>, la regla
        `.q-wrap aside{position:static}` del móvil le ganaba en especificidad
        y la hoja quedaba sin posicionar, con el total dibujado encima. */}
    <dialog ref={dialogo} className="hoja-dlg" aria-labelledby="hoja-dlg-t">
      <form onSubmit={confirmarPdf}>
        <h2 id="hoja-dlg-t">{t.hoja.dlgT}</h2>
        <label>
          <span>{t.hoja.dlgL}</span>
          <input type="text" value={empresa} maxLength={80} autoFocus
            placeholder={t.hoja.dlgP} onChange={(e) => setEmpresa(e.target.value)} />
        </label>
        <p className="hint">{t.hoja.dlgH}</p>
        <div className="hoja-dlg-acc">
          <button type="button" className="btn ghost" onClick={() => dialogo.current?.close()}>{t.hoja.dlgNo}</button>
          <button type="submit" className="btn primary">{t.hoja.dlgOk}</button>
        </div>
      </form>
    </dialog>

    <Hoja t={t} lang={lang} unit={unit} catalog={catalog} form={form} selected={selected}
      result={result} empresa={empresa.trim()} gruposEquipos={[...byGroup.entries()]} />

    <Ficha
      item={itemDeFicha}
      lang={lang}
      textos={{ ...t.ficha, preventa: t.pre }}
      precio={precioDeFicha}
      cerrar={() => setFichaDe(null)}
    />
    </>
  );
}

function Row({ label, value, total }) {
  return (
    <div className={`row${total ? ' tot' : ''}`}>
      <span>{label}</span><b>{value}</b>
    </div>
  );
}
