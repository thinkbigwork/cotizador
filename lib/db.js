/* ==========================================================================
   db.js — acceso a Postgres.

   En producción (Vercel) se conecta por DATABASE_URL con un pool. En
   desarrollo y en los tests, si no hay DATABASE_URL, levanta un Postgres en
   proceso con PGlite: mismas consultas, sin instalar nada.
   ========================================================================== */

let pool = null;
let pglite = null;

async function getDriver() {
  if (process.env.DATABASE_URL) {
    if (!pool) {
      const { Pool } = await import('pg');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 10_000,
        /* Vercel Postgres y Neon exigen TLS. */
        /* Vercel Postgres y Neon exigen TLS; una base local, no. */
        ssl: /(^|@|\/\/)(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL)
          ? false : { rejectUnauthorized: true },
      });
    }
    return { kind: 'pg', run: (text, params) => pool.query(text, params) };
  }

  /* Sin DATABASE_URL en producción no se sigue: el respaldo en memoria
     perdería todo en cada despliegue y nadie se enteraría hasta que
     desaparezca una cotización. */
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Falta DATABASE_URL. Configurá la base de datos en las variables de entorno del proyecto.',
    );
  }

  if (!pglite) {
    const { PGlite } = await import('@electric-sql/pglite');
    pglite = await PGlite.create(process.env.PGLITE_DIR || undefined);
  }
  return { kind: 'pglite', run: (text, params) => pglite.query(text, params) };
}

/** Ejecuta una consulta parametrizada. Nunca concatenar valores en el texto. */
export async function query(text, params = []) {
  const driver = await getDriver();
  return driver.run(text, params);
}

/** Primera fila, o null. */
export async function one(text, params = []) {
  const { rows } = await query(text, params);
  return rows[0] ?? null;
}

/**
 * Ejecuta varias sentencias en una transacción.
 *
 * Todas las sentencias tienen que ir por la MISMA conexión. Con el pool de
 * pg, cada pool.query() puede salir por una conexión distinta: un `begin`
 * por una y un `commit` por otra no forman una transacción. Así,
 * publishDraft podía archivar el catálogo vigente sin publicar el nuevo, y
 * dejar sin cotizar a /ventas. Además dejaba una conexión del pool con una
 * transacción abierta, que se "tragaba" las consultas siguientes. Por eso
 * acá se toma un cliente dedicado y no se vuelve a usar driver.run().
 */
export async function transaction(fn) {
  const driver = await getDriver();

  if (driver.kind === 'pglite') {
    /* PGlite tiene una sola conexión, pero el servidor de desarrollo atiende
       pedidos concurrentes: su transaction() los encola en vez de dejar que
       se mezclen con un begin abierto. */
    return pglite.transaction((tx) => fn((text, params) => tx.query(text, params)));
  }

  const client = await pool.connect();
  let broken = null;
  try {
    await client.query('begin');
    const result = await fn((text, params) => client.query(text, params));
    await client.query('commit');
    return result;
  } catch (error) {
    try {
      await client.query('rollback');
    } catch (rollbackError) {
      /* Si ni el rollback anda, la conexión quedó en un estado desconocido:
         se descarta en lugar de devolverla al pool. */
      broken = rollbackError;
    }
    throw error;
  } finally {
    client.release(broken ?? undefined);
  }
}

/** Varias sentencias en un solo texto, sin parámetros. Para migraciones. */
export async function exec(sql) {
  const driver = await getDriver();
  /* pg acepta varias sentencias en una query simple; pglite necesita exec(). */
  if (driver.kind === 'pglite') return pglite.exec(sql);
  return driver.run(sql);
}
