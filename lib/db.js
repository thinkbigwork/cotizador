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

/** Ejecuta varias sentencias en una transacción. */
export async function transaction(fn) {
  const driver = await getDriver();
  await driver.run('begin');
  try {
    const result = await fn((text, params) => driver.run(text, params));
    await driver.run('commit');
    return result;
  } catch (error) {
    await driver.run('rollback');
    throw error;
  }
}

/** Varias sentencias en un solo texto, sin parámetros. Para migraciones. */
export async function exec(sql) {
  const driver = await getDriver();
  /* pg acepta varias sentencias en una query simple; pglite necesita exec(). */
  if (driver.kind === 'pglite') return pglite.exec(sql);
  return driver.run(sql);
}
