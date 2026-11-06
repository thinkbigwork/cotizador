/* ==========================================================================
   engine.js — motor de precios.

   A diferencia del cotizador anterior, acá no hay una sola constante del
   modelo comercial: todo sale del catálogo que se le pasa. Eso es lo que
   permite que el back office agregue productos y cambie tarifas sin tocar
   código, y que una suscripción vieja se siga calculando con el catálogo
   que tenía clavado el día que se firmó.

   Este módulo corre SOLO EN EL SERVIDOR. Nunca se importa desde un
   componente de cliente: el modelo no vuelve a viajar al navegador.
   ========================================================================== */

/* --- Ayudas sobre el documento ------------------------------------------ */

const byOrder = (a, b) => a.order - b.order;

function index(book) {
  return {
    products: new Map(book.products.map((p) => [p.key, p])),
    curves: new Map(book.curves.map((c) => [c.key, c])),
    categories: new Map(book.categories.map((c) => [c.key, c])),
    hardware: new Map(book.hardware.map((h) => [h.key, h])),
  };
}

export function activeProducts(book) {
  return book.products.filter((p) => p.active).sort(byOrder);
}

export function activeHardware(book) {
  return book.hardware.filter((h) => h.active).sort(byOrder);
}

/** Equipamiento agrupado por familia, para mostrarlo en secciones. */
export function hardwareByGroup(book) {
  const groups = new Map();
  for (const item of activeHardware(book)) {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group).push(item);
  }
  return groups;
}

/** Productos visibles en el onboarding público: los que se pagan y los que
    están en preventa. Los `hidden` no se muestran. */
export function publicProducts(book) {
  return activeProducts(book).filter((p) => p.onlineMode !== 'hidden');
}

/** Productos que se pagan online sin hablar con nadie. */
export function buyableProducts(book) {
  return activeProducts(book).filter((p) => p.onlineMode === 'buy');
}

/** Productos en preventa: se muestran con precio, pero cierran con solicitud. */
export function waitlistProducts(book) {
  return activeProducts(book).filter((p) => p.onlineMode === 'waitlist');
}

export function categoryOf(book, industry) {
  return book.industries[industry] ?? null;
}

/* --- Cálculo ------------------------------------------------------------- */

/** Precio anual de un producto, en dólares, ya redondeado. */
function annualPrice(book, idx, product, headcount, category) {
  if (category.free) return 0;

  const categoryFactor = product.appliesCategoryFactor ? category.factor : 1;

  /* Dotaciones chicas: banda cerrada, sin curva y sin mínimo anual. */
  if (headcount <= book.selfServiceMaxHeadcount) {
    const band = book.smallBands.find(([upTo]) => headcount <= upTo)
      ?? book.smallBands[book.smallBands.length - 1];
    return Math.round(band[1] * product.bandMultiplier * categoryFactor);
  }

  /* Dotaciones grandes: tarifa marginal por tramo. */
  const curve = idx.curves.get(product.curve);
  let previous = 0;
  let monthly = 0;

  curve.tiers.forEach((upTo, i) => {
    const ceiling = upTo === null ? Infinity : upTo;
    const inTier = Math.max(0, Math.min(headcount, ceiling) - previous);
    monthly += inTier * product.baseRate * curve.factors[i];
    previous = ceiling;
  });

  return Math.max(book.annualMinimum, Math.round(monthly * 12 * categoryFactor));
}

/** Desglose por tramo, para la tabla explicativa. */
function tierBreakdown(book, idx, product, headcount, category) {
  if (headcount <= book.selfServiceMaxHeadcount || category.free) return [];

  const curve = idx.curves.get(product.curve);
  const categoryFactor = product.appliesCategoryFactor ? category.factor : 1;

  const out = [];
  let previous = 0;

  curve.tiers.forEach((upTo, i) => {
    const ceiling = upTo === null ? Infinity : upTo;
    const qty = Math.max(0, Math.min(headcount, ceiling) - previous);
    const rate = product.baseRate * curve.factors[i] * categoryFactor;
    if (qty > 0) {
      out.push({
        from: previous + 1,
        to: upTo,                      // null = tramo abierto
        qty,
        rate,
        subtotal: qty * rate * 12,
      });
    }
    previous = ceiling;
  });

  return out;
}

/**
 * Resuelve qué productos quedan efectivamente contratados aplicando las
 * reglas de absorción. Si Wizor 360 está activo, Lens y Core no se suman.
 */
function resolveSelection(book, selected) {
  const chosen = activeProducts(book).filter((p) => selected[p.key]);
  const absorbed = new Set();
  for (const product of chosen) {
    for (const key of product.absorbs) absorbed.add(key);
  }
  return chosen.filter((p) => !absorbed.has(p.key));
}

/**
 * Canal de venta SUGERIDO. Es una recomendación en pantalla, nunca una traba:
 * ni el tamaño ni operar en varios países impiden contratar por autoservicio.
 * Una multinacional elige su país de contratación y cotiza sobre la dotación
 * total, igual que se hizo con Abbott.
 */
function salesSegment(book, headcount, countries) {
  if (countries > 1) return 'proposal';
  if (headcount > book.selfServiceMaxHeadcount) return 'demo';
  return 'self';
}

/**
 * Qué puede hacer esta configuración en el onboarding público, y por qué.
 *
 *   pay      se cobra con Stripe y queda contratado.
 *   deposit  producto en preventa: se cobra la seña que reserva el lugar.
 *   request  no hay nada que cobrar. Hoy pasa con las organizaciones sin
 *            cargo, que se activan por solicitud.
 *   contact  no se puede cerrar solo: hace falta una propuesta.
 *   none     no eligió nada todavía.
 *
 * El TAMAÑO DE LA EMPRESA NO BLOQUEA. Una empresa de 20.000 personas que
 * quiera contratar sola tiene que poder hacerlo: cuando Wizor sea conocido
 * y recomendado va a pasar seguido. La recomendación de pedir una demo vive
 * en `segment` y es un consejo, no una traba.
 *
 * `reasons` son códigos, nunca texto: la traducción vive en la interfaz.
 */
function resolveCheckout({ contracted, free, total, firstYear, hardwareTotal }) {
  if (!contracted.length) return { mode: 'none', reasons: ['noSelection'] };

  /* Un producto que no funciona sin equipamiento no se puede contratar vacío.
     Wizor 360 es el caso: sin sensores instalados no hay medición. */
  const sinEquipo = contracted.filter((p) => p.requiresHardware && hardwareTotal <= 0);
  if (sinEquipo.length) {
    return {
      mode: 'incomplete',
      reasons: ['hardwareRequired'],
      needsHardwareFor: sinEquipo.map((p) => p.key),
    };
  }

  /* Sin cargo: no hay cobro posible, se activa por solicitud. */
  if (free || total <= 0) return { mode: 'request', reasons: ['freeTier'] };

  const waiting = contracted.filter((p) => p.onlineMode === 'waitlist');
  if (waiting.length) {
    const base = { hardware: hardwareTotal, firstYear, fixed: 0 };
    const depositUsd = waiting.reduce((sum, p) => {
      const d = p.deposit ?? {};
      if (d.basis === 'fixed') return sum + (d.amountUsd ?? 0);
      return sum + (base[d.basis] ?? 0) * (d.pct ?? 0);
    }, 0);
    return {
      mode: 'deposit',
      reasons: ['preOrder'],
      waitlist: waiting.map((p) => p.key),
      depositUsd: Math.round(depositUsd),
      depositCredited: waiting.every((p) => p.deposit?.creditedToContract !== false),
    };
  }

  const notBuyable = contracted.filter((p) => p.onlineMode !== 'buy');
  if (notBuyable.length) {
    return { mode: 'contact', reasons: ['notSellableOnline'], blocked: notBuyable.map((p) => p.key) };
  }

  return { mode: 'pay', reasons: [] };
}

/**
 * Cotiza una configuración contra un catálogo determinado.
 *
 * @param {object} book      documento de catálogo ya validado
 * @param {object} input
 * @param {string} input.industry
 * @param {number} input.headcount
 * @param {number} input.sites
 * @param {number} input.countries
 * @param {object} input.selected  { <productKey>: boolean }
 * @param {object} input.devices   { <deviceKey>: number }
 * @returns {object} importes en dólares, sin formato y sin texto traducido.
 */
export function quote(book, input) {
  const idx = index(book);
  const { industry, headcount, sites, countries, selected = {}, hardware = {} } = input;

  const categoryKey = categoryOf(book, industry);

  /* Actividad fuera del catálogo: no hay tarifa que calcular. */
  if (!categoryKey) {
    return {
      unlisted: true,
      category: null,
      free: false,
      contracted: [],
      plans: {},
      platformAnnual: 0,
      monthlyTotal: 0,
      perPersonMonth: 0,
      hardwareTotal: 0,
      hardwareGroups: {},
      hardwareLines: [],
      firstYear: 0,
      reports: 0,
      users: 0,
      index: false,
      tiers: [],
      notes: [],
      segment: salesSegment(book, headcount, countries),
      checkout: { mode: 'contact', reasons: ['unlistedIndustry'] },
    };
  }

  const category = idx.categories.get(categoryKey);

  /* Precio de referencia de cada producto, para las tarjetas. */
  const plans = {};
  for (const product of activeProducts(book)) {
    const annual = annualPrice(book, idx, product, headcount, category);
    plans[product.key] = { annual, perPersonMonth: annual / 12 / headcount };
  }

  const contracted = resolveSelection(book, selected);
  const platformAnnual = contracted.reduce((sum, p) => sum + plans[p.key].annual, 0);

  /* El producto principal —el de mayor orden entre los contratados— define
     informes y usuarios de backoffice. */
  const lead = contracted.length
    ? contracted.reduce((best, p) => (p.order > best.order ? p : best))
    : null;

  /* Equipamiento: total y desglose por familia, para mostrarlo separado. */
  const hardwareLines = activeHardware(book)
    .map((item) => ({ ...item, qty: hardware[item.key] || 0 }))
    .filter((line) => line.qty > 0);
  const hardwareTotal = hardwareLines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const hardwareGroups = {};
  for (const line of hardwareLines) {
    hardwareGroups[line.group] = (hardwareGroups[line.group] || 0) + line.qty * line.price;
  }

  const reports = lead ? lead.reports.regional + lead.reports.perSite * sites : 0;

  const notes = [];
  if (category.free) {
    notes.push('social');
  } else {
    if (countries > 1) notes.push('multiCountry');
    if (contracted.some((p) => p.preOrder)) notes.push('preOrder');
    if (lead && platformAnnual <= book.annualMinimum && headcount > book.selfServiceMaxHeadcount) {
      notes.push('minimum');
    }
  }

  return {
    unlisted: false,
    category: categoryKey,
    free: category.free,
    contracted: contracted.map((p) => p.key),
    plans,
    platformAnnual,
    monthlyTotal: platformAnnual / 12,
    perPersonMonth: platformAnnual / 12 / headcount,
    hardwareTotal,
    hardwareGroups,
    hardwareLines: hardwareLines.map(({ key, name, group, qty, price }) =>
      ({ key, name, group, qty, price, subtotal: qty * price })),
    firstYear: platformAnnual + hardwareTotal,
    reports,
    users: lead ? lead.backofficeUsers : 0,
    index: contracted.some((p) => p.deliversIndex),
    tiers: lead ? tierBreakdown(book, idx, lead, headcount, category) : [],
    notes,
    segment: salesSegment(book, headcount, countries),
    checkout: resolveCheckout({
      contracted, free: category.free, total: platformAnnual,
      firstYear: platformAnnual + hardwareTotal, hardwareTotal,
    }),
  };
}
