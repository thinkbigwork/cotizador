import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Marca from '../Marca.jsx';
import SelectorIdioma from '../SelectorIdioma.jsx';
import { idiomaActual } from '../../lib/idioma.js';
import { TEXTOS_ACCESO as TEXTOS } from './textos.js';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: TEXTOS[await idiomaActual()].titulo, robots: { index: false } };
}

async function entrar(formData) {
  'use server';
  const clave = String(formData.get('clave') ?? '');
  const destino = String(formData.get('destino') || '/ventas');

  if (clave && clave === process.env.SITE_PASSWORD) {
    (await cookies()).set('wizor_acceso', clave, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect(destino.startsWith('/') ? destino : '/ventas');
  }
  redirect(`/acceso?error=1&destino=${encodeURIComponent(destino)}`);
}

export default async function AccesoPage({ searchParams }) {
  const params = await searchParams;
  const lang = await idiomaActual();
  const T = TEXTOS[lang];
  return (
    <main className="acceso">
      <form action={entrar}>
        <Marca rotulo={T.rotulo} />
        <p className="muted">{T.lema}</p>
        <input type="password" name="clave" placeholder={T.clave}
               autoComplete="current-password" autoFocus required />
        <input type="hidden" name="destino" value={params?.destino ?? '/ventas'} />
        {params?.error && <p className="err">{T.error}</p>}
        <button className="btn primary wide" type="submit">{T.entrar}</button>
        <div className="acceso-idioma">
          <SelectorIdioma lang={lang} ruta="/acceso" params={params} />
        </div>
      </form>
    </main>
  );
}
