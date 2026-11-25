-- ==============================================================================
-- SCRUM-145 · T-25.1 [Backend] Consolidación estadística de cumplimiento de tareas (HU-25)
--
-- Devuelve, en una sola llamada, lo que necesita la pantalla 43 «Progreso e historial» (la misma
-- para tutor y familia) sobre un alumno y un periodo (un día, una semana o un mes):
--   alumno    → su id y su nombre, para el título de la pantalla.
--   resumen   → cuántas tareas hay y cuántas están hechas, pendientes, en curso, bloqueadas, sin
--               terminar a tiempo (caducadas, SCRUM-265) y con Plan B activado.
--   emociones → cuántas veces ha marcado cada emoción al terminar, de la más a la menos frecuente.
--   dias      → tareas y tareas hechas de cada día del periodo que tiene tareas (botón «Ver días»).
--   tareas    → la tabla: día, hora, título, ámbito (clase o casa), estado, emoción, Plan B y
--               horas reales de inicio y fin.
--   avisos    → lo que ha pedido en «Ayuda» (baño, agua, descanso, urgencia…) en el periodo.
--
-- Es una consulta: no copia nada, así que lo que pasa en la agenda se ve en el progreso al momento.
-- Mismos criterios que secuencia_dia: la hora de la asignación manda sobre la de la tarea, los
-- estados «hecho» y «completada» se devuelven como «hecha» y las canceladas no cuentan. Las tareas
-- desactivadas después sí cuentan: lo que hizo el alumno sigue siendo su historial.
--
-- Tutor y familia ven TODAS las tareas del alumno, de clase y de casa: los dos tienen que saber qué
-- hace en el colegio y en casa. Lo que no pueden es crear o cambiar tareas del otro ámbito, y eso lo
-- siguen controlando las políticas de escritura de «tareas». Como la política de lectura «Tareas:
-- Lectura segregada RGPD» solo deja ver a cada uno su ámbito (y la usan otras pantallas), la función
-- es SECURITY DEFINER y comprueba ella misma quién llama: administración, los tutores y especialistas
-- del alumno y su familia. Nadie más (tampoco otro alumno) puede pedir el progreso.
--
--   supabase.rpc("progreso_alumno", { p_estudiante, p_desde: "2026-11-23", p_hasta: "2026-11-29" })
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.progreso_alumno(p_estudiante UUID, p_desde DATE, p_hasta DATE)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    resultado JSONB;
BEGIN
    IF p_estudiante IS NULL OR p_desde IS NULL OR p_hasta IS NULL THEN
        RAISE EXCEPTION 'progreso_alumno: faltan el alumno o las fechas' USING ERRCODE = '22004';
    END IF;
    IF p_hasta < p_desde THEN
        RAISE EXCEPTION 'progreso_alumno: el periodo acaba antes de empezar' USING ERRCODE = '22023';
    END IF;
    IF p_hasta - p_desde > 366 THEN
        RAISE EXCEPTION 'progreso_alumno: el periodo no puede pasar de un año' USING ERRCODE = '22023';
    END IF;
    -- Solo quien supervisa al alumno. Sin sesión solo se deja al editor SQL de Supabase y a
    -- service_role: desde la app (rol authenticated o anon) siempre hay que tener sesión.
    IF auth.uid() IS NULL THEN
        IF current_setting('role', true) IN ('authenticated', 'anon') THEN
            RAISE EXCEPTION 'progreso_alumno: hace falta iniciar sesión' USING ERRCODE = '42501';
        END IF;
    ELSIF NOT (public.is_admin()
               OR public.is_tutor_docente_of_student(p_estudiante)
               OR public.is_familiar_of_student(p_estudiante)) THEN
        RAISE EXCEPTION 'progreso_alumno: no supervisas a este alumno' USING ERRCODE = '42501';
    END IF;

    WITH filas AS (
        SELECT
            a.id,
            a.fecha,
            COALESCE(a.hora_inicio, t.hora_inicio) AS hora,
            a.orden,
            t.titulo,
            t.pictograma_url,
            t.ambito,
            CASE a.estado
                WHEN 'hecho' THEN 'hecha'
                WHEN 'completada' THEN 'hecha'
                ELSE a.estado
            END AS estado,
            a.pendiente_motivo,
            COALESCE(a.plan_b_activado, false) AS plan_b,
            e.valoracion_emocional AS emocion,
            e.inicio AS inicio_real,
            e.fin AS fin_real
        FROM public.asignaciones a
        JOIN public.tareas t ON t.id = a.tarea_id
        LEFT JOIN public.ejecuciones e ON e.asignacion_id = a.id
        WHERE a.estudiante_id = p_estudiante
          AND a.fecha BETWEEN p_desde AND p_hasta
          AND a.estado <> 'cancelada'
    )
    SELECT jsonb_build_object(
        'alumno', (
            SELECT jsonb_build_object('id', al.id, 'nombre', al.nombre)
            FROM public.alumnos al
            WHERE al.id = p_estudiante
        ),
        'desde', p_desde,
        'hasta', p_hasta,
        'resumen', (
            SELECT jsonb_build_object(
                'total', count(*),
                'hechas', count(*) FILTER (WHERE estado = 'hecha'),
                'pendientes', count(*) FILTER (WHERE estado = 'pendiente'),
                'en_curso', count(*) FILTER (WHERE estado = 'en_curso'),
                'bloqueadas', count(*) FILTER (WHERE estado = 'bloqueada'),
                'sin_terminar', count(*) FILTER (
                    WHERE estado = 'pendiente' AND pendiente_motivo = 'tiempo_agotado'
                ),
                'planes_b', count(*) FILTER (WHERE plan_b)
            )
            FROM filas
        ),
        'emociones', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object('emocion', m.emocion, 'total', m.total)
                ORDER BY m.total DESC, m.emocion
            )
            FROM (
                SELECT emocion, count(*) AS total
                FROM filas
                WHERE emocion IS NOT NULL
                GROUP BY emocion
            ) m
        ), '[]'::jsonb),
        'dias', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object('fecha', d.fecha, 'total', d.total, 'hechas', d.hechas)
                ORDER BY d.fecha
            )
            FROM (
                SELECT fecha, count(*) AS total, count(*) FILTER (WHERE estado = 'hecha') AS hechas
                FROM filas
                GROUP BY fecha
            ) d
        ), '[]'::jsonb),
        'tareas', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', f.id,
                    'fecha', f.fecha,
                    'hora', to_char(f.hora, 'HH24:MI'),
                    'titulo', f.titulo,
                    'pictograma_url', f.pictograma_url,
                    'ambito', f.ambito,
                    'estado', f.estado,
                    'pendiente_motivo', f.pendiente_motivo,
                    'plan_b', f.plan_b,
                    'emocion', f.emocion,
                    'inicio_real', f.inicio_real,
                    'fin_real', f.fin_real
                )
                ORDER BY f.fecha, f.hora NULLS LAST, f.orden, f.id
            )
            FROM filas f
        ), '[]'::jsonb),
        'avisos', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', av.id,
                    'necesidad', av.necesidad,
                    'urgencia', av.urgencia,
                    'atendido', av.atendido,
                    'creado_en', av.creado_en
                )
                ORDER BY av.creado_en DESC
            )
            FROM public.avisos_peticiones av
            WHERE av.estudiante_id = p_estudiante
              AND (av.creado_en AT TIME ZONE 'Europe/Madrid')::DATE BETWEEN p_desde AND p_hasta
        ), '[]'::jsonb)
    )
    INTO resultado;

    RETURN resultado;
END;
$$;

COMMENT ON FUNCTION public.progreso_alumno(UUID, DATE, DATE) IS
    'SCRUM-145 (HU-25): progreso de un alumno en un periodo para la pantalla 43 (alumno, resumen, emociones, días, tareas y avisos).';

-- Supabase da EXECUTE a anon en las funciones nuevas: hay que quitárselo aparte de PUBLIC.
REVOKE ALL ON FUNCTION public.progreso_alumno(UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.progreso_alumno(UUID, DATE, DATE) TO authenticated;
