import './globals.css';

export const metadata = {
  title: 'Wizor · Back office',
  description: 'Administración interna del catálogo comercial de Wizor.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
