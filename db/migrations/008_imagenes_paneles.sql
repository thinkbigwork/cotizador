-- ===========================================================================
-- 008_imagenes_paneles.sql — los Paneles de Control pasan a sus imágenes
-- definitivas.
--
-- Mismo motivo que 004: las definitivas son JPG y el seed no pisa fichas ya
-- cargadas. Solo se toca cada fila si sigue apuntando al marcador provisorio.
-- ===========================================================================

update contenido_catalogo
   set imagen = '/img/catalogo/panel_start.jpg'
 where clave = 'panel_start'
   and imagen = '/img/catalogo/panel_start.svg';

update contenido_catalogo
   set imagen = '/img/catalogo/panel_pro.jpg'
 where clave = 'panel_pro'
   and imagen = '/img/catalogo/panel_pro.svg';

update contenido_catalogo
   set imagen = '/img/catalogo/panel_expert.jpg'
 where clave = 'panel_expert'
   and imagen = '/img/catalogo/panel_expert.svg';
