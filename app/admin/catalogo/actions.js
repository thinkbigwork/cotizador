'use server';

/* Acciones del editor de catálogo. Cada una identifica al usuario y deja
   registro en auditoría a través del repositorio: no hay forma de cambiar un
   precio sin que quede asentado quién lo hizo. */

import { revalidatePath } from 'next/cache';
import { requireRole } from '../../../lib/auth.js';
import * as repo from '../../../lib/pricebook/repo.js';

const RUTA = '/admin/catalogo';

async function run(fn) {
  try {
    const user = await requireRole('admin');
    const result = await fn(user);
    revalidatePath(RUTA);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, message: error.message, details: error.details ?? null };
  }
}

export async function abrirBorrador() {
  return run((user) => repo.createDraft({ user }));
}

export async function publicar(formData) {
  const expected = Number(formData.get('diffCount'));
  return run((user) => repo.publishDraft({
    user,
    expectedDiffCount: Number.isFinite(expected) ? expected : null,
  }));
}

export async function descartar() {
  return run((user) => repo.discardDraft({ user }));
}
