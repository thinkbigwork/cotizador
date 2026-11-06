/* ==========================================================================
   auth.js — quién está usando el back office.

   Todavía no está conectado el proveedor de identidad definitivo. Hasta que
   lo esté, esta capa FALLA CERRADA: en producción, sin proveedor configurado,
   el back office no deja entrar a nadie. Es deliberado — un panel que cambia
   precios no puede quedar abierto por un descuido de configuración.

   En desarrollo usa el usuario administrador sembrado en la base, para poder
   trabajar sin montar el login todavía.
   ========================================================================== */

import { one } from './db.js';

export class AuthError extends Error {
  constructor(message) { super(message); this.name = 'AuthError'; }
}

const isProduction = () => process.env.NODE_ENV === 'production';
const hasProvider = () => Boolean(process.env.AUTH_SECRET);

/**
 * Usuario de la sesión actual.
 * @throws {AuthError} si no hay forma seria de identificarlo.
 */
export async function currentUser() {
  if (isProduction() && !hasProvider()) {
    throw new AuthError(
      'El back office no tiene autenticación configurada y no puede abrirse en producción. '
      + 'Falta definir AUTH_SECRET y conectar el proveedor de identidad.',
    );
  }

  if (!isProduction()) {
    const dev = await one(
      `select id, email, name, role from users where active and role = 'admin'
       order by created_at limit 1`);
    if (!dev) throw new AuthError('No hay ningún usuario administrador en la base. Corré db:seed.');
    return { ...dev, devSession: true };
  }

  /* TODO: leer la sesión real del proveedor y buscar el usuario por email. */
  throw new AuthError('Sesión no válida.');
}

/**
 * ¿Entró con la clave compartida del sitio (SITE_PASSWORD)?
 *
 * Mientras el cotizador está en prueba y solo lo usa el equipo interno, esta
 * clave alcanza para ver /ventas/comision. NO alcanza para el back office:
 * publicar precios exige un usuario identificado (requireRole).
 *
 * El middleware ya hace esta misma comprobación, pero la página la repite: si
 * alguien cambia el matcher del middleware, la comisión no puede quedar
 * abierta por arrastre. Falla cerrado igual que el portero: en producción,
 * sin SITE_PASSWORD, no entra nadie.
 */
export async function accesoConClave() {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return !isProduction();
  const { cookies } = await import('next/headers');
  return (await cookies()).get('wizor_acceso')?.value === expected;
}

/** Exige un rol determinado. */
export async function requireRole(...roles) {
  const user = await currentUser();
  if (!roles.includes(user.role)) {
    throw new AuthError(`Esta acción requiere el rol ${roles.join(' o ')}.`);
  }
  return user;
}
