-- ==============================================================================
-- SCRUM-259 · T-ADM.1 [Frontend/Backend] Pantalla 48b: configurar aulas y clases (SCRUM-235)
-- El administrador personaliza el nombre y el icono de cada aula, que se ven en la pantalla 01
-- (el alumno elige su clase) y en la 35 (el tutor elige clase). Puede haber más de 9 aulas.
--
-- 1. icono_forma deja de ser solo triangulo/circulo/cuadrado: admite cualquier forma
--    (estrella, rombo, hexagono...). Ya era un VARCHAR sin restricción CHECK; se amplía el tamaño.
-- 2. icono_url: pictograma de ARASAAC o imagen propia del aula (opcional). Si tiene valor,
--    las pantallas 01 y 35 enseñan esa imagen en lugar de la forma.
-- 3. orden: posición del aula en las pantallas 01 y 35 (páginas de 9 aulas).
--
-- Las políticas RLS de aulas no cambian: todos los usuarios autenticados las leen y solo
-- las modifican los administradores.
-- ==============================================================================

ALTER TABLE public.aulas
    ADD COLUMN IF NOT EXISTS icono_url TEXT,
    ADD COLUMN IF NOT EXISTS orden INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.aulas
    ALTER COLUMN icono_forma TYPE VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_aulas_orden ON public.aulas (centro_id, orden);
