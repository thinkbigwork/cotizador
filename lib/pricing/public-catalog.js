/* ==========================================================================
   public-catalog.js — qué parte del catálogo puede ver un navegador.

   El catálogo completo contiene el modelo comercial: curvas de volumen,
   factores por categoría, bandas y mínimo anual. Eso no sale del servidor.

   Lo que sí necesita la pantalla para dibujarse son nombres, precios de
   equipamiento y qué productos existen. Esta función arma exactamente ese
   recorte y nada más. Hay un test que recorre el resultado buscando
   cualquier constante del modelo.
   ========================================================================== */

import { activeProducts, activeHardware } from './engine.js';

/**
 * @param {object} book      catálogo de precios publicado
 * @param {object} [fichas]  contenido de las fichas, por clave (lib/contenido)
 */
export function publicCatalog(book, fichas = {}) {
  /* La ficha es material de marketing: imagen, resumen y características.
     No revela nada de cómo se calcula el precio, así que puede viajar. */
  const ficha = (clave) => {
    const f = fichas[clave];
    if (!f) return null;
    return { imagen: f.imagen, borrador: f.borrador, textos: f.textos };
  };

  return {
    products: activeProducts(book).map((p) => ({
      key: p.key,
      name: p.name,
      order: p.order,
      onlineMode: p.onlineMode,
      preOrder: p.preOrder,
      supportsHardware: p.supportsHardware,
      requiresHardware: p.requiresHardware,
      deliversIndex: p.deliversIndex,
      absorbs: p.absorbs,
      waitlistNote: p.waitlistNote,
      ficha: ficha(p.key),
    })),

    hardware: activeHardware(book).map((h) => ({
      key: h.key,
      name: h.name,
      group: h.group,
      order: h.order,
      price: h.price,            // se muestra en pantalla, es público
      spec: h.spec,
      preOrder: h.preOrder,
      deliveryNote: h.deliveryNote,
      ficha: ficha(h.key),
    })),

    industries: Object.keys(book.industries),

    contract: book.contract,

    /* Nada de curvas, factores, bandas, mínimo anual ni comisiones. */
  };
}
