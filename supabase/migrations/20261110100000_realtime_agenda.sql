-- ==============================================================================
-- SCRUM-68 · HU-06 · Supabase Realtime para la agenda del día
-- RF4.7: la tableta del alumno se actualiza sin recargar cuando el tutor crea, modifica, bloquea o
-- borra tareas. src/servicios/agendaService.ts escucha estas tres tablas.
-- ==============================================================================

DO $$
DECLARE
    tabla TEXT;
BEGIN
    -- En un PostgreSQL sin Supabase (supabase/tests) la publicación no existe: no se hace nada.
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        RETURN;
    END IF;
    FOREACH tabla IN ARRAY ARRAY['asignaciones', 'tareas', 'pasos_tarea'] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tabla
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tabla);
        END IF;
    END LOOP;
END $$;

-- Para que los DELETE lleguen con todos los datos de la fila (el id y el estudiante).
ALTER TABLE public.asignaciones REPLICA IDENTITY FULL;
ALTER TABLE public.pasos_tarea REPLICA IDENTITY FULL;
