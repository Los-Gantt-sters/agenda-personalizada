-- ==============================================================================
-- SCRUM-71 · T-06.3 [Backend] Secuencia cronológica de las tareas del día (HU-06)
-- RF4.1: la agenda muestra las tareas del día en orden cronológico.
-- RI4.1: entrada de agenda (estudiante, tarea, fecha, hora de inicio, duración, orden y estado).
--
-- Devuelve las asignaciones de un estudiante para una fecha, sin las canceladas ni las de tareas
-- desactivadas, ordenadas por hora de inicio (las que no tienen hora, al final) y por orden.
-- Cada fila tiene el mismo formato que EntradaAgenda de la agenda (src/componentes/agenda/tipos.ts),
-- con la tarea y sus pasos anidados, para poder usarla con:
--   supabase.rpc("secuencia_dia", { p_estudiante: estudianteId, p_fecha: fecha })
--
-- SECURITY INVOKER: se ejecuta con los permisos de quien la llama, así que respeta las políticas
-- RLS de asignaciones, tareas y pasos_tarea; no da acceso a nada que no se pudiera leer ya.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.secuencia_dia(p_estudiante UUID, p_fecha DATE)
RETURNS TABLE (
    id UUID,
    estudiante_id UUID,
    tarea_id UUID,
    fecha DATE,
    hora_inicio TIME,
    duracion_prevista_min INTEGER,
    orden INTEGER,
    estado TEXT,
    tarea JSONB
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
        CASE
            WHEN a.hora_inicio IS NOT NULL AND a.hora_fin IS NOT NULL AND a.hora_fin > a.hora_inicio
                THEN (EXTRACT(EPOCH FROM (a.hora_fin - a.hora_inicio)) / 60)::INTEGER
            ELSE t.duracion_estimada_minutos
        END AS duracion_prevista_min,
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
        ) AS tarea
    FROM public.asignaciones a
    JOIN public.tareas t ON t.id = a.tarea_id
    WHERE a.estudiante_id = p_estudiante
      AND a.fecha = p_fecha
      AND a.estado <> 'cancelada'
      AND t.activo
    ORDER BY COALESCE(a.hora_inicio, t.hora_inicio) NULLS LAST, a.orden, a.id;
$$;

COMMENT ON FUNCTION public.secuencia_dia(UUID, DATE) IS
    'SCRUM-71 (RF4.1): tareas del día de un estudiante en orden cronológico, con el formato EntradaAgenda de la agenda.';

-- Solo la usan usuarios con sesión; las políticas RLS deciden qué filas ve cada uno
REVOKE ALL ON FUNCTION public.secuencia_dia(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secuencia_dia(UUID, DATE) TO authenticated;
