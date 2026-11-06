/* Textos de la barra de /ventas. Viven acá y no en lib/i18n.js a propósito:
   i18n.js viaja al navegador con el cotizador, y el rótulo del link a la
   comisión no puede estar en ese paquete. Esta página es de servidor, así que
   estas cadenas solo llegan al HTML cuando se muestran (nunca en modo
   presentación). */

export const TEXTOS_VENTAS = {
  es: {
    titulo: 'Wizor · Cotizador', rotulo: 'Cotizador', guia: 'Guía',
    presentacion: 'Modo presentación', salir: 'Salir del modo presentación',
    miComision: 'Mi comisión', sinCatalogo: 'No hay un catálogo publicado todavía.',
  },
  en: {
    titulo: 'Wizor · Quoter', rotulo: 'Quoter', guia: 'Guide',
    presentacion: 'Presentation mode', salir: 'Exit presentation mode',
    miComision: 'My commission', sinCatalogo: 'There is no published price book yet.',
  },
  pt: {
    titulo: 'Wizor · Cotador', rotulo: 'Cotador', guia: 'Guia',
    presentacion: 'Modo apresentação', salir: 'Sair do modo apresentação',
    miComision: 'Minha comissão', sinCatalogo: 'Ainda não há uma tabela de preços publicada.',
  },
};
