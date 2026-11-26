-- ==============================================================================
-- Seguridad (SCRUM-278 · T-ADM.6): cierra dos políticas de schema_inicial.sql (SCRUM-156) que
-- permitían saltarse la seguridad por filas (RLS). Detectado en la revisión de seguridad.
--
-- 1. perfiles: la política de UPDATE deja que cada usuario cambie TODA su fila, incluido el rol.
--    Un familiar podía hacer update({ rol: "admin" }) sobre su propio perfil y pasar a ser admin.
-- 2. vinculos_alumno_supervisor: la política solo miraba el rol, así que cualquier familiar o
--    tutor podía vincularse a cualquier alumno (y ver sus datos) o borrar los vínculos de otros.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Solo administración cambia el rol, el estado, el centro o el correo de un perfil
-- ------------------------------------------------------------------------------
-- Cada usuario sigue pudiendo cambiar el resto de su perfil (p. ej. su nombre). La app llega a la
-- base de datos con el rol «authenticated»; el editor SQL de Supabase y service_role no se bloquean.
CREATE OR REPLACE FUNCTION public.proteger_campos_perfil()
RETURNS TRIGGER AS $$
BEGIN
    IF current_user = 'authenticated' AND NOT public.is_admin() AND (
        NEW.rol IS DISTINCT FROM OLD.rol
        OR NEW.activo IS DISTINCT FROM OLD.activo
        OR NEW.centro_id IS DISTINCT FROM OLD.centro_id
        OR NEW.email IS DISTINCT FROM OLD.email
    ) THEN
        RAISE EXCEPTION 'Solo administración puede cambiar el rol, el estado, el centro o el correo de un perfil'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_perfiles_proteger_campos ON public.perfiles;
CREATE TRIGGER trg_perfiles_proteger_campos
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_perfil();

-- ------------------------------------------------------------------------------
-- 2. Vínculos: solo administración o el tutor de ese alumno
-- ------------------------------------------------------------------------------
-- is_tutor_docente_of_student: tutor titular del aula del alumno o tutor con vínculo activo de aula.
-- El alta de alumnos que hace un tutor (alumnosService.crearAlumno) sigue funcionando si es el
-- tutor titular del aula.
DROP POLICY IF EXISTS "Vínculos: Modificación por administradores o tutores" ON public.vinculos_alumno_supervisor;
DROP POLICY IF EXISTS "Vínculos: Modificación admin o tutor del alumno" ON public.vinculos_alumno_supervisor;
CREATE POLICY "Vínculos: Modificación admin o tutor del alumno"
    ON public.vinculos_alumno_supervisor FOR ALL TO authenticated
    USING (public.is_admin() OR public.is_tutor_docente_of_student(alumno_id))
    WITH CHECK (public.is_admin() OR public.is_tutor_docente_of_student(alumno_id));
