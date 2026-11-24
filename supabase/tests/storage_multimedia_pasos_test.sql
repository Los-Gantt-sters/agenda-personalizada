-- Pruebas de la migración 20261125100000_storage_multimedia_pasos.sql (SCRUM-96 · T-10.3, HU-10).
-- En un PostgreSQL normal no hay esquema storage, así que se prueba lo que deciden las políticas
-- del bucket: de qué tarea es cada ruta y que un paso no pueda apuntar a archivos de otra tarea.
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
BEGIN;

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

    RAISE NOTICE 'storage_multimedia_pasos: las 5 comprobaciones pasan';
END $$;

ROLLBACK;
