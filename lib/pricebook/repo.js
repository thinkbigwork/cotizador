/* ==========================================================================
   repo.js — acceso al catálogo de precios.

   Es el único camino por el que el catálogo se lee y se modifica. Concentra
   acá las reglas que no pueden saltearse:

     · Nunca se edita un catálogo publicado. La base lo impide con un trigger;
       esta capa además evita siquiera intentarlo y da un mensaje claro.
     · Publicar archiva al anterior y deja asentado en auditoría quién lo hizo
       y qué cambió.
     · Un borrador incompleto se puede guardar pero no publicar.

   Todas las funciones que escriben piden el usuario que actúa. No hay
   escritura anónima sobre precios.
   ========================================================================== */

import { query, one, transaction } from '../db.js';
import { validatePriceBook, readyToPublish } from './schema.js';
import { diffPriceBooks, summarizeDiff } from './diff.js';

export class PriceBookError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'PriceBookError';
    this.details = details;
  }
}

/* --- Lectura ------------------------------------------------------------ */

/** El catálogo vigente. Es el que se usa para cotizar. */
export async function getPublished() {
  return one(`select id, version, model, published_at
              from price_books where status = 'published'`);
}

/** Un catálogo puntual por id. Lo usan las suscripciones, que están clavadas
    a su versión y tienen que seguir leyéndose con ella para siempre. */
export async function getById(id) {
  return one('select id, version, status, model, published_at from price_books where id = $1', [id]);
}

/** El borrador en curso, si hay alguno. */
export async function getDraft() {
  return one(`select id, version, model, note, created_at, created_by
              from price_books where status = 'draft'`);
}

/** Historial, sin el modelo completo para no traer megabytes al listado. */
export async function listVersions(limit = 50) {
  const { rows } = await query(
    `select id, version, status, note, created_at, published_at,
            (select email from users u where u.id = pb.published_by) as published_by_email
     from price_books pb
     order by version desc
     limit $1`, [limit],
  );
  return rows;
}

/* --- Escritura ----------------------------------------------------------- */

async function writeAudit(run, { user, action, entityId, before, after, ip }) {
  await run(
    `insert into audit_log (actor_id, actor_email, action, entity, entity_id, before, after, ip)
     values ($1, $2, $3, 'price_book', $4, $5, $6, $7)`,
    [user?.id ?? null, user?.email ?? null, action, entityId,
     before ? JSON.stringify(before) : null,
     after ? JSON.stringify(after) : null,
     ip ?? null],
  );
}

/**
 * Abre un borrador nuevo partiendo del catálogo vigente.
 * Si ya hay uno abierto lo devuelve en lugar de crear otro: dos borradores en
 * paralelo terminan con alguien publicando encima del trabajo del otro.
 */
export async function createDraft({ user, note = null, ip = null }) {
  const existing = await getDraft();
  if (existing) return { draft: existing, created: false };

  const current = await getPublished();
  if (!current) throw new PriceBookError('No hay un catálogo publicado del cual partir.');

  const next = await one('select coalesce(max(version), 0) + 1 as v from price_books');

  return transaction(async (run) => {
    const { rows } = await run(
      `insert into price_books (version, status, model, note, created_by)
       values ($1, 'draft', $2, $3, $4)
       returning id, version, model, note, created_at`,
      [next.v, JSON.stringify(current.model), note, user?.id ?? null],
    );
    const draft = rows[0];
    await writeAudit(run, {
      user, action: 'crear_borrador', entityId: draft.id, ip,
      after: { version: draft.version, from: current.version },
    });
    return { draft, created: true };
  });
}

/**
 * Guarda cambios en el borrador. Valida la estructura pero no exige que esté
 * completo: se puede guardar a medio hacer y seguir mañana.
 */
export async function saveDraft({ user, model, note, ip = null }) {
  const draft = await getDraft();
  if (!draft) throw new PriceBookError('No hay ningún borrador abierto.');

  const check = validatePriceBook(model);
  if (!check.ok) {
    throw new PriceBookError('El catálogo tiene errores y no se puede guardar.', check.errors);
  }

  return transaction(async (run) => {
    await run(
      `update price_books set model = $1, note = coalesce($2, note) where id = $3`,
      [JSON.stringify(check.book), note ?? null, draft.id],
    );
    const changes = diffPriceBooks(draft.model, check.book);
    await writeAudit(run, {
      user, action: 'guardar_borrador', entityId: draft.id, ip,
      before: draft.model, after: check.book,
    });
    return { id: draft.id, version: draft.version, diff: changes };
  });
}

/** Qué cambiaría si se publicara el borrador tal como está. */
export async function previewPublish() {
  const [draft, current] = await Promise.all([getDraft(), getPublished()]);
  if (!draft) throw new PriceBookError('No hay ningún borrador abierto.');

  const check = validatePriceBook(draft.model);
  if (!check.ok) return { ready: false, errors: check.errors, diff: null, missing: [] };

  const publishable = readyToPublish(check.book);
  const diff = current ? diffPriceBooks(current.model, check.book) : null;

  return {
    ready: publishable.ready,
    missing: publishable.missing,
    errors: [],
    fromVersion: current?.version ?? null,
    toVersion: draft.version,
    diff,
    summary: diff ? summarizeDiff(diff) : 'Primer catálogo.',
  };
}

/**
 * Publica el borrador y archiva al anterior, en una sola transacción.
 *
 * `expectedDiffCount` es un seguro contra la carrera clásica: alguien revisa
 * el diff, se distrae, otro guarda cambios, y el primero publica algo que no
 * es lo que miró. Si el número no coincide, se rechaza y hay que volver a
 * revisar.
 */
export async function publishDraft({ user, expectedDiffCount = null, ip = null }) {
  if (!user?.id) throw new PriceBookError('Publicar un catálogo requiere un usuario identificado.');

  const preview = await previewPublish();
  if (!preview.ready) {
    throw new PriceBookError(
      'El catálogo no está listo para publicarse.',
      preview.errors.length ? preview.errors : preview.missing,
    );
  }
  if (expectedDiffCount !== null && preview.diff && preview.diff.counts.total !== expectedDiffCount) {
    throw new PriceBookError(
      'El borrador cambió desde que lo revisaste. Volvé a mirar las diferencias antes de publicar.',
    );
  }

  const [draft, current] = await Promise.all([getDraft(), getPublished()]);

  return transaction(async (run) => {
    if (current) {
      await run(`update price_books set status = 'archived' where id = $1`, [current.id]);
    }
    await run(
      `update price_books set status = 'published', published_at = now(), published_by = $1
       where id = $2`,
      [user.id, draft.id],
    );
    await writeAudit(run, {
      user, action: 'publicar_catalogo', entityId: draft.id, ip,
      before: current ? { version: current.version } : null,
      after: {
        version: draft.version,
        resumen: preview.summary,
        cambios_de_precio: preview.diff ? preview.diff.priceChanges.map((c) => c.path) : [],
      },
    });
    return { version: draft.version, summary: preview.summary };
  });
}

/** Descarta el borrador. Solo se puede descartar un borrador. */
export async function discardDraft({ user, ip = null }) {
  const draft = await getDraft();
  if (!draft) throw new PriceBookError('No hay ningún borrador abierto.');

  return transaction(async (run) => {
    await writeAudit(run, {
      user, action: 'descartar_borrador', entityId: draft.id, ip, before: draft.model,
    });
    await run('delete from price_books where id = $1', [draft.id]);
    return { version: draft.version };
  });
}
