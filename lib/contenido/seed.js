/* ==========================================================================
   seed.js — contenido inicial de las fichas.

   PROCEDENCIA DE CADA DATO, y qué falta
   Todo esto es BORRADOR. Cada ficha nace con `borrador: true` y la pantalla
   la muestra marcada como tal hasta que alguien de Wizor la aprueba desde el
   back office.

     · Los resúmenes salen del campo `spec` del catálogo de precios, que ya
       estaba aprobado por Wizor.
     · Las características y los datos de Smart Desktop y de los Paneles de
       Control salen de sales.wizor.io/devices.
     · Smart Machine y Smart Pin NO tienen características: la web no publica
       ninguna y no se inventan. Sus fichas se ven incompletas a propósito,
       para que se note qué contenido falta.

   Los tres idiomas llevan la misma cantidad de rasgos y de datos; si uno
   tuviera menos, tests/idiomas.test.mjs falla.
   ========================================================================== */

/* Centro de monitoreo: los tres paneles son el mismo sistema en distintos
   tamaños, así que comparten estos datos. El tamaño va en el resumen. */
const DATOS_PANEL = {
  es: [{ v: '200+', t: 'variables' }, { v: '<1 s', t: 'latencia' }, { v: 'IA', t: 'predictiva' }],
  en: [{ v: '200+', t: 'variables' }, { v: '<1 s', t: 'latency' }, { v: 'AI', t: 'predictive' }],
  pt: [{ v: '200+', t: 'variáveis' }, { v: '<1 s', t: 'latência' }, { v: 'IA', t: 'preditiva' }],
};

const RASGOS_PANEL = {
  es: ['Monitoreo en tiempo real de todos los equipos', 'Alertas y tendencias',
       'Nivel de estrés del personal', 'Nube o instalación propia'],
  en: ['Real-time monitoring of every device', 'Alerts and trends',
       'Staff stress level', 'Cloud or on-premise'],
  pt: ['Monitoramento em tempo real de todos os equipamentos', 'Alertas e tendências',
       'Nível de estresse da equipe', 'Nuvem ou instalação própria'],
};

const panel = (clave, imagen, resumen) => ({
  clave,
  tipo: 'equipo',
  imagen,
  textos: {
    es: { resumen: resumen.es, rasgos: RASGOS_PANEL.es, datos: DATOS_PANEL.es },
    en: { resumen: resumen.en, rasgos: RASGOS_PANEL.en, datos: DATOS_PANEL.en },
    pt: { resumen: resumen.pt, rasgos: RASGOS_PANEL.pt, datos: DATOS_PANEL.pt },
  },
});

/* Sin características publicadas. Se deja la ficha con imagen y resumen, y
   la pantalla avisa que falta contenido. */
const sinRasgos = (clave, tipo, imagen, resumen) => ({
  clave,
  tipo,
  imagen,
  textos: {
    es: { resumen: resumen.es, rasgos: [], datos: [] },
    en: { resumen: resumen.en, rasgos: [], datos: [] },
    pt: { resumen: resumen.pt, rasgos: [], datos: [] },
  },
});

export const CONTENIDO_INICIAL = [
  /* --- Servicios --- */
  sinRasgos('lens', 'producto', '/img/catalogo/lens.jpg', {
    es: 'Evaluación de riesgo psicosocial con instrumento validado. El cumplimiento resuelto, con informe por establecimiento.',
    en: 'Psychosocial risk assessment with a validated instrument. Compliance covered, with a report per site.',
    pt: 'Avaliação de risco psicossocial com instrumento validado. Conformidade resolvida, com relatório por estabelecimento.',
  }),
  sinRasgos('core', 'producto', '/img/catalogo/core.jpg', {
    es: 'La batería completa de evaluaciones, con seguimiento en el tiempo y diez informes por establecimiento.',
    en: 'The full battery of assessments, tracked over time, with ten reports per site.',
    pt: 'A bateria completa de avaliações, com acompanhamento ao longo do tempo e dez relatórios por estabelecimento.',
  }),
  sinRasgos('w360', 'producto', '/img/catalogo/w360.jpg', {
    es: 'Evaluación y medición ambiental juntas. Los equipos miden el ambiente real de trabajo y alimentan el Wizor Index.',
    en: 'Assessment and environmental measurement together. Devices read the real working environment and feed the Wizor Index.',
    pt: 'Avaliação e medição ambiental juntas. Os equipamentos medem o ambiente real de trabalho e alimentam o Wizor Index.',
  }),

  /* --- Sensores --- */
  {
    clave: 'desk',
    tipo: 'equipo',
    imagen: '/img/catalogo/desk.jpg',
    textos: {
      es: {
        resumen: 'Para oficinas y salas de reunión. Escucha el ambiente de forma continua y en silencio.',
        rasgos: ['Aire y compuestos orgánicos volátiles', 'Ruido y nivel sonoro',
                 'Temperatura y humedad', 'Luz y vibración'],
        datos: [{ v: '24/7', t: 'escucha' }, { v: '0 dB', t: 'silencioso' }, { v: '12+', t: 'sensores' }],
      },
      en: {
        resumen: 'For offices and meeting rooms. Reads the environment continuously and silently.',
        rasgos: ['Air and volatile organic compounds', 'Noise and sound level',
                 'Temperature and humidity', 'Light and vibration'],
        datos: [{ v: '24/7', t: 'listening' }, { v: '0 dB', t: 'silent' }, { v: '12+', t: 'sensors' }],
      },
      pt: {
        resumen: 'Para escritórios e salas de reunião. Escuta o ambiente de forma contínua e silenciosa.',
        rasgos: ['Ar e compostos orgânicos voláteis', 'Ruído e nível sonoro',
                 'Temperatura e umidade', 'Luz e vibração'],
        datos: [{ v: '24/7', t: 'escuta' }, { v: '0 dB', t: 'silencioso' }, { v: '12+', t: 'sensores' }],
      },
    },
  },
  sinRasgos('mach', 'equipo', '/img/catalogo/mach.jpg', {
    es: 'Para cabinas de maquinaria y puestos operativos, donde la exposición es más alta y más variable.',
    en: 'For machinery cabins and operating stations, where exposure runs higher and less predictably.',
    pt: 'Para cabines de máquinas e postos operacionais, onde a exposição é mais alta e mais variável.',
  }),
  sinRasgos('pin', 'equipo', '/img/catalogo/pin.svg', {
    es: 'Para personal sin puesto fijo. Acompaña a la persona y arma el mapa de exposición individual.',
    en: 'For staff without a fixed station. It travels with the person and builds their exposure map.',
    pt: 'Para pessoal sem posto fixo. Acompanha a pessoa e monta o mapa de exposição individual.',
  }),

  /* --- Paneles de Control --- */
  panel('panel_start', '/img/catalogo/panel_start.svg', {
    es: 'Centro de monitoreo de entrada: cuatro monitores de 50 pulgadas.',
    en: 'Entry-level monitoring centre: four 50-inch displays.',
    pt: 'Centro de monitoramento de entrada: quatro monitores de 50 polegadas.',
  }),
  panel('panel_pro', '/img/catalogo/panel_pro.svg', {
    es: 'Centro de monitoreo profesional: seis monitores de 65 pulgadas.',
    en: 'Professional monitoring centre: six 65-inch displays.',
    pt: 'Centro de monitoramento profissional: seis monitores de 65 polegadas.',
  }),
  panel('panel_expert', '/img/catalogo/panel_expert.svg', {
    es: 'Centro de monitoreo completo: nueve monitores de 100 pulgadas.',
    en: 'Full monitoring centre: nine 100-inch displays.',
    pt: 'Centro de monitoramento completo: nove monitores de 100 polegadas.',
  }),
];
