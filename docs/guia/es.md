# Guía del cotizador

Todo lo que hace falta para cotizar Wizor sin dudas. Las cifras de esta guía salen del catálogo vigente (**{{catalogo.version}}**, publicado el {{catalogo.fecha}}) y se actualizan solas cuando se publica uno nuevo.

Uso interno del equipo Wizor.

## Qué es el cotizador

Es la herramienta con la que el equipo arma el precio de Wizor para una organización, en el momento y sin planillas.

- **`/ventas`** · el cotizador. Se puede mostrar al cliente: tiene un **modo presentación** que oculta todo lo interno.
- **`/ventas/comision`** · la comisión de quien vende. Se abre en otra pestaña y nunca aparece en el cotizador ni en esta guía.
- **`/admin/catalogo`** · el back office donde Wizor cambia precios.

**Idioma.** Todas las pantallas están en español, inglés y portugués. El selector **ES · EN · PT** está arriba en cada una, y lo que elijas vale para todo el sitio. En el modo presentación también se ve, por si el cliente necesita la pantalla en su idioma.

## Cómo funciona

1. Se carga la organización: **actividad**, **cantidad de personas**, **establecimientos** y **países**.
2. Se eligen los **productos** y, si corresponde, los **dispositivos**.
3. La pantalla manda esos datos al servidor, que calcula con el catálogo vigente y devuelve el precio. El modelo de precios nunca viaja al navegador.
4. El cotizador muestra el precio anual, el precio por persona por mes, el primer año (plataforma + dispositivos) y cómo se cierra la venta:

{{tabla.desenlaces}}

**El precio queda fijado a la versión del catálogo.** Cada cotización y cada contrato guardan la versión con la que se emitieron. Si mañana se suben los precios, nadie que ya firmó se reprecia.

## De dónde salen los números

El precio anual depende de tres cosas: **la actividad, la cantidad de personas y el producto**.

### 1 · La actividad define un factor

Como una aseguradora con su alícuota: más riesgo, más tarifa. Wizor Lens no aplica este factor; Core y 360 sí.

{{tabla.categorias}}

### 2 · Hasta {{autoservicio.max}} personas: banda cerrada

El precio anual sale de una tabla por tramos de dotación, multiplicada por el producto (Lens ×1, Core ×2, 360 ×3) y por el factor de actividad. Estas bandas **no** tienen mínimo anual.

{{tabla.bandas}}

Los valores de la tabla son antes del factor de actividad.

### 3 · Más de {{autoservicio.max}} personas: tarifa por tramo

Cada persona paga la tarifa base del producto, que baja por tramos de volumen. Es **marginal**: cada tramo paga su propio porcentaje, como el impuesto a las ganancias, así que sumar personas nunca hace saltar el precio.

{{tabla.curvas}}

Precio anual = suma de los tramos × 12 × factor de actividad. Si el resultado es menor que **{{minimo}}**, se cobra ese mínimo anual.

### Casos resueltos

Calculados por el mismo motor que usa el cotizador:

{{tabla.ejemplos}}

Todos los valores son de lista, en dólares y sin impuestos (IVA, TAX o equivalente según el país).

## Tamaño de la empresa

El cotizador recomienda un canal según el tamaño y los países. **Es una recomendación, nunca una traba**: cualquier empresa puede contratar sola si quiere.

{{tabla.canales}}

**Multinacionales.** Eligen un país de contratación y cotizan sobre la **dotación total**: el volumen de todos los países define el tramo, y cada país mantiene el instrumento que exige su norma.

**Organizaciones de neurodivergencia.** Pagan **cero** (principio 4 del manifiesto). No hay cobro: se activan por solicitud.

## Productos

{{tabla.productos}}

{{productos.descripciones}}

**Wizor 360 absorbe a Lens y Core**: si se elige 360, los otros no se suman. Cuando hay varios productos, el de mayor nivel define los informes y los usuarios incluidos.

### Dispositivos

Se compran una vez, sin abono mensual, y **solo funcionan con un producto que los admita**. Wizor 360 los **exige**: sin sensores instalados no hay medición.

{{tabla.equipos}}

- **Smart Desktop:** dispositivo fijo para espacios cerrados; se puede usar una o varias unidades por ambiente. Conectar y listo, completamente silencioso. Mide aire, COV, ruido, temperatura, luz y vibraciones, 24/7.
- **Paneles de control:** el centro de monitoreo. Fatiga, estrés y calidad del aire en tiempo real: más de 200 variables, latencia menor a 1 segundo, en la nube o en las instalaciones del cliente, con análisis predictivo.


**Fichas.** Cada servicio y cada equipo tiene una miniatura y un botón *Ver detalle* que abren una
ficha al costado, con imagen, descripción y características. El panel entra por la
izquierda a propósito: el total queda a la vista mientras se explica el producto.
Con la tecla Escape o un clic afuera se cierra.

El contenido de las fichas no vive en el catálogo de precios sino en su propia
tabla, porque corregir una descripción no debería obligar a publicar una versión
nueva del catálogo. Una ficha sin revisar se muestra marcada como provisoria.

## Preventa y seña

**En preventa hoy:** {{preventa.productos}}, y los dispositivos {{preventa.equipos}}.

{{preventa.entrega}}

Un producto en preventa se muestra con su precio, pero no se cobra el abono: se **reserva con una seña**.

{{seña.reglas}}

- ¿Se descuenta de la facturación? **{{seña.descuenta}}**
- ¿Es reembolsable? **{{seña.reembolsable}}**
- La plataforma se factura recién cuando la instalación está lista.

## Cómo se vende

1. **Cotizar con el cliente.** Abrí `/ventas` y activá el **modo presentación** si vas a mostrar la pantalla. La comisión está en otra pestaña; nunca la tengas abierta al lado.
2. **Seguir el canal sugerido.** Autoservicio: el cliente contrata solo. Con acompañamiento: demo de 30 minutos con su dotación y establecimientos reales. Propuesta: oferta consolidada por país.
3. **Cerrar según el desenlace** que muestra el cotizador (pago, seña, solicitud o propuesta).
4. **Dejar la cotización por escrito.** *Descargar PDF* pide el nombre de la empresa y arma un documento de tres páginas: portada y servicios, dispositivos y paneles, y resumen de la inversión. Lo elegido se destaca y lo demás aparece atenuado.

**Contrato:** {{contrato.meses}} meses, facturación {{contrato.facturacion}}. Una cotización vale {{contrato.validez}} días.

**Actividad que no está en la lista.** El cotizador no calcula: el cliente describe su actividad y Wizor responde con una tarifa.

### Programa fundador

**No es la preventa.** Es un programa aparte para empresas pioneras que co-desarrollan con Wizor. Hay **{{fundador.cupos}} cupos por país** y entrar lo decide Wizor.

{{fundador.beneficios}}

Niveles de Wizor Credits: {{fundador.creditos}}.

## Versiones

### Catálogo de precios

Se actualiza solo con cada publicación desde el back office.

{{versiones.catalogo}}

### Cotizador

| Fecha | Cambio |
|---|---|
| 8 nov 2026 | La cotización en PDF es un documento propio de tres páginas, con el nombre de la empresa en la portada, lo elegido destacado y textos legibles en papel (#16). |
| 8 nov 2026 | Wizor Lens se describe como lo que es: solo evaluación de riesgo psicosocial. Antes mencionaba también ergonomía y riesgo biológico (#9). |
| 8 nov 2026 | Los servicios muestran la misma miniatura que los equipos: un clic en la imagen abre su ficha (#8). |
| 8 nov 2026 | Cada servicio y cada equipo tiene su ficha: imagen, descripción y características, en un panel que se abre al costado sin tapar el total. El contenido se edita aparte del catálogo de precios. |
| 6 nov 2026 | El logo lleva a la guía desde cualquier pantalla (#7). |
| 6 nov 2026 | Todo el sitio en español, inglés y portugués: cotizador, comisión, acceso y back office. El idioma elegido vale para todas las pantallas (#6). |
| 6 nov 2026 | Guía del cotizador en la página de inicio, en español, inglés y portugués, con esta sección de versiones. |
| 6 nov 2026 | Tipografía, logo y colores de sales.wizor.io (#4). |
| 6 nov 2026 | La comisión se ve con la clave compartida durante la etapa de prueba (#3). |
| 6 nov 2026 | Corrección: publicar un catálogo ya no puede dejar el sitio sin precios si falla a mitad de camino (#2). |
| 6 nov 2026 | Despliegue en quoter.wizor.io (Vercel + Neon). |
| 5 nov 2026 | Actualización de seguridad de React Server Components (#1). |
| 5 nov 2026 | Lanzamiento: catálogo versionado, motor de precios, cotizador, comisión en ruta aparte y back office. |

{{version.despliegue}}
