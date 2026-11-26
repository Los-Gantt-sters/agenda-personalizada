-- ==============================================================================
-- SCRUM-125 · T-17.2 (MOD HU-17): guardar la «Pantalla al entrar» del alumno (Hoy 06 o Semana 06b)
-- desde Preferencias (24).
--
-- Revisión de Jaime: en preferencias_alumnos el alumno solo puede leer, así que su UPDATE cambiaba
-- 0 filas sin dar error y la app creía que se había guardado. Esta función deja al alumno cambiar
-- SOLO su vista_agenda (nada más de sus preferencias) y a sus adultos (tutor, familia, admin)
-- cambiársela, y dice si de verdad se ha guardado.
-- El alumno se reconoce por el correo técnico de su inicio de sesión visual (SCRUM-51):
-- «alu-<id del alumno>@alumnos.agensible».
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.guardar_vista_agenda(p_alumno UUID, p_vista TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_es_el_alumno BOOLEAN;
BEGIN
    IF p_alumno IS NULL OR p_vista IS NULL OR p_vista NOT IN ('diaria', 'semanal') THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid()
          AND rol = 'estudiante'
          AND lower(email) = 'alu-' || p_alumno::TEXT || '@alumnos.agensible'
    ) INTO v_es_el_alumno;

    IF NOT (
        v_es_el_alumno
        OR public.is_admin()
        OR public.is_tutor_docente_of_student(p_alumno)
        OR public.is_familiar_of_student(p_alumno)
    ) THEN
        RETURN false;
    END IF;

    -- Si el alumno aún no tiene preferencias guardadas, se crean con los valores por defecto.
    INSERT INTO public.preferencias_alumnos (alumno_id, vista_agenda)
    VALUES (p_alumno, p_vista)
    ON CONFLICT (alumno_id) DO UPDATE SET vista_agenda = EXCLUDED.vista_agenda;

    RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION public.guardar_vista_agenda(UUID, TEXT) IS
    'SCRUM-125 (MOD HU-17): guarda vista_agenda (diaria o semanal) del alumno. Puede el propio alumno (solo este campo), su tutor, su familia o admin. Devuelve true si se ha guardado.';

REVOKE ALL ON FUNCTION public.guardar_vista_agenda(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_vista_agenda(UUID, TEXT) TO authenticated;
