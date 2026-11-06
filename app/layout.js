import { Montserrat } from 'next/font/google';
import './globals.css';

/* La tipografía de sales.wizor.io. next/font la descarga al compilar y la
   sirve desde este mismo dominio: el navegador no le pide nada a Google, y la
   pantalla de acceso no depende de un tercero para verse bien. Los pesos son
   los que usa el sitio de referencia (400 a 900). */
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-montserrat',
});

export const metadata = {
  title: 'Wizor · Back office',
  description: 'Administración interna del catálogo comercial de Wizor.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
