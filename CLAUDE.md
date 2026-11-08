# Wizor · Cotizador y back office

Sistema comercial de Wizor Technologies, Inc. Catálogo de precios, cotización,
comisiones y —desde el 10 de diciembre de 2026— contratación y cobro en línea.

Leé `docs/ESTADO.md` para saber en qué punto está el trabajo y qué decisiones
quedaron abiertas.

---

## Invariantes

No son preferencias de estilo. Romper cualquiera de estas rompe el negocio.

### 1 · Un catálogo publicado es inmutable

Para cambiar un precio se abre un borrador, se revisan las diferencias y se
publica una versión nueva. Lo impide un trigger en la base, no solo la
aplicación.

Cada cotización y cada suscripción guarda el `price_book_id` con el que se
emitió, y se sigue leyendo con ese. Subir precios mañana no reprecia a nadie
que ya firmó. **Sin esto, el precio fijo por 36 meses que promete el programa
fundador no se puede sostener.**

Nunca agregues un camino que modifique un catálogo publicado, ni siquiera "solo
para corregir una errata". Se publica una versión nueva.

### 2 · El modelo comercial no viaja al navegador

Curvas de volumen, factores por categoría de riesgo, bandas PyME y mínimo anual
viven en `lib/pricing/engine.js` y **corren solo en el servidor**. La pantalla
manda la configuración a `/api/quote` y recibe números.

`lib/pricing/public-catalog.js` arma el recorte que sí puede ver el navegador:
nombres, precios de equipamiento y qué productos existen. Si agregás un campo
ahí, preguntate si revela cómo se calcula el precio.

**Excepción deliberada: la guía (`/`).** Muestra curvas, factores, bandas y
mínimo, armados en el servidor desde el catálogo. Lo decidió Wizor el 6 de
noviembre de 2026 porque la guía es solo para el equipo interno y vive detrás
del portero. Es una página de lectura: el motor sigue sin viajar al
navegador. **Antes de abrir el sitio o la raíz al público, la guía se mueve o
se recorta.**

### 3 · Las comisiones no están en el cotizador

No ocultas: **ausentes**. Un vendedor puede estar mostrando `/ventas` sentado al
lado del cliente, y esconder una cifra con CSS la deja en el HTML.

`lib/pricing/commissions.js` se importa **únicamente** desde
`app/ventas/comision/`. Nunca desde `/ventas`, nunca desde un componente de
cliente, nunca desde `/api/quote`.

`tests/separacion.test.mjs` descarga la página y todos sus scripts y busca
cualquier rastro del módulo. Si lo importás por error, falla.

### 4 · Ningún valor comercial se inventa

Precios, porcentajes, plazos de entrega, condiciones de un programa, textos
legales. Si falta un dato, **preguntá**; no pongas un valor razonable de
relleno.

`readyToPublish()` existe para esto: un catálogo al que le falta un dato se
puede guardar como borrador pero no publicar, y dice qué falta. Preferí ese
camino antes que completar con una suposición.

---

## Cómo se trabaja acá

- **Español** en el código: comentarios, mensajes de commit, nombres de
  variables de dominio (`seña`, `acumulado`, `borrador`). El inglés queda para
  las APIs y lo que ya viene en inglés.
- **La pantalla, en tres idiomas.** Todo texto visible existe en español,
  inglés y portugués, con las mismas claves (`tests/idiomas.test.mjs`). Cada
  pantalla tiene su `textos.js` al lado; los del cotizador del navegador van
  en `lib/i18n.js`. Los de la comisión, **solo** en `app/ventas/comision/`. El
  idioma lo elige el selector ES·EN·PT y lo guarda el portero en una cookie
  (`lib/idioma.js`); ninguna página lo fija a mano.
- **Comentarios que explican por qué**, no qué. Si una línea es rara, el
  comentario dice qué pasa si se "arregla".
- **Nada de secretos en el repositorio.** Solo `.env.example`, con los nombres
  y los valores vacíos.
- **Fallar cerrado.** Sin `SITE_PASSWORD` el sitio no abre; sin `AUTH_SECRET`
  el back office no abre; sin `DATABASE_URL` la aplicación no arranca en
  producción. Es deliberado: una variable que falta no puede convertirse en un
  sitio público o en una base en memoria que se borra sola.

## La guía se mantiene con cada cambio

`docs/guia/{es,en,pt}.md` es la guía del cotizador que se ve en `/`. **Todo
cambio que altere cómo se cotiza, se vende o se usa la herramienta actualiza
los tres archivos en el mismo PR** y suma una fila arriba de todo en la tabla
"Versiones · Cotizador". Las versiones del catálogo se listan solas desde la
base.

- **Ninguna cifra a mano.** Importes, porcentajes, plazos y cupos van como
  marcadores (`{{minimo}}`, `{{tabla.bandas}}`) que resuelve
  `lib/guia/marcadores.js` con el catálogo publicado. Un marcador nuevo se
  agrega ahí.
- **Los tres idiomas dicen lo mismo**: mismos marcadores y mismas secciones.
  `tests/guia.test.mjs` lo verifica, junto con que no haya importes escritos a
  mano.
- **Nada de comisiones**, igual que en `/ventas`.

## Tests

```bash
npm test                               # 67 pruebas (14 se saltean sin servidor)
node --test tests/separacion.test.mjs  # 8, necesita el servidor levantado
```

Con el portero activo, el test necesita `SITE_PASSWORD` en el entorno; sin
ella falla en lugar de aprobar la página de `/acceso`.

El test más importante compara el motor actual contra una copia literal del
anterior sobre **39.744 combinaciones**. Ningún cambio puede mover un precio
sin que falle. Si falla después de un cambio al modelo comercial, es
intencional: actualizá la referencia a conciencia, no borres el test.

## Entorno local

```bash
npm install
cp .env.example .env.local      # completar DATABASE_URL
./scripts/dev-db.sh             # Postgres local, si hace falta
npm run db:migrate && npm run db:seed
npm run dev
```

PGlite sirve para los tests pero **no se puede compartir entre procesos**: si
el servidor y un script escriben a la vez, cada uno ve su propia copia. Para
desarrollar con el servidor levantado, usá un Postgres de verdad.

## Mapa

```
app/
  page.js            guía del cotizador (/) · lee docs/guia · sin comisiones
  ventas/            cotizador de vendedores · sin comisiones
  ventas/comision/   única ruta que importa el módulo de comisiones
  admin/catalogo/    back office del catálogo
  api/quote/         cotización del lado del servidor
  acceso/            portero provisorio por clave compartida
lib/
  pricebook/   schema · seed-v1 · diff · repo
  pricing/     engine · commissions · public-catalog
  guia/        marcadores · render · textos
  db.js  auth.js  i18n.js  idioma.js
db/migrations/  SQL numerado, se aplica en orden
docs/guia/      contenido de la guía, en es · en · pt
```

## Reglas del producto que el código hace cumplir

- Los equipos solo funcionan con un producto que los admita. Wizor 360
  **exige** equipamiento: sin sensores instalados no hay medición.
- Wizor 360 absorbe a Lens y Core; no se suman.
- Las organizaciones de neurodivergencia pagan **cero** (principio 4 del
  manifiesto) y se activan por solicitud, no por cobro.
- **Ni el tamaño de la empresa ni operar en varios países bloquean la
  contratación.** Son una recomendación en pantalla (`segment`), nunca una
  traba. Una multinacional elige país de contratación y cotiza sobre la
  dotación total.
- La preventa se reserva con **seña del 100% del equipamiento**, que se
  descuenta de la facturación. La plataforma se factura cuando la instalación
  está lista.
- El socio de negocio cobra por **escala marginal sobre el acumulado anual**.
  La escala plana anterior tenía una franja donde Wizor ganaba menos con una
  venta más grande; no se vuelve a eso.
- El programa fundador **no es** la preventa. Es un programa aparte, con cupos
  por país, y entrar lo decide Wizor.

## Desenlaces del checkout

`quote()` devuelve `checkout.mode`, y la pantalla obedece:

| modo | qué significa |
|---|---|
| `pay` | se cobra con Stripe |
| `deposit` | preventa: se cobra la seña |
| `request` | no hay nada que cobrar (tarifa cero) |
| `contact` | hace falta una propuesta |
| `incomplete` | falta equipamiento para un producto que lo exige |
| `none` | no eligió nada |
