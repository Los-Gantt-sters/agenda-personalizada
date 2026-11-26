-- ==============================================================================
-- Pruebas de SCRUM-138: vínculo y activación del Plan B en asignaciones.
-- Se ejecutan después de supabase_minimo.sql y las migraciones (ver README.md).
-- ==============================================================================
BEGIN;

INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000b001', 'tutora@planb.test'),
    ('00000000-0000-0000-0000-00000000b002', 'otro@planb.test');
INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000b001', 'tutora@planb.test', 'Tutora', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000b002', 'otro@planb.test', 'Otro tutor', 'tutor_docente')
ON CONFLICT (id) DO UPDATE SET rol = EXCLUDED.rol;
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-00000000b0c1', 'CEE Purísima', 'PRUEBA-138');
INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-00000000b0a1', '00000000-0000-0000-0000-00000000b0c1', 'Aula Rombo',
     '00000000-0000-0000-0000-00000000b001');
INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-00000000b0c1',
     '00000000-0000-0000-0000-00000000b0a1', 'EXP-PLANB-1', 'Alejandro');
INSERT INTO public.tareas (id, titulo) VALUES
    ('00000000-0000-0000-0000-00000000b201', 'Recreo en el patio'),
    ('00000000-0000-0000-0000-00000000b202', 'Juegos en clase');
INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, fecha) VALUES
    ('00000000-0000-0000-0000-00000000b301', '00000000-0000-0000-0000-00000000b101',
     '00000000-0000-0000-0000-00000000b201', CURRENT_DATE);

-- Permisos de tabla que Supabase concede por defecto.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA auth TO authenticated; -- para auth.uid()

-- 1-3. La tutora vincula y activa el Plan B de su alumno.
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b001', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE filas INTEGER;
BEGIN
    UPDATE public.asignaciones SET plan_b_tarea_id = '00000000-0000-0000-0000-00000000b202'
    WHERE id = '00000000-0000-0000-0000-00000000b301';
    GET DIAGNOSTICS filas = ROW_COUNT;
    ASSERT filas = 1, 'FALLA 1: la tutora no ha podido vincular el Plan B';

    UPDATE public.asignaciones SET plan_b_activado = true
    WHERE id = '00000000-0000-0000-0000-00000000b301';
    GET DIAGNOSTICS filas = ROW_COUNT;
    ASSERT filas = 1, 'FALLA 2: la tutora no ha podido activar el Plan B';

    BEGIN
        UPDATE public.asignaciones SET plan_b_tarea_id = tarea_id
        WHERE id = '00000000-0000-0000-0000-00000000b301';
        RAISE EXCEPTION 'FALLA 3: una tarea no puede ser su propio Plan B';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
END $$;

-- 4. Un tutor de otra clase no puede.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b002', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE filas INTEGER;
BEGIN
    UPDATE public.asignaciones SET plan_b_activado = false
    WHERE id = '00000000-0000-0000-0000-00000000b301';
    GET DIAGNOSTICS filas = ROW_COUNT;
    ASSERT filas = 0, 'FALLA 4: otro tutor ha cambiado el Plan B';
END $$;

-- 5. Si se borra la tarea Plan B, la asignación se queda sin vínculo.
RESET ROLE;
DELETE FROM public.tareas WHERE id = '00000000-0000-0000-0000-00000000b202';
DO $$
BEGIN
    ASSERT (SELECT plan_b_tarea_id FROM public.asignaciones
            WHERE id = '00000000-0000-0000-0000-00000000b301') IS NULL,
        'FALLA 5: queda un vínculo a una tarea borrada';
    RAISE NOTICE 'plan_b: las 5 comprobaciones pasan';
END $$;

ROLLBACK;
