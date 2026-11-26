-- Pruebas de public.aulas_acceso y public.alumnos_acceso (SCRUM-249 · T-01.7, MOD HU-01).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c9', 'CEE Purísima', 'PRUEBA-ACC');

-- Cursos: el activo, uno ya cerrado y el del año que viene (abierto, pero aún no activo).
-- Solo puede haber un curso activo: se desactiva el que hubiera (se deshace con el ROLLBACK).
UPDATE public.cursos_lectivos SET activo = false WHERE activo;
INSERT INTO public.cursos_lectivos (id, anio_escolar, fecha_inicio, fecha_fin, activo, cerrado) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'PRUEBA-ACTIVO', '2026-09-01', '2027-06-30', true, false),
    ('00000000-0000-0000-0000-0000000000e2', 'PRUEBA-CERRADO', '2025-09-01', '2026-06-30', false, true),
    ('00000000-0000-0000-0000-0000000000e3', 'PRUEBA-SIGUIENTE', '2027-09-01', '2028-06-30', false, false);

-- El administrador las ha ordenado así en la 48b: Círculo, Triángulo y Sol (con imagen).
-- Luna es de un curso cerrado y Estrella del curso siguiente: no salen en la pantalla 01.
INSERT INTO public.aulas (id, centro_id, curso_lectivo_id, nombre, icono_forma, icono_url, orden) VALUES
    ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e1', 'Clase Triángulo', 'tri', NULL, 1),
    ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e1', 'Clase Círculo', 'cir', NULL, 0),
    ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e1', 'Clase Sol', 'tri', 'https://picto/sol.png', 2),
    ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e2', 'Clase Luna', 'cir', NULL, 3),
    ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000e3', 'Clase Estrella', 'tri', NULL, 4);

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre, apellidos, fecha_nacimiento,
                            estado, activo, foto_url, icono_personal, color_identificativo) VALUES
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1',
     'EXP-ACC1', 'Miriam', 'Lozano Fuentes', '2010-03-01', 'activo', true, NULL, '🦋', '#7A3FA6'),
    ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1',
     'EXP-ACC2', 'Alejandro', 'Castillo Vega', '2009-05-02', 'activo', true, 'https://foto/ale.jpg', '🦁', '#B8492F'),
    -- Estos NO salen: dado de baja, archivado (RGPD) y de otra aula
    ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1',
     'EXP-ACC3', 'Bruno', 'Pérez', '2010-01-01', 'activo', false, NULL, '🚗', '#2f62b8'),
    ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1',
     'EXP-ACC4', 'Carla', 'Ruiz', '2008-01-01', 'archivado', true, NULL, '⚽', '#2f62b8'),
    ('00000000-0000-0000-0000-0000000000d5', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b2',
     'EXP-ACC5', 'Nora', 'Gil', '2010-01-01', 'activo', true, NULL, '🐢', '#2f62b8'),
    -- Activo, pero en Clase Luna, que es de un curso cerrado: tampoco sale
    ('00000000-0000-0000-0000-0000000000d6', '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b4',
     'EXP-ACC6', 'Olga', 'Sanz', '2010-01-01', 'activo', true, NULL, '🌙', '#2f62b8');

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    triangulo CONSTANT UUID := '00000000-0000-0000-0000-0000000000b1';
    filas     TEXT[];
    r         RECORD;
BEGIN
    -- 1. Aulas en el orden de la 48b (orden, luego nombre), con su icono
    SELECT array_agg(a.nombre ORDER BY ord) INTO filas
    FROM public.aulas_acceso() WITH ORDINALITY AS a(id, nombre, icono_forma, icono_url, orden, ord)
    WHERE a.id IN ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b2',
                   '00000000-0000-0000-0000-0000000000b3');
    IF filas IS DISTINCT FROM ARRAY['Clase Círculo', 'Clase Triángulo', 'Clase Sol'] THEN
        RAISE EXCEPTION 'FALLA orden de las aulas: %', filas;
    END IF;
    -- 1b. Solo las aulas del curso activo: ni la del curso cerrado ni la del curso siguiente
    IF EXISTS (
        SELECT 1 FROM public.aulas_acceso() a
        WHERE a.id IN ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000b5')
    ) THEN
        RAISE EXCEPTION 'FALLA salen aulas de cursos cerrados o que no han empezado';
    END IF;
    IF (SELECT count(*) FROM public.alumnos_acceso('00000000-0000-0000-0000-0000000000b4')) <> 0 THEN
        RAISE EXCEPTION 'FALLA salen alumnos de un aula de un curso cerrado';
    END IF;
    SELECT * INTO r FROM public.aulas_acceso() a WHERE a.nombre = 'Clase Sol';
    IF r.icono_url IS DISTINCT FROM 'https://picto/sol.png' OR r.icono_forma IS DISTINCT FROM 'tri' THEN
        RAISE EXCEPTION 'FALLA icono del aula: % / %', r.icono_forma, r.icono_url;
    END IF;

    -- 2. Alumnos: solo los activos de esa aula, por nombre
    SELECT array_agg(a.nombre ORDER BY ord) INTO filas
    FROM public.alumnos_acceso(triangulo) WITH ORDINALITY
         AS a(id, nombre, icono_personal, color_identificativo, ord);
    IF filas IS DISTINCT FROM ARRAY['Alejandro', 'Miriam'] THEN
        RAISE EXCEPTION 'FALLA alumnos del aula: %', filas;
    END IF;

    -- 3. Lo que sale de cada alumno: icono y color (la foto no, aunque la tenga)
    SELECT * INTO r FROM public.alumnos_acceso(triangulo) a WHERE a.nombre = 'Alejandro';
    IF r.icono_personal <> '🦁' OR r.color_identificativo <> '#B8492F' THEN
        RAISE EXCEPTION 'FALLA datos del alumno: %', r;
    END IF;

    -- 4. Protección de datos: no devuelven más columnas que las de la pantalla (ni la foto)
    IF pg_get_function_result('public.alumnos_acceso(uuid)'::regprocedure)
       <> 'TABLE(id uuid, nombre text, icono_personal text, color_identificativo text)' THEN
        RAISE EXCEPTION 'FALLA columnas de alumnos_acceso: %',
            pg_get_function_result('public.alumnos_acceso(uuid)'::regprocedure);
    END IF;
    IF pg_get_function_result('public.aulas_acceso()'::regprocedure)
       <> 'TABLE(id uuid, nombre text, icono_forma text, icono_url text, orden integer)' THEN
        RAISE EXCEPTION 'FALLA columnas de aulas_acceso: %',
            pg_get_function_result('public.aulas_acceso()'::regprocedure);
    END IF;

    -- 5. Un aula sin alumnos (o que no existe) devuelve 0 filas, no un error
    IF (SELECT count(*) FROM public.alumnos_acceso('00000000-0000-0000-0000-0000000000b3')) <> 0
       OR (SELECT count(*) FROM public.alumnos_acceso(gen_random_uuid())) <> 0 THEN
        RAISE EXCEPTION 'FALLA aula vacía';
    END IF;

    -- 6. Permisos: las puede llamar la pantalla sin sesión (anon), pero anon sigue sin poder leer
    --    las tablas directamente (RLS y permisos de siempre)
    IF NOT has_function_privilege('anon', 'public.aulas_acceso()', 'EXECUTE')
       OR NOT has_function_privilege('anon', 'public.alumnos_acceso(uuid)', 'EXECUTE')
       OR NOT has_function_privilege('authenticated', 'public.alumnos_acceso(uuid)', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALLA permisos de ejecución';
    END IF;
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename IN ('alumnos', 'aulas') AND 'anon' = ANY (roles)
    ) THEN
        RAISE EXCEPTION 'FALLA hay políticas para anon en alumnos o aulas';
    END IF;

    RAISE NOTICE 'acceso_alumnos: las 7 comprobaciones pasan';
END $$;

ROLLBACK;
