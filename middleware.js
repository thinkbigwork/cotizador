/* ==========================================================================
   middleware.js — portero del sitio.

   Hasta que exista el login por vendedor, quoter.wizor.io no puede quedar
   abierto: es una herramienta interna. Este portero pide una clave
   compartida, guardada en SITE_PASSWORD.

   FALLA CERRADO. En producción, si SITE_PASSWORD no está configurada, no
   entra nadie. Es a propósito: un despliegue sin la variable no debe
   convertirse en un sitio público por accidente.

   Es una medida provisoria. No distingue un vendedor de otro ni permite
   revocar a una persona sola; eso llega con el login real.
   ========================================================================== */

import { NextResponse } from 'next/server';

const COOKIE = 'wizor_acceso';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/acceso') || pathname.startsWith('/_next')
      || pathname === '/favicon.ico'
      /* El logo se ve en la propia pantalla de acceso. Es una ruta exacta, no
         un prefijo: no abre nada más de /public. */
      || pathname === '/logo-wizor.png') {
    return NextResponse.next();
  }

  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    return new NextResponse(
      'Este despliegue no tiene SITE_PASSWORD configurada, así que no se abre a nadie. '
      + 'Definila en las variables de entorno del proyecto.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (request.cookies.get(COOKIE)?.value === expected) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/acceso';
  url.searchParams.set('destino', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
