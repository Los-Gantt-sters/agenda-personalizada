-- ==============================================================================
-- SCRUM-265 · T-AUTO.1 [Backend] Paso automático a Pendiente al expirar la duración (SCRUM-237)
--
-- Si termina la franja programada de una tarea y el alumno no ha pulsado «Terminar», la asignación
-- queda en estado 'pendiente' con pendiente_motivo = 'tiempo_agotado'. Con ese motivo, la agenda la
-- enseña en «Hecho» en ámbar y permite retomarla (pantalla 10b).
--
-- Reglas:
-- - Caducan las tareas en curso y también las pendientes que ni se empezaron, si tienen hora y la
--   tarea está activa.
-- - Una tarea retomada (en curso y con motivo) no vuelve a caducar: ya se le pasó su hora.
-- - Las horas de la agenda son las del centro (Europe/Madrid), aunque el servidor esté en UTC.
-- - La ejecución (hora real de inicio) no se toca.
-- - Si el tutor cambia la fecha o la hora de una tarea caducada, vuelve a ser una tarea normal.
--
-- IMPORTANTE: aplicar esta migración solo cuando el frontend de la 10b (SCRUM-264) esté en main. Sin
-- él, una tarea caducada se ve como una pendiente normal y vuelve a «Ahora».
-- ==============================================================================

ALTER TABLE public.asignaciones
    ADD COLUMN IF NOT EXISTS pendiente_motivo VARCHAR(20)
    CONSTRAINT asignaciones_pendiente_motivo_check
    CHECK (pendiente_motivo IN ('tiempo_agotado', 'profesor'));

COMMENT ON COLUMN public.asignaciones.pendiente_motivo IS
    'SCRUM-237: por qué la tarea se quedó a medias y se puede retomar (pantalla 10b).';

-- La revisión se hace cada minuto: solo mira las filas que todavía pueden caducar.
CREATE INDEX IF NOT EXISTS idx_asignaciones_por_caducar
    ON public.asignaciones (fecha)
    WHERE estado IN ('pendiente', 'en_curso') AND pendiente_motivo IS NULL;

-- Misma regla de duración para la agenda y para la caducidad.
CREATE OR REPLACE FUNCTION public.duracion_asignacion_min(
    p_inicio TIME,
    p_fin TIME,
    p_estimada INTEGER
)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
    SELECT CASE
        WHEN p_inicio IS NOT NULL AND p_fin IS NOT NULL AND p_fin > p_inicio
            THEN (EXTRACT(EPOCH FROM (p_fin - p_inicio)) / 60)::INTEGER
        ELSE p_estimada
    END;
$$;

-- ---- Regla de caducidad ------------------------------------------------------
-- Devuelve cuántas tareas ha marcado. Mira hoy y ayer (hora del centro): así cubre las franjas que
-- cruzan la medianoche y no modifica el histórico de días anteriores.
CREATE OR REPLACE FUNCTION public.caducar_tareas_agenda(p_ahora TIMESTAMPTZ DEFAULT now())
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    WITH caducadas AS (
        UPDATE public.asignaciones a
        SET estado = 'pendiente',
            pendiente_motivo = 'tiempo_agotado'
        FROM public.tareas t
        WHERE t.id = a.tarea_id
          AND t.activo
          AND a.estado IN ('pendiente', 'en_curso')
          AND a.pendiente_motivo IS NULL
          AND a.fecha BETWEEN (p_ahora AT TIME ZONE 'Europe/Madrid')::DATE - 1
                          AND (p_ahora AT TIME ZONE 'Europe/Madrid')::DATE
          AND COALESCE(a.hora_inicio, t.hora_inicio) IS NOT NULL
          AND (
              a.fecha
              + COALESCE(a.hora_inicio, t.hora_inicio)
              + make_interval(
                  mins => public.duracion_asignacion_min(
                      a.hora_inicio,
                      a.hora_fin,
                      t.duracion_estimada_minutos
                  )
              )
          ) AT TIME ZONE 'Europe/Madrid' <= p_ahora
        RETURNING a.id
    )
    SELECT count(*)::INTEGER FROM caducadas;
$$;

COMMENT ON FUNCTION public.caducar_tareas_agenda(TIMESTAMPTZ) IS
    'SCRUM-265: marca como pendientes por tiempo agotado las tareas cuya franja ha terminado sin «Terminar».';

-- Salta las políticas RLS, así que solo la ejecuta el dueño (la tarea programada).
REVOKE ALL ON FUNCTION public.caducar_tareas_agenda(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- ---- Reprogramar una tarea caducada la devuelve a la agenda normal ---------------
CREATE OR REPLACE FUNCTION public.limpiar_caducidad_al_reprogramar()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.pendiente_motivo = 'tiempo_agotado'
       AND NEW.pendiente_motivo IS NOT DISTINCT FROM OLD.pendiente_motivo THEN
        NEW.pendiente_motivo := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asignaciones_reprogramar ON public.asignaciones;
CREATE TRIGGER trg_asignaciones_reprogramar
    BEFORE UPDATE OF fecha, hora_inicio, hora_fin ON public.asignaciones
    FOR EACH ROW
    WHEN (
        OLD.fecha IS DISTINCT FROM NEW.fecha
        OR OLD.hora_inicio IS DISTINCT FROM NEW.hora_inicio
        OR OLD.hora_fin IS DISTINCT FROM NEW.hora_fin
    )
    EXECUTE FUNCTION public.limpiar_caducidad_al_reprogramar();

-- ---- La agenda recibe el motivo --------------------------------------------------
-- Cambia lo que devuelve la función, y eso obliga a borrarla y crearla de nuevo.
DROP FUNCTION IF EXISTS public.secuencia_dia(UUID, DATE);

CREATE FUNCTION public.secuencia_dia(p_estudiante UUID, p_fecha DATE)
RETURNS TABLE (
    id UUID,
    estudiante_id UUID,
    tarea_id UUID,
    fecha DATE,
    hora_inicio TIME,
    duracion_prevista_min INTEGER,
    orden INTEGER,
    estado TEXT,
    tarea JSONB,
    pendiente_motivo TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        a.id,
        a.estudiante_id,
        a.tarea_id,
        a.fecha,
        -- La hora de la asignación manda; si no tiene, la de la tarea
        COALESCE(a.hora_inicio, t.hora_inicio) AS hora_inicio,
        -- Si la asignación fija inicio y fin, la duración sale de ahí; si no, la estimada de la tarea
        public.duracion_asignacion_min(a.hora_inicio, a.hora_fin, t.duracion_estimada_minutos)
            AS duracion_prevista_min,
        a.orden,
        -- Estados del esquema → estados de la agenda (pendiente, en_curso, hecha, bloqueada)
        CASE a.estado
            WHEN 'hecho' THEN 'hecha'
            WHEN 'completada' THEN 'hecha'
            ELSE a.estado
        END AS estado,
        jsonb_build_object(
            'id', t.id,
            'titulo', t.titulo,
            'pictograma_url', t.pictograma_url,
            'descripcion', t.descripcion,
            'pasos', (
                SELECT COALESCE(
                    jsonb_agg(
                        jsonb_build_object(
                            'orden', p.orden,
                            'texto', p.texto,
                            'pictograma_url', p.imagen_url
                        )
                        ORDER BY p.orden
                    ),
                    '[]'::jsonb
                )
                FROM public.pasos_tarea p
                WHERE p.tarea_id = t.id
            )
        ) AS tarea,
        a.pendiente_motivo::TEXT AS pendiente_motivo
    FROM public.asignaciones a
    JOIN public.tareas t ON t.id = a.tarea_id
    WHERE a.estudiante_id = p_estudiante
      AND a.fecha = p_fecha
      AND a.estado <> 'cancelada'
      AND t.activo
    ORDER BY COALESCE(a.hora_inicio, t.hora_inicio) NULLS LAST, a.orden, a.id;
$$;

COMMENT ON FUNCTION public.secuencia_dia(UUID, DATE) IS
    'SCRUM-71 (RF4.1) y SCRUM-265: tareas del día de un estudiante en orden cronológico, con el formato EntradaAgenda de la agenda.';

REVOKE ALL ON FUNCTION public.secuencia_dia(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secuencia_dia(UUID, DATE) TO authenticated;

-- ---- Revisión cada minuto ----------------------------------------------------------
-- Supabase trae pg_cron. En un PostgreSQL sin él (supabase/tests) no se programa nada.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron no está disponible: la caducidad automática no queda programada.';
        RETURN;
    END IF;
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    -- Con nombre: si la migración se repite, actualiza la tarea programada en lugar de duplicarla.
    PERFORM cron.schedule(
        'caducar-tareas-agenda',
        '* * * * *',
        'SELECT public.caducar_tareas_agenda();'
    );
EXCEPTION WHEN OTHERS THEN
    -- El resto de la migración sigue siendo válido; se puede activar luego desde Supabase.
    RAISE WARNING 'No se pudo programar la caducidad automática: %', SQLERRM;
END $$;
