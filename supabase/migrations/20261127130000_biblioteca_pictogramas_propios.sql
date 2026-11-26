-- Migración: tabla de pictogramas propios por usuario/rol (Pantalla 51)
-- y bucket de Storage `pictogramas-propios` con aislamiento estricto mediante RLS
-- SCRUM-241 / SCRUM-275 / SCRUM-279

CREATE TABLE IF NOT EXISTS public.pictogramas_propios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('tutor', 'familia')),
  palabra_clave TEXT NOT NULL,
  texto_alternativo TEXT NOT NULL DEFAULT '',
  imagen_url TEXT NOT NULL,
  ruta_storage TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pictogramas_propios_propietario_rol
  ON public.pictogramas_propios (propietario_id, rol, creado_en DESC);

COMMENT ON TABLE public.pictogramas_propios IS
  'Pictogramas y fotografías propios subidos por cada Tutor o Familia en la Pantalla 51, aislados estrictamente por propietario_id (auth.uid()) y rol.';

ALTER TABLE public.pictogramas_propios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pictogramas_propios_select_propios" ON public.pictogramas_propios;
CREATE POLICY "pictogramas_propios_select_propios"
  ON public.pictogramas_propios
  FOR SELECT
  TO authenticated
  USING (propietario_id = auth.uid());

DROP POLICY IF EXISTS "pictogramas_propios_insert_propios" ON public.pictogramas_propios;
CREATE POLICY "pictogramas_propios_insert_propios"
  ON public.pictogramas_propios
  FOR INSERT
  TO authenticated
  WITH CHECK (propietario_id = auth.uid());

DROP POLICY IF EXISTS "pictogramas_propios_update_propios" ON public.pictogramas_propios;
CREATE POLICY "pictogramas_propios_update_propios"
  ON public.pictogramas_propios
  FOR UPDATE
  TO authenticated
  USING (propietario_id = auth.uid())
  WITH CHECK (propietario_id = auth.uid());

DROP POLICY IF EXISTS "pictogramas_propios_delete_propios" ON public.pictogramas_propios;
CREATE POLICY "pictogramas_propios_delete_propios"
  ON public.pictogramas_propios
  FOR DELETE
  TO authenticated
  USING (propietario_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pictogramas_propios TO authenticated;

-- Bucket PRIVADO de Storage para los archivos de imagen subidos desde el recuadro punteado '+'
-- El acceso se realiza exclusivamente mediante URLs firmadas para el usuario autenticado propietario.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pictogramas-propios', 'pictogramas-propios', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS "storage_pictogramas_propios_lectura" ON storage.objects;
CREATE POLICY "storage_pictogramas_propios_lectura"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pictogramas-propios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "storage_pictogramas_propios_insert" ON storage.objects;
CREATE POLICY "storage_pictogramas_propios_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pictogramas-propios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "storage_pictogramas_propios_delete" ON storage.objects;
CREATE POLICY "storage_pictogramas_propios_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pictogramas-propios'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
