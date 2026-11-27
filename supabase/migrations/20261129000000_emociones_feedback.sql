-- ==============================================================================
-- SCRUM-136 · T-21.2 [Backend] Registro del estado de ánimo vinculado a la tarea (HU-21)
-- Pantallas 09 y 09b: «¿Cómo te has sentido?» con Contento, Tranquilo, Cansado, Triste y Enfadado.
--
-- La respuesta se guarda en ejecuciones.valoracion_emocional (una por asignación, así queda unida a
-- la tarea). La columna solo admitía las 3 caritas del esquema inicial: se añaden las que faltan y
-- se conservan las anteriores para no invalidar los datos que ya hay.
-- ==============================================================================

ALTER TABLE public.ejecuciones DROP CONSTRAINT IF EXISTS ejecuciones_valoracion_emocional_check;
ALTER TABLE public.ejecuciones ADD CONSTRAINT ejecuciones_valoracion_emocional_check CHECK (
    valoracion_emocional IN (
        'contento', 'tranquilo', 'cansado', 'triste', 'enfadado',
        'neutral', 'bien', 'regular', 'mal'
    )
);

COMMENT ON COLUMN public.ejecuciones.valoracion_emocional IS
    'SCRUM-136 (HU-21): cómo se sintió el alumno al terminar la tarea (pantalla 09).';
