-- Pruebas de progreso_alumno (SCRUM-145 · T-25.1, HU-25, pantalla 43).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000cc00', 'admin@progreso.es'),
    ('00000000-0000-0000-0000-00000000cc01', 'carmen@progreso.es'),
    ('00000000-0000-0000-0000-00000000cc02', 'otro.tutor@progreso.es'),
    ('00000000-0000-0000-0000-00000000cc03', 'madre@progreso.es'),
    ('00000000-0000-0000-0000-00000000cc04', 'otra.familia@progreso.es'),
    ('00000000-0000-0000-0000-00000000cc05', 'alumno@progreso.es');

INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000cc00', 'admin@progreso.es', 'Marta Soler', 'admin'),
    ('00000000-0000-0000-0000-00000000cc01', 'carmen@progreso.es', 'Carmen Ruiz', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000cc02', 'otro.tutor@progreso.es', 'Otro Tutor', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000cc03', 'madre@progreso.es', 'Madre de Alejandro', 'familiar'),
    ('00000000-0000-0000-0000-00000000cc04', 'otra.familia@progreso.es', 'Otra Familia', 'familiar'),
    ('00000000-0000-0000-0000-00000000cc05', 'alumno@progreso.es', 'Miriam', 'estudiante');

INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c4', 'CEE Purísima', 'PRUEBA-145');

INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000c4', 'Aula Triángulo',
     '00000000-0000-0000-0000-00000000cc01'),
    ('00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-0000000000c4', 'Aula Círculo',
     '00000000-0000-0000-0000-00000000cc02');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c4',
     '00000000-0000-0000-0000-0000000000a5', 'EXP-P145A', 'Alejandro');

INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo) VALUES
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000cc03', 'familiar');

-- t1 y t2 son de clase; t3, de casa; t4, de clase y desactivada después.
INSERT INTO public.tareas (id, alumno_id, titulo, ambito, hora_inicio, activo) VALUES
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 'Asamblea', 'centro', '09:00', true),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e1', 'Huerto', 'centro', NULL, true),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e1', 'Preparar la mochila', 'hogar', '19:00', true),
    ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000e1', 'Taller antiguo', 'centro', '12:00', false);

INSERT INTO public.asignaciones
    (id, estudiante_id, tarea_id, fecha, hora_inicio, orden, estado, pendiente_motivo, plan_b_activado)
SELECT ('00000000-0000-0000-0000-000000000' || v.id)::UUID,
       '00000000-0000-0000-0000-0000000000e1',
       ('00000000-0000-0000-0000-0000000000' || v.tarea)::UUID,
       v.fecha::DATE, v.hora::TIME, v.orden, v.estado, v.motivo, v.plan_b
FROM (VALUES
    -- Semana del 23 al 29 de noviembre
    ('d01', 'f1', '2026-11-23', NULL,    1, 'hecho',      NULL,             false), -- 09:00 de la tarea
    ('d02', 'f2', '2026-11-23', '11:30', 2, 'completada', NULL,             true),  -- Plan B
    ('d03', 'f3', '2026-11-23', NULL,    3, 'hecho',      NULL,             false), -- casa, 19:00
    ('d04', 'f1', '2026-11-24', NULL,    1, 'pendiente',  'tiempo_agotado', false), -- sin terminar
    ('d05', 'f2', '2026-11-24', '10:00', 2, 'en_curso',   NULL,             false),
    ('d06', 'f2', '2026-11-24', NULL,    3, 'bloqueada',  NULL,             false), -- sin hora: al final
    ('d07', 'f3', '2026-11-24', NULL,    4, 'pendiente',  NULL,             false),
    ('d08', 'f4', '2026-11-25', NULL,    1, 'hecho',      NULL,             false), -- tarea desactivada
    -- No cuentan
    ('d09', 'f1', '2026-11-25', NULL,    2, 'cancelada',  NULL,             false),
    ('d10', 'f1', '2026-11-22', NULL,    1, 'hecho',      NULL,             false), -- semana anterior
    ('d11', 'f1', '2026-11-30', NULL,    1, 'hecho',      NULL,             false)  -- semana siguiente
) AS v(id, tarea, fecha, hora, orden, estado, motivo, plan_b);

INSERT INTO public.ejecuciones (asignacion_id, estudiante_id, inicio, fin, valoracion_emocional)
SELECT ('00000000-0000-0000-0000-000000000' || v.id)::UUID,
       '00000000-0000-0000-0000-0000000000e1', v.inicio::TIMESTAMPTZ, v.fin::TIMESTAMPTZ, v.emocion
FROM (VALUES
    ('d01', '2026-11-23 09:01+01', '2026-11-23 09:20+01', 'contento'),
    ('d02', '2026-11-23 11:31+01', '2026-11-23 12:10+01', 'triste'),
    ('d03', '2026-11-23 19:02+01', '2026-11-23 19:15+01', 'contento'),
    ('d05', '2026-11-24 10:01+01', NULL,                  NULL),
    ('d10', '2026-11-22 09:00+01', '2026-11-22 09:20+01', 'triste')   -- fuera del periodo
) AS v(id, inicio, fin, emocion);

INSERT INTO public.avisos_peticiones (estudiante_id, necesidad, urgencia, atendido, creado_en) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'bano',     false, true,  '2026-11-24 10:30+01'),
    ('00000000-0000-0000-0000-0000000000e1', 'urgencia', true,  false, '2026-11-29 23:30+01'), -- domingo en Madrid
    ('00000000-0000-0000-0000-0000000000e1', 'agua',     false, true,  '2026-11-22 12:00+01'); -- fuera

-- En Supabase el rol authenticated ya tiene estos permisos; en un PostgreSQL normal no.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated; -- para auth.uid()

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    admin   CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc00';
    carmen  CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc01';
    otro    CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc02';
    madre   CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc03';
    otra    CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc04';
    alumno  CONSTANT TEXT := '00000000-0000-0000-0000-00000000cc05';
    alejandro CONSTANT UUID := '00000000-0000-0000-0000-0000000000e1';
    desde CONSTANT DATE := '2026-11-23';
    hasta CONSTANT DATE := '2026-11-29';
    p JSONB;
    titulos TEXT;
    quien TEXT;
BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claim.sub', admin, true);
    p := public.progreso_alumno(alejandro, desde, hasta);

    -- 1. Alumno y resumen: sin la cancelada ni las de fuera de la semana; la desactivada sí cuenta
    IF p->'resumen' <> '{"total": 8, "hechas": 4, "pendientes": 2, "en_curso": 1, "bloqueadas": 1,
                         "sin_terminar": 1, "planes_b": 1}'::JSONB THEN
        RAISE EXCEPTION 'FALLA resumen: %', p->'resumen';
    END IF;

    IF p->'alumno' <> '{"id": "00000000-0000-0000-0000-0000000000e1", "nombre": "Alejandro"}'::JSONB THEN
        RAISE EXCEPTION 'FALLA alumno: %', p->'alumno';
    END IF;

    -- 2. Emociones del periodo, de la más a la menos frecuente
    IF p->'emociones' <> '[{"emocion": "contento", "total": 2}, {"emocion": "triste", "total": 1}]'::JSONB THEN
        RAISE EXCEPTION 'FALLA emociones: %', p->'emociones';
    END IF;

    -- 3. Días con tareas, en orden
    IF p->'dias' <> '[{"fecha": "2026-11-23", "total": 3, "hechas": 3},
                      {"fecha": "2026-11-24", "total": 4, "hechas": 0},
                      {"fecha": "2026-11-25", "total": 1, "hechas": 1}]'::JSONB THEN
        RAISE EXCEPTION 'FALLA días: %', p->'dias';
    END IF;

    -- 4. Tabla en orden de día y hora (la de la asignación manda; sin hora, al final del día)
    SELECT string_agg(t->>'titulo' || ' ' || COALESCE(t->>'hora', '--'), ', ' ORDER BY n)
    INTO titulos
    FROM jsonb_array_elements(p->'tareas') WITH ORDINALITY AS x(t, n);
    IF titulos <> 'Asamblea 09:00, Huerto 11:30, Preparar la mochila 19:00, Asamblea 09:00, '
                  'Huerto 10:00, Preparar la mochila 19:00, Huerto --, Taller antiguo 12:00' THEN
        RAISE EXCEPTION 'FALLA orden de la tabla: %', titulos;
    END IF;

    -- 5. Cada fila trae estado traducido, ámbito, emoción, Plan B y horas reales
    IF (p->'tareas'->1) @> '{"estado": "hecha", "ambito": "centro", "emocion": "triste", "plan_b": true}'::JSONB IS NOT TRUE
       OR (p->'tareas'->1->>'inicio_real') IS NULL
       OR (p->'tareas'->3) @> '{"estado": "pendiente", "pendiente_motivo": "tiempo_agotado"}'::JSONB IS NOT TRUE
       OR (p->'tareas'->4->>'fin_real') IS NOT NULL THEN
        RAISE EXCEPTION 'FALLA campos de la tabla: % / % / %', p->'tareas'->1, p->'tareas'->3, p->'tareas'->4;
    END IF;

    -- 6. Avisos del periodo (por el día en Madrid), del más reciente al más antiguo
    IF jsonb_array_length(p->'avisos') <> 2
       OR p->'avisos'->0->>'necesidad' <> 'urgencia'
       OR p->'avisos'->1->>'necesidad' <> 'bano' THEN
        RAISE EXCEPTION 'FALLA avisos: %', p->'avisos';
    END IF;

    -- 7. El tutor ve todas las tareas, también las de casa
    PERFORM set_config('request.jwt.claim.sub', carmen, true);
    p := public.progreso_alumno(alejandro, desde, hasta);
    IF (p->'resumen'->>'total')::INT <> 8
       OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p->'tareas') t WHERE t->>'ambito' = 'hogar') THEN
        RAISE EXCEPTION 'FALLA tutor: %', p->'resumen';
    END IF;

    -- 8. La familia también ve todas, también las de clase, con sus emociones
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    p := public.progreso_alumno(alejandro, desde, hasta);
    IF (p->'resumen'->>'total')::INT <> 8
       OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p->'tareas') t WHERE t->>'ambito' = 'centro')
       OR p->'emociones' <> '[{"emocion": "contento", "total": 2}, {"emocion": "triste", "total": 1}]'::JSONB THEN
        RAISE EXCEPTION 'FALLA familia: % %', p->'resumen', p->'emociones';
    END IF;

    -- 9. Quien no supervisa al alumno no puede pedir su progreso
    FOREACH quien IN ARRAY ARRAY[otro, otra, alumno] LOOP
        PERFORM set_config('request.jwt.claim.sub', quien, true);
        BEGIN
            PERFORM public.progreso_alumno(alejandro, desde, hasta);
            RAISE EXCEPTION 'FALLA permisos: % ha visto el progreso de Alejandro', quien;
        EXCEPTION WHEN insufficient_privilege THEN NULL;
        END;
    END LOOP;

    -- 10. Periodos no válidos
    PERFORM set_config('request.jwt.claim.sub', admin, true);
    BEGIN
        PERFORM public.progreso_alumno(alejandro, hasta, desde);
        RAISE EXCEPTION 'FALLA periodo al revés aceptado';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
    BEGIN
        PERFORM public.progreso_alumno(alejandro, '2025-01-01', '2026-11-29');
        RAISE EXCEPTION 'FALLA periodo de casi dos años aceptado';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    -- 11. Un periodo sin tareas devuelve ceros y listas vacías
    p := public.progreso_alumno(alejandro, '2026-12-07', '2026-12-13');
    IF (p->'resumen'->>'total')::INT <> 0 OR p->'tareas' <> '[]'::JSONB OR p->'emociones' <> '[]'::JSONB
       OR p->'dias' <> '[]'::JSONB OR p->'avisos' <> '[]'::JSONB THEN
        RAISE EXCEPTION 'FALLA periodo vacío: %', p;
    END IF;

    -- 12. Desde la app sin sesión no se puede; desde el editor SQL de Supabase sí, y lo ve todo
    PERFORM set_config('request.jwt.claim.sub', '', true);
    BEGIN
        PERFORM public.progreso_alumno(alejandro, desde, hasta);
        RAISE EXCEPTION 'FALLA sin sesión: authenticated sin usuario ha visto el progreso';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    RESET ROLE;
    p := public.progreso_alumno(alejandro, desde, hasta);
    IF (p->'resumen'->>'total')::INT <> 8 THEN
        RAISE EXCEPTION 'FALLA editor SQL: %', p->'resumen';
    END IF;

    -- 13. El rol anon no puede ejecutarla
    IF has_function_privilege('anon', 'public.progreso_alumno(uuid, date, date)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALLA anon puede ejecutar progreso_alumno';
    END IF;

    RAISE NOTICE 'progreso_alumno: las 13 comprobaciones pasan';
END $$;

ROLLBACK;
