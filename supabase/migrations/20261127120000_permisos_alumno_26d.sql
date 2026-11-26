-- Migración: tabla de permisos simplificados del alumno (Pantalla 26d / 07e)
-- HU-23 / SCRUM-141 / SCRUM-142

CREATE TABLE IF NOT EXISTS public.permisos_alumno_26d (
  alumno_id TEXT PRIMARY KEY,
  nombre_alumno TEXT NOT NULL DEFAULT 'Alejandro',
  formatos_permitidos TEXT[] NOT NULL DEFAULT ARRAY['pictograma', 'texto', 'foto', 'video', 'audio']::TEXT[],
  entrada_tras_login TEXT NOT NULL DEFAULT '06b'
    CHECK (entrada_tras_login IN ('06b', '06')),
  mostrar_boton_preferencias_16 BOOLEAN NOT NULL DEFAULT TRUE,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT permisos_alumno_26d_formatos_no_vacios
    CHECK (cardinality(formatos_permitidos) >= 1)
);

COMMENT ON TABLE public.permisos_alumno_26d IS
  'Permisos simplificados por alumno configurados por el tutor en la Pantalla 26d (formatos multimedia permitidos, entrada tras login 06b/06 y botón Preferencias 16).';

ALTER TABLE public.permisos_alumno_26d ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permisos_alumno_26d_lectura_publica" ON public.permisos_alumno_26d;
CREATE POLICY "permisos_alumno_26d_lectura_publica"
  ON public.permisos_alumno_26d
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "permisos_alumno_26d_escritura_autenticados" ON public.permisos_alumno_26d;
CREATE POLICY "permisos_alumno_26d_escritura_autenticados"
  ON public.permisos_alumno_26d
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "permisos_alumno_26d_actualizacion_autenticados" ON public.permisos_alumno_26d;
CREATE POLICY "permisos_alumno_26d_actualizacion_autenticados"
  ON public.permisos_alumno_26d
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT SELECT ON public.permisos_alumno_26d TO anon, authenticated;
GRANT INSERT, UPDATE ON public.permisos_alumno_26d TO authenticated;
