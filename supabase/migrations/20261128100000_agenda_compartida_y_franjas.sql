-- ==============================================================================
-- SCRUM-144 (HU-25) · Agenda completa para tutor y familia, y tramos horarios para poner tareas
--
-- Regla del centro (aclarada por el equipo el 25/11/2026):
--   · Tutor y familia ven la agenda COMPLETA del alumno: lo que hace en el colegio y en casa.
--   · Lo que se reparte es el horario en el que cada uno puede poner tareas, para que no se pisen:
--       - De 08:00 a 15:00 (mañana, horario lectivo): solo el tutor (y los especialistas).
--       - De 15:00 a 08:00 (tarde, noche y madrugada): solo la familia.
--     Es lo mismo que ya hace la pantalla 28c «Programar horario» (SCRUM-91).
--
-- 1. Lectura. La política «Tareas: Lectura segregada RGPD» (schema_inicial.sql) solo dejaba ver al
--    tutor las tareas de clase y a la familia las de casa. Se sustituye por «Tareas: Lectura de la
--    agenda completa»: quien supervisa al alumno ve todas sus tareas y también las del catálogo
--    común que tiene asignadas. Lo demás no cambia (administración, catálogo para tutores y alumno).
--    Con esto, secuencia_dia (la agenda) devuelve a los dos adultos las tareas de los dos ámbitos.
--    Las políticas de escritura de «tareas» (crear, cambiar y borrar la definición de una tarea por
--    ámbito) no se tocan.
--
-- 2. Escritura por tramos. Un disparador en «asignaciones» comprueba, al poner una tarea en la
--    agenda, al cambiarle el día o la hora y al quitarla, que la franja es la de quien lo hace. La franja
--    sale de la hora de inicio y de fin (si no hay fin, inicio + duración estimada de la tarea); una
--    tarea que pasa de un tramo a otro (p. ej. de 14:30 a 15:30) no la puede poner ninguno de los dos.
--    Si la tarea no tiene hora, vale su ámbito: «centro» es del tutor y «hogar» de la familia.
--    No afecta a los cambios de estado (Empezar, Terminar, bloquear, Plan B), ni a administración,
--    ni al alumno, ni a lo que se hace sin sesión (editor SQL, service_role, pg_cron).
--
-- 3. puede_ver_tarea (pasos de la tarea, migración de pasos de SCRUM-94): si existe, se rehace con
--    la misma regla de lectura para que los dos adultos vean también los pasos.
-- ==============================================================================

-- ---- 1. Lectura de la agenda completa ----------------------------------------

/** true si quien llama supervisa al alumno de la tarea o a un alumno que la tiene asignada. */
CREATE OR REPLACE FUNCTION public.supervisa_tarea(p_tarea UUID, p_alumno UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT (p_alumno IS NOT NULL
            AND (public.is_tutor_docente_of_student(p_alumno)
                 OR public.is_familiar_of_student(p_alumno)))
        OR EXISTS (
            SELECT 1
            FROM public.asignaciones a
            WHERE a.tarea_id = p_tarea
              AND (public.is_tutor_docente_of_student(a.estudiante_id)
                   OR public.is_familiar_of_student(a.estudiante_id))
        );
$$;

COMMENT ON FUNCTION public.supervisa_tarea(UUID, UUID) IS
    'SCRUM-144: true si quien llama es tutor, especialista o familia del alumno de la tarea o de un alumno que la tiene asignada.';

REVOKE ALL ON FUNCTION public.supervisa_tarea(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.supervisa_tarea(UUID, UUID) TO authenticated;

DROP POLICY IF EXISTS "Tareas: Lectura segregada RGPD" ON public.tareas;
DROP POLICY IF EXISTS "Tareas: Lectura de la agenda completa" ON public.tareas;
CREATE POLICY "Tareas: Lectura de la agenda completa" ON public.tareas FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR (alumno_id IS NULL AND public.auth_user_role() IN ('tutor_docente', 'admin')) -- Catálogo común
        OR public.supervisa_tarea(id, alumno_id) -- Tutor y familia: clase y casa
        OR (public.auth_user_role() = 'estudiante')
    );

-- ---- 2. Tramos horarios para poner tareas ------------------------------------

/**
 * Tramo de una franja horaria: «manana» (08:00 a 15:00, tutor), «tarde» (15:00 a 08:00, familia)
 * o «mixta» si pasa de uno a otro. NULL si no hay hora de inicio.
 */
CREATE OR REPLACE FUNCTION public.tramo_horario(p_inicio TIME, p_fin TIME)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
    fin TIME := NULLIF(p_fin, p_inicio); -- una duración de 0 minutos es como no tener fin
BEGIN
    IF p_inicio IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_inicio >= '08:00' AND p_inicio < '15:00' THEN
        RETURN CASE WHEN fin IS NULL OR (fin > p_inicio AND fin <= '15:00') THEN 'manana' ELSE 'mixta' END;
    END IF;
    IF fin IS NULL THEN
        RETURN 'tarde';
    END IF;
    -- Empieza por la tarde: puede acabar más tarde el mismo día o pasada la medianoche hasta las 08:00
    IF p_inicio >= '15:00' AND (fin > p_inicio OR fin <= '08:00') THEN
        RETURN 'tarde';
    END IF;
    -- Empieza de madrugada: tiene que acabar como muy tarde a las 08:00
    IF p_inicio < '08:00' AND fin > p_inicio AND fin <= '08:00' THEN
        RETURN 'tarde';
    END IF;
    RETURN 'mixta';
END;
$$;

COMMENT ON FUNCTION public.tramo_horario(TIME, TIME) IS
    'SCRUM-144: manana (08:00-15:00, tutor), tarde (15:00-08:00, familia) o mixta si pasa de un tramo a otro.';

/** Tramo de una asignación, con la hora y la duración de su tarea si la asignación no las fija. */
CREATE OR REPLACE FUNCTION public.tramo_de_asignacion(p_tarea UUID, p_inicio TIME, p_fin TIME)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    t RECORD;
    inicio TIME;
    fin TIME;
BEGIN
    SELECT hora_inicio, hora_fin, duracion_estimada_minutos, ambito
    INTO t
    FROM public.tareas
    WHERE id = p_tarea;

    inicio := COALESCE(p_inicio, t.hora_inicio);
    IF inicio IS NULL THEN
        -- Sin hora: manda el ámbito de la tarea
        RETURN CASE WHEN t.ambito = 'hogar' THEN 'tarde' ELSE 'manana' END;
    END IF;
    fin := COALESCE(
        p_fin,
        CASE WHEN p_inicio IS NULL THEN t.hora_fin END,
        inicio + make_interval(mins => COALESCE(t.duracion_estimada_minutos, 0))
    );
    RETURN public.tramo_horario(inicio, fin);
END;
$$;

REVOKE ALL ON FUNCTION public.tramo_de_asignacion(UUID, TIME, TIME) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tramo_de_asignacion(UUID, TIME, TIME) TO authenticated;

CREATE OR REPLACE FUNCTION public.comprobar_tramo_asignacion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    rol TEXT;
    tramo_propio TEXT;
    aviso TEXT;
BEGIN
    -- Sin sesión (editor SQL, service_role, pg_cron) o administración: sin límite de horario
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    rol := public.auth_user_role();
    tramo_propio := CASE
        WHEN rol IN ('tutor_docente', 'especialista') THEN 'manana'
        WHEN rol = 'familiar' THEN 'tarde'
    END;
    IF tramo_propio IS NULL THEN
        RETURN COALESCE(NEW, OLD); -- el alumno y otros roles no tienen tramo
    END IF;
    -- Un cambio que no toca el día, la hora ni la tarea (p. ej. el estado) no depende del tramo,
    -- aunque la app reenvíe esas columnas con el mismo valor
    IF TG_OP = 'UPDATE'
       AND (NEW.fecha, NEW.hora_inicio, NEW.hora_fin, NEW.tarea_id, NEW.estudiante_id)
           IS NOT DISTINCT FROM (OLD.fecha, OLD.hora_inicio, OLD.hora_fin, OLD.tarea_id, OLD.estudiante_id) THEN
        RETURN NEW;
    END IF;
    aviso := CASE tramo_propio
        WHEN 'manana' THEN 'El tutor solo puede poner tareas de 08:00 a 15:00; de 15:00 a 08:00 las pone la familia.'
        ELSE 'La familia solo puede poner tareas de 15:00 a 08:00; de 08:00 a 15:00 las pone el tutor.'
    END;

    -- La tarea que se cambia o se quita tiene que estar en su tramo…
    IF TG_OP IN ('UPDATE', 'DELETE')
       AND public.tramo_de_asignacion(OLD.tarea_id, OLD.hora_inicio, OLD.hora_fin)
           IS DISTINCT FROM tramo_propio THEN
        RAISE EXCEPTION '%', aviso USING ERRCODE = '42501';
    END IF;
    -- …y donde queda, también
    IF TG_OP IN ('INSERT', 'UPDATE')
       AND public.tramo_de_asignacion(NEW.tarea_id, NEW.hora_inicio, NEW.hora_fin)
           IS DISTINCT FROM tramo_propio THEN
        RAISE EXCEPTION '%', aviso USING ERRCODE = '42501';
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.comprobar_tramo_asignacion() IS
    'SCRUM-144: el tutor pone, mueve y quita tareas de 08:00 a 15:00 y la familia de 15:00 a 08:00.';

DROP TRIGGER IF EXISTS trg_asignaciones_tramo_alta ON public.asignaciones;
CREATE TRIGGER trg_asignaciones_tramo_alta
    BEFORE INSERT ON public.asignaciones
    FOR EACH ROW EXECUTE FUNCTION public.comprobar_tramo_asignacion();

-- Solo al cambiar el día, la hora o la tarea: los cambios de estado no dependen del tramo
DROP TRIGGER IF EXISTS trg_asignaciones_tramo_cambio ON public.asignaciones;
CREATE TRIGGER trg_asignaciones_tramo_cambio
    BEFORE UPDATE OF fecha, hora_inicio, hora_fin, tarea_id, estudiante_id ON public.asignaciones
    FOR EACH ROW EXECUTE FUNCTION public.comprobar_tramo_asignacion();

DROP TRIGGER IF EXISTS trg_asignaciones_tramo_baja ON public.asignaciones;
CREATE TRIGGER trg_asignaciones_tramo_baja
    BEFORE DELETE ON public.asignaciones
    FOR EACH ROW EXECUTE FUNCTION public.comprobar_tramo_asignacion();

-- ---- 3. Pasos de la tarea (si ya está la migración de pasos de SCRUM-94) -------
DO $$
BEGIN
    IF to_regprocedure('public.puede_ver_tarea(uuid)') IS NOT NULL
       AND to_regprocedure('public.alumno_de_sesion()') IS NOT NULL THEN
        EXECUTE $f$
            CREATE OR REPLACE FUNCTION public.puede_ver_tarea(p_tarea UUID)
            RETURNS BOOLEAN
            LANGUAGE sql
            STABLE
            SECURITY DEFINER
            SET search_path = public
            AS $q$
                SELECT EXISTS (
                    SELECT 1 FROM public.tareas t
                    WHERE t.id = p_tarea
                      AND (
                          public.is_admin()
                          OR (t.alumno_id IS NULL AND public.auth_user_role() IN ('tutor_docente', 'admin'))
                          -- SCRUM-144: tutor y familia ven las tareas (y sus pasos) de clase y de casa
                          OR public.supervisa_tarea(t.id, t.alumno_id)
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
            $q$
        $f$;
    END IF;
END $$;
