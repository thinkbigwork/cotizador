/* ==========================================================================
   /api/quote — cotiza en el servidor.

   El modelo comercial no viaja al navegador: la pantalla manda la
   configuración y recibe números. Esta ruta NO importa el módulo de
   comisiones, a propósito.
   ========================================================================== */

import { NextResponse } from 'next/server';
import { getPublished } from '../../../lib/pricebook/repo.js';
import { quote } from '../../../lib/pricing/engine.js';

const LIMITS = {
  headcount: [1, 3_000_000],
  sites: [1, 500],
  countries: [1, 60],
  qty: [0, 100_000],
};

const clamp = (value, [min, max], fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 }); }

  const book = await getPublished();
  if (!book) return NextResponse.json({ error: 'No hay catálogo publicado.' }, { status: 503 });

  const selected = {};
  for (const p of book.model.products) selected[p.key] = Boolean(body?.selected?.[p.key]);

  const hardware = {};
  for (const h of book.model.hardware) hardware[h.key] = clamp(body?.hardware?.[h.key], LIMITS.qty, 0);

  const result = quote(book.model, {
    industry: typeof body?.industry === 'string' ? body.industry : '',
    headcount: clamp(body?.headcount, LIMITS.headcount, 10),
    sites: clamp(body?.sites, LIMITS.sites, 1),
    countries: clamp(body?.countries, LIMITS.countries, 1),
    selected,
    hardware,
  });

  return NextResponse.json(
    { ...result, priceBookVersion: book.version },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
