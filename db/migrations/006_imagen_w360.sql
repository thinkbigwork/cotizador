-- ===========================================================================
-- 006_imagen_w360.sql — la ficha de Wizor 360 pasa a su imagen definitiva.
--
-- Mismo motivo que 004: la definitiva es un JPG y el seed no pisa fichas ya
-- cargadas. Solo se toca la fila si sigue apuntando al marcador provisorio.
-- ===========================================================================

update contenido_catalogo
   set imagen = '/img/catalogo/w360.jpg'
 where clave = 'w360'
   and imagen = '/img/catalogo/w360.svg';
