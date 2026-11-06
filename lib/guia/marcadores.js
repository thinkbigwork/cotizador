/* ==========================================================================
   marcadores.js — las cifras de la guía, sacadas del catálogo publicado.

   docs/guia/<idioma>.md no tiene ni un número escrito a mano: tiene
   marcadores como {{minimo}} o {{tabla.bandas}}, y este módulo los resuelve
   contra el catálogo vigente. Así la guía no puede contradecir al
   cotizador, y cuando se publica una versión nueva se actualiza sola.

   Muestra el modelo comercial completo (curvas, factores, bandas). Es una
   decisión de Wizor del 6 de noviembre de 2026: la guía es solo para el
   equipo interno y vive detrás del portero. NO la abras al público sin
   revisar esto primero (ver CLAUDE.md, invariante 2).

   Nunca importa el módulo de comisiones: un vendedor puede mostrarle esta
   página a un cliente.

   Solo corre en el servidor.
   ========================================================================== */

import { quote, activeProducts, activeHardware } from '../pricing/engine.js';
import { STRINGS } from '../i18n.js';
import { TEXTOS, LOCALE } from './textos.js';

/* Casos de ejemplo. No son valores comerciales: son configuraciones
   cualquiera para mostrar cómo se comporta el motor en cada tamaño. Los
   importes los calcula quote() con el catálogo vigente. */
export const EJEMPLOS = [
  { industry: 'edu', headcount: 80, sites: 1, countries: 1, selected: { core: true }, hardware: {} },
  { industry: 'constr', headcount: 850, sites: 4, countries: 1, selected: { core: true }, hardware: {} },
  {
    industry: 'manuf', headcount: 20000, sites: 12, countries: 3,
    selected: { w360: true }, hardware: { desk: 40, mach: 10, pin: 60, panel_pro: 1 },
  },
];

const fill = (plantilla, valores) =>
  plantilla.replace(/\{(\w+)\}/g, (_, k) => (valores[k] ?? `{${k}}`));

/* El contenido de las celdas viene del catálogo, que se edita desde el back
   office: se escapa lo que rompería la tabla o se interpretaría como HTML. */
const celda = (v) => String(v ?? '—')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\|/g, '\\|').replace(/\n/g, ' ');

function tabla(encabezados, filas) {
  return [
    `| ${encabezados.map(celda).join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((f) => `| ${f.map(celda).join(' | ')} |`),
  ].join('\n');
}

function formatos(lang) {
  const loc = LOCALE[lang];
  const usd = new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const usd2 = new Intl.NumberFormat(loc, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  /* Los factores van como porcentaje: 0,833 → 83,3 %. Además de leerse
     mejor, evita que un factor se confunda con una tasa de comisión en el
     test de separación. */
  const pct = new Intl.NumberFormat(loc, { style: 'percent', maximumFractionDigits: 1 });
  const fecha = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' });
  return {
    usd: (n) => usd.format(n), usd2: (n) => usd2.format(n), num: (n) => num.format(n),
    pct: (n) => pct.format(n), fecha: (d) => (d ? fecha.format(new Date(d)) : '—'),
  };
}

/**
 * Valores de todos los marcadores para un idioma.
 * @param {object} book          catálogo publicado (documento + version + published_at)
 * @param {string} lang
 * @param {object} extra         { versiones: [...], sha: string|null }
 * @returns {Record<string,string>} marcador → markdown
 */
export function marcadores(book, lang, { versiones = [], sha = null } = {}) {
  const T = TEXTOS[lang];
  const S = STRINGS[lang];
  const f = formatos(lang);
  const model = book.model;
  const productos = activeProducts(model);
  const nombre = (key) => model.products.find((p) => p.key === key)?.name ?? key;

  const m = {};

  /* --- Catálogo y contrato --- */
  m['catalogo.version'] = `v${book.version}`;
  m['catalogo.fecha'] = f.fecha(book.published_at);
  m.minimo = f.usd(model.annualMinimum);
  m['autoservicio.max'] = f.num(model.selfServiceMaxHeadcount);
  m['contrato.meses'] = f.num(model.contract.termMonths);
  m['contrato.facturacion'] = T.facturacion[model.contract.billing] ?? model.contract.billing;
  m['contrato.validez'] = f.num(model.contract.quoteValidDays);

  /* --- Actividad → categoría → factor --- */
  m['tabla.categorias'] = tabla(
    [T.th.categoria, T.th.factor, T.th.actividades],
    model.categories.map((c) => [
      `${c.key} · ${T.categorias[c.key] ?? c.label}`,
      f.pct(c.free ? 0 : c.factor),
      Object.entries(model.industries).filter(([, cat]) => cat === c.key)
        .map(([ind]) => S.i?.[ind] ?? ind).join(', '),
    ]),
  );

  /* --- Bandas cerradas para dotaciones chicas --- */
  m['tabla.bandas'] = tabla(
    [T.th.hasta, T.th.bandaBase, ...productos.map((p) => `${p.name} (×${p.bandMultiplier})`)],
    model.smallBands.map(([hasta, precio]) => [
      `${f.num(hasta)} ${T.th.personas}`,
      f.usd(precio),
      ...productos.map((p) => f.usd(precio * p.bandMultiplier)),
    ]),
  );

  /* --- Curvas de volumen (tarifa marginal por tramo) --- */
  const tiers = model.curves[0]?.tiers ?? [];
  const rango = (i) => {
    const desde = i === 0 ? 1 : tiers[i - 1] + 1;
    return tiers[i] === null
      ? `${f.num(desde)} ${T.tramoAbierto}`
      : `${f.num(desde)} – ${f.num(tiers[i])}`;
  };
  m['tabla.curvas'] = tabla(
    [T.th.tramo, ...model.curves.map((c) => T.curvas[c.key] ?? c.label)],
    tiers.map((_, i) => [rango(i), ...model.curves.map((c) => f.pct(c.factors[i]))]),
  );

  /* --- Productos --- */
  const equiposDe = (p) => (p.requiresHardware ? T.equiposProducto.exige
    : p.supportsHardware ? T.equiposProducto.admite : T.equiposProducto.no);
  m['tabla.productos'] = tabla(
    ['', ...productos.map((p) => p.name)],
    [
      [T.th.tarifaBase, ...productos.map((p) => f.usd2(p.baseRate))],
      [T.th.curva, ...productos.map((p) => T.curvas[p.curve] ?? p.curve)],
      [T.th.aplicaFactor, ...productos.map((p) => (p.appliesCategoryFactor ? T.si : T.no))],
      [T.th.informes, ...productos.map((p) => fill(T.informes, { r: p.reports.regional, s: p.reports.perSite }))],
      [T.th.usuarios, ...productos.map((p) => f.num(p.backofficeUsers))],
      [T.th.equipos, ...productos.map(equiposDe)],
      [T.th.absorbe, ...productos.map((p) => (p.absorbs.length ? p.absorbs.map(nombre).join(', ') : '—'))],
      [T.th.venta, ...productos.map((p) => T.ventaModo[p.onlineMode] ?? p.onlineMode)],
    ],
  );

  /* Descripción de cada producto: los mismos textos que muestra el cotizador. */
  m['productos.descripciones'] = productos.map((p) => {
    const t = S.p?.[p.key];
    if (!t) return `### ${p.name}`;
    return [`### ${p.name}`, '', t.d, '', ...t.f.map((x) => `- ${x}`)].join('\n');
  }).join('\n\n');

  m['tabla.equipos'] = tabla(
    [T.th.equipo, T.th.familia, T.th.precio, T.th.descripcion],
    activeHardware(model).map((h) => [
      h.name, T.familias[h.group] ?? h.group, f.usd(h.price), h.spec?.[lang] ?? '',
    ]),
  );

  /* --- Preventa y seña --- */
  const enPreventa = productos.filter((p) => p.onlineMode === 'waitlist');
  m['preventa.productos'] = enPreventa.map((p) => p.name).join(', ') || '—';
  m['preventa.equipos'] = activeHardware(model).filter((h) => h.preOrder).map((h) => h.name).join(', ') || '—';
  m['preventa.entrega'] = enPreventa.map((p) => p.waitlistNote?.[lang]).find(Boolean) ?? '—';
  m['seña.reglas'] = enPreventa.map((p) => {
    const d = p.deposit ?? {};
    const regla = d.basis === 'fixed'
      ? f.usd(d.amountUsd ?? 0)
      : fill(T.señaRegla, { pct: f.pct(d.pct ?? 0), base: T.señaBase[d.basis] ?? d.basis });
    return `- **${p.name}:** ${regla}`;
  }).join('\n') || '—';
  m['seña.descuenta'] = enPreventa.every((p) => p.deposit?.creditedToContract !== false) ? T.si : T.no;
  m['seña.reembolsable'] = enPreventa.some((p) => p.deposit?.refundable) ? T.si : T.no;

  /* --- Programa fundador --- */
  const fundador = (model.programs ?? []).find((p) => p.key === 'fundador');
  m['fundador.cupos'] = fundador ? f.num(fundador.seatsPerCountry) : '—';
  m['fundador.beneficios'] = fundador ? fundador.benefits[lang].map((b) => `- ${b}`).join('\n') : '—';
  m['fundador.creditos'] = fundador ? fundador.creditTiersUsd.map(f.usd).join(' · ') : '—';

  /* --- Canales y desenlaces --- */
  m['tabla.canales'] = tabla(
    [T.th.canal, T.th.cuando],
    Object.values(T.canales).map(([k, cuando]) => [k, fill(cuando, { max: m['autoservicio.max'] })]),
  );
  m['tabla.desenlaces'] = tabla(
    [T.th.modo, T.th.significa],
    Object.entries(T.desenlaces).map(([k, v]) => [`\`${k}\``, v]),
  );

  /* --- Casos resueltos por el motor --- */
  m['tabla.ejemplos'] = tabla(
    [T.th.ejemplo, T.th.plataforma, T.th.porPersona, T.th.canal, T.th.desenlace],
    EJEMPLOS.map((e) => {
      const r = quote(model, e);
      const prod = Object.keys(e.selected).map(nombre).join(' + ');
      const caso = fill(T.ejemplo, {
        act: S.i?.[e.industry] ?? e.industry, n: f.num(e.headcount), s: f.num(e.sites),
        c: f.num(e.countries), prod,
      });
      const cierre = r.checkout.mode === 'deposit'
        ? `deposit · ${T.th.seña} ${f.usd(r.checkout.depositUsd)}`
        : r.checkout.mode;
      return [caso, f.usd(r.platformAnnual), f.usd2(r.perPersonMonth), T.canales[r.segment]?.[0] ?? r.segment, cierre];
    }),
  );

  /* --- Versiones --- */
  m['versiones.catalogo'] = versiones.length
    ? tabla(
      [T.th.version, T.th.estado, T.th.publicada, T.th.nota],
      versiones.map((v) => [`v${v.version}`, T.estados[v.status] ?? v.status, f.fecha(v.published_at), v.note ?? '']),
    )
    : T.sinVersiones;
  m['version.despliegue'] = sha ? fill(T.despliegue, { sha: sha.slice(0, 7) }) : T.despliegueLocal;

  return m;
}

/** Reemplaza los {{marcadores}}. Devuelve también los que no existen. */
export function resolver(markdown, valores) {
  const faltantes = [];
  const texto = markdown.replace(/\{\{\s*([\w.ñ]+)\s*\}\}/g, (_, clave) => {
    if (clave in valores) return valores[clave];
    faltantes.push(clave);
    return `**⟦${clave}⟧**`;
  });
  return { texto, faltantes };
}
