/* ==========================================================================
   pricebook.test.mjs — el catálogo v1 tiene que validar, y el motor nuevo
   tiene que dar exactamente los mismos números que el cotizador anterior.
   ========================================================================== */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validatePriceBook, readyToPublish } from '../lib/pricebook/schema.js';
import { PRICE_BOOK_V1 } from '../lib/pricebook/seed-v1.js';
import { quote, buyableProducts, waitlistProducts, publicProducts, hardwareByGroup } from '../lib/pricing/engine.js';

/* --- Motor anterior, copiado literal como referencia -------------------- */
const CURVE=[10000,30000,75000,150000,400000,Infinity];
const FC=[1,.833,.700,.583,.433,.300], FV=[1,.90,.80,.70,.60,.50];
const BASE={lens:4,core:8,w360:12}, MULT={lens:1,core:2,w360:3};
const BANDS=[[25,1920],[50,3360],[100,6080],[200,10880],[350,17640],[500,24000]];
const CATF={'1A':1.25,'1B':1,'2':.9,'3':.8,'4':.7,'5':.75,'SOC':0};
const MIN=4800, DEVP={desk:800,mach:1300,pin:600};
const IND={oilgas:'1A',mining:'1A',constr:'1A',chem:'1A',energy:'1A',
 manuf:'1B',pharma:'1B',auto:'1B',food:'1B',agro:'1B',logi:'2',infra:'2',port:'2',
 retail:'3',hosp:'3',servop:'3',bank:'4',tech:'4',telco:'4',prof:'4',
 health:'5',edu:'5',gov:'5',ngo:'SOC'};
function annualOld(p,n,c){
  if(c==='SOC') return 0;
  const cf = p==='lens'?1:CATF[c];
  if(n<=500){const b=BANDS.find(x=>n<=x[0])||BANDS[5];return Math.round(b[1]*MULT[p]*cf);}
  const f = p==='lens'?FC:FV; let prev=0,m=0;
  CURVE.forEach((up,i)=>{m+=Math.max(0,Math.min(n,up)-prev)*BASE[p]*f[i];prev=up;});
  return Math.max(MIN,Math.round(m*12*cf));
}
function tiersOld(p,n,c){
  if(n<=500||c==='SOC')return[];
  const f=p==='lens'?FC:FV, cf=p==='lens'?1:CATF[c];
  let prev=0,out=[];
  CURVE.forEach((up,i)=>{const q=Math.max(0,Math.min(n,up)-prev);prev=up;
    if(q>0)out.push([q,BASE[p]*f[i]*cf,q*BASE[p]*f[i]*cf*12]);});
  return out;
}

/* ------------------------------------------------------------------------ */

test('el catálogo v1 valida contra el esquema', () => {
  const r = validatePriceBook(PRICE_BOOK_V1);
  assert.equal(r.ok, true, r.ok ? '' : JSON.stringify(r.errors, null, 2));
});

test('el esquema rechaza un catálogo incoherente', () => {
  const cases = [
    ['curva inexistente', (b) => { b.products[0].curve = 'no-existe'; }],
    ['categoría inexistente', (b) => { b.industries.oilgas = 'ZZ'; }],
    ['absorbe un producto que no existe', (b) => { b.products[2].absorbs = ['fantasma']; }],
    ['bandas desordenadas', (b) => { b.smallBands[2] = [10, 6080]; }],
    ['la última banda no coincide con el corte de autoservicio', (b) => { b.selfServiceMaxHeadcount = 400; }],
    ['curva con menos factores que tramos', (b) => { b.curves[0].factors = [1, 0.5]; }],
    ['escala de comisiones con último tramo cerrado', (b) => { b.commissions.partner.scale.at(-1)[0] = 5e6; }],
    ['productos con clave repetida', (b) => { b.products[1].key = 'lens'; }],
  ];
  for (const [label, mutate] of cases) {
    const copy = structuredClone(PRICE_BOOK_V1);
    mutate(copy);
    assert.equal(validatePriceBook(copy).ok, false, `debería rechazar: ${label}`);
  }
});

test('el motor da los mismos números que el cotizador anterior', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const headcounts = [10,24,25,26,50,99,100,200,350,500,501,1000,5000,9999,10000,
                      10001,30000,30001,75000,150000,400000,400001,1200000];
  const sitesList = [1,3,12];
  const countryList = [1,2];
  const combos = [
    {lens:true},{core:true},{lens:true,core:true},{w360:true},
    {w360:true,lens:true,core:true},{},
  ];
  const devSets = [{desk:0,mach:0,pin:0},{desk:2,mach:5,pin:11}];

  let checked = 0;
  for (const industry of Object.keys(IND)) {
    const c = IND[industry];
    for (const headcount of headcounts)
    for (const sites of sitesList)
    for (const countries of countryList)
    for (const sel of combos)
    for (const hardware of devSets) {
      const selected = {lens:!!sel.lens, core:!!sel.core, w360:!!sel.w360};
      const r = quote(book, {industry, headcount, sites, countries, selected, hardware});

      let plat = 0, top = null;
      if (selected.w360) { plat = annualOld('w360',headcount,c); top='w360'; }
      else {
        if (selected.core) { plat += annualOld('core',headcount,c); top='core'; }
        if (selected.lens) { plat += annualOld('lens',headcount,c); top = top||'lens'; }
      }
      const devTot = Object.keys(DEVP).reduce((s,k)=>s+hardware[k]*DEVP[k],0);
      const reports = top==='lens' ? 1+sites : (top ? 10+10*sites : 0);
      const users = top==='w360'?10:top==='core'?5:top==='lens'?3:0;

      const id = `${industry}/${headcount}/${sites}/${countries}/${JSON.stringify(sel)}/${hardware.mach}`;
      assert.equal(r.platformAnnual, plat, `plataforma ${id}`);
      assert.equal(r.hardwareTotal, devTot, `equipamiento ${id}`);
      assert.equal(r.firstYear, plat+devTot, `primer año ${id}`);
      assert.equal(r.reports, reports, `informes ${id}`);
      assert.equal(r.users, users, `usuarios ${id}`);
      assert.equal(r.index, !!selected.w360, `index ${id}`);

      const tOld = top ? tiersOld(top,headcount,c) : [];
      assert.equal(r.tiers.length, tOld.length, `cantidad de tramos ${id}`);
      r.tiers.forEach((x,i)=>{
        assert.equal(x.qty, tOld[i][0], `tramo ${i} cantidad ${id}`);
        assert.ok(Math.abs(x.rate-tOld[i][1])<1e-9, `tramo ${i} tarifa ${id}`);
        assert.ok(Math.abs(x.subtotal-tOld[i][2])<1e-6, `tramo ${i} subtotal ${id}`);
      });
      checked++;
    }
  }
  console.log(`      ${checked.toLocaleString('es-AR')} combinaciones verificadas`);
  assert.ok(checked > 30000);
});

test('una actividad fuera del catálogo no cotiza', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const r = quote(book, {industry:'other', headcount:100, sites:1, countries:1, selected:{core:true}, hardware:{}});
  assert.equal(r.unlisted, true);
  assert.equal(r.platformAnnual, 0);
});

test('el onboarding muestra los tres productos, pero solo cobra dos', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  assert.deepEqual(publicProducts(book).map(p=>p.key), ['lens','core','w360'],
    'Wizor 360 tiene que verse: si no, quien vino a buscarlo se frustra.');
  assert.deepEqual(buyableProducts(book).map(p=>p.key), ['lens','core']);
  assert.deepEqual(waitlistProducts(book).map(p=>p.key), ['w360']);
  assert.ok(book.products.find(p=>p.key==='w360').waitlistNote.es.length > 20,
    'La preventa tiene que explicar cuándo se entrega.');
});

test('el motor resuelve los desenlaces del checkout', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const base = {industry:'constr', headcount:200, sites:1, countries:1, hardware:{}};
  const q = (over) => quote(book, {...base, ...over});

  // Lens o Core: se paga.
  assert.equal(q({selected:{core:true}}).checkout.mode, 'pay');
  assert.equal(q({selected:{lens:true}}).checkout.mode, 'pay');

  // Wizor 360 sin equipamiento no se puede contratar: sin sensores
  // instalados no hay medición.
  const vacio = q({selected:{w360:true}});
  assert.equal(vacio.checkout.mode, 'incomplete');
  assert.deepEqual(vacio.checkout.reasons, ['hardwareRequired']);
  assert.ok(vacio.platformAnnual > 0, 'El precio de la plataforma igual se muestra.');

  // Con equipamiento, pasa a seña de preventa.
  const pre = q({selected:{w360:true}, hardware:{mach:5}});
  assert.equal(pre.checkout.mode, 'deposit');
  assert.deepEqual(pre.checkout.waitlist, ['w360']);

  // 360 absorbe a Core: elegir los dos sigue siendo preventa.
  assert.equal(q({selected:{core:true, w360:true}, hardware:{mach:5}}).checkout.mode, 'deposit');

  // ONG: cotiza cero, no se puede cobrar cero.
  const ong = q({industry:'ngo', selected:{core:true}});
  assert.equal(ong.platformAnnual, 0);
  assert.equal(ong.checkout.mode, 'request');
  assert.deepEqual(ong.checkout.reasons, ['freeTier']);

  // Una empresa grande que quiere contratar sola TIENE QUE PODER.
  const grande = q({headcount:20000, selected:{core:true}});
  assert.equal(grande.checkout.mode, 'pay',
    'Una empresa de 20.000 personas tiene que poder contratar por autoservicio.');
  assert.equal(grande.segment, 'demo', 'El tamaño sugiere una demo, no la impone.');

  // Varios países tampoco bloquea: elige su país de contratación y cotiza
  // sobre la dotación total.
  const multi = q({countries:5, headcount:12000, selected:{core:true}});
  assert.equal(multi.checkout.mode, 'pay',
    'Una multinacional elige país de contratación y contrata.');
  assert.equal(multi.segment, 'proposal', 'Se le sugiere una propuesta, nada más.');

  // Sin nada elegido, y actividad fuera del catálogo.
  assert.equal(q({selected:{}}).checkout.mode, 'none');
  assert.equal(q({industry:'other', selected:{core:true}}).checkout.mode, 'contact');
});

test('el catálogo v1 es publicable y la seña es del 100% del equipamiento', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const d = book.products.find((p) => p.key === 'w360').deposit;
  assert.equal(d.pct, 1.0);
  assert.equal(d.basis, 'hardware');
  assert.equal(readyToPublish(book).ready, true);

  // Si alguien borra la seña, deja de poder publicarse.
  const sinSeña = structuredClone(PRICE_BOOK_V1);
  sinSeña.products.find((p) => p.key === 'w360').deposit.pct = null;
  const r = readyToPublish(validatePriceBook(sinSeña).book);
  assert.equal(r.ready, false);
  assert.ok(r.missing.some((m) => m.path.includes('deposit')));
});

test('la seña es el 100% del equipamiento y no toca la plataforma', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const base = {industry:'constr', headcount:200, sites:1, countries:1, selected:{w360:true}};

  const r = quote(book, {...base, hardware:{mach:5}});
  assert.equal(r.hardwareTotal, 6500);
  assert.equal(r.checkout.depositUsd, 6500, 'La seña es todo el equipamiento.');
  assert.ok(r.platformAnnual > 0);
  assert.ok(r.checkout.depositUsd < r.firstYear,
    'La plataforma no entra en la seña: se factura cuando el equipo está instalado.');
  assert.equal(r.checkout.depositCredited, true);

  // Con un panel de control, la seña sube por su precio completo.
  const conPanel = quote(book, {...base, hardware:{mach:5, panel_pro:1}});
  assert.equal(conPanel.hardwareTotal, 6500 + 25000);
  assert.equal(conPanel.checkout.depositUsd, 31500);
  assert.deepEqual(conPanel.hardwareGroups, { sensor: 6500, panel: 25000 });
});

test('el Panel de Control está en las tres versiones y en preventa', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const grupos = hardwareByGroup(book);
  const paneles = grupos.get('panel');
  assert.equal(paneles.length, 3);
  assert.deepEqual(paneles.map((p) => p.price), [15000, 25000, 72000]);
  assert.deepEqual(paneles.map((p) => p.key), ['panel_start', 'panel_pro', 'panel_expert']);
  assert.ok(paneles.every((p) => p.preOrder), 'Los paneles van en preventa.');
  assert.ok(paneles.every((p) => p.deliveryNote.es), 'Tienen que decir cuándo se entregan.');
  assert.equal(grupos.get('sensor').length, 3);
});

test('una seña por porcentaje no puede llevar además un monto fijo', () => {
  const malo = structuredClone(PRICE_BOOK_V1);
  malo.products.find((p) => p.key === 'w360').deposit.amountUsd = 2500;  // ya tiene pct
  assert.equal(validatePriceBook(malo).ok, false);
});

test('el programa fundador es un programa aparte, no la preventa', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const prog = book.programs.find((p) => p.key === 'fundador');
  assert.ok(prog, 'Tiene que existir el programa fundador.');
  assert.equal(prog.requiresApproval, true, 'Entrar lo decide Wizor.');
  assert.equal(prog.seatsPerCountry, 10, 'Diez cupos POR PAÍS, no en total.');
  assert.deepEqual(prog.creditTiersUsd, [5000, 10000, 25000, 100000]);
  // No es un producto ni tiene nada que ver con el modo de venta de 360.
  assert.equal(book.products.some((p) => p.key === 'fundador'), false);
});

test('una seña solo tiene sentido sobre un producto en preventa', () => {
  const malo = structuredClone(PRICE_BOOK_V1);
  const core = malo.products.find((p) => p.key === 'core');
  core.deposit = { required: true, basis: 'hardware', pct: 0.1, amountUsd: null, creditedToContract: true, refundable: false };
  assert.equal(validatePriceBook(malo).ok, false);
});

test('pasar 360 a venta directa no necesita tocar código', () => {
  const futuro = structuredClone(PRICE_BOOK_V1);
  const w360 = futuro.products.find(p=>p.key==='w360');
  w360.onlineMode = 'buy';
  w360.preOrder = false;
  w360.deposit = { required: false, basis: 'hardware', pct: null, amountUsd: null, creditedToContract: true, refundable: false };

  const check = validatePriceBook(futuro);
  assert.equal(check.ok, true, check.ok ? '' : JSON.stringify(check.errors));
  const r = quote(check.book, {industry:'constr', headcount:200, sites:1, countries:1,
                               selected:{w360:true}, hardware:{mach:2}});
  assert.equal(r.checkout.mode, 'pay');
});

test('el esquema no deja vender online algo marcado como preventa', () => {
  const malo = structuredClone(PRICE_BOOK_V1);
  malo.products.find(p=>p.key==='w360').onlineMode = 'buy';  // sigue con preOrder: true
  assert.equal(validatePriceBook(malo).ok, false);
});

test('Wizor 360 absorbe a Lens y Core en lugar de sumarse', () => {
  const book = validatePriceBook(PRICE_BOOK_V1).book;
  const base = {industry:'constr', headcount:5000, sites:1, countries:1, hardware:{}};
  const solo = quote(book, {...base, selected:{w360:true}});
  const todo = quote(book, {...base, selected:{w360:true, lens:true, core:true}});
  assert.equal(todo.platformAnnual, solo.platformAnnual);
  assert.deepEqual(todo.contracted, ['w360']);
});

