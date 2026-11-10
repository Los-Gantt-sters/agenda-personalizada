-- Pruebas de public.secuencia_dia (SCRUM-71 · T-06.3, HU-06).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c1', 'CEE Purísima', 'PRUEBA-01');

INSERT INTO public.aulas (id, centro_id, nombre)
VALUES ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Aula Triángulo');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1',
     '00000000-0000-0000-0000-0000000000a1', 'EXP-T001', 'Marcos'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c1',
     '00000000-0000-0000-0000-0000000000a1', 'EXP-T002', 'Nora');

-- Tareas (catálogo). La de «Ordenar mi mesa» tiene pasos; «Taller» está desactivada.
INSERT INTO public.tareas (id, titulo, duracion_estimada_minutos, hora_inicio, activo, pictograma_url) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'Asamblea', 15, NULL, true, 'https://picto/asamblea.png'),
    ('00000000-0000-0000-0000-0000000000e2', 'Ordenar mi mesa', 10, NULL, true, NULL),
    ('00000000-0000-0000-0000-0000000000e3', 'Huerto', 45, '10:00', true, NULL),
    ('00000000-0000-0000-0000-0000000000e4', 'Recreo', 30, NULL, true, NULL),
    ('00000000-0000-0000-0000-0000000000e5', 'Comer', 40, NULL, true, NULL),
    ('00000000-0000-0000-0000-0000000000e6', 'Leer un cuento', 20, NULL, true, NULL),
    ('00000000-0000-0000-0000-0000000000e7', 'Taller', 30, NULL, false, NULL),
    ('00000000-0000-0000-0000-0000000000e8', 'Excursión', 60, NULL, true, NULL);

-- Pasos metidos desordenados a propósito
INSERT INTO public.pasos_tarea (tarea_id, orden, texto, imagen_url) VALUES
    ('00000000-0000-0000-0000-0000000000e2', 2, 'Guarda los lápices', 'https://picto/lapices.png'),
    ('00000000-0000-0000-0000-0000000000e2', 1, 'Recoge los papeles', 'https://picto/papeles.png');

INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, fecha, hora_inicio, hora_fin, orden, estado) VALUES
    -- Del 12/11 de Marcos: estas sí salen
    ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e4', '2026-11-12', '11:00', '11:30', 1, 'pendiente'),
    ('00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', '2026-11-12', '09:30', NULL,    1, 'hecho'),
    ('00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e2', '2026-11-12', '09:30', NULL,    2, 'en_curso'),
    ('00000000-0000-0000-0000-000000000a04', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e6', '2026-11-12', NULL,    NULL,    1, 'pendiente'),
    ('00000000-0000-0000-0000-000000000a05', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e3', '2026-11-12', NULL,    NULL,    1, 'bloqueada'),
    ('00000000-0000-0000-0000-000000000a06', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e5', '2026-11-12', '13:30', NULL,    1, 'completada'),
    -- Estas NO salen: cancelada, tarea desactivada, otro día y otro alumno
    ('00000000-0000-0000-0000-000000000a07', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e8', '2026-11-12', '12:00', NULL,    1, 'cancelada'),
    ('00000000-0000-0000-0000-000000000a08', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e7', '2026-11-12', '12:30', NULL,    1, 'pendiente'),
    ('00000000-0000-0000-0000-000000000a09', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e4', '2026-11-13', '11:00', NULL,    1, 'pendiente'),
    ('00000000-0000-0000-0000-000000000a10', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e4', '2026-11-12', '11:00', NULL,    1, 'pendiente');

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    marcos CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
    filas  TEXT[];
    r      RECORD;
BEGIN
    -- 1. Orden cronológico: hora de inicio (la de la tarea si la asignación no tiene), luego orden;
    --    las que no tienen hora, al final. Sin canceladas, desactivadas, otros días ni otros alumnos.
    SELECT array_agg(s.tarea->>'titulo' ORDER BY ord) INTO filas
    FROM public.secuencia_dia(marcos, '2026-11-12') WITH ORDINALITY AS s(id, estudiante_id, tarea_id,
         fecha, hora_inicio, duracion_prevista_min, orden, estado, tarea, ord);
    IF filas IS DISTINCT FROM ARRAY['Asamblea', 'Ordenar mi mesa', 'Huerto', 'Recreo', 'Comer', 'Leer un cuento'] THEN
        RAISE EXCEPTION 'FALLA orden/filtros: %', filas;
    END IF;

    -- 2. Estados traducidos al formato de la agenda
    SELECT array_agg(s.estado ORDER BY ord) INTO filas
    FROM public.secuencia_dia(marcos, '2026-11-12') WITH ORDINALITY AS s(id, estudiante_id, tarea_id,
         fecha, hora_inicio, duracion_prevista_min, orden, estado, tarea, ord);
    IF filas IS DISTINCT FROM ARRAY['hecha', 'en_curso', 'bloqueada', 'pendiente', 'hecha', 'pendiente'] THEN
        RAISE EXCEPTION 'FALLA estados: %', filas;
    END IF;

    -- 3. Duración: de inicio a fin de la asignación (Recreo 11:00-11:30 = 30) o la estimada (Asamblea = 15)
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Recreo';
    IF r.duracion_prevista_min <> 30 THEN RAISE EXCEPTION 'FALLA duración por horas: %', r.duracion_prevista_min; END IF;
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Asamblea';
    IF r.duracion_prevista_min <> 15 THEN RAISE EXCEPTION 'FALLA duración estimada: %', r.duracion_prevista_min; END IF;

    -- 4. Hora heredada de la tarea cuando la asignación no tiene (Huerto, 10:00)
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Huerto';
    IF r.hora_inicio IS DISTINCT FROM '10:00'::TIME THEN RAISE EXCEPTION 'FALLA hora heredada: %', r.hora_inicio; END IF;

    -- 5. Tarea anidada con sus campos y los pasos ordenados (aunque se insertaran desordenados)
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Ordenar mi mesa';
    IF r.tarea->'pasos'->0->>'texto' <> 'Recoge los papeles'
       OR r.tarea->'pasos'->1->>'pictograma_url' <> 'https://picto/lapices.png' THEN
        RAISE EXCEPTION 'FALLA pasos: %', r.tarea->'pasos';
    END IF;
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Asamblea';
    IF r.tarea->>'pictograma_url' <> 'https://picto/asamblea.png' OR r.tarea->'pasos' <> '[]'::jsonb THEN
        RAISE EXCEPTION 'FALLA tarea sin pasos: %', r.tarea;
    END IF;

    -- 6. Un día sin tareas devuelve 0 filas (no error)
    IF (SELECT count(*) FROM public.secuencia_dia(marcos, '2026-11-14')) <> 0 THEN
        RAISE EXCEPTION 'FALLA día vacío';
    END IF;

    -- 7. Permisos: la pueden llamar los usuarios con sesión, no los anónimos
    IF NOT has_function_privilege('authenticated', 'public.secuencia_dia(uuid, date)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.secuencia_dia(uuid, date)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALLA permisos de ejecución';
    END IF;

    RAISE NOTICE 'secuencia_dia: las 7 comprobaciones pasan';
END $$;

ROLLBACK;
