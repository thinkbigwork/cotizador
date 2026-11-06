/* ==========================================================================
   seed-v1.js — catálogo de precios versión 1.

   Es el modelo comercial vigente de Wizor, trasladado tal cual desde el
   cotizador anterior. El test de regresión verifica que produce exactamente
   los mismos números sobre 33.120 combinaciones.

   A partir de acá, los cambios de precio se hacen desde el back office
   publicando versiones nuevas. Este archivo queda como el punto de partida
   histórico y no debería volver a editarse.
   ========================================================================== */

export const PRICE_BOOK_V1 = {
  schemaVersion: 1,
  currency: 'USD',

  annualMinimum: 4800,
  selfServiceMaxHeadcount: 500,

  /* Precio anual cerrado para dotaciones chicas: [hasta N personas, precio].
     Estas bandas no están sujetas al mínimo anual. */
  smallBands: [
    [25, 1920],
    [50, 3360],
    [100, 6080],
    [200, 10880],
    [350, 17640],
    [500, 24000],
  ],

  curves: [
    {
      key: 'compliance',
      label: 'Cumplimiento — baja logarítmica',
      tiers: [10000, 30000, 75000, 150000, 400000, null],
      factors: [1, 0.833, 0.700, 0.583, 0.433, 0.300],
    },
    {
      key: 'value',
      label: 'Valor — baja lineal',
      tiers: [10000, 30000, 75000, 150000, 400000, null],
      factors: [1, 0.90, 0.80, 0.70, 0.60, 0.50],
    },
  ],

  categories: [
    { key: '1A', label: 'Riesgo muy alto', factor: 1.25, free: false },
    { key: '1B', label: 'Riesgo alto', factor: 1, free: false },
    { key: '2', label: 'Riesgo medio-alto', factor: 0.9, free: false },
    { key: '3', label: 'Riesgo medio', factor: 0.8, free: false },
    { key: '4', label: 'Riesgo bajo', factor: 0.7, free: false },
    { key: '5', label: 'Riesgo bajo con exposición', factor: 0.75, free: false },
    { key: 'SOC', label: 'Sin cargo — principio 4 del manifiesto', factor: 0, free: true },
  ],

  industries: {
    oilgas: '1A', mining: '1A', constr: '1A', chem: '1A', energy: '1A',
    manuf: '1B', pharma: '1B', auto: '1B', food: '1B', agro: '1B',
    logi: '2', infra: '2', port: '2',
    retail: '3', hosp: '3', servop: '3',
    bank: '4', tech: '4', telco: '4', prof: '4',
    health: '5', edu: '5', gov: '5',
    ngo: 'SOC',
  },

  products: [
    {
      key: 'lens',
      name: 'Wizor Lens',
      order: 10,
      baseRate: 4,
      bandMultiplier: 1,
      curve: 'compliance',
      /* La tarifa de Lens no cambia con la actividad: es una evaluación
         puntual, no una cobertura del ambiente de trabajo. */
      appliesCategoryFactor: false,
      absorbs: [],
      reports: { regional: 1, perSite: 1 },
      backofficeUsers: 3,
      supportsHardware: false,
      requiresHardware: false,
      deliversIndex: false,
      preOrder: false,
      onlineMode: 'buy',
      waitlistNote: {},
      deposit: { required: false, basis: 'hardware', pct: null, amountUsd: null, creditedToContract: true, refundable: false },
      availability: { countries: null, maxUnits: null },
      active: true,
    },
    {
      key: 'core',
      name: 'Wizor Core',
      order: 20,
      baseRate: 8,
      bandMultiplier: 2,
      curve: 'value',
      appliesCategoryFactor: true,
      absorbs: [],
      reports: { regional: 10, perSite: 10 },
      backofficeUsers: 5,
      supportsHardware: false,
      requiresHardware: false,
      deliversIndex: false,
      preOrder: false,
      onlineMode: 'buy',
      waitlistNote: {},
      deposit: { required: false, basis: 'hardware', pct: null, amountUsd: null, creditedToContract: true, refundable: false },
      availability: { countries: null, maxUnits: null },
      active: true,
    },
    {
      key: 'w360',
      name: 'Wizor 360',
      order: 30,
      baseRate: 12,
      bandMultiplier: 3,
      curve: 'value',
      appliesCategoryFactor: true,
      absorbs: ['lens', 'core'],
      reports: { regional: 10, perSite: 10 },
      backofficeUsers: 10,
      supportsHardware: true,
      requiresHardware: true,
      deliversIndex: true,
      preOrder: true,
      /* Se muestra en el onboarding con precio y leyenda de preventa, pero
         no se cobra: los dispositivos recién tienen serie comercial en mayo
         de 2027. Quien lo elija manda una solicitud y Wizor lo contacta. */
      onlineMode: 'waitlist',
      waitlistNote: {
        es: 'Dispositivos desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Devices ship from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Dispositivos a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      },
      /* Seña del 100% del equipamiento. Hasta que los equipos no están
         instalados Wizor 360 no se puede usar, así que se cobra el
         equipamiento completo por adelantado y la suscripción arranca
         cuando la instalación está lista. */
      deposit: {
        required: true,
        basis: 'hardware',
        pct: 1.0,
        amountUsd: null,
        creditedToContract: true,
        refundable: false,
      },
      availability: { countries: null, maxUnits: null },
      active: true,
    },
  ],

  /* Equipamiento de compra única. Dos familias: los sensores que miden el
     ambiente en campo, y los paneles de control que muestran todo en tiempo
     real. Las dos están en preventa y se cobran al 100% por adelantado. */
  hardware: [
    {
      key: 'desk', name: 'Smart Desktop', group: 'sensor', order: 10, price: 800,
      spec: {
        es: 'Ambiente de oficina y salas. 12 parámetros.',
        en: 'Offices and meeting rooms. 12 parameters.',
        pt: 'Escritórios e salas. 12 parâmetros.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },
    {
      key: 'mach', name: 'Smart Machine', group: 'sensor', order: 20, price: 1300,
      spec: {
        es: 'Cabinas de maquinaria y puestos operativos.',
        en: 'Machinery cabins and operating stations.',
        pt: 'Cabines de máquinas e postos operacionais.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },
    {
      key: 'pin', name: 'Smart Pin', group: 'sensor', order: 30, price: 600,
      spec: {
        es: 'Personal sin puesto fijo. Mapa de exposición.',
        en: 'Staff without a fixed station. Exposure map.',
        pt: 'Pessoal sem posto fixo. Mapa de exposição.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },

    /* Panel de Control: centro de monitoreo en tiempo real de todos los
       dispositivos, con alertas, tendencias y nivel de estrés del personal. */
    {
      key: 'panel_start', name: 'Panel de Control Start', group: 'panel', order: 110, price: 15000,
      spec: {
        es: '4 monitores de 50". Monitoreo en tiempo real, alertas y tendencias.',
        en: '4 × 50" displays. Real-time monitoring, alerts and trends.',
        pt: '4 monitores de 50". Monitoramento em tempo real, alertas e tendências.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },
    {
      key: 'panel_pro', name: 'Panel de Control Professional', group: 'panel', order: 120, price: 25000,
      spec: {
        es: '6 monitores de 65". Monitoreo en tiempo real, alertas, tendencias y nivel de estrés del personal.',
        en: '6 × 65" displays. Real-time monitoring, alerts, trends and staff stress level.',
        pt: '6 monitores de 65". Monitoramento em tempo real, alertas, tendências e nível de estresse da equipe.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },
    {
      key: 'panel_expert', name: 'Panel de Control Expert', group: 'panel', order: 130, price: 72000,
      spec: {
        es: '9 monitores de 100". Centro de monitoreo completo: tiempo real, alertas, tendencias y nivel de estrés del personal.',
        en: '9 × 100" displays. Full monitoring centre: real time, alerts, trends and staff stress level.',
        pt: '9 monitores de 100". Centro de monitoramento completo: tempo real, alertas, tendências e nível de estresse da equipe.',
      },
      preOrder: true, deliveryNote: {
        es: 'Entrega desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.',
        en: 'Ships from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.',
        pt: 'Entrega a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.',
      }, active: true,
    },
  ],

  commissions: {
    roles: {
      conector: 0.025,
      desarrollador: 0.04,
      vendedor: 0.08,
    },
    /* Socio de negocio. El socio absorbe a los demás roles dentro de su
       territorio.

       Escala MARGINAL sobre el ACUMULADO ANUAL del socio. Cada tramo paga su
       propia tasa, así que no hay saltos: nunca pasa que un dólar más de
       venta cueste miles de comisión. Lo que motiva no es forzar una
       operación por encima de una línea, sino subir de nivel: la tasa nueva
       corre para todo lo que el socio cierre después, hasta fin de año.

       Las tasas de los tramos altos están subidas a propósito para que, al
       llegar a cada hito, el socio cobre prácticamente lo mismo que le
       prometía la escala plana anterior:
         $250.000 → 29,2%   $1.000.000 → 39,3%   $3.000.000 → 50,4%
         $500.000 → 33,6%   $2.000.000 → 45,7% */
    partner: {
      basis: 'acumulado_anual',
      mode: 'marginal',
      resetsAnnually: true,
      retroactive: false,
      scale: [
        [100000, 0.25],
        [250000, 0.32],
        [500000, 0.38],
        [1000000, 0.45],
        [2000000, 0.52],
        [null, 0.60],
      ],
    },
  },

  /* El programa fundador NO es la preventa de Wizor 360. Es un programa para
     empresas pioneras que co-desarrollan con Wizor el futuro del trabajo: dan
     acceso temprano y reciben Wizor Credits y otros beneficios. Se postula
     desde la web, pero entrar es decisión de Wizor. Los diez cupos son por
     país y son una estrategia de venta, no un límite técnico. */
  programs: [
    {
      key: 'fundador',
      name: 'Programa fundador',
      seatsPerCountry: 10,
      activeUntil: null,
      applicationOpen: true,
      requiresApproval: true,
      creditTiersUsd: [5000, 10000, 25000, 100000],
      benefits: {
        es: [
          'Wizor Credits aplicables sobre la facturación',
          'Precio fijo por 36 meses',
          'Prioridad en la asignación de dispositivos',
          'Participación en el co-desarrollo del producto',
        ],
        en: [
          'Wizor Credits applied against billing',
          '36-month price lock',
          'Priority on device allocation',
          'A seat in co-developing the product',
        ],
        pt: [
          'Wizor Credits aplicáveis sobre o faturamento',
          'Preço fixo por 36 meses',
          'Prioridade na alocação de dispositivos',
          'Participação no co-desenvolvimento do produto',
        ],
      },
    },
  ],

  contract: {
    termMonths: 12,
    billing: 'mensual',
    quoteValidDays: 30,
  },
};
