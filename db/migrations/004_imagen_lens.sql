-- ===========================================================================
-- 004_imagen_lens.sql — la ficha de Wizor Lens pasa a su imagen definitiva.
--
-- Las imágenes provisorias eran SVG; las definitivas son fotos (JPG), así que
-- cambia la extensión y con ella la ruta guardada. El seed solo inserta fichas
-- que no existen, por eso las bases ya cargadas necesitan este cambio.
--
-- Solo se toca la fila si sigue apuntando al marcador provisorio: si alguien
-- ya cargó otra imagen a mano, se respeta.
-- ===========================================================================

update contenido_catalogo
   set imagen = '/img/catalogo/lens.jpg'
 where clave = 'lens'
   and imagen = '/img/catalogo/lens.svg';
