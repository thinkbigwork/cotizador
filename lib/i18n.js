/* ==========================================================================
   i18n.js — textos de la interfaz en español, inglés y portugués.
   Es el único archivo con cadenas visibles: ningún otro módulo escribe texto
   para el usuario. Las tres variantes comparten exactamente el mismo juego de
   claves; assertSameKeys() lo verifica al cargar en desarrollo.
   ========================================================================== */

export const STRINGS = {
es:{bar:"Uso interno · Vendedores y partners Wizor",h1:"Calculá tu inversión",sub:"Elegí tu actividad, tu cantidad de personal y qué querés evaluar. El precio aparece al instante, sin formularios.",
 t1:"Tu organización",h1h:"La actividad define la tarifa, igual que una aseguradora define su alícuota.",lInd:"Actividad principal",lCty:"País de contratación",lHc:"Colaboradores cubiertos",lEst:"Establecimientos",lCtn:"Países donde opera",
 t2:"Servicios de Wizor",h2h:"Podés empezar por una evaluación específica y sumar el resto cuando quieras, sobre el mismo contrato.",
 t3:"Dispositivos",h3h:"Opcionales. Se compran una vez, sin abono mensual. El cliente los instala y calibra con el manual.",
 sumTr:"Ver cómo se calcula el precio por tramos de volumen",thTr:"Tramo",thPe:"Personas",thTa:"Tarifa",thSu:"Subtotal",
 crT:"Wizor Credits · disponibles para empresas seleccionadas",crF:"El monto lo define Wizor según el caso. Se aplica como crédito sobre la facturación, no como descuento sobre el precio de lista.",
 fT:"Programa fundador",fP:"Diez organizaciones entran en condiciones preferenciales, con precio fijo por 36 meses y prioridad en la asignación de dispositivos. Se define en la demo.",fS:"10 cupos · cierra en 2026",
 sT:"Tu inversión",mLab:"por mes",
 taxAll:"Todos los valores son más impuestos (IVA, TAX o equivalente) según el país de contratación.",
 fxLbl:"Tipo de cambio",fxRef:"al {d} · el contrato se factura en dólares",
 fxLive:"en vivo · {t} · el contrato se factura en dólares",fxWait:"buscando cotización…",
 foot:"Los valores son de lista, en dólares, y no incluyen impuestos de cada jurisdicción. Contrato anual con facturación mensual. Onboarding y usuarios de backoffice incluidos.",
 rAnnual:"Plataforma, por año",rPepm:"Por persona por mes",rRep:"Informes incluidos",rUsr:"Usuarios de backoffice",rDev:"Dispositivos, pago único",rTot:"Primer año",rIdx:"Wizor Index",rCtn:"Países",
 avail:"Disponible",pre:"Preventa",yes:"Sí",no:"No",pick:"Elegí al menos una evaluación.",
 noteSoc:"Principio 4 del manifiesto: la plataforma es sin cargo para fundaciones y organizaciones que trabajan con neurodivergencia. Escribinos y la activamos.",
 noteMin:"Se aplica el mínimo de contrato anual de US$4.800.",
 note360:"Wizor 360 se contrata en preventa: los dispositivos se entregan desde noviembre de 2026 para pruebas, mayo de 2027 en serie comercial y diciembre de 2027 a escala completa.",
 noteMulti:"Contrato regional consolidado: el volumen total define el tramo, y cada país mantiene el instrumento que exige su norma.",
 segSelfK:"Autoservicio",segSelfT:"Podés contratar en línea. Precio cerrado y alta inmediata.",
 segDemoK:"Con acompañamiento",segDemoT:"Precio de lista. Lo confirmamos en una demo de 30 minutos, con tu cantidad de personal y tus establecimientos reales.",
 segPropK:"Propuesta a medida",segPropT:"Operación multinacional. El instrumento cambia por jurisdicción, así que armamos una propuesta consolidada en lugar de cerrar acá.",
 ctaSelf:"Contratar ahora",ctaDemo:"Agendar demo",ctaProp:"Solicitar propuesta",shT:"Presupuesto",ctaPdf:"Descargar PDF",ctaCopy:"Copiar resumen",
 quoteFail:"No se pudo calcular el precio. Reintentá en unos segundos.",
 copied:"Resumen copiado al portapapeles.",copyFail:"No se pudo copiar. Seleccioná el texto del panel a mano.",
 sent:"Pedido registrado. Te contactamos a la brevedad.",
 oT:"Contanos de tu actividad",oP:"No encontramos tu actividad en la lista. Describila y te respondemos con una tarifa.",
 lOAct:"Descripción de la actividad",lOCty:"País",lOMail:"Email de contacto",lOHc:"Cantidad de colaboradores",lOEst:"Cantidad de establecimientos",oBtn:"Descargar resumen en PDF",
 oOk:"Listo. Guardá el PDF y enviáselo a tu contacto en Wizor.",oErr:"Completá la descripción y tu email.",
 devOn:"Los dispositivos solo funcionan con Wizor 360, así que lo seleccionamos.",
 devOff:"Quitamos los dispositivos: solo Wizor 360 puede usarlos.",
 panelT:"Panel de Control",
 ck:{pay:"Se puede contratar en línea.",deposit:"Preventa: se reserva con una seña de {monto}, que se descuenta de la facturación.",request:"Sin cargo. Se activa por solicitud.",contact:"Requiere una propuesta a medida.",incomplete:"Wizor 360 necesita equipamiento instalado para funcionar. Agregá al menos un equipo.",none:"Elegí al menos un servicio."},
 p:{lens:{n:"Wizor Lens",d:"Una evaluación específica: psicosocial, ergonomía o riesgo biológico.",
   f:["Instrumento normado por país, con base ISO 45003","1 informe regional y 1 por establecimiento","Tablero comparativo y backoffice"]},
  core:{n:"Wizor Core",d:"La evaluación general: 13 dimensiones del ambiente de trabajo.",
   f:["Mapa de calor y prioridades por establecimiento","Proyección del costo directo, indirecto y oculto a 12–24 meses","10 informes regionales y 10 por establecimiento"]},
  w360:{n:"Wizor 360",d:"Todo, más los dispositivos. El único plan que entrega el Wizor Index.",
   f:["Core más las evaluaciones específicas","Medición ambiental continua con dispositivos","Wizor Index: percepción de las personas más medición real del ambiente"]}},
 d:{desk:["Smart Desktop","Ambiente de oficina y salas. 12 parámetros."],mach:["Smart Machine","Cabinas de maquinaria y puestos operativos."],pin:["Smart Pin","Personal sin puesto fijo. Mapa de exposición."]},
 i:{oilgas:"Petróleo y gas",mining:"Minería",constr:"Construcción",chem:"Química y petroquímica",energy:"Energía",manuf:"Manufactura",pharma:"Farmacéutica",auto:"Automotriz",food:"Alimentos y bebidas",agro:"Agroindustria",logi:"Logística y transporte",infra:"Infraestructura",port:"Puertos y marítimo",retail:"Comercio y retail",hosp:"Hotelería y gastronomía",servop:"Servicios operativos",bank:"Banca, seguros y finanzas",tech:"Tecnología y software",telco:"Telecomunicaciones",prof:"Servicios profesionales",health:"Salud y hospitales",edu:"Educación",gov:"Administración pública",ngo:"Fundación u ONG de neurodivergencia",other:"Otra actividad · contanos"}},

en:{bar:"Internal use · Wizor sellers and partners",h1:"Calculate your investment",sub:"Pick your activity, your headcount and what you want to measure. The price shows up instantly, no forms.",
 t1:"Your organization",h1h:"Activity sets the rate, the same way an insurer sets a premium class.",lInd:"Primary activity",lCty:"Contracting country",lHc:"Covered employees",lEst:"Sites",lCtn:"Countries of operation",
 t2:"Wizor services",h2h:"Start with one specific assessment and add the rest whenever you want, on the same contract.",
 t3:"Devices",h3h:"Optional. Bought once, no monthly fee. You install and calibrate them with the manual.",
 sumTr:"See how volume tiers build the price",thTr:"Tier",thPe:"People",thTa:"Rate",thSu:"Subtotal",
 crT:"Wizor Credits · available for selected companies",crF:"The amount is set by Wizor case by case. It is applied as a credit against billing, not as a discount off list price.",
 fT:"Founding program",fP:"Ten organizations get preferential terms, a 36-month price lock and priority on device allocation. Defined in the demo.",fS:"10 seats · closes in 2026",
 sT:"Your investment",mLab:"per month",
 taxAll:"All figures are exclusive of taxes (VAT, sales tax or equivalent) in the contracting country.",
 fxLbl:"Exchange rate",fxRef:"as of {d} · the contract is billed in US dollars",
 fxLive:"live · {t} · the contract is billed in US dollars",fxWait:"fetching rate…",
 foot:"List prices in US dollars, excluding taxes in each jurisdiction. Annual contract, monthly billing. Onboarding and backoffice users included.",
 rAnnual:"Platform, per year",rPepm:"Per person per month",rRep:"Reports included",rUsr:"Backoffice users",rDev:"Devices, one-time",rTot:"First year",rIdx:"Wizor Index",rCtn:"Countries",
 avail:"Available",pre:"Pre-order",yes:"Yes",no:"No",pick:"Pick at least one assessment.",
 noteSoc:"Principle 4 of our manifesto: the platform is free for foundations and organizations working with neurodivergence. Write to us and we'll switch it on.",
 noteMin:"The US$4,800 annual contract minimum applies.",
 note360:"Wizor 360 is sold as a pre-order: devices ship from November 2026 for pilots, May 2027 in commercial series and December 2027 at full scale.",
 noteMulti:"Consolidated regional contract: total volume sets the tier, and each country keeps the instrument its regulation requires.",
 segSelfK:"Self-service",segSelfT:"You can sign up online. Fixed price, immediate activation.",
 segDemoK:"Guided",segDemoT:"List price. We confirm it in a 30-minute demo, against your real headcount and sites.",
 segPropK:"Tailored proposal",segPropT:"Multi-country operation. The instrument changes by jurisdiction, so we build a consolidated proposal instead of closing here.",
 ctaSelf:"Start now",ctaDemo:"Book a demo",ctaProp:"Request a proposal",shT:"Quote",ctaPdf:"Download PDF",ctaCopy:"Copy summary",
 quoteFail:"Couldn't calculate the price. Try again in a few seconds.",
 copied:"Summary copied to clipboard.",copyFail:"Couldn't copy. Select the panel text by hand.",
 sent:"Request logged. We'll be in touch shortly.",
 oT:"Tell us about your activity",oP:"We couldn't find your activity on the list. Describe it and we'll come back with a rate.",
 lOAct:"Activity description",lOCty:"Country",lOMail:"Contact email",lOHc:"Number of employees",lOEst:"Number of sites",oBtn:"Download summary as PDF",
 oOk:"Done. Save the PDF and send it to your Wizor contact.",oErr:"Please fill in the description and your email.",
 devOn:"Devices only work with Wizor 360, so we selected it.",
 devOff:"We removed the devices: only Wizor 360 can use them.",
 panelT:"Control Panel",
 ck:{pay:"Can be signed up online.",deposit:"Pre-order: reserved with a {monto} deposit, credited against billing.",request:"Free of charge. Activated on request.",contact:"Needs a tailored proposal.",incomplete:"Wizor 360 needs installed devices to work. Add at least one device.",none:"Pick at least one service."},
 p:{lens:{n:"Wizor Lens",d:"One specific assessment: psychosocial, ergonomics or biological risk.",
   f:["Country-compliant instrument, ISO 45003 based","1 regional report and 1 per site","Comparative dashboard and backoffice"]},
  core:{n:"Wizor Core",d:"The general assessment: 13 dimensions of the work environment.",
   f:["Heat map and priorities per site","Direct, indirect and hidden cost projection over 12–24 months","10 regional reports and 10 per site"]},
  w360:{n:"Wizor 360",d:"Everything, plus devices. The only plan that delivers the Wizor Index.",
   f:["Core plus the specific assessments","Continuous environmental measurement with devices","Wizor Index: what people perceive plus what sensors measure"]}},
 d:{desk:["Smart Desktop","Offices and meeting rooms. 12 parameters."],mach:["Smart Machine","Machinery cabins and operating stations."],pin:["Smart Pin","Staff without a fixed station. Exposure map."]},
 i:{oilgas:"Oil & gas",mining:"Mining",constr:"Construction",chem:"Chemicals & petrochemicals",energy:"Energy",manuf:"Manufacturing",pharma:"Pharmaceutical",auto:"Automotive",food:"Food & beverage",agro:"Agribusiness",logi:"Logistics & transport",infra:"Infrastructure",port:"Ports & maritime",retail:"Retail & commerce",hosp:"Hospitality & food service",servop:"Operational services",bank:"Banking, insurance & finance",tech:"Technology & software",telco:"Telecommunications",prof:"Professional services",health:"Healthcare & hospitals",edu:"Education",gov:"Public administration",ngo:"Neurodivergence foundation or NGO",other:"Other activity · tell us"}},

pt:{bar:"Uso interno · Vendedores e parceiros Wizor",h1:"Calcule seu investimento",sub:"Escolha sua atividade, seu quadro de pessoal e o que quer medir. O preço aparece na hora, sem formulários.",
 t1:"Sua organização",h1h:"A atividade define a tarifa, como uma seguradora define sua alíquota.",lInd:"Atividade principal",lCty:"País de contratação",lHc:"Colaboradores cobertos",lEst:"Estabelecimentos",lCtn:"Países onde opera",
 t2:"Serviços da Wizor",h2h:"Comece por uma avaliação específica e some o resto quando quiser, no mesmo contrato.",
 t3:"Dispositivos",h3h:"Opcionais. Compra única, sem mensalidade. O cliente instala e calibra com o manual.",
 sumTr:"Ver como o preço é calculado por faixas de volume",thTr:"Faixa",thPe:"Pessoas",thTa:"Tarifa",thSu:"Subtotal",
 crT:"Wizor Credits · disponíveis para empresas selecionadas",crF:"O valor é definido pela Wizor caso a caso. É aplicado como crédito sobre o faturamento, não como desconto sobre o preço de tabela.",
 fT:"Programa fundador",fP:"Dez organizações entram em condições preferenciais, com preço fixo por 36 meses e prioridade na alocação de dispositivos. Definido na demo.",fS:"10 vagas · encerra em 2026",
 sT:"Seu investimento",mLab:"por mês",
 taxAll:"Todos os valores são acrescidos de impostos (IVA, TAX ou equivalente) conforme o país de contratação.",
 fxLbl:"Taxa de câmbio",fxRef:"em {d} · o contrato é faturado em dólares",
 fxLive:"ao vivo · {t} · o contrato é faturado em dólares",fxWait:"buscando cotação…",
 foot:"Valores de tabela em dólares, sem impostos de cada jurisdição. Contrato anual com faturamento mensal. Onboarding e usuários de backoffice incluídos.",
 rAnnual:"Plataforma, por ano",rPepm:"Por pessoa por mês",rRep:"Relatórios incluídos",rUsr:"Usuários de backoffice",rDev:"Dispositivos, pagamento único",rTot:"Primeiro ano",rIdx:"Wizor Index",rCtn:"Países",
 avail:"Disponível",pre:"Pré-venda",yes:"Sim",no:"Não",pick:"Escolha ao menos uma avaliação.",
 noteSoc:"Princípio 4 do manifesto: a plataforma é gratuita para fundações e organizações que trabalham com neurodivergência. Escreva para nós e a ativamos.",
 noteMin:"Aplica-se o mínimo de contrato anual de US$4.800.",
 note360:"Wizor 360 é contratado em pré-venda: os dispositivos são entregues a partir de novembro de 2026 para testes, maio de 2027 em série comercial e dezembro de 2027 em escala total.",
 noteMulti:"Contrato regional consolidado: o volume total define a faixa, e cada país mantém o instrumento exigido por sua norma.",
 segSelfK:"Autoatendimento",segSelfT:"Você pode contratar online. Preço fechado e ativação imediata.",
 segDemoK:"Com acompanhamento",segDemoT:"Preço de tabela. Confirmamos em uma demo de 30 minutos, com seu quadro e seus estabelecimentos reais.",
 segPropK:"Proposta sob medida",segPropT:"Operação multinacional. O instrumento muda por jurisdição, então montamos uma proposta consolidada em vez de fechar aqui.",
 ctaSelf:"Contratar agora",ctaDemo:"Agendar demo",ctaProp:"Solicitar proposta",shT:"Orçamento",ctaPdf:"Baixar PDF",ctaCopy:"Copiar resumo",
 quoteFail:"Não foi possível calcular o preço. Tente de novo em alguns segundos.",
 copied:"Resumo copiado para a área de transferência.",copyFail:"Não foi possível copiar. Selecione o texto do painel manualmente.",
 sent:"Pedido registrado. Entraremos em contato em breve.",
 oT:"Conte sobre sua atividade",oP:"Não encontramos sua atividade na lista. Descreva-a e respondemos com uma tarifa.",
 lOAct:"Descrição da atividade",lOCty:"País",lOMail:"E-mail de contato",lOHc:"Quantidade de colaboradores",lOEst:"Quantidade de estabelecimentos",oBtn:"Baixar resumo em PDF",
 oOk:"Pronto. Salve o PDF e envie ao seu contato na Wizor.",oErr:"Preencha a descrição e seu e-mail.",
 devOn:"Os dispositivos só funcionam com Wizor 360, então o selecionamos.",
 devOff:"Removemos os dispositivos: só o Wizor 360 pode usá-los.",
 panelT:"Painel de Controle",
 ck:{pay:"Pode ser contratado online.",deposit:"Pré-venda: reservado com um sinal de {monto}, descontado do faturamento.",request:"Sem custo. Ativado por solicitação.",contact:"Requer uma proposta sob medida.",incomplete:"O Wizor 360 precisa de dispositivos instalados para funcionar. Adicione ao menos um dispositivo.",none:"Escolha ao menos um serviço."},
 p:{lens:{n:"Wizor Lens",d:"Uma avaliação específica: psicossocial, ergonomia ou risco biológico.",
   f:["Instrumento conforme a norma de cada país, base ISO 45003","1 relatório regional e 1 por estabelecimento","Painel comparativo e backoffice"]},
  core:{n:"Wizor Core",d:"A avaliação geral: 13 dimensões do ambiente de trabalho.",
   f:["Mapa de calor e prioridades por estabelecimento","Projeção do custo direto, indireto e oculto em 12–24 meses","10 relatórios regionais e 10 por estabelecimento"]},
  w360:{n:"Wizor 360",d:"Tudo, mais os dispositivos. O único plano que entrega o Wizor Index.",
   f:["Core mais as avaliações específicas","Medição ambiental contínua com dispositivos","Wizor Index: a percepção das pessoas mais a medição real do ambiente"]}},
 d:{desk:["Smart Desktop","Escritórios e salas. 12 parâmetros."],mach:["Smart Machine","Cabines de máquinas e postos operacionais."],pin:["Smart Pin","Pessoal sem posto fixo. Mapa de exposição."]},
 i:{oilgas:"Petróleo e gás",mining:"Mineração",constr:"Construção",chem:"Química e petroquímica",energy:"Energia",manuf:"Manufatura",pharma:"Farmacêutica",auto:"Automotiva",food:"Alimentos e bebidas",agro:"Agroindústria",logi:"Logística e transporte",infra:"Infraestrutura",port:"Portos e marítimo",retail:"Comércio e varejo",hosp:"Hotelaria e gastronomia",servop:"Serviços operacionais",bank:"Bancos, seguros e finanças",tech:"Tecnologia e software",telco:"Telecomunicações",prof:"Serviços profissionais",health:"Saúde e hospitais",edu:"Educação",gov:"Administração pública",ngo:"Fundação ou ONG de neurodivergência",other:"Outra atividade · conte-nos"}}};

/* Códigos de nota que devuelve el motor de precios -> clave de traducción.
   El motor nunca devuelve texto, solo el código. */
export const NOTE_KEYS = {
  social: 'noteSoc',
  multiCountry: 'noteMulti',
  preOrder: 'note360',
  minimum: 'noteMin',
};

/* Etiqueta del segmento comercial -> par de claves (título, descripción). */
export const SEGMENT_KEYS = {
  self:     ['segSelfK', 'segSelfT'],
  demo:     ['segDemoK', 'segDemoT'],
  proposal: ['segPropK', 'segPropT'],
};

/* Sufijo de la tarifa unitaria, por idioma. */
export const PER_PERSON_UNIT = { es: 'persona/mes', en: 'person/mo', pt: 'pessoa/mês' };

/* Locale para formatear fechas en la hoja de presupuesto. */
export const DATE_LOCALE = { es: 'es-AR', en: 'en-US', pt: 'pt-BR' };

/**
 * Verifica que los tres idiomas tengan el mismo juego de claves de primer
 * nivel. Una clave faltante se manifestaría como "undefined" en pantalla al
 * cambiar de idioma, que es un error difícil de ver en una revisión rápida.
 * Devuelve la lista de diferencias; vacía significa que están alineados.
 */
export function missingKeys() {
  const langs = Object.keys(STRINGS);
  const reference = new Set(Object.keys(STRINGS[langs[0]]));
  const problems = [];
  for (const lang of langs.slice(1)) {
    const keys = new Set(Object.keys(STRINGS[lang]));
    for (const k of reference) if (!keys.has(k)) problems.push(`${lang}: falta ${k}`);
    for (const k of keys) if (!reference.has(k)) problems.push(`${lang}: sobra ${k}`);
  }
  return problems;
}
