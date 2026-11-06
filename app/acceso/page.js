import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Marca from '../Marca.jsx';

export const metadata = { title: 'Wizor · Acceso', robots: { index: false } };
export const dynamic = 'force-dynamic';

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
  return (
    <main className="acceso">
      <form action={entrar}>
        <Marca rotulo="Cotizador" />
        <p className="muted">Herramienta interna de vendedores y partners.</p>
        <input type="password" name="clave" placeholder="Clave de acceso"
               autoComplete="current-password" autoFocus required />
        <input type="hidden" name="destino" value={params?.destino ?? '/ventas'} />
        {params?.error && <p className="err">Clave incorrecta.</p>}
        <button className="btn primary wide" type="submit">Entrar</button>
      </form>
    </main>
  );
}
