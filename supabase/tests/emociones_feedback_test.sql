-- ==============================================================================
-- Pruebas de SCRUM-136: ejecuciones.valoracion_emocional admite las 5 emociones.
-- Se ejecutan después de supabase_minimo.sql y las migraciones (ver README.md).
-- ==============================================================================
BEGIN;

INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000e001', 'emociones.alumno@test.local');
INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000e001', 'emociones.alumno@test.local', 'Alumno', 'estudiante')
ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol;
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-00000000e0c1', 'CEE Purísima', 'PRUEBA-136');
INSERT INTO public.aulas (id, centro_id, nombre) VALUES
    ('00000000-0000-0000-0000-00000000e0a1', '00000000-0000-0000-0000-00000000e0c1', 'Aula Estrella');
INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e0c1',
     '00000000-0000-0000-0000-00000000e0a1', 'EXP-EMO-1', 'Alumno de prueba');
INSERT INTO public.tareas (id, titulo) VALUES
    ('00000000-0000-0000-0000-00000000e201', 'Lavarse las manos');
INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, fecha) VALUES
    ('00000000-0000-0000-0000-00000000e301', '00000000-0000-0000-0000-00000000e101',
     '00000000-0000-0000-0000-00000000e201', CURRENT_DATE);

-- Permisos de tabla que Supabase concede por defecto.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated; -- para auth.uid()

-- La guarda el propio alumno, con su sesión (RLS).
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000e001', true);
SET LOCAL ROLE authenticated;

INSERT INTO public.ejecuciones (asignacion_id, estudiante_id, inicio) VALUES
    ('00000000-0000-0000-0000-00000000e301', '00000000-0000-0000-0000-00000000e101', now());

DO $$
DECLARE
    emocion TEXT;
    filas INTEGER;
BEGIN
    FOREACH emocion IN ARRAY ARRAY['contento', 'tranquilo', 'cansado', 'triste', 'enfadado'] LOOP
        UPDATE public.ejecuciones SET valoracion_emocional = emocion
        WHERE asignacion_id = '00000000-0000-0000-0000-00000000e301';
        GET DIAGNOSTICS filas = ROW_COUNT;
        ASSERT filas = 1, 'El alumno no ha podido guardar: ' || emocion;
    END LOOP;

    BEGIN
        UPDATE public.ejecuciones SET valoracion_emocional = 'inventada'
        WHERE asignacion_id = '00000000-0000-0000-0000-00000000e301';
        RAISE EXCEPTION 'Se ha admitido una emoción que no existe';
    EXCEPTION WHEN check_violation THEN
        NULL;
    END;

    RAISE NOTICE 'SCRUM-136: OK';
END $$;

ROLLBACK;
