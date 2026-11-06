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
import { COOKIE_IDIOMA, idiomaValido } from './lib/idioma.js';

const COOKIE = 'wizor_acceso';

export function middleware(request) {
  /* Se lee antes de llamar al portero: seguir() escribe la cookie en el
     pedido, y después ya no se distingue si el navegador la tenía. */
  const lang = idiomaValido(request.nextUrl.searchParams.get('lang'));
  const cambia = lang && request.cookies.get(COOKIE_IDIOMA)?.value !== lang;
  const response = portero(request);
  if (cambia) recordarIdioma(response, lang);
  return response;
}

/* ?lang=xx cambia el idioma de todo el sitio. Se escribe en el pedido (para
   que esta misma página ya salga traducida) y en la respuesta (para los
   pedidos que siguen). Vale también para /acceso: se elige antes de entrar. */
function recordarIdioma(response, lang) {
  response.cookies.set(COOKIE_IDIOMA, lang, {
    path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
  });
}

function seguir(request) {
  const lang = idiomaValido(request.nextUrl.searchParams.get('lang'));
  if (!lang) return NextResponse.next();
  request.cookies.set(COOKIE_IDIOMA, lang);
  return NextResponse.next({ request: { headers: request.headers } });
}

function portero(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/acceso') || pathname.startsWith('/_next')
      || pathname === '/favicon.ico'
      /* El logo se ve en la propia pantalla de acceso. Es una ruta exacta, no
         un prefijo: no abre nada más de /public. */
      || pathname === '/logo-wizor.png') {
    return seguir(request);
  }

  const expected = process.env.SITE_PASSWORD;

  if (!expected) {
    if (process.env.NODE_ENV !== 'production') return seguir(request);
    return new NextResponse(
      'Este despliegue no tiene SITE_PASSWORD configurada, así que no se abre a nadie. '
      + 'Definila en las variables de entorno del proyecto.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (request.cookies.get(COOKIE)?.value === expected) return seguir(request);

  const url = request.nextUrl.clone();
  url.pathname = '/acceso';
  url.searchParams.set('destino', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
