-- Pruebas de 20261128100000_agenda_compartida_y_franjas.sql (SCRUM-144, HU-25).
-- Tutor y familia ven la agenda completa; el tutor pone tareas de 08:00 a 15:00 y la familia de
-- 15:00 a 08:00. Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error «FALLA …» que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000dd00', 'admin@franjas.es'),
    ('00000000-0000-0000-0000-00000000dd01', 'carmen@franjas.es'),
    ('00000000-0000-0000-0000-00000000dd02', 'otro.tutor@franjas.es'),
    ('00000000-0000-0000-0000-00000000dd03', 'madre@franjas.es'),
    ('00000000-0000-0000-0000-00000000dd04', 'otra.familia@franjas.es');

INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000dd00', 'admin@franjas.es', 'Marta Soler', 'admin'),
    ('00000000-0000-0000-0000-00000000dd01', 'carmen@franjas.es', 'Carmen Ruiz', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000dd02', 'otro.tutor@franjas.es', 'Otro Tutor', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000dd03', 'madre@franjas.es', 'Madre de Alejandro', 'familiar'),
    ('00000000-0000-0000-0000-00000000dd04', 'otra.familia@franjas.es', 'Otra Familia', 'familiar');

INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c5', 'CEE Purísima', 'PRUEBA-144');

INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-0000000000c5', 'Aula Triángulo',
     '00000000-0000-0000-0000-00000000dd01'),
    ('00000000-0000-0000-0000-0000000000a8', '00000000-0000-0000-0000-0000000000c5', 'Aula Círculo',
     '00000000-0000-0000-0000-00000000dd02');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c5',
     '00000000-0000-0000-0000-0000000000a7', 'EXP-F144A', 'Alejandro');

INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo) VALUES
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000dd03', 'familiar');

-- e1: de clase; e2: de casa; e3: del catálogo común (sin alumno), de clase y sin hora;
-- e4: de casa y sin hora. Todas duran 30 minutos.
INSERT INTO public.tareas (id, alumno_id, titulo, ambito, hora_inicio, duracion_estimada_minutos) VALUES
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', 'Asamblea', 'centro', '09:00', 30),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f1', 'Preparar la mochila', 'hogar', '19:00', 30),
    ('00000000-0000-0000-0000-0000000000e3', NULL, 'Recreo', 'centro', NULL, 30),
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000f1', 'Leer un cuento', 'hogar', NULL, 30);

-- Agenda del 23/11 puesta desde el editor SQL (sin sesión: sin límite de horario).
-- b01 es del tutor (mañana) y b02 de la familia (tarde).
INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, fecha, hora_inicio, hora_fin, orden) VALUES
    ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-0000000000f1',
     '00000000-0000-0000-0000-0000000000e1', '2026-11-23', '09:00', '09:30', 1),
    ('00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-0000000000f1',
     '00000000-0000-0000-0000-0000000000e2', '2026-11-23', '19:00', '19:30', 2),
    ('00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-0000000000f1',
     '00000000-0000-0000-0000-0000000000e3', '2026-11-23', '11:00', '11:30', 3);

-- En Supabase el rol authenticated ya tiene estos permisos; en un PostgreSQL normal no.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated; -- para auth.uid()

-- ---- Comprobaciones ---------------------------------------------------------
-- Cada intento que debe fallar va en su propio BEGIN … EXCEPTION: si la base lo deja pasar, se
-- lanza un «FALLA» (que no es insufficient_privilege y por tanto no se captura).
DO $$
DECLARE
    admin     CONSTANT TEXT := '00000000-0000-0000-0000-00000000dd00';
    carmen    CONSTANT TEXT := '00000000-0000-0000-0000-00000000dd01';
    otro      CONSTANT TEXT := '00000000-0000-0000-0000-00000000dd02';
    madre     CONSTANT TEXT := '00000000-0000-0000-0000-00000000dd03';
    otra      CONSTANT TEXT := '00000000-0000-0000-0000-00000000dd04';
    alejandro CONSTANT UUID := '00000000-0000-0000-0000-0000000000f1';
    clase     CONSTANT UUID := '00000000-0000-0000-0000-0000000000e1';
    casa      CONSTANT UUID := '00000000-0000-0000-0000-0000000000e2';
    catalogo  CONSTANT UUID := '00000000-0000-0000-0000-0000000000e3';
    casa_sin_hora CONSTANT UUID := '00000000-0000-0000-0000-0000000000e4';
    de_tutor  CONSTANT UUID := '00000000-0000-0000-0000-000000000b01';
    de_familia CONSTANT UUID := '00000000-0000-0000-0000-000000000b02';
    n INTEGER;
    titulos TEXT;
BEGIN
    -- 1. Tramos: mañana, tarde, noche, madrugada y los que pasan de uno a otro
    IF public.tramo_horario('08:00', '08:30') <> 'manana'
       OR public.tramo_horario('14:00', '15:00') <> 'manana'
       OR public.tramo_horario('10:00', NULL) <> 'manana'
       OR public.tramo_horario('14:30', '15:30') <> 'mixta'
       OR public.tramo_horario('15:00', '16:00') <> 'tarde'
       OR public.tramo_horario('23:00', '00:30') <> 'tarde'
       OR public.tramo_horario('07:00', '08:00') <> 'tarde'
       OR public.tramo_horario('07:30', '08:30') <> 'mixta'
       OR public.tramo_horario('20:00', '09:00') <> 'mixta'
       OR public.tramo_horario(NULL, NULL) IS NOT NULL THEN
        RAISE EXCEPTION 'FALLA 1 tramo_horario';
    END IF;

    SET LOCAL ROLE authenticated;

    -- 2. La familia lee las tareas de clase, las de casa y las del catálogo que tiene asignadas,
    --    y la agenda del día (secuencia_dia) le devuelve las tres
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    SELECT string_agg(titulo, ', ' ORDER BY titulo) INTO titulos
    FROM public.tareas WHERE id IN (clase, casa, catalogo);
    IF titulos IS DISTINCT FROM 'Asamblea, Preparar la mochila, Recreo' THEN
        RAISE EXCEPTION 'FALLA 2 familia lee: %', titulos;
    END IF;
    SELECT count(*) INTO n FROM public.secuencia_dia(alejandro, '2026-11-23');
    IF n <> 3 THEN RAISE EXCEPTION 'FALLA 2 agenda de la familia: % tareas', n; END IF;

    -- 3. El tutor lee también las de casa
    PERFORM set_config('request.jwt.claim.sub', carmen, true);
    SELECT count(*) INTO n FROM public.tareas WHERE id IN (clase, casa, catalogo, casa_sin_hora);
    IF n <> 4 THEN RAISE EXCEPTION 'FALLA 3 tutor lee % tareas', n; END IF;
    SELECT count(*) INTO n FROM public.secuencia_dia(alejandro, '2026-11-23');
    IF n <> 3 THEN RAISE EXCEPTION 'FALLA 3 agenda del tutor: % tareas', n; END IF;

    -- 4. Quien no supervisa al alumno no ve sus tareas
    PERFORM set_config('request.jwt.claim.sub', otra, true);
    SELECT count(*) INTO n FROM public.tareas WHERE id IN (clase, casa, catalogo, casa_sin_hora);
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA 4 otra familia lee % tareas', n; END IF;
    PERFORM set_config('request.jwt.claim.sub', otro, true);
    SELECT count(*) INTO n FROM public.tareas WHERE id IN (clase, casa, casa_sin_hora);
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA 4 otro tutor lee % tareas', n; END IF;

    -- 5. El tutor pone tareas por la mañana, hasta las 15:00 justas, y sin hora si son de clase
    PERFORM set_config('request.jwt.claim.sub', carmen, true);
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio, hora_fin)
    VALUES (alejandro, clase, '2026-11-24', '14:00', '15:00');
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
    VALUES (alejandro, clase, '2026-11-24', '14:30'); -- 14:30 + 30 min = 15:00
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha) VALUES (alejandro, catalogo, '2026-11-24');

    -- 6. Pero no por la tarde, ni una que pasa de las 15:00, ni una de casa sin hora
    BEGIN
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
        VALUES (alejandro, clase, '2026-11-24', '17:00');
        RAISE EXCEPTION 'FALLA 6 el tutor ha puesto una tarea a las 17:00';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio, hora_fin)
        VALUES (alejandro, clase, '2026-11-24', '14:30', '15:30');
        RAISE EXCEPTION 'FALLA 6 el tutor ha puesto una tarea de 14:30 a 15:30';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        -- Sin hora de fin: 14:45 + 30 minutos de la tarea = 15:15
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
        VALUES (alejandro, clase, '2026-11-24', '14:45');
        RAISE EXCEPTION 'FALLA 6 el tutor ha puesto una tarea que acaba a las 15:15';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha)
        VALUES (alejandro, casa_sin_hora, '2026-11-24');
        RAISE EXCEPTION 'FALLA 6 el tutor ha puesto una tarea de casa sin hora';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 7. El tutor no mueve de hora ni de día la tarea de la familia, ni la quita
    BEGIN
        UPDATE public.asignaciones SET hora_inicio = '10:00', hora_fin = '10:30' WHERE id = de_familia;
        RAISE EXCEPTION 'FALLA 7 el tutor ha movido a la mañana la tarea de la familia';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        UPDATE public.asignaciones SET fecha = '2026-11-24' WHERE id = de_familia;
        RAISE EXCEPTION 'FALLA 7 el tutor ha cambiado de día la tarea de la familia';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        DELETE FROM public.asignaciones WHERE id = de_familia;
        RAISE EXCEPTION 'FALLA 7 el tutor ha quitado la tarea de la familia';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 8. Sí puede cambiar su estado, aunque se reenvíe la misma hora: eso no depende del tramo
    UPDATE public.asignaciones SET estado = 'bloqueada' WHERE id = de_familia;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA 8 el tutor no ha podido cambiar el estado'; END IF;
    UPDATE public.asignaciones SET estado = 'pendiente', hora_inicio = '19:00', hora_fin = '19:30'
    WHERE id = de_familia;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA 8 el tutor no ha podido guardar el estado con la misma hora'; END IF;

    -- 9. Y mueve las suyas dentro de la mañana, también a otro día
    UPDATE public.asignaciones SET hora_inicio = '10:00', hora_fin = '10:30', fecha = '2026-11-25'
    WHERE id = de_tutor;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA 9 el tutor no ha podido mover su tarea'; END IF;

    -- 10. La familia pone tareas por la tarde, de noche, de madrugada hasta las 08:00 y sin hora
    --     si son de casa
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio, hora_fin) VALUES
        (alejandro, casa, '2026-11-24', '15:00', '15:30'),
        (alejandro, casa, '2026-11-24', '23:30', '00:15'),
        (alejandro, casa, '2026-11-24', '07:00', '08:00');
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha) VALUES (alejandro, casa_sin_hora, '2026-11-24');

    -- 11. Pero no por la mañana, ni una que entra en las 08:00
    BEGIN
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
        VALUES (alejandro, casa, '2026-11-24', '10:00');
        RAISE EXCEPTION 'FALLA 11 la familia ha puesto una tarea a las 10:00';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio, hora_fin)
        VALUES (alejandro, casa, '2026-11-24', '07:30', '08:30');
        RAISE EXCEPTION 'FALLA 11 la familia ha puesto una tarea de 07:30 a 08:30';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 12. La familia no pasa su tarea a la mañana ni quita la del tutor, pero sí quita la suya
    BEGIN
        UPDATE public.asignaciones SET hora_inicio = '12:00', hora_fin = '12:30' WHERE id = de_familia;
        RAISE EXCEPTION 'FALLA 12 la familia ha movido su tarea a la mañana';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        DELETE FROM public.asignaciones WHERE id = de_tutor;
        RAISE EXCEPTION 'FALLA 12 la familia ha quitado la tarea del tutor';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    DELETE FROM public.asignaciones WHERE id = de_familia;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA 12 la familia no ha podido quitar su tarea'; END IF;

    -- 13. Crear la definición de una tarea sigue siendo por ámbito: la familia no crea tareas de clase
    BEGIN
        INSERT INTO public.tareas (alumno_id, titulo, ambito) VALUES (alejandro, 'Tarea de clase', 'centro');
        RAISE EXCEPTION 'FALLA 13 la familia ha creado una tarea de clase';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 14. Administración y el editor SQL (sin sesión) no tienen límite de horario
    PERFORM set_config('request.jwt.claim.sub', admin, true);
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
    VALUES (alejandro, clase, '2026-11-26', '18:00');
    RESET ROLE;
    PERFORM set_config('request.jwt.claim.sub', '', true);
    INSERT INTO public.asignaciones (estudiante_id, tarea_id, fecha, hora_inicio)
    VALUES (alejandro, casa, '2026-11-26', '10:00');

    RAISE NOTICE 'agenda_compartida_y_franjas: las 14 comprobaciones pasan';
END $$;

ROLLBACK;
