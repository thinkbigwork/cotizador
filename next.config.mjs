/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ['pg', '@electric-sql/pglite'],
  poweredByHeader: false,
  /* La guía (/) lee docs/guia/*.md en cada pedido. Sin esto, Vercel no
     empaqueta esos archivos con la función y la página falla en producción. */
  outputFileTracingIncludes: {
    '/': ['./docs/guia/*.md'],
  },
};
