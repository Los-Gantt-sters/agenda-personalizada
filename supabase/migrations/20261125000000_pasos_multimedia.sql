-- ==============================================================================
-- SCRUM-94 · T-10.1 [Base de Datos] Modelo relacional de pasos ordenados por tarea (HU-10)
-- Pantallas 07-07d y 07f (alumno) y 28s (editor de pasos del tutor y la familia).
--
-- Cada paso tiene (28s):
--   - título corto («Abre el grifo») y texto en Lectura Fácil («Gira el grifo despacio...», 07b);
--   - pictograma ARASAAC o propio (07);
--   - foto real, vídeo y audio (07c, 07d y el botón Audio), guardados como recursos_multimedia en
--     el bucket privado de T-10.3 (20261125100000_storage_multimedia_pasos.sql).
-- La tarea guarda qué formatos puede elegir el alumno (cambios 17-11: «se mostrarán los que el
-- profesor le dé permiso»).
--
-- Cambios sobre el esquema de T-T01.2:
--   1. pasos_tarea: titulo, texto sin límite, pictograma_id/origen, orden único por tarea.
--   2. recursos_multimedia: ruta en Storage, tipo MIME, tamaño y duración; un recurso por tipo y paso.
--   3. tareas.formatos_permitidos.
--   4. Permisos: los pasos se ven si se ve la tarea y se editan con las mismas reglas que la tarea
--      (tutor → ámbito centro, familia → ámbito hogar, admin → todo).
--   5. guardar_pasos(): guarda de una vez todo lo del editor 28s («Guardar» → 28ok).
--   6. secuencia_dia(): los pasos llegan a la agenda con título, texto y multimedia.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Pasos
-- ------------------------------------------------------------------------------
ALTER TABLE public.pasos_tarea ADD COLUMN IF NOT EXISTS titulo VARCHAR(80);
-- Hasta ahora «texto» era la frase corta del paso: pasa a ser el título si no lo había.
UPDATE public.pasos_tarea SET titulo = LEFT(texto, 80) WHERE titulo IS NULL;
ALTER TABLE public.pasos_tarea ALTER COLUMN titulo SET NOT NULL;

-- Lo que ya inserta pasos solo con «texto» (seed.sql, pruebas de SCRUM-71) sigue funcionando:
-- si no llega título, se usa el principio del texto.
CREATE OR REPLACE FUNCTION public.pasos_tarea_titulo_por_defecto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.titulo IS NULL OR btrim(NEW.titulo) = '' THEN
        NEW.titulo := LEFT(NEW.texto, 80);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pasos_tarea_titulo_por_defecto ON public.pasos_tarea;
CREATE TRIGGER pasos_tarea_titulo_por_defecto
    BEFORE INSERT OR UPDATE ON public.pasos_tarea
    FOR EACH ROW EXECUTE FUNCTION public.pasos_tarea_titulo_por_defecto();

-- «texto» es ahora la explicación en Lectura Fácil (07b): puede ser más larga que 255.
ALTER TABLE public.pasos_tarea ALTER COLUMN texto TYPE TEXT;

-- imagen_url sigue siendo la URL del pictograma (así la lee secuencia_dia desde SCRUM-71).
ALTER TABLE public.pasos_tarea ADD COLUMN IF NOT EXISTS pictograma_id INTEGER;
ALTER TABLE public.pasos_tarea ADD COLUMN IF NOT EXISTS pictograma_origen VARCHAR(20)
    NOT NULL DEFAULT 'arasaac' CHECK (pictograma_origen IN ('arasaac', 'propio'));
ALTER TABLE public.pasos_tarea ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.pasos_tarea DROP CONSTRAINT IF EXISTS pasos_tarea_orden_positivo;
ALTER TABLE public.pasos_tarea ADD CONSTRAINT pasos_tarea_orden_positivo CHECK (orden >= 1);

-- Dos pasos de la misma tarea no pueden tener el mismo número. DEFERRABLE para poder reordenar
-- (subir/bajar en 28s) dentro de una transacción sin chocar a medio camino.
ALTER TABLE public.pasos_tarea DROP CONSTRAINT IF EXISTS pasos_tarea_orden_unico;
ALTER TABLE public.pasos_tarea ADD CONSTRAINT pasos_tarea_orden_unico
    UNIQUE (tarea_id, orden) DEFERRABLE INITIALLY IMMEDIATE;

COMMENT ON COLUMN public.pasos_tarea.titulo IS 'HU-10 (28s): título corto del paso, se ve debajo del pictograma (07).';
COMMENT ON COLUMN public.pasos_tarea.texto IS 'HU-10 (28s): texto del paso en Lectura Fácil (07b).';
COMMENT ON COLUMN public.pasos_tarea.imagen_url IS 'URL del pictograma del paso (ARASAAC o propio).';

-- ------------------------------------------------------------------------------
-- 2. Recursos multimedia de cada paso (foto, vídeo y audio)
-- ------------------------------------------------------------------------------
-- Los archivos subidos no tienen URL pública: se guardan por ruta en el bucket privado
-- «multimedia-pasos» y la app pide una URL firmada de corta duración para verlos (T-10.3).
ALTER TABLE public.recursos_multimedia ALTER COLUMN archivo_url DROP NOT NULL;
ALTER TABLE public.recursos_multimedia ADD COLUMN IF NOT EXISTS ruta_storage TEXT;
ALTER TABLE public.recursos_multimedia ADD COLUMN IF NOT EXISTS tipo_mime VARCHAR(100);
ALTER TABLE public.recursos_multimedia ADD COLUMN IF NOT EXISTS tamano_bytes BIGINT CHECK (tamano_bytes > 0);
ALTER TABLE public.recursos_multimedia ADD COLUMN IF NOT EXISTS duracion_segundos INTEGER CHECK (duracion_segundos >= 0);
ALTER TABLE public.recursos_multimedia ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.recursos_multimedia DROP CONSTRAINT IF EXISTS recursos_multimedia_origen_archivo;
ALTER TABLE public.recursos_multimedia ADD CONSTRAINT recursos_multimedia_origen_archivo
    CHECK (archivo_url IS NOT NULL OR ruta_storage IS NOT NULL);

-- Un paso tiene como mucho una foto, un vídeo y un audio (28s: «Subir foto», «Subir vídeo»...).
ALTER TABLE public.recursos_multimedia DROP CONSTRAINT IF EXISTS recursos_multimedia_uno_por_tipo;
ALTER TABLE public.recursos_multimedia ADD CONSTRAINT recursos_multimedia_uno_por_tipo
    UNIQUE (paso_id, tipo);

COMMENT ON COLUMN public.recursos_multimedia.ruta_storage IS
    'HU-10 (T-10.3): ruta del archivo en el bucket privado multimedia-pasos (<tarea>/<paso>/<archivo>).';

-- ------------------------------------------------------------------------------
-- 3. Formatos que el alumno puede elegir en 07 (los 5 botones de debajo del paso)
-- ------------------------------------------------------------------------------
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS formatos_permitidos TEXT[]
    NOT NULL DEFAULT ARRAY['pictograma', 'texto', 'foto', 'video', 'audio'];
ALTER TABLE public.tareas DROP CONSTRAINT IF EXISTS tareas_formatos_permitidos_validos;
ALTER TABLE public.tareas ADD CONSTRAINT tareas_formatos_permitidos_validos CHECK (
    formatos_permitidos <@ ARRAY['pictograma', 'texto', 'foto', 'video', 'audio']
    AND cardinality(formatos_permitidos) >= 1
);

-- ------------------------------------------------------------------------------
-- 4. Permisos de pasos y multimedia
-- ------------------------------------------------------------------------------
-- Las mismas reglas que «Tareas: Actualización segregada por ámbito», más el catálogo común
-- (tareas sin alumno) para tutores. SECURITY DEFINER para poder usarla también en las políticas
-- de storage.objects (T-10.3) sin depender de las políticas de tareas.
CREATE OR REPLACE FUNCTION public.puede_editar_tarea(p_tarea UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.tareas t
        WHERE t.id = p_tarea
          AND (
              public.is_admin()
              OR (t.alumno_id IS NULL AND public.auth_user_role() = 'tutor_docente')
              OR (public.is_tutor_docente_of_student(t.alumno_id) AND t.ambito = 'centro')
              OR (public.is_familiar_of_student(t.alumno_id) AND t.ambito = 'hogar')
          )
    );
$$;

-- Alumno con el que ha entrado el usuario de la sesión (RGPD). El inicio de sesión visual
-- (SCRUM-51, authService.signInEstudianteConDibujos) usa el correo técnico
-- «alu-<id del alumno>@alumnos.agensible»; el alumno no puede cambiar su correo
-- (trigger de SCRUM-278). NULL si la sesión no es de un alumno o no cuadra con ninguno.
CREATE OR REPLACE FUNCTION public.alumno_de_sesion()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT a.id
    FROM public.perfiles p
    JOIN public.alumnos a
      ON lower(p.email) = 'alu-' || a.id::text || '@alumnos.agensible'
    WHERE p.id = auth.uid()
      AND p.rol = 'estudiante'
      AND p.activo
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.alumno_de_sesion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alumno_de_sesion() TO authenticated;

-- Quién puede ver la tarea: tutor y familia con las reglas de «Tareas: Lectura segregada RGPD» y
-- el alumno SOLO sus tareas (las suyas o las que tiene asignadas), nunca las de otros alumnos ni
-- las del hogar de otras familias (revisión de Jaime, RGPD).
CREATE OR REPLACE FUNCTION public.puede_ver_tarea(p_tarea UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.tareas t
        WHERE t.id = p_tarea
          AND (
              public.is_admin()
              OR (t.alumno_id IS NULL AND public.auth_user_role() IN ('tutor_docente', 'admin'))
              OR (public.is_tutor_docente_of_student(t.alumno_id) AND t.ambito = 'centro')
              OR (public.is_familiar_of_student(t.alumno_id) AND t.ambito = 'hogar')
              OR (
                  public.alumno_de_sesion() IS NOT NULL
                  AND (
                      t.alumno_id = public.alumno_de_sesion()
                      OR EXISTS (
                          SELECT 1 FROM public.asignaciones asg
                          WHERE asg.tarea_id = t.id
                            AND asg.estudiante_id = public.alumno_de_sesion()
                      )
                  )
              )
          )
    );
$$;

REVOKE ALL ON FUNCTION public.puede_editar_tarea(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_ver_tarea(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.puede_editar_tarea(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.puede_ver_tarea(UUID) TO authenticated;

-- Antes cualquier tutor podía cambiar los pasos de cualquier tarea y la familia ninguno.
DROP POLICY IF EXISTS "Pasos: Lectura autenticados" ON public.pasos_tarea;
DROP POLICY IF EXISTS "Pasos: Modificación tutores o admin" ON public.pasos_tarea;
DROP POLICY IF EXISTS "Multimedia: Lectura autenticados" ON public.recursos_multimedia;
DROP POLICY IF EXISTS "Multimedia: Modificación tutores o admin" ON public.recursos_multimedia;

CREATE POLICY "Pasos: Lectura si se ve la tarea" ON public.pasos_tarea FOR SELECT TO authenticated
    USING (public.puede_ver_tarea(tarea_id));
CREATE POLICY "Pasos: Modificación según ámbito de la tarea" ON public.pasos_tarea FOR ALL TO authenticated
    USING (public.puede_editar_tarea(tarea_id))
    WITH CHECK (public.puede_editar_tarea(tarea_id));

CREATE POLICY "Multimedia: Lectura si se ve la tarea" ON public.recursos_multimedia FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.pasos_tarea p
        WHERE p.id = paso_id AND public.puede_ver_tarea(p.tarea_id)
    ));
CREATE POLICY "Multimedia: Modificación según ámbito de la tarea" ON public.recursos_multimedia FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.pasos_tarea p
        WHERE p.id = paso_id AND public.puede_editar_tarea(p.tarea_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.pasos_tarea p
        WHERE p.id = paso_id AND public.puede_editar_tarea(p.tarea_id)
    ));

-- ------------------------------------------------------------------------------
-- 5. guardar_pasos: «Guardar» del editor 28s
-- ------------------------------------------------------------------------------
-- Recibe la lista completa de pasos en el orden en que deben quedar y la deja así en una sola
-- transacción: crea los nuevos, actualiza los que ya existían, borra los que se han quitado y
-- renumera 1..N. Para cada paso, foto/vídeo/audio:
--   - si no viene la clave, no se toca;
--   - si viene null, se quita;
--   - si viene un objeto { ruta, tipo_mime, tamano_bytes, duracion_segundos }, se guarda.
-- Formato de p_pasos:
--   [{ "id": uuid|null, "titulo": "...", "texto": "...", "pictograma_id": 1234|null,
--      "pictograma_url": "...", "pictograma_origen": "arasaac"|"propio",
--      "foto": {...}|null, "video": {...}|null, "audio": {...}|null }, ...]
-- SECURITY INVOKER: las políticas RLS de arriba deciden si se puede.
-- Una URL externa (pictograma o archivo que no está en el bucket) solo vale si es https:// y no
-- lleva espacios ni comillas: así no se cuelan javascript:, data: ni http sin cifrar (revisión de Jaime).
CREATE OR REPLACE FUNCTION public.es_url_externa_valida(p_url TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT p_url IS NULL
        OR (length(p_url) <= 2048 AND p_url ~* '^https://[a-z0-9.-]+(:[0-9]+)?(/[^\s"''<>]*)?$');
$$;

CREATE OR REPLACE FUNCTION public.guardar_pasos(p_tarea UUID, p_pasos JSONB)
RETURNS SETOF public.pasos_tarea
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_paso    JSONB;
    v_orden   INTEGER := 0;
    v_id      UUID;
    v_ids     UUID[] := ARRAY[]::UUID[];
    v_formato TEXT;
    v_tipo    TEXT;
    v_rec     JSONB;
BEGIN
    IF NOT public.puede_editar_tarea(p_tarea) THEN
        RAISE EXCEPTION 'No tienes permiso para cambiar los pasos de esta tarea'
            USING ERRCODE = '42501';
    END IF;
    IF jsonb_typeof(p_pasos) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Los pasos tienen que venir en una lista' USING ERRCODE = '22023';
    END IF;

    SET CONSTRAINTS public.pasos_tarea_orden_unico DEFERRED;

    -- Se apartan los números actuales para que no choquen con 1..N mientras se renumera.
    UPDATE public.pasos_tarea SET orden = orden + 100000 WHERE tarea_id = p_tarea;

    FOR v_paso IN SELECT value FROM jsonb_array_elements(p_pasos) LOOP
        v_orden := v_orden + 1;
        IF COALESCE(btrim(v_paso->>'titulo'), '') = '' THEN
            RAISE EXCEPTION 'El paso % no tiene título', v_orden USING ERRCODE = '23502';
        END IF;

        IF NOT public.es_url_externa_valida(v_paso->>'pictograma_url') THEN
            RAISE EXCEPTION 'El pictograma del paso % no tiene una dirección https válida', v_orden
                USING ERRCODE = '22023';
        END IF;

        v_id := NULLIF(v_paso->>'id', '')::UUID;
        IF v_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.pasos_tarea WHERE id = v_id AND tarea_id = p_tarea
        ) THEN
            RAISE EXCEPTION 'El paso % no es de esta tarea', v_id USING ERRCODE = '22023';
        END IF;

        IF v_id IS NULL THEN
            INSERT INTO public.pasos_tarea (
                tarea_id, orden, titulo, texto, imagen_url, pictograma_id, pictograma_origen
            ) VALUES (
                p_tarea, v_orden, btrim(v_paso->>'titulo'),
                COALESCE(NULLIF(btrim(v_paso->>'texto'), ''), btrim(v_paso->>'titulo')),
                v_paso->>'pictograma_url', NULLIF(v_paso->>'pictograma_id', '')::INTEGER,
                COALESCE(v_paso->>'pictograma_origen', 'arasaac')
            )
            RETURNING id INTO v_id;
        ELSE
            UPDATE public.pasos_tarea SET
                orden = v_orden,
                titulo = btrim(v_paso->>'titulo'),
                texto = COALESCE(NULLIF(btrim(v_paso->>'texto'), ''), btrim(v_paso->>'titulo')),
                imagen_url = v_paso->>'pictograma_url',
                pictograma_id = NULLIF(v_paso->>'pictograma_id', '')::INTEGER,
                pictograma_origen = COALESCE(v_paso->>'pictograma_origen', 'arasaac'),
                actualizado_en = NOW()
            WHERE id = v_id;
        END IF;
        v_ids := v_ids || v_id;

        -- Foto, vídeo y audio (en el esquema la foto es el tipo «imagen»)
        FOREACH v_formato IN ARRAY ARRAY['foto', 'video', 'audio'] LOOP
            CONTINUE WHEN NOT (v_paso ? v_formato);
            v_tipo := CASE v_formato WHEN 'foto' THEN 'imagen' ELSE v_formato END;
            v_rec := v_paso->v_formato;
            IF v_rec IS NOT NULL AND jsonb_typeof(v_rec) = 'object'
               AND NOT public.es_url_externa_valida(v_rec->>'url') THEN
                RAISE EXCEPTION 'El archivo del paso % no tiene una dirección https válida', v_orden
                    USING ERRCODE = '22023';
            END IF;
            IF v_rec IS NULL OR jsonb_typeof(v_rec) = 'null' THEN
                DELETE FROM public.recursos_multimedia WHERE paso_id = v_id AND tipo = v_tipo;
            ELSE
                INSERT INTO public.recursos_multimedia (
                    paso_id, tipo, ruta_storage, archivo_url, tipo_mime, tamano_bytes,
                    duracion_segundos, descripcion_alternativa, origen
                ) VALUES (
                    v_id, v_tipo, v_rec->>'ruta', v_rec->>'url', v_rec->>'tipo_mime',
                    NULLIF(v_rec->>'tamano_bytes', '')::BIGINT,
                    NULLIF(v_rec->>'duracion_segundos', '')::INTEGER,
                    v_rec->>'descripcion', CASE v_formato WHEN 'audio' THEN 'grabacion' ELSE 'propio' END
                )
                ON CONFLICT (paso_id, tipo) DO UPDATE SET
                    ruta_storage = EXCLUDED.ruta_storage,
                    archivo_url = EXCLUDED.archivo_url,
                    tipo_mime = EXCLUDED.tipo_mime,
                    tamano_bytes = EXCLUDED.tamano_bytes,
                    duracion_segundos = EXCLUDED.duracion_segundos,
                    descripcion_alternativa = EXCLUDED.descripcion_alternativa,
                    actualizado_en = NOW();
            END IF;
        END LOOP;
    END LOOP;

    -- Los pasos que ya no están en la lista se han quitado en el editor.
    DELETE FROM public.pasos_tarea WHERE tarea_id = p_tarea AND NOT (id = ANY (v_ids));

    SET CONSTRAINTS public.pasos_tarea_orden_unico IMMEDIATE;

    UPDATE public.tareas SET actualizado_en = NOW() WHERE id = p_tarea;

    RETURN QUERY SELECT * FROM public.pasos_tarea WHERE tarea_id = p_tarea ORDER BY orden;
END;
$$;

COMMENT ON FUNCTION public.guardar_pasos(UUID, JSONB) IS
    'SCRUM-94 (HU-10, 28s): guarda en una transacción los pasos de una tarea en el orden dado, con su multimedia.';

REVOKE ALL ON FUNCTION public.guardar_pasos(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_pasos(UUID, JSONB) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. pasos_de_tarea y secuencia_dia: los pasos con título, texto y multimedia
-- ------------------------------------------------------------------------------
-- Formato de cada paso (el de PasoTarea en src/componentes/agenda/tipos.ts):
--   { id, orden, titulo, texto, pictograma_url, pictograma_id, pictograma_origen,
--     foto: { ruta, url, tipo_mime, tamano_bytes, duracion_segundos } | null, video: ..., audio: ... }
CREATE OR REPLACE FUNCTION public.recurso_json(r public.recursos_multimedia)
RETURNS JSONB
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT jsonb_build_object(
        'ruta', r.ruta_storage,
        'url', r.archivo_url,
        'tipo_mime', r.tipo_mime,
        'tamano_bytes', r.tamano_bytes,
        'duracion_segundos', r.duracion_segundos,
        'descripcion', r.descripcion_alternativa
    );
$$;

CREATE OR REPLACE FUNCTION public.pasos_de_tarea(p_tarea UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'orden', p.orden,
                'titulo', p.titulo,
                'texto', p.texto,
                'pictograma_url', p.imagen_url,
                'pictograma_id', p.pictograma_id,
                'pictograma_origen', p.pictograma_origen,
                'foto', (SELECT public.recurso_json(r) FROM public.recursos_multimedia r
                         WHERE r.paso_id = p.id AND r.tipo = 'imagen'),
                'video', (SELECT public.recurso_json(r) FROM public.recursos_multimedia r
                          WHERE r.paso_id = p.id AND r.tipo = 'video'),
                'audio', (SELECT public.recurso_json(r) FROM public.recursos_multimedia r
                          WHERE r.paso_id = p.id AND r.tipo = 'audio')
            )
            ORDER BY p.orden
        ),
        '[]'::jsonb
    )
    FROM public.pasos_tarea p
    WHERE p.tarea_id = p_tarea;
$$;

REVOKE ALL ON FUNCTION public.pasos_de_tarea(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pasos_de_tarea(UUID) TO authenticated;

-- La misma secuencia_dia de 20261124230000_requiere_inicio_fin.sql (SCRUM-71, SCRUM-265 y
-- SCRUM-225: motivo de pendiente, «Empezar» obligatorio y horas reales de ejecuciones). Solo cambia
-- lo de HU-10 dentro de «tarea»: los pasos completos (pasos_de_tarea) y formatos_permitidos.
-- DROP antes de crear: CREATE OR REPLACE no deja cambiar lo que devuelve una función (revisión de
-- Jaime).
DROP FUNCTION IF EXISTS public.secuencia_dia(UUID, DATE);

CREATE FUNCTION public.secuencia_dia(p_estudiante UUID, p_fecha DATE)
RETURNS TABLE (
    id UUID,
    estudiante_id UUID,
    tarea_id UUID,
    fecha DATE,
    hora_inicio TIME,
    duracion_prevista_min INTEGER,
    orden INTEGER,
    estado TEXT,
    tarea JSONB,
    pendiente_motivo TEXT,
    requiere_inicio_fin BOOLEAN,
    inicio_real TIMESTAMPTZ,
    fin_real TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT
        a.id,
        a.estudiante_id,
        a.tarea_id,
        a.fecha,
        -- La hora de la asignación manda; si no tiene, la de la tarea
        COALESCE(a.hora_inicio, t.hora_inicio) AS hora_inicio,
        -- Si la asignación fija inicio y fin, la duración sale de ahí; si no, la estimada de la tarea
        public.duracion_asignacion_min(a.hora_inicio, a.hora_fin, t.duracion_estimada_minutos)
            AS duracion_prevista_min,
        a.orden,
        -- Estados del esquema → estados de la agenda (pendiente, en_curso, hecha, bloqueada)
        CASE a.estado
            WHEN 'hecho' THEN 'hecha'
            WHEN 'completada' THEN 'hecha'
            ELSE a.estado
        END AS estado,
        jsonb_build_object(
            'id', t.id,
            'titulo', t.titulo,
            'pictograma_url', t.pictograma_url,
            'descripcion', t.descripcion,
            -- HU-10: formatos que puede elegir el alumno y pasos con título, texto y multimedia
            'formatos_permitidos', to_jsonb(t.formatos_permitidos),
            'pasos', public.pasos_de_tarea(t.id)
        ) AS tarea,
        a.pendiente_motivo::TEXT AS pendiente_motivo,
        a.requiere_inicio_fin,
        -- RI6.1: horas reales de «Empezar» y «Terminar». ejecuciones.asignacion_id es UNIQUE, así que
        -- el LEFT JOIN no repite filas; si la tarea no se ha empezado, salen NULL.
        e.inicio AS inicio_real,
        e.fin AS fin_real
    FROM public.asignaciones a
    JOIN public.tareas t ON t.id = a.tarea_id
    LEFT JOIN public.ejecuciones e ON e.asignacion_id = a.id
    WHERE a.estudiante_id = p_estudiante
      AND a.fecha = p_fecha
      AND a.estado <> 'cancelada'
      AND t.activo
    ORDER BY COALESCE(a.hora_inicio, t.hora_inicio) NULLS LAST, a.orden, a.id;
$$;

COMMENT ON FUNCTION public.secuencia_dia(UUID, DATE) IS
    'SCRUM-71 (RF4.1), SCRUM-265, SCRUM-225 y SCRUM-94 (HU-10): tareas del día de un estudiante en orden cronológico, con sus pasos multimedia y el formato EntradaAgenda de la agenda.';

REVOKE ALL ON FUNCTION public.secuencia_dia(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.secuencia_dia(UUID, DATE) TO authenticated;

-- Realtime (RF4.7): si el tutor cambia la foto o el vídeo de un paso, la tableta se entera.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
           SELECT 1 FROM pg_publication_tables
           WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
             AND tablename = 'recursos_multimedia'
       ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.recursos_multimedia;
    END IF;
END $$;
