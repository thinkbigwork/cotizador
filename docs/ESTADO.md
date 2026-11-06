# Estado del proyecto

Última actualización: 6 de noviembre de 2026.
Lanzamiento público de la contratación automática: **10 de diciembre de 2026.**

---

## Hecho

**Modelo de datos.** 12 tablas. Las garantías están en el motor de Postgres,
no solo en la aplicación: un catálogo publicado no se puede editar ni borrar,
no puede haber dos vigentes, no puede haber dos borradores. Probadas una por
una.

**Catálogo de precios versionado.** Documento JSON validado en dos niveles:
estructura y coherencia (`validatePriceBook`) y listo-para-publicar
(`readyToPublish`). Contiene curvas, factores, bandas, mínimo anual, productos,
equipamiento en dos familias, programas y comisiones.

**Motor de precios dirigido por datos.** Mismos resultados que el cotizador
anterior sobre 39.744 combinaciones. Resuelve además el desenlace del checkout.

**Comisiones.** Escala marginal sobre el acumulado anual para el socio,
porcentaje fijo para los demás roles, y la regla de absorción.

**Back office del catálogo** (`/admin/catalogo`): abrir borrador, ver las
diferencias clasificadas por impacto, publicar, descartar, historial y
auditoría de quién cambió qué.

**Cotizador de vendedores** (`/ventas`) con modo presentación, y la comisión
en ruta aparte (`/ventas/comision`).

**Portero provisorio** por clave compartida, que falla cerrado. Mientras el
cotizador está en prueba con el equipo interno, la clave alcanza para
`/ventas` y `/ventas/comision` (la comisión no muestra nombre). El back office
sigue exigiendo un usuario identificado y no abre en producción.

**Guía del cotizador** en `/`, en español, inglés y portugués. El contenido
está en `docs/guia/*.md` y las cifras salen del catálogo publicado. Incluye
una sección de versiones: las del catálogo se listan solas y las del
cotizador se agregan con cada PR. Es interna y muestra el modelo comercial
completo, por decisión de Wizor.

**Todo el sitio en tres idiomas**: guía, cotizador, comisión, acceso y back
office. El idioma elegido queda en una cookie y vale para todas las pantallas.
Los mensajes de validación del catálogo y de autenticación (`lib/`) siguen en
español.

63 tests en verde (55 sin servidor más 8 de separación).

---

## Lo que falta

### Para que el equipo lo use ya

1. **Login por vendedor.** Hoy hay una clave compartida para todo el sitio. No
   distingue personas ni permite revocar a una sola. El back office falla
   cerrado sin `AUTH_SECRET`, pero no hay login real.
2. **Formularios de edición en el back office.** El ciclo de vida del catálogo
   funciona, pero los valores se cambian por código. Faltan las pantallas de
   productos, equipamiento, curvas, categorías, programas y comisiones.
3. **Gestión de vendedores y códigos de atribución.** La tabla existe
   (`attribution_codes`), las pantallas no.

### Para el 10 de diciembre

4. **Onboarding guiado para clientes** (`/contratar`).
5. **Stripe**: checkout, cobro de señas, webhooks con idempotencia
   (`stripe_events` ya está), impuestos y registro de aceptación del plazo de
   12 meses.
6. **Landing** con los tres accesos. La raíz hoy es la guía interna, que
   muestra el modelo comercial: la landing pública no puede reemplazarla sin
   antes mover o recortar la guía.
7. **Bandeja de solicitudes** (`requests`): preventa, sin cargo y demo.
8. **API de alta de cuentas.** Wizor la tiene prevista para fines de noviembre.
   Hasta entonces el pago deja un pendiente en `provisioning_jobs` que alguien
   resuelve a mano.

---

## Decisiones abiertas

Ninguna bloquea el trabajo, pero todas necesitan que Wizor las confirme.

| Tema | Estado |
|---|---|
| Texto bajo las miniaturas de Wizor Credits (`crF` en `i18n.js`) | **Lo redactó Claude, sin confirmar.** Describe cómo se aplica el crédito. Es una afirmación comercial. |
| Wizor 360 sin equipamiento | Se bloquea la contratación (`checkout.mode = incomplete`). Deriva de que sin sensores instalados el servicio no funciona, pero no está confirmado que no exista el caso de una empresa con equipos previos. |
| Paneles de Control | Se pueden comprar varios del mismo tipo y no son excluyentes entre sí. Decisión por defecto. |
| Plazo de alta tras el pago | La pantalla de confirmación tiene que prometer un plazo concreto, porque el alta es manual hasta que exista la API. Falta definir cuál. |
| Programa fundador: cupos y cierre | El catálogo dice **10 cupos por país** y sin fecha de cierre (`seatsPerCountry`, `activeUntil: null`). El cotizador (`fP` y `fS` en `i18n.js`) dice "Diez organizaciones" y "cierra en 2026". La guía sigue al catálogo. Falta confirmar cuál vale. |
| Facturación local | Wizor planea registrarse en México, Brasil y Uruguay, y ya puede facturar desde Argentina. Hoy todo se cobra desde la INC de EEUU vía Stripe. |

### Fuera de alcance

**Sensa** — dispositivo para hogares de personas neurodivergentes,
desarrollado con Aspika. Preventa exclusiva para 1.000 familias en Estados
Unidos, entrega a 12 meses.

Es otro negocio: producto físico de compra única, para familias y no empresas,
con tope geográfico y de unidades. No entra en un modelo construido sobre
suscripción por persona, curvas de volumen y categorías de riesgo. **Va por un
camino paralelo**, reutilizando la cuenta de Stripe, la base y el back office,
pero con su propio embudo. Decisión de Wizor: no mezclarlo.

---

## Despliegue

Vercel + Neon Postgres, en `quoter.wizor.io`. El paso a paso está en el README.

Dos trampas conocidas: la variable tiene que llamarse exactamente
`DATABASE_URL` (Neon a veces la crea como `POSTGRES_URL`), y las migraciones
hay que correrlas contra la conexión **directa** (`DATABASE_URL_UNPOOLED`),
porque la agrupada rompe la creación de triggers.

Las migraciones **no** corren solas en cada build, a propósito: un despliegue
de vista previa no debe tocar la base de producción.
