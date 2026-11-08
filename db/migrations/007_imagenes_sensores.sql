-- ===========================================================================
-- 007_imagenes_sensores.sql — los sensores pasan a sus imágenes definitivas.
--
-- Mismo motivo que 004: las definitivas son JPG y el seed no pisa fichas ya
-- cargadas. Solo se toca cada fila si sigue apuntando al marcador provisorio.
-- ===========================================================================

update contenido_catalogo
   set imagen = '/img/catalogo/desk.jpg'
 where clave = 'desk'
   and imagen = '/img/catalogo/desk.svg';

update contenido_catalogo
   set imagen = '/img/catalogo/mach.jpg'
 where clave = 'mach'
   and imagen = '/img/catalogo/mach.svg';
