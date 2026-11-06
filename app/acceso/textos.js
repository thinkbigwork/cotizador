/* Textos de la pantalla de la clave. Aparte de page.js porque Next no deja
   exportar otra cosa que la página desde ese archivo, y el test de idiomas
   necesita leerlos. */

export const TEXTOS_ACCESO = {
  es: { titulo: 'Wizor · Acceso', rotulo: 'Cotizador', lema: 'Herramienta interna de vendedores y partners.',
        clave: 'Clave de acceso', error: 'Clave incorrecta.', entrar: 'Entrar' },
  en: { titulo: 'Wizor · Access', rotulo: 'Quoter', lema: 'Internal tool for Wizor sellers and partners.',
        clave: 'Access password', error: 'Wrong password.', entrar: 'Sign in' },
  pt: { titulo: 'Wizor · Acesso', rotulo: 'Cotador', lema: 'Ferramenta interna de vendedores e parceiros.',
        clave: 'Senha de acesso', error: 'Senha incorreta.', entrar: 'Entrar' },
};
