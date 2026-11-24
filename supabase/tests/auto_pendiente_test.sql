-- Pruebas de la caducidad automática de tareas (SCRUM-265 · T-AUTO.1, SCRUM-237).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c2', 'CEE Purísima', 'PRUEBA-02');

INSERT INTO public.aulas (id, centro_id, nombre)
VALUES ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c2', 'Aula Círculo');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre)
VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-0000000000c2',
        '00000000-0000-0000-0000-0000000000a2', 'EXP-T011', 'Marcos');

INSERT INTO public.tareas (id, titulo, duracion_estimada_minutos, hora_inicio, activo) VALUES
    ('00000000-0000-0000-0000-0000000000f1', 'Sin hora propia', 30, NULL, true),
    ('00000000-0000-0000-0000-0000000000f2', 'Con hora propia', 30, '09:00', true),
    ('00000000-0000-0000-0000-0000000000f3', 'Desactivada', 30, NULL, false);

INSERT INTO public.asignaciones
    (id, estudiante_id, tarea_id, fecha, hora_inicio, hora_fin, orden, estado, pendiente_motivo)
SELECT ('00000000-0000-0000-0000-000000000' || v.id)::UUID,
       '00000000-0000-0000-0000-000000000011',
       ('00000000-0000-0000-0000-0000000000' || v.tarea)::UUID,
       v.fecha::DATE, v.inicio::TIME, v.fin::TIME, 1, v.estado, v.motivo
FROM (VALUES
    -- Caducan a las 10:00 del 12/11
    ('b01', 'f1', '2026-11-12', '09:00', '09:30', 'pendiente', NULL),   -- sin empezar
    ('b02', 'f1', '2026-11-12', '09:30', NULL,    'en_curso',  NULL),   -- acaba justo a las 10:00
    ('b09', 'f2', '2026-11-12', NULL,    NULL,    'pendiente', NULL),   -- hora heredada de la tarea
    ('b12', 'f1', '2026-11-11', '23:50', '23:55', 'pendiente', NULL),   -- de ayer
    -- No caducan
    ('b03', 'f1', '2026-11-12', '09:45', '10:01', 'pendiente', NULL),   -- aún le queda un minuto
    ('b04', 'f1', '2026-11-12', '08:00', '08:30', 'hecho',     NULL),
    ('b05', 'f1', '2026-11-12', '08:00', '08:30', 'bloqueada', NULL),
    ('b06', 'f1', '2026-11-12', '08:00', '08:30', 'cancelada', NULL),
    ('b07', 'f1', '2026-11-12', NULL,    NULL,    'pendiente', NULL),   -- sin hora
    ('b08', 'f1', '2026-11-12', '08:00', '08:30', 'en_curso',  'tiempo_agotado'), -- retomada
    ('b10', 'f1', '2026-11-12', '08:00', '08:30', 'pendiente', 'profesor'),
    ('b11', 'f1', '2026-11-10', '09:00', '09:30', 'pendiente', NULL),   -- histórico
    ('b13', 'f3', '2026-11-12', '08:00', '08:30', 'pendiente', NULL),   -- tarea desactivada
    -- Horario de verano
    ('b14', 'f1', '2026-07-01', '09:00', '09:30', 'pendiente', NULL)
) AS v(id, tarea, fecha, inicio, fin, estado, motivo);

INSERT INTO public.ejecuciones (asignacion_id, estudiante_id, inicio)
VALUES ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000011',
        '2026-11-12 09:31:00+01');

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    diez CONSTANT TIMESTAMPTZ := '2026-11-12 10:00:00+01';
    marcados INTEGER;
    filas TEXT[];
    r RECORD;
BEGIN
    -- 1. Justo antes del final de la franja de b02 no caduca
    SELECT public.caducar_tareas_agenda(diez - INTERVAL '1 second') INTO marcados;
    IF marcados <> 3 OR (SELECT estado FROM public.asignaciones WHERE id::TEXT LIKE '%b02') <> 'en_curso' THEN
        RAISE EXCEPTION 'FALLA antes de acabar: % marcadas', marcados;
    END IF;

    -- 2. A la hora exacta caduca y solo quedaba esa
    SELECT public.caducar_tareas_agenda(diez) INTO marcados;
    IF marcados <> 1 THEN RAISE EXCEPTION 'FALLA a la hora exacta: % marcadas', marcados; END IF;

    -- 3. Caducan las que tocan, pasan a pendiente y llevan el motivo
    SELECT array_agg(right(id::TEXT, 3) ORDER BY id) INTO filas
    FROM public.asignaciones
    WHERE estado = 'pendiente' AND pendiente_motivo = 'tiempo_agotado';
    IF filas IS DISTINCT FROM ARRAY['b01', 'b02', 'b09', 'b12'] THEN
        RAISE EXCEPTION 'FALLA tareas caducadas: %', filas;
    END IF;

    -- 4. Repetir la revisión no cambia nada
    SELECT public.caducar_tareas_agenda(diez) INTO marcados;
    IF marcados <> 0 THEN RAISE EXCEPTION 'FALLA repetir: % marcadas', marcados; END IF;

    -- 5. No se tocan las hechas, bloqueadas, canceladas, sin hora, retomadas, del profesor,
    --    del histórico ni las de tareas desactivadas
    SELECT array_agg(right(id::TEXT, 3) || ':' || estado || ':' || COALESCE(pendiente_motivo, '-') ORDER BY id)
    INTO filas FROM public.asignaciones
    WHERE right(id::TEXT, 3) IN ('b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b10', 'b11', 'b13');
    IF filas IS DISTINCT FROM ARRAY[
        'b03:pendiente:-', 'b04:hecho:-', 'b05:bloqueada:-', 'b06:cancelada:-', 'b07:pendiente:-',
        'b08:en_curso:tiempo_agotado', 'b10:pendiente:profesor', 'b11:pendiente:-', 'b13:pendiente:-'
    ] THEN
        RAISE EXCEPTION 'FALLA tareas que no debían cambiar: %', filas;
    END IF;

    -- 6. La caducidad no toca la hora real de inicio
    IF (SELECT inicio FROM public.ejecuciones WHERE asignacion_id::TEXT LIKE '%b02')
       IS DISTINCT FROM '2026-11-12 09:31:00+01'::TIMESTAMPTZ THEN
        RAISE EXCEPTION 'FALLA ejecución conservada';
    END IF;

    -- 7. Usa la hora del centro también en verano (09:30 en Madrid = 07:30 UTC)
    IF public.caducar_tareas_agenda('2026-07-01 07:29:59+00') <> 0
       OR public.caducar_tareas_agenda('2026-07-01 07:30:00+00') <> 1 THEN
        RAISE EXCEPTION 'FALLA zona horaria';
    END IF;

    -- 8. La agenda recibe el motivo
    SELECT * INTO r FROM public.secuencia_dia('00000000-0000-0000-0000-000000000011', '2026-11-12') s
    WHERE s.id::TEXT LIKE '%b02';
    IF r.estado <> 'pendiente' OR r.pendiente_motivo <> 'tiempo_agotado' THEN
        RAISE EXCEPTION 'FALLA secuencia_dia: % / %', r.estado, r.pendiente_motivo;
    END IF;

    -- 9. Cambiar la hora devuelve la tarea a la agenda normal; otros cambios no
    UPDATE public.asignaciones SET hora_inicio = '11:00', hora_fin = '11:30' WHERE id::TEXT LIKE '%b01';
    UPDATE public.asignaciones SET orden = 5 WHERE id::TEXT LIKE '%b12';
    UPDATE public.asignaciones SET hora_inicio = '12:00', hora_fin = '12:30' WHERE id::TEXT LIKE '%b10';
    IF (SELECT pendiente_motivo FROM public.asignaciones WHERE id::TEXT LIKE '%b01') IS NOT NULL
       OR (SELECT pendiente_motivo FROM public.asignaciones WHERE id::TEXT LIKE '%b12') <> 'tiempo_agotado'
       OR (SELECT pendiente_motivo FROM public.asignaciones WHERE id::TEXT LIKE '%b10') <> 'profesor' THEN
        RAISE EXCEPTION 'FALLA reprogramar';
    END IF;

    -- 10. Solo se aceptan los motivos previstos
    BEGIN
        UPDATE public.asignaciones SET pendiente_motivo = 'otro' WHERE id::TEXT LIKE '%b03';
        RAISE EXCEPTION 'FALLA motivo no válido aceptado';
    EXCEPTION WHEN check_violation THEN NULL;
    END;

    -- 11. Permisos: nadie con sesión puede lanzar la caducidad, pero sí leer la agenda
    IF has_function_privilege('authenticated', 'public.caducar_tareas_agenda(timestamptz)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.caducar_tareas_agenda(timestamptz)', 'EXECUTE')
       OR NOT has_function_privilege('authenticated', 'public.secuencia_dia(uuid, date)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALLA permisos de ejecución';
    END IF;

    RAISE NOTICE 'auto_pendiente: las 11 comprobaciones pasan';
END $$;

ROLLBACK;
