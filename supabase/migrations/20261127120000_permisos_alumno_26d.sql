-- Migración: ampliar public.preferencias_alumnos con los formatos multimedia permitidos (Pantalla 26d / 07e)
-- y eliminar la tabla temporal permisos_alumno_26d.
-- Reutiliza las columnas existentes `vista_agenda` ('semanal' = 06b / 'diaria' = 06)
-- y `nivel_permisos_preferencias` ('total'/'parcial' = visible / 'ninguno' = oculto)
-- usadas por SCRUM-125 y SCRUM-246, restringiendo la escritura al tutor del alumno o admin.
-- HU-23 / SCRUM-141 / SCRUM-142

DROP TABLE IF EXISTS public.permisos_alumno_26d CASCADE;

ALTER TABLE public.preferencias_alumnos
  ADD COLUMN IF NOT EXISTS formatos_multimedia_permitidos TEXT[]
    NOT NULL
    DEFAULT ARRAY['pictograma', 'texto', 'foto', 'video', 'audio']::TEXT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'preferencias_alumnos_formatos_no_vacios'
      AND conrelid = 'public.preferencias_alumnos'::regclass
  ) THEN
    ALTER TABLE public.preferencias_alumnos
      ADD CONSTRAINT preferencias_alumnos_formatos_no_vacios
      CHECK (cardinality(formatos_multimedia_permitidos) >= 1);
  END IF;
END $$;

COMMENT ON COLUMN public.preferencias_alumnos.formatos_multimedia_permitidos IS
  'Formatos multimedia habilitados debajo de cada paso en 07/07e configurados desde la Pantalla 26d.';

-- Asegurar que solo el tutor docente vinculado al alumno o un administrador puedan modificar preferencias_alumnos
DROP POLICY IF EXISTS "Preferencias: Gestión por tutores vinculados o admin" ON public.preferencias_alumnos;
CREATE POLICY "Preferencias: Gestión por tutores vinculados o admin"
  ON public.preferencias_alumnos
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_tutor_docente_of_student(alumno_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.is_tutor_docente_of_student(alumno_id)
  );
