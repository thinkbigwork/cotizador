/* ==========================================================================
   commissions.js — cálculo de comisiones.

   CORRE SOLO EN EL SERVIDOR. Este módulo no se importa nunca desde una
   pantalla que un cliente pueda llegar a ver: las comisiones son información
   interna y no deben viajar al navegador junto con una cotización.

   Dos mecánicas distintas:

     Conector, desarrollador y vendedor cobran un porcentaje fijo sobre el
     valor del primer año del contrato.

     El socio de negocio cobra por escala MARGINAL sobre su ACUMULADO ANUAL.
     Cada tramo paga su propia tasa, así que no hay saltos; lo que sube de
     nivel es la producción del año, y la tasa nueva corre para todo lo que
     cierre después.
   ========================================================================== */

const round2 = (n) => Math.round(n * 100) / 100;

/** Normaliza la escala a tramos con piso y techo explícitos. */
function brackets(scale) {
  let floor = 0;
  return scale.map(([upTo, pct]) => {
    const tier = { from: floor, to: upTo, pct };
    floor = upTo ?? Infinity;
    return tier;
  });
}

/**
 * Comisión del socio sobre una operación, dada su producción previa del año.
 *
 * @param {object} book          catálogo vigente
 * @param {number} priorYtdUsd   acumulado del socio en lo que va del año
 * @param {number} dealUsd       valor del primer año de esta operación
 * @returns {{
 *   amount:number, effectivePct:number,
 *   slices:Array<{from:number,to:number|null,pct:number,base:number,amount:number}>,
 *   currentTier:{pct:number}, nextTier:{at:number,pct:number,missing:number}|null
 * }}
 */
export function partnerCommission(book, { priorYtdUsd = 0, dealUsd = 0 }) {
  const config = book.commissions.partner;
  const tiers = brackets(config.scale);

  /* Escala plana: la tasa del tramo donde cae el acumulado total, aplicada a
     toda la operación. Se conserva por si Wizor vuelve a ella, pero reintroduce
     los saltos que marginal evita. */
  if (config.mode === 'plana') {
    const total = priorYtdUsd + dealUsd;
    const tier = tiers.find((t) => t.to === null || total <= t.to);
    return {
      amount: round2(dealUsd * tier.pct),
      effectivePct: tier.pct,
      slices: [{ from: 0, to: tier.to, pct: tier.pct, base: dealUsd, amount: round2(dealUsd * tier.pct) }],
      currentTier: { pct: tier.pct },
      nextTier: nextTierFrom(tiers, total),
    };
  }

  /* Marginal: se reparte la operación entre los tramos que atraviesa,
     empezando donde quedó el acumulado previo. */
  const start = Math.max(0, priorYtdUsd);
  const end = start + Math.max(0, dealUsd);

  const slices = [];
  let amount = 0;

  for (const tier of tiers) {
    const ceiling = tier.to ?? Infinity;
    const base = Math.max(0, Math.min(end, ceiling) - Math.max(start, tier.from));
    if (base > 0) {
      const slice = round2(base * tier.pct);
      amount += slice;
      slices.push({ from: tier.from, to: tier.to, pct: tier.pct, base, amount: slice });
    }
    if (ceiling >= end) break;
  }

  const currentTier = tiers.find((t) => t.to === null || end <= t.to);

  return {
    amount: round2(amount),
    effectivePct: dealUsd > 0 ? amount / dealUsd : 0,
    slices,
    currentTier: { pct: currentTier.pct },
    nextTier: nextTierFrom(tiers, end),
  };
}

/** Cuánto le falta al socio para subir de nivel. Es el dato que motiva. */
function nextTierFrom(tiers, totalUsd) {
  const current = tiers.findIndex((t) => t.to === null || totalUsd <= t.to);
  const next = tiers[current + 1];
  if (!next) return null;
  return {
    at: tiers[current].to,
    pct: next.pct,
    missing: round2(tiers[current].to - totalUsd),
  };
}

/**
 * Comisión de un rol sobre una operación.
 *
 * @param {object} book
 * @param {string} role      conector | desarrollador | vendedor | socio
 * @param {number} dealUsd   valor del primer año
 * @param {object} [opts]    { priorYtdUsd } — solo lo usa el socio
 */
export function commissionFor(book, role, dealUsd, opts = {}) {
  if (role === 'socio') return partnerCommission(book, { ...opts, dealUsd });

  const pct = book.commissions.roles[role];
  if (pct === undefined) throw new Error(`Rol de comisión desconocido: ${role}`);

  return {
    amount: round2(dealUsd * pct),
    effectivePct: pct,
    slices: [{ from: 0, to: null, pct, base: dealUsd, amount: round2(dealUsd * pct) }],
    currentTier: { pct },
    nextTier: null,
  };
}

/**
 * Reparto completo de una operación entre quienes intervinieron.
 *
 * Regla de Wizor: el socio de negocio absorbe a los demás roles dentro de su
 * territorio. Sin esa regla, sumar conector, desarrollador, vendedor y socio
 * daría más del 70% del contrato.
 *
 * @param {object} book
 * @param {number} dealUsd
 * @param {Array<{personId:string, role:string, priorYtdUsd?:number}>} participants
 */
export function splitCommissions(book, dealUsd, participants = []) {
  const partner = participants.find((p) => p.role === 'socio');

  const effective = partner ? [partner] : participants;
  const absorbed = partner
    ? participants.filter((p) => p.role !== 'socio').map((p) => p.role)
    : [];

  const lines = effective.map((p) => {
    const result = commissionFor(book, p.role, dealUsd, { priorYtdUsd: p.priorYtdUsd ?? 0 });
    return {
      personId: p.personId,
      role: p.role,
      pct: result.effectivePct,
      amount: result.amount,
      slices: result.slices,
      nextTier: result.nextTier,
    };
  });

  const total = round2(lines.reduce((sum, l) => sum + l.amount, 0));

  return {
    lines,
    absorbed,
    totalUsd: total,
    totalPct: dealUsd > 0 ? total / dealUsd : 0,
    netToWizorUsd: round2(dealUsd - total),
  };
}
