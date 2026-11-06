# Wizor · Cotizador y back office

Aplicación Next.js sobre Postgres. Tres superficies previstas:

| Ruta | Qué es | Estado |
|---|---|---|
| `/ventas` | Cotizador de vendedores | funcionando |
| `/ventas/comision` | Comisión del vendedor, vista interna | funcionando |
| `/admin/catalogo` | Back office del catálogo de precios | funcionando |
| `/contratar` | Onboarding y cobro para clientes | pendiente · 10 de diciembre |

---

## Las dos reglas que gobiernan el diseño

**Un catálogo publicado es inmutable.** Para cambiar un precio se abre un
borrador, se revisan las diferencias y se publica una versión nueva. Lo impide
un trigger en la base, no solo la aplicación. Cada cotización y cada contrato
queda clavado a la versión con la que se emitió, así que subir precios mañana
no reprecia a nadie que ya firmó. Sin esto, el precio fijo por 36 meses del
programa fundador no se puede sostener.

**El modelo comercial no viaja al navegador.** Curvas de volumen, factores por
categoría, bandas y mínimo anual viven en el servidor. La pantalla manda la
configuración a `/api/quote` y recibe números.

Y una consecuencia de la primera: **las comisiones no están en el cotizador.**
No ocultas: ausentes. El vendedor puede estar mostrando la pantalla a un
cliente, y esconder una cifra con CSS la deja en el HTML. La comisión vive en
otra ruta. Hay un test que descarga la página y todos sus scripts y verifica
que no aparezca nada del módulo de comisiones.

---

## Desarrollo

```bash
npm install
cp .env.example .env.local      # completar DATABASE_URL
npm run db:migrate
npm run db:seed
npm run dev                     # http://localhost:3000
npm test
```

`scripts/dev-db.sh` levanta un Postgres local si hace falta.

---

## Despliegue en Vercel

1. **Importar el repositorio.** Next.js se detecta solo; no hay que tocar los
   comandos de build.

2. **Crear la base** desde Storage → Postgres. Vercel define `DATABASE_URL`
   sola.

3. **Cargar las variables** de `.env.example`:
   - `SITE_PASSWORD` — sin esto nadie entra. Es el portero provisorio hasta
     que exista el login por vendedor.
   - `AUTH_SECRET` — sin esto `/admin` no abre.

4. **Correr las migraciones** apuntando a la base de producción. A propósito
   no se corren solas en cada build: un despliegue de vista previa no debe
   tocar la base real.

   ```bash
   DATABASE_URL="<la de producción>" npm run db:migrate
   DATABASE_URL="<la de producción>" npm run db:seed
   ```

5. **Crear el primer usuario administrador:**

   ```sql
   insert into users (email, name, role)
   values ('mmendez@wizor.io', 'Martín Méndez', 'admin');
   ```

6. **Apuntar `quoter.wizor.io`** al proyecto desde Settings → Domains.

---

## Estructura

```
app/
  ventas/            cotizador de vendedores (sin comisiones)
  ventas/comision/   única ruta que importa el módulo de comisiones
  admin/catalogo/    back office del catálogo
  api/quote/         cotización del lado del servidor
  acceso/            portero provisorio
lib/
  pricebook/         esquema, semilla, diferencias, repositorio
  pricing/           motor, comisiones, catálogo público
  db.js  auth.js  i18n.js
db/migrations/       SQL, se aplican en orden
tests/               44 pruebas + 7 de separación de comisiones
```

## Tests

```bash
npm test                              # modelo, motor, catálogo, comisiones
node --test tests/separacion.test.mjs  # requiere el servidor levantado
```

Si el servidor tiene `SITE_PASSWORD`, pasásela al test (por ejemplo
`SITE_PASSWORD=... TEST_BASE_URL=http://localhost:3000 node --test tests/separacion.test.mjs`).
Sin la clave los pedidos terminan en `/acceso` y el test falla, a propósito.

La prueba más importante compara el motor actual contra una copia del anterior
sobre 39.744 combinaciones: ningún cambio de código puede mover un precio sin
que falle.
