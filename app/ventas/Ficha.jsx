'use client';

/* ==========================================================================
   Ficha.jsx — el detalle de un servicio o de un equipo.

   POR QUÉ UN PANEL LATERAL Y NO UN MODAL
   El vendedor abre esto sentado al lado del cliente. Un modal a pantalla
   completa tapa el panel de inversión, y el cliente pierde de vista el precio
   justo cuando le están explicando qué está comprando. El panel entra desde
   la derecha y deja la configuración y el total a la vista: "esto es el
   equipo" y "esto es lo que cuesta", al mismo tiempo.

   En pantallas angostas pasa a ser una hoja completa desde abajo, que ahí sí
   es lo correcto.

   Sin comisiones, como todo lo que cuelga de /ventas.
   ========================================================================== */

import { useEffect, useRef } from 'react';

export default function Ficha({ item, lang, textos, precio, cerrar }) {
  const panel = useRef(null);
  const abierto = Boolean(item);

  /* Escape cierra, y mientras está abierto el fondo no se desplaza: si no,
     al scrollear sobre el panel se mueve la página de atrás. */
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('keydown', alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = previo;
    };
  }, [abierto, cerrar]);

  if (!item) return null;

  const t = item.ficha?.textos?.[lang];
  const nota = item.waitlistNote?.[lang] || item.deliveryNote?.[lang];
  const esBorrador = item.ficha?.borrador;

  return (
    <div className="ficha-fondo" onClick={cerrar} role="presentation">
      <aside
        className="ficha"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="ficha-x" type="button" onClick={cerrar} aria-label={textos.cerrar}>
          ✕
        </button>

        {item.ficha?.imagen && (
          /* Sin next/image a propósito: son SVG servidos desde public/, ya
             livianos, y el optimizador no les aporta nada. */
          <img className="ficha-img" src={item.ficha.imagen} alt="" width="1200" height="900" />
        )}

        <div className="ficha-cuerpo">
          <header>
            <h2>{item.name}</h2>
            {item.preOrder && <span className="tag pre">{textos.preventa}</span>}
          </header>

          {precio && <p className="ficha-precio">{precio}</p>}

          {t?.resumen && <p className="ficha-resumen">{t.resumen}</p>}

          {t?.datos?.length > 0 && (
            <div className="ficha-datos">
              {t.datos.map((d, i) => (
                <div key={i}><b>{d.v}</b><span>{d.t}</span></div>
              ))}
            </div>
          )}

          {t?.rasgos?.length > 0 && (
            <>
              <h3>{textos.rasgos}</h3>
              <ul className="ficha-rasgos">
                {t.rasgos.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </>
          )}

          {!t?.rasgos?.length && <p className="ficha-vacio">{textos.sinContenido}</p>}

          {nota && <p className="ficha-nota">{nota}</p>}

          {esBorrador && <p className="ficha-borrador">{textos.borrador}</p>}
        </div>
      </aside>
    </div>
  );
}
