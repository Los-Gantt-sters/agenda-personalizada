-- Pruebas de public.secuencia_dia (SCRUM-71 · T-06.3, HU-06; SCRUM-225, HU-08).
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

-- SCRUM-225: el tutor le quita «Empezar» a «Leer un cuento» (las demás lo piden por defecto);
-- «Ordenar mi mesa» está en curso y tiene su hora real de inicio en ejecuciones; «Asamblea» ya
-- terminó y tiene inicio y fin.
UPDATE public.asignaciones SET requiere_inicio_fin = false
WHERE id = '00000000-0000-0000-0000-000000000a04';

INSERT INTO public.ejecuciones (asignacion_id, estudiante_id, inicio, fin) VALUES
    ('00000000-0000-0000-0000-000000000a03', '00000000-0000-0000-0000-000000000001',
     '2026-11-12 09:32:00+01', NULL),
    ('00000000-0000-0000-0000-000000000a02', '00000000-0000-0000-0000-000000000001',
     '2026-11-12 09:30:00+01', '2026-11-12 09:44:00+01');

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
         fecha, hora_inicio, duracion_prevista_min, orden, estado, tarea, pendiente_motivo,
         requiere_inicio_fin, inicio_real, fin_real, ord);
    IF filas IS DISTINCT FROM ARRAY['Asamblea', 'Ordenar mi mesa', 'Huerto', 'Recreo', 'Comer', 'Leer un cuento'] THEN
        RAISE EXCEPTION 'FALLA orden/filtros: %', filas;
    END IF;

    -- 2. Estados traducidos al formato de la agenda
    SELECT array_agg(s.estado ORDER BY ord) INTO filas
    FROM public.secuencia_dia(marcos, '2026-11-12') WITH ORDINALITY AS s(id, estudiante_id, tarea_id,
         fecha, hora_inicio, duracion_prevista_min, orden, estado, tarea, pendiente_motivo,
         requiere_inicio_fin, inicio_real, fin_real, ord);
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

    -- 8. SCRUM-225 (RF6.8): por defecto todas piden «Empezar» (true); si el tutor lo quita, false
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Leer un cuento';
    IF r.requiere_inicio_fin IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'FALLA requiere_inicio_fin quitado: %', r.requiere_inicio_fin;
    END IF;
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Recreo';
    IF r.requiere_inicio_fin IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'FALLA requiere_inicio_fin por defecto: %', r.requiere_inicio_fin;
    END IF;

    -- 9. SCRUM-225 (RI6.1): horas reales desde ejecuciones, NULL si no hay ejecución y sin repetir filas
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Ordenar mi mesa';
    IF r.inicio_real IS DISTINCT FROM '2026-11-12 09:32:00+01'::TIMESTAMPTZ OR r.fin_real IS NOT NULL THEN
        RAISE EXCEPTION 'FALLA hora real en curso: % / %', r.inicio_real, r.fin_real;
    END IF;
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Asamblea';
    IF r.fin_real IS DISTINCT FROM '2026-11-12 09:44:00+01'::TIMESTAMPTZ THEN
        RAISE EXCEPTION 'FALLA hora real de fin: %', r.fin_real;
    END IF;
    SELECT * INTO r FROM public.secuencia_dia(marcos, '2026-11-12') s WHERE s.tarea->>'titulo' = 'Recreo';
    IF r.inicio_real IS NOT NULL OR r.fin_real IS NOT NULL THEN
        RAISE EXCEPTION 'FALLA sin ejecución debería ser NULL: % / %', r.inicio_real, r.fin_real;
    END IF;
    IF (SELECT count(*) FROM public.secuencia_dia(marcos, '2026-11-12')) <> 6 THEN
        RAISE EXCEPTION 'FALLA el LEFT JOIN repite filas';
    END IF;

    RAISE NOTICE 'secuencia_dia: las 9 comprobaciones pasan';
END $$;

ROLLBACK;
