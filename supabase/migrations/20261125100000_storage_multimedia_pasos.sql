-- ==============================================================================
-- SCRUM-96 · T-10.3 [Backend] Almacenamiento seguro y compresión de archivos multimedia (HU-10)
--
-- Bucket «multimedia-pasos» para las fotos, vídeos y audios de los pasos (28s → 07c, 07d, Audio).
--   - PRIVADO: no hay URL pública. La app pide una URL firmada que caduca (src/servicios/
--     multimediaPasosService.ts) y solo la consigue quien puede ver la tarea (RGPD: en las fotos
--     y vídeos del colegio pueden salir alumnos).
--   - Límite de tamaño y solo tipos de imagen, vídeo y audio. Las fotos llegan ya comprimidas desde
--     la app (src/servicios/compresionMultimedia.ts); vídeo y audio se limitan por tamaño y duración.
--   - Ruta de cada archivo: <tarea_id>/<foto|video|audio>/<nombre>.<ext>. La primera carpeta dice de
--     qué tarea es y las políticas usan puede_ver_tarea / puede_editar_tarea de T-10.1.
--
-- En un PostgreSQL sin Supabase (supabase/tests) no existe el esquema storage: no se hace nada.
-- ==============================================================================

-- Tarea a la que pertenece un archivo según su ruta (NULL si la ruta no empieza por un UUID).
CREATE OR REPLACE FUNCTION public.tarea_de_ruta_multimedia(p_ruta TEXT)
RETURNS UUID
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN split_part(p_ruta, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             AND split_part(p_ruta, '/', 2) IN ('foto', 'video', 'audio')
             AND split_part(p_ruta, '/', 3) <> ''
            THEN split_part(p_ruta, '/', 1)::UUID
    END;
$$;

COMMENT ON FUNCTION public.tarea_de_ruta_multimedia(TEXT) IS
    'SCRUM-96 (HU-10): UUID de la tarea dueña de un archivo del bucket multimedia-pasos.';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage')
       OR to_regclass('storage.buckets') IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'multimedia-pasos',
        'multimedia-pasos',
        false,
        52428800, -- 50 MB: el máximo de un vídeo corto; fotos y audios tienen límites menores en la app
        ARRAY[
            'image/jpeg', 'image/png', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime',
            'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm', 'audio/ogg', 'audio/wav'
        ]
    )
    ON CONFLICT (id) DO UPDATE SET
        public = false,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;

    DROP POLICY IF EXISTS "Multimedia pasos: ver si se ve la tarea" ON storage.objects;
    DROP POLICY IF EXISTS "Multimedia pasos: subir si se edita la tarea" ON storage.objects;
    DROP POLICY IF EXISTS "Multimedia pasos: cambiar si se edita la tarea" ON storage.objects;
    DROP POLICY IF EXISTS "Multimedia pasos: borrar si se edita la tarea" ON storage.objects;

    CREATE POLICY "Multimedia pasos: ver si se ve la tarea" ON storage.objects
        FOR SELECT TO authenticated
        USING (
            bucket_id = 'multimedia-pasos'
            AND public.puede_ver_tarea(public.tarea_de_ruta_multimedia(name))
        );

    CREATE POLICY "Multimedia pasos: subir si se edita la tarea" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (
            bucket_id = 'multimedia-pasos'
            AND public.puede_editar_tarea(public.tarea_de_ruta_multimedia(name))
        );

    CREATE POLICY "Multimedia pasos: cambiar si se edita la tarea" ON storage.objects
        FOR UPDATE TO authenticated
        USING (
            bucket_id = 'multimedia-pasos'
            AND public.puede_editar_tarea(public.tarea_de_ruta_multimedia(name))
        );

    CREATE POLICY "Multimedia pasos: borrar si se edita la tarea" ON storage.objects
        FOR DELETE TO authenticated
        USING (
            bucket_id = 'multimedia-pasos'
            AND public.puede_editar_tarea(public.tarea_de_ruta_multimedia(name))
        );
END $$;

-- Las rutas guardadas en recursos_multimedia tienen que ser de la misma tarea que el paso: así
-- nadie puede «colgar» de su paso un archivo de una tarea que no puede ver.
CREATE OR REPLACE FUNCTION public.recursos_multimedia_ruta_de_su_tarea()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.ruta_storage IS NOT NULL AND public.tarea_de_ruta_multimedia(NEW.ruta_storage) IS DISTINCT FROM (
        SELECT tarea_id FROM public.pasos_tarea WHERE id = NEW.paso_id
    ) THEN
        RAISE EXCEPTION 'El archivo % no es de la tarea de este paso', NEW.ruta_storage
            USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recursos_multimedia_ruta_de_su_tarea ON public.recursos_multimedia;
CREATE TRIGGER recursos_multimedia_ruta_de_su_tarea
    BEFORE INSERT OR UPDATE ON public.recursos_multimedia
    FOR EACH ROW EXECUTE FUNCTION public.recursos_multimedia_ruta_de_su_tarea();
