-- ===========================================================================
-- 005_imagen_core.sql — la ficha de Wizor Core pasa a su imagen definitiva.
--
-- Mismo motivo que 004: la definitiva es un JPG y el seed no pisa fichas ya
-- cargadas. Solo se toca la fila si sigue apuntando al marcador provisorio.
-- ===========================================================================

update contenido_catalogo
   set imagen = '/img/catalogo/core.jpg'
 where clave = 'core'
   and imagen = '/img/catalogo/core.svg';
