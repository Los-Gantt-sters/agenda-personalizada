-- ==============================================================================
-- SCRUM-260 · T-ADM.2 [Frontend/Backend] Pantallas 46 y 46b: menús y alergias por alumno (SCRUM-235)
-- Administración fija el tipo de menú y las alergias de cada alumno; la cocina (pantalla 54) las
-- usa para preparar el parte diario. El alumno del comedor solo anota quién falta.
--
-- 1. Tipos de menú: se renombra basal -> normal y se añaden sin_gluten, sin_lactosa y especial.
--    Quedan: normal, turmix (triturado líquido), texturizada (triturado con textura), cetogenica,
--    sin_gluten, sin_lactosa y especial.
-- 2. alergias: lista de alergias e intolerancias del alumno. Mezcla la lista fija de la app
--    (frutos_secos, huevo, marisco...) y las que el administrador escribe a mano.
-- 3. observaciones_cocina: nota libre para la cocina (por ejemplo «servir pan sin gluten precintado»).
--
-- Todavía no hay datos reales en uso, así que se cambia el modelo sin más.
-- ==============================================================================

ALTER TABLE public.alumnos
    DROP CONSTRAINT IF EXISTS alumnos_dieta_comedor_check;

UPDATE public.alumnos SET dieta_comedor = 'normal' WHERE dieta_comedor = 'basal';

ALTER TABLE public.alumnos
    ADD CONSTRAINT alumnos_dieta_comedor_check CHECK (
        dieta_comedor IN (
            'normal', 'turmix', 'texturizada', 'cetogenica', 'sin_gluten', 'sin_lactosa', 'especial'
        )
    ),
    ALTER COLUMN dieta_comedor SET DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS alergias TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS observaciones_cocina TEXT;
