-- Pruebas de la migración 20261128300000_storage_multimedia_pasos.sql (SCRUM-96 · T-10.3, HU-10).
-- En un PostgreSQL normal no hay esquema storage, así que se prueba lo que deciden las políticas
-- del bucket: de qué tarea es cada ruta y que un paso no pueda apuntar a archivos de otra tarea.
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
BEGIN;

INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-00000000ad01', 'admin@prueba.es');

INSERT INTO public.tareas (id, titulo) VALUES
    ('00000000-0000-0000-0000-0000000000e1', 'Lavarse las manos'),
    ('00000000-0000-0000-0000-0000000000e2', 'Merendar');
INSERT INTO public.pasos_tarea (id, tarea_id, orden, texto) VALUES
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000e1', 1, 'Abre el grifo');

DO $$
DECLARE
    lavarse CONSTANT UUID := '00000000-0000-0000-0000-0000000000e1';
    paso    CONSTANT UUID := '00000000-0000-0000-0000-0000000000f1';
BEGIN
    -- 1. Rutas válidas: <tarea>/<foto|video|audio>/<archivo>
    IF public.tarea_de_ruta_multimedia(lavarse || '/foto/grifo.jpg') IS DISTINCT FROM lavarse
       OR public.tarea_de_ruta_multimedia(lavarse || '/audio/voz.m4a') IS DISTINCT FROM lavarse THEN
        RAISE EXCEPTION 'FALLA ruta válida';
    END IF;

    -- 2. Rutas que no dan acceso a ninguna tarea
    IF public.tarea_de_ruta_multimedia('no-es-uuid/foto/a.jpg') IS NOT NULL
       OR public.tarea_de_ruta_multimedia(lavarse || '/documentos/a.pdf') IS NOT NULL
       OR public.tarea_de_ruta_multimedia(lavarse || '/foto/') IS NOT NULL
       OR public.tarea_de_ruta_multimedia('../' || lavarse || '/foto/a.jpg') IS NOT NULL THEN
        RAISE EXCEPTION 'FALLA rutas no válidas';
    END IF;

    -- 3. Sin tarea, puede_ver_tarea y puede_editar_tarea dicen que no (las políticas niegan).
    IF public.puede_ver_tarea(NULL) OR public.puede_editar_tarea(NULL) THEN
        RAISE EXCEPTION 'FALLA permisos sin tarea';
    END IF;

    -- 4. Un paso puede guardar archivos de su tarea...
    INSERT INTO public.recursos_multimedia (paso_id, tipo, ruta_storage, tipo_mime)
    VALUES (paso, 'imagen', lavarse || '/foto/grifo.jpg', 'image/jpeg');

    -- 5. ...pero no de otra tarea.
    BEGIN
        INSERT INTO public.recursos_multimedia (paso_id, tipo, ruta_storage, tipo_mime)
        VALUES (paso, 'video', '00000000-0000-0000-0000-0000000000e2/video/x.mp4', 'video/mp4');
        RAISE EXCEPTION 'FALLA archivo de otra tarea aceptado';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;

    -- 6. Si se borra el recurso y se vuelve a crear con el mismo archivo (lo que hace guardar_pasos
    -- con los archivos que se conservan), no se apunta para borrar.
    DELETE FROM public.recursos_multimedia WHERE paso_id = paso;
    INSERT INTO public.recursos_multimedia (paso_id, tipo, ruta_storage, tipo_mime)
    VALUES (paso, 'imagen', lavarse || '/foto/grifo.jpg', 'image/jpeg');
    SET CONSTRAINTS public.anotar_multimedia_por_borrar IMMEDIATE;
    IF EXISTS (SELECT 1 FROM public.multimedia_por_borrar) THEN
        RAISE EXCEPTION 'FALLA huérfanos: se ha apuntado un archivo que se sigue usando';
    END IF;
    SET CONSTRAINTS public.anotar_multimedia_por_borrar DEFERRED;

    -- 7. Revisión de Jaime: al borrar la tarea, su foto queda apuntada para borrarla del bucket.
    DELETE FROM public.tareas WHERE id = lavarse;
    SET CONSTRAINTS public.anotar_multimedia_por_borrar IMMEDIATE;
    IF NOT EXISTS (SELECT 1 FROM public.multimedia_por_borrar WHERE ruta = lavarse || '/foto/grifo.jpg') THEN
        RAISE EXCEPTION 'FALLA huérfanos: al borrar la tarea no se ha apuntado su foto';
    END IF;

    -- 8. Solo administración ve qué hay que borrar.
    PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000ad01', true);
    IF (SELECT count(*) FROM public.multimedia_huerfana()) <> 0 THEN
        RAISE EXCEPTION 'FALLA huérfanos: alguien que no es admin ve la lista';
    END IF;
    INSERT INTO public.perfiles (id, email, nombre_completo, rol)
    VALUES ('00000000-0000-0000-0000-00000000ad01', 'admin@prueba.es', 'Admin', 'admin');
    IF (SELECT count(*) FROM public.multimedia_huerfana()) <> 1 THEN
        RAISE EXCEPTION 'FALLA huérfanos: administración no ve la foto por borrar';
    END IF;

    RAISE NOTICE 'storage_multimedia_pasos: las 8 comprobaciones pasan';
END $$;

ROLLBACK;
