-- ==============================================================================
-- SCRUM-225 · [HU-08] requiere_inicio_fin en asignaciones y horas reales en secuencia_dia
--
-- 1. RF6.8: guarda si una tarea pide pulsar «Empezar» antes de «Terminar». Por defecto, true: en el
--    prototipo todas las tareas empiezan con «Empezar tarea» (pantalla 06) y la app ya lo hace así
--    (necesitaEmpezar en src/componentes/agenda/logica.ts). Solo con false se va directa a «Terminar».
--    Con DEFAULT false, todas las tareas dejarían de pedir «Empezar».
-- 2. RI6.1: secuencia_dia devuelve también la hora real de inicio y de fin (tabla ejecuciones).
--    Así, al recargar la agenda con una tarea empezada se sigue viendo «Empezaste a las…».
--
-- Parte de la versión de secuencia_dia de 20261123100000_auto_pendiente.sql (SCRUM-265) y solo
-- añade columnas al final: lo demás (orden, filtros, estados, duración, pasos y pendiente_motivo)
-- queda igual.
-- ==============================================================================

ALTER TABLE public.asignaciones
    ADD COLUMN IF NOT EXISTS requiere_inicio_fin BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.asignaciones.requiere_inicio_fin IS
    'SCRUM-225 (RF6.8): true (por defecto) = el alumno pulsa «Empezar» antes de «Terminar»; false = va directo a «Terminar».';

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
    pendiente_motivo TEXT,
    requiere_inicio_fin BOOLEAN,
    inicio_real TIMESTAMPTZ,
    fin_real TIMESTAMPTZ
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
        a.pendiente_motivo::TEXT AS pendiente_motivo,
        a.requiere_inicio_fin,
        -- RI6.1: horas reales de «Empezar» y «Terminar». ejecuciones.asignacion_id es UNIQUE, así que
        -- el LEFT JOIN no repite filas; si la tarea no se ha empezado, salen NULL.
        e.inicio AS inicio_real,
        e.fin AS fin_real
    FROM public.asignaciones a
    JOIN public.tareas t ON t.id = a.tarea_id
    LEFT JOIN public.ejecuciones e ON e.asignacion_id = a.id
    WHERE a.estudiante_id = p_estudiante
      AND a.fecha = p_fecha
      AND a.estado <> 'cancelada'
      AND t.activo
    ORDER BY COALESCE(a.hora_inicio, t.hora_inicio) NULLS LAST, a.orden, a.id;
$$;

COMMENT ON FUNCTION public.secuencia_dia(UUID, DATE) IS
    'SCRUM-71 (RF4.1), SCRUM-265 y SCRUM-225: tareas del día de un estudiante en orden cronológico, con el formato EntradaAgenda de la agenda.';

REVOKE ALL ON FUNCTION public.secuencia_dia(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secuencia_dia(UUID, DATE) TO authenticated;
