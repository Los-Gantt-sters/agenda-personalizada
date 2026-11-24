-- Pruebas de la migración 20261124000000_pasos_multimedia.sql (SCRUM-94 · T-10.1, HU-10).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000aa01', 'carmen@prueba.es'),
    ('00000000-0000-0000-0000-00000000aa02', 'otro.tutor@prueba.es'),
    ('00000000-0000-0000-0000-00000000aa03', 'madre@prueba.es');

INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000aa01', 'carmen@prueba.es', 'Carmen Ruiz', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000aa02', 'otro.tutor@prueba.es', 'Otro Tutor', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000aa03', 'madre@prueba.es', 'Madre de Alejandro', 'familiar');

INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c1', 'CEE Purísima', 'PRUEBA-10');

INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', 'Aula Triángulo',
     '00000000-0000-0000-0000-00000000aa01'),
    ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-0000000000c1', 'Aula Círculo',
     '00000000-0000-0000-0000-00000000aa02');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1',
     '00000000-0000-0000-0000-0000000000a1', 'EXP-H10A', 'Alejandro');

INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000aa03', 'familiar');

-- «Lavarse las manos» es del colegio; «Merendar» es de casa.
INSERT INTO public.tareas (id, alumno_id, titulo, ambito) VALUES
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000001', 'Lavarse las manos', 'centro'),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000001', 'Merendar', 'hogar');

INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, fecha, hora_inicio, orden) VALUES
    ('00000000-0000-0000-0000-000000000a01', '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-0000000000e1', '2026-11-12', '09:30', 1);

-- En Supabase el rol authenticated ya tiene estos permisos; en un PostgreSQL normal no.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    lavarse  CONSTANT UUID := '00000000-0000-0000-0000-0000000000e1';
    merendar CONSTANT UUID := '00000000-0000-0000-0000-0000000000e2';
    carmen   CONSTANT TEXT := '00000000-0000-0000-0000-00000000aa01';
    otro     CONSTANT TEXT := '00000000-0000-0000-0000-00000000aa02';
    madre    CONSTANT TEXT := '00000000-0000-0000-0000-00000000aa03';
    titulos  TEXT[];
    ids      UUID[];
    r        RECORD;
    pasos    JSONB;
    n        INTEGER;
BEGIN
    -- 1. Un paso que solo trae «texto» (como seed.sql) recibe ese texto como título.
    INSERT INTO public.pasos_tarea (tarea_id, orden, texto) VALUES (lavarse, 1, 'Abre el grifo');
    SELECT titulo INTO r FROM public.pasos_tarea WHERE tarea_id = lavarse;
    IF r.titulo IS DISTINCT FROM 'Abre el grifo' THEN
        RAISE EXCEPTION 'FALLA título por defecto: %', r.titulo;
    END IF;

    -- 2. No puede haber dos pasos con el mismo número en la misma tarea.
    BEGIN
        INSERT INTO public.pasos_tarea (tarea_id, orden, texto) VALUES (lavarse, 1, 'Repetido');
        RAISE EXCEPTION 'FALLA orden único: se ha dejado repetir el paso 1';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    DELETE FROM public.pasos_tarea WHERE tarea_id = lavarse;

    -- 3. Solo valen los 5 formatos de 07 y al menos uno.
    BEGIN
        UPDATE public.tareas SET formatos_permitidos = ARRAY['pictograma', 'olor'] WHERE id = lavarse;
        RAISE EXCEPTION 'FALLA formatos: se ha aceptado «olor»';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        UPDATE public.tareas SET formatos_permitidos = ARRAY[]::TEXT[] WHERE id = lavarse;
        RAISE EXCEPTION 'FALLA formatos: se ha aceptado una lista vacía';
    EXCEPTION WHEN check_violation THEN NULL;
    END;

    -- A partir de aquí, como Carmen (tutora de Alejandro) con sesión iniciada.
    PERFORM set_config('request.jwt.claim.sub', carmen, true);
    SET LOCAL ROLE authenticated;

    -- 4. guardar_pasos crea los pasos en el orden recibido, con su foto y su vídeo.
    PERFORM public.guardar_pasos(lavarse, '[
        {"titulo": "Abre el grifo", "texto": "Gira el grifo despacio para que salga agua templada.",
         "pictograma_id": 2384, "pictograma_url": "https://static.arasaac.org/pictograms/2384/2384_500.png",
         "foto": {"ruta": "00000000-0000-0000-0000-0000000000e1/foto/grifo.jpg", "tipo_mime": "image/jpeg", "tamano_bytes": 120000},
         "video": {"ruta": "00000000-0000-0000-0000-0000000000e1/video/grifo.mp4", "tipo_mime": "video/mp4", "tamano_bytes": 900000, "duracion_segundos": 12}},
        {"titulo": "Echa jabón", "texto": "Pon una gota de jabón en la palma de tu mano."},
        {"titulo": "Sécate", "texto": "Coge la toalla limpia y sécate bien las dos manos."}
    ]'::jsonb);
    SELECT array_agg(titulo ORDER BY orden), array_agg(id ORDER BY orden) INTO titulos, ids
    FROM public.pasos_tarea WHERE tarea_id = lavarse;
    IF titulos IS DISTINCT FROM ARRAY['Abre el grifo', 'Echa jabón', 'Sécate']::TEXT[] THEN
        RAISE EXCEPTION 'FALLA crear pasos: %', titulos;
    END IF;
    SELECT count(*) INTO n FROM public.recursos_multimedia WHERE paso_id = ids[1];
    IF n <> 2 THEN RAISE EXCEPTION 'FALLA multimedia del paso 1: % recursos', n; END IF;

    -- 5. Reordenar (Subir/Bajar), quitar un paso, añadir otro y quitar el vídeo, todo de una vez.
    PERFORM public.guardar_pasos(lavarse, jsonb_build_array(
        jsonb_build_object('id', ids[2], 'titulo', 'Echa jabón', 'texto', 'Pon una gota de jabón.'),
        jsonb_build_object('id', ids[1], 'titulo', 'Abre el grifo', 'texto', 'Gira el grifo.', 'video', NULL),
        jsonb_build_object('titulo', 'Frota las manos', 'texto', 'Frota las palmas y entre los dedos.')
    ));
    SELECT array_agg(titulo ORDER BY orden) INTO titulos FROM public.pasos_tarea WHERE tarea_id = lavarse;
    IF titulos IS DISTINCT FROM ARRAY['Echa jabón', 'Abre el grifo', 'Frota las manos']::TEXT[] THEN
        RAISE EXCEPTION 'FALLA reordenar/quitar/añadir: %', titulos;
    END IF;
    SELECT array_agg(tipo ORDER BY tipo) INTO titulos FROM public.recursos_multimedia WHERE paso_id = ids[1];
    IF titulos IS DISTINCT FROM ARRAY['imagen']::TEXT[] THEN
        RAISE EXCEPTION 'FALLA quitar vídeo y mantener foto: %', titulos;
    END IF;

    -- 6. Un paso sin título no se guarda (y no se queda nada a medias).
    BEGIN
        PERFORM public.guardar_pasos(lavarse, '[{"titulo": "  "}]'::jsonb);
        RAISE EXCEPTION 'FALLA paso sin título aceptado';
    EXCEPTION WHEN not_null_violation THEN NULL;
    END;
    SELECT count(*) INTO n FROM public.pasos_tarea WHERE tarea_id = lavarse;
    IF n <> 3 THEN RAISE EXCEPTION 'FALLA paso sin título ha dejado % pasos', n; END IF;

    -- 7. secuencia_dia lleva a la agenda los pasos con título, texto, foto y formatos permitidos.
    SELECT s.tarea INTO r FROM public.secuencia_dia('00000000-0000-0000-0000-000000000001', '2026-11-12') s;
    pasos := r.tarea->'pasos';
    IF jsonb_array_length(pasos) <> 3
       OR pasos->1->>'titulo' <> 'Abre el grifo'
       OR pasos->1->>'texto' <> 'Gira el grifo.'
       OR pasos->1->'foto'->>'ruta' <> '00000000-0000-0000-0000-0000000000e1/foto/grifo.jpg'
       OR jsonb_typeof(pasos->1->'video') <> 'null'
       OR (r.tarea->'formatos_permitidos') <> '["pictograma", "texto", "foto", "video", "audio"]'::jsonb THEN
        RAISE EXCEPTION 'FALLA secuencia_dia con pasos: %', r.tarea;
    END IF;

    -- 8. Carmen no puede tocar los pasos de una tarea de casa.
    BEGIN
        PERFORM public.guardar_pasos(merendar, '[{"titulo": "Coge el bocadillo"}]'::jsonb);
        RAISE EXCEPTION 'FALLA permisos: la tutora ha editado una tarea de casa';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 9. Otro tutor (de otra clase) no puede tocar los pasos de Alejandro, ni a mano.
    PERFORM set_config('request.jwt.claim.sub', otro, true);
    BEGIN
        PERFORM public.guardar_pasos(lavarse, '[{"titulo": "Hackeado"}]'::jsonb);
        RAISE EXCEPTION 'FALLA permisos: otro tutor ha usado guardar_pasos';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    UPDATE public.pasos_tarea SET titulo = 'Hackeado' WHERE tarea_id = lavarse;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA RLS: otro tutor ha cambiado % pasos', n; END IF;

    -- 10. La familia sí edita los pasos de las tareas de casa.
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    PERFORM public.guardar_pasos(merendar, '[{"titulo": "Coge el bocadillo", "texto": "Está en la nevera."}]'::jsonb);
    SELECT count(*) INTO n FROM public.pasos_tarea WHERE tarea_id = merendar;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA familia en tarea de casa: % pasos', n; END IF;

    RESET ROLE;
    RAISE NOTICE 'pasos_multimedia: las 10 comprobaciones pasan';
END $$;

ROLLBACK;
