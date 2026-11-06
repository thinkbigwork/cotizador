/* ==========================================================================
   schema.js — forma del documento de catálogo de precios.

   Un catálogo es un documento JSON que describe el modelo comercial completo.
   El back office edita un borrador, lo valida contra este esquema y recién
   entonces lo publica. Una vez publicado no se toca más: el trigger de la
   base lo impide.

   Todo lo que un día se quiera cambiar sin tocar código tiene que estar acá:
   curvas, factores, bandas, mínimo, productos, dispositivos y comisiones.
   ========================================================================== */

import { z } from 'zod';

const money = z.number().nonnegative().finite();
const factor = z.number().nonnegative().max(100);

/* Una curva de volumen: límites superiores de cada tramo y el factor que se
   aplica dentro de cada uno. El último límite es null = tramo abierto. */
const curve = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  tiers: z.array(z.union([z.number().positive(), z.null()])).min(1).max(12),
  factors: z.array(factor).min(1).max(12),
}).refine((c) => c.tiers.length === c.factors.length, {
  message: 'La curva necesita un factor por cada tramo.',
}).refine((c) => c.tiers.slice(0, -1).every((v) => typeof v === 'number'), {
  message: 'Solo el último tramo puede ser abierto (null).',
}).refine((c) => {
  const bounded = c.tiers.filter((v) => typeof v === 'number');
  return bounded.every((v, i) => i === 0 || v > bounded[i - 1]);
}, { message: 'Los tramos tienen que ir de menor a mayor.' });

/* Un producto o servicio. Agregar uno nuevo desde el back office es agregar
   un objeto acá: el motor y la interfaz no tienen nada cableado. */
const product = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,23}$/, 'Clave en minúsculas, sin espacios.'),
  name: z.string().min(1).max(60),
  order: z.number().int().min(0).max(999),

  /* Tarifa base por persona por mes, y multiplicador sobre la banda PyME. */
  baseRate: money,
  bandMultiplier: z.number().positive().max(100),

  curve: z.string().min(1),

  /* Lens no aplica el factor por categoría de riesgo: su tarifa es la misma
     para cualquier actividad. Core y 360 sí lo aplican. */
  appliesCategoryFactor: z.boolean(),

  /* Productos que este absorbe: contratarlo apaga a los otros en lugar de
     sumarse. Wizor 360 absorbe a Lens y Core. */
  absorbs: z.array(z.string()).default([]),

  reports: z.object({
    regional: z.number().int().nonnegative(),
    perSite: z.number().int().nonnegative(),
  }),
  backofficeUsers: z.number().int().nonnegative(),

  /* Banderas comerciales. */
  supportsHardware: z.boolean().default(false),
  /* El servicio no funciona sin equipamiento instalado. Wizor 360 es así:
     sin sensores no hay medición y sin medición no hay Wizor Index. */
  requiresHardware: z.boolean().default(false),
  deliversIndex: z.boolean().default(false),
  preOrder: z.boolean().default(false),

  /* Cómo se comporta el producto en el onboarding público:
       buy      se configura y se paga con Stripe.
       waitlist se muestra con precio y leyenda de preventa; el cierre es una
                solicitud, no un cobro. Wizor 360 está acá porque los
                dispositivos recién entran en serie comercial en mayo de 2027.
       hidden   no aparece: producto de baja o todavía no anunciado.
     Pasar un producto de waitlist a buy es un cambio de catálogo, no de
     código: el día que los dispositivos estén disponibles, se publica una
     versión nueva y 360 se vende solo. */
  onlineMode: z.enum(['buy', 'waitlist', 'hidden']).default('hidden'),

  /* Texto corto que acompaña a un producto en preventa, por idioma.
     Ejemplo: entrega estimada, cupos, condiciones. */
  waitlistNote: z.record(z.string(), z.string()).default({}),

  /* Seña de preventa. Sin seña la reserva no vale, así que un producto en
     preventa que la exija y no tenga monto no se puede publicar: la
     verificación está en readyToPublish(). */
  deposit: z.object({
    required: z.boolean().default(false),
    /* Sobre qué se calcula la seña:
         hardware   el equipamiento del pedido —sensores y paneles—. Es el
                    caso de Wizor 360: hasta que los equipos no están
                    instalados el servicio no se puede usar, así que se cobra
                    el equipamiento completo por adelantado.
         firstYear  el valor del primer año, plataforma incluida.
         fixed      un monto fijo en dólares. */
    basis: z.enum(['hardware', 'firstYear', 'fixed']).default('hardware'),
    pct: z.union([z.number().positive().max(1), z.null()]).default(null),
    amountUsd: z.union([money, z.null()]).default(null),
    /* Si la seña se descuenta de la facturación o se pierde al no concretar. */
    creditedToContract: z.boolean().default(true),
    refundable: z.boolean().default(false),
  }).default({
    required: false, basis: 'hardware', pct: null, amountUsd: null,
    creditedToContract: true, refundable: false,
  }),

  /* Límites de disponibilidad. `countries` en null significa sin restricción;
     `maxUnits` en null significa sin cupo. */
  availability: z.object({
    countries: z.union([z.array(z.string().min(2)), z.null()]).default(null),
    maxUnits: z.union([z.number().int().positive(), z.null()]).default(null),
  }).default({ countries: null, maxUnits: null }),

  active: z.boolean().default(true),
});

/* Equipamiento de compra única. Cubre dos familias que se muestran por
   separado pero se cobran igual: los sensores que se despliegan en campo y
   los paneles de control que los monitorean. */
const hardwareItem = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{1,23}$/),
  name: z.string().min(1).max(60),
  group: z.enum(['sensor', 'panel']),
  order: z.number().int().min(0).max(999),
  price: money,
  /* Detalle técnico corto, por idioma: qué incluye el equipo. */
  spec: z.record(z.string(), z.string()).default({}),
  /* En preventa: se muestra con la leyenda y no se entrega de inmediato. */
  preOrder: z.boolean().default(false),
  deliveryNote: z.record(z.string(), z.string()).default({}),
  active: z.boolean().default(true),
});

const category = z.object({
  key: z.string().min(1).max(10),
  label: z.string().min(1).max(60),
  factor,
  /* Tarifa cero: fundaciones y ONG de neurodivergencia, por el principio 4
     del manifiesto. */
  free: z.boolean().default(false),
});

export const priceBookSchema = z.object({
  schemaVersion: z.literal(1),
  currency: z.literal('USD'),

  /* Piso del contrato anual. No se aplica a las bandas PyME. */
  annualMinimum: money,

  /* Por encima de esta dotación el autoservicio deja de ofrecerse. */
  selfServiceMaxHeadcount: z.number().int().positive(),

  /* Bandas de precio anual cerrado para dotaciones chicas: [hasta, precio]. */
  smallBands: z.array(z.tuple([z.number().int().positive(), money])).min(1).max(20),

  curves: z.array(curve).min(1),
  categories: z.array(category).min(1),

  /* Actividad -> clave de categoría. */
  industries: z.record(z.string().min(1), z.string().min(1)).refine(
    (map) => Object.keys(map).length > 0, 'Tiene que haber al menos una actividad.',
  ),

  products: z.array(product).min(1),
  hardware: z.array(hardwareItem),

  commissions: z.object({
    /* Porcentaje fijo sobre el valor del primer año del contrato. */
    roles: z.record(z.string(), z.number().min(0).max(1)),

    /* Socio de negocio. La escala es MARGINAL sobre el ACUMULADO ANUAL:
       cada tramo paga su propia tasa, y lo que sube de nivel es la
       producción del año, no el tamaño de una operación suelta.

       Con la escala plana anterior, Wizor ganaba menos con una venta más
       grande: un contrato de 100.000 le dejaba 75.000 y uno de 100.001 le
       dejaba 70.000. Marginal elimina esa franja. */
    partner: z.object({
      basis: z.enum(['acumulado_anual', 'por_operacion']).default('acumulado_anual'),
      mode: z.enum(['marginal', 'plana']).default('marginal'),
      /* El acumulado vuelve a cero cada año calendario. */
      resetsAnnually: z.boolean().default(true),
      /* Sin retroactividad: lo cobrado a una tasa menor queda así. */
      retroactive: z.boolean().default(false),
      scale: z.array(z.tuple([
        z.union([money, z.null()]), // tope del tramo; null = sin tope
        z.number().min(0).max(1),
      ])).min(1),
    }),
  }),

  /* Programas comerciales. No son productos: son condiciones especiales que
     Wizor otorga a dedo. El programa fundador es para empresas pioneras que
     co-desarrollan con Wizor; los cupos son una estrategia de venta y la
     decisión de aceptar a una empresa es siempre de Wizor. */
  programs: z.array(z.object({
    key: z.string().regex(/^[a-z][a-z0-9_]{1,23}$/),
    name: z.string().min(1).max(60),
    /* Cupos por país, no globales. */
    seatsPerCountry: z.union([z.number().int().positive(), z.null()]).default(null),
    activeUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
    /* Se postula desde la web, pero entra solo si Wizor lo aprueba. */
    applicationOpen: z.boolean().default(true),
    requiresApproval: z.literal(true),
    /* Montos de Wizor Credits que se pueden otorgar. */
    creditTiersUsd: z.array(money).default([]),
    benefits: z.record(z.string(), z.array(z.string())).default({}),
  })).default([]),

  contract: z.object({
    termMonths: z.number().int().positive(),
    billing: z.enum(['mensual', 'anual']),
    quoteValidDays: z.number().int().positive(),
  }),
})
  /* --- Coherencia entre partes del documento --- */
  .superRefine((book, ctx) => {
    const add = (message, path) => ctx.addIssue({ code: 'custom', message, path });

    const curveKeys = new Set(book.curves.map((c) => c.key));
    const productKeys = new Set(book.products.map((p) => p.key));
    const categoryKeys = new Set(book.categories.map((c) => c.key));

    if (book.curves.length !== curveKeys.size) add('Hay curvas con la misma clave.', ['curves']);
    if (book.products.length !== productKeys.size) add('Hay productos con la misma clave.', ['products']);
    if (book.categories.length !== categoryKeys.size) add('Hay categorías con la misma clave.', ['categories']);

    book.products.forEach((p, i) => {
      if (!curveKeys.has(p.curve)) add(`El producto "${p.key}" usa la curva "${p.curve}", que no existe.`, ['products', i, 'curve']);
      p.absorbs.forEach((key) => {
        if (!productKeys.has(key)) add(`El producto "${p.key}" absorbe a "${key}", que no existe.`, ['products', i, 'absorbs']);
        if (key === p.key) add(`El producto "${p.key}" no puede absorberse a sí mismo.`, ['products', i, 'absorbs']);
      });
      if (p.availability.countries && p.availability.countries.length === 0) {
        add(`"${p.key}" no está disponible en ningún país: usá null para no restringir.`, ['products', i, 'availability']);
      }
      if (p.deposit.required && p.onlineMode !== 'waitlist') {
        add(`"${p.key}" pide seña pero no está en preventa: la seña reserva un lugar, no reemplaza al pago.`, ['products', i, 'deposit']);
      }
      if (p.onlineMode === 'buy' && p.preOrder) {
        add(`"${p.key}" se vende online pero está marcado como preventa: debería ser waitlist hasta que se pueda entregar.`, ['products', i, 'onlineMode']);
      }
      if (p.supportsHardware === false && p.deliversIndex) {
        add(`"${p.key}" entrega el Wizor Index pero no admite equipamiento: el Index necesita medición real.`, ['products', i]);
      }
      if (p.requiresHardware && !p.supportsHardware) {
        add(`"${p.key}" exige equipamiento pero no lo admite.`, ['products', i, 'requiresHardware']);
      }
      if (p.deposit.required) {
        const d = p.deposit;
        if (d.basis === 'fixed' && !(d.amountUsd > 0)) {
          add(`La seña de "${p.key}" es un monto fijo sin monto.`, ['products', i, 'deposit']);
        }
        if (d.basis !== 'fixed' && d.amountUsd !== null) {
          add(`La seña de "${p.key}" se calcula por porcentaje: no corresponde un monto fijo.`, ['products', i, 'deposit']);
        }
        if (d.basis === 'hardware' && !p.supportsHardware) {
          add(`La seña de "${p.key}" se calcula sobre el equipamiento, pero el producto no admite equipamiento.`, ['products', i, 'deposit']);
        }
      }
    });

    /* El equipamiento no sirve sin un producto que lo admita. */
    if (book.hardware.some((h) => h.active) && !book.products.some((p) => p.active && p.supportsHardware)) {
      add('Hay equipamiento activo pero ningún producto que lo admita.', ['hardware']);
    }
    const hardwareKeys = new Set(book.hardware.map((h) => h.key));
    if (book.hardware.length !== hardwareKeys.size) add('Hay equipamiento con la misma clave.', ['hardware']);

    for (const [industry, key] of Object.entries(book.industries)) {
      if (!categoryKeys.has(key)) {
        add(`La actividad "${industry}" apunta a la categoría "${key}", que no existe.`, ['industries', industry]);
      }
    }

    book.smallBands.forEach(([upTo], i) => {
      if (i > 0 && upTo <= book.smallBands[i - 1][0]) {
        add('Las bandas tienen que ir de menor a mayor.', ['smallBands', i]);
      }
    });

    const lastBand = book.smallBands[book.smallBands.length - 1][0];
    if (lastBand !== book.selfServiceMaxHeadcount) {
      add(
        `La última banda llega a ${lastBand} pero el autoservicio corta en ${book.selfServiceMaxHeadcount}: entre esos dos números no habría precio definido.`,
        ['smallBands'],
      );
    }

    const scale = book.commissions.partner.scale;
    scale.forEach(([upTo], i) => {
      const isLast = i === scale.length - 1;
      if (upTo === null && !isLast) add('Solo el último tramo de la escala puede no tener tope.', ['commissions', 'partner', 'scale', i]);
      if (!isLast && upTo !== null && scale[i + 1][0] !== null && scale[i + 1][0] <= upTo) {
        add('Los tramos de comisión tienen que ir de menor a mayor.', ['commissions', 'partner', 'scale', i]);
      }
    });
    if (scale[scale.length - 1][0] !== null) {
      add('El último tramo de la escala de comisiones tiene que ser abierto.', ['commissions', 'partner', 'scale']);
    }
  });

/**
 * Verifica que un catálogo esté listo para publicarse.
 *
 * Es un segundo nivel por encima de la validación estructural: un borrador
 * incompleto se puede guardar, pero no publicar. Así el back office puede
 * mostrar qué falta en lugar de rechazar el guardado y perder el trabajo.
 *
 * @returns {{ready:boolean, missing:Array<{path:string,message:string}>}}
 */
export function readyToPublish(book) {
  const missing = [];
  const flag = (path, message) => missing.push({ path, message });

  book.products.forEach((p, i) => {
    const d = p.deposit;
    if (d.required && !(d.pct > 0) && !(d.amountUsd > 0)) {
      flag(`products.${i}.deposit`,
        `Falta definir la seña de "${p.name}" —porcentaje o monto—. Sin seña la reserva de preventa no es válida.`);
    }
    if (p.onlineMode === 'waitlist' && !Object.keys(p.waitlistNote).length) {
      flag(`products.${i}.waitlistNote`,
        `"${p.name}" está en preventa y no explica cuándo se entrega.`);
    }
  });

  book.hardware.forEach((h, i) => {
    if (h.preOrder && !Object.keys(h.deliveryNote).length) {
      flag(`hardware.${i}.deliveryNote`,
        `"${h.name}" está en preventa y no dice cuándo se entrega.`);
    }
  });

  book.programs.forEach((prog, i) => {
    if (prog.applicationOpen && prog.activeUntil) {
      const until = new Date(`${prog.activeUntil}T23:59:59Z`);
      if (Number.isFinite(until.getTime()) && until < new Date()) {
        flag(`programs.${i}.activeUntil`,
          `El programa "${prog.name}" sigue abierto a postulaciones pero venció el ${prog.activeUntil}.`);
      }
    }
  });

  return { ready: missing.length === 0, missing };
}

/**
 * Valida un documento de catálogo.
 * @returns {{ok:true, book:object} | {ok:false, errors:Array<{path:string,message:string}>}}
 */
export function validatePriceBook(candidate) {
  const parsed = priceBookSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, book: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((issue) => ({
      path: issue.path.join('.') || '(raíz)',
      message: issue.message,
    })),
  };
}
