-- Pruebas de la migración 20261126000000_seguridad_perfiles_vinculos.sql (SCRUM-278 · T-ADM.6).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000bb00', 'admin@prueba.es'),
    ('00000000-0000-0000-0000-00000000bb01', 'carmen@prueba.es'),
    ('00000000-0000-0000-0000-00000000bb02', 'otro.tutor@prueba.es'),
    ('00000000-0000-0000-0000-00000000bb03', 'madre@prueba.es'),
    ('00000000-0000-0000-0000-00000000bb04', 'otra.familia@prueba.es');

INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000bb00', 'admin@prueba.es', 'Marta Soler', 'admin'),
    ('00000000-0000-0000-0000-00000000bb01', 'carmen@prueba.es', 'Carmen Ruiz', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000bb02', 'otro.tutor@prueba.es', 'Otro Tutor', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000bb03', 'madre@prueba.es', 'Madre de Alejandro', 'familiar'),
    ('00000000-0000-0000-0000-00000000bb04', 'otra.familia@prueba.es', 'Otra Familia', 'familiar');

INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c3', 'CEE Purísima', 'PRUEBA-278');

INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000c3', 'Aula Triángulo',
     '00000000-0000-0000-0000-00000000bb01'),
    ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-0000000000c3', 'Aula Círculo',
     '00000000-0000-0000-0000-00000000bb02');

-- Alejandro es del aula de Carmen; Miriam, del aula del otro tutor.
INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000c3',
     '00000000-0000-0000-0000-0000000000a3', 'EXP-S278A', 'Alejandro'),
    ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000c3',
     '00000000-0000-0000-0000-0000000000a4', 'EXP-S278B', 'Miriam');

INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo) VALUES
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000bb03', 'familiar'),
    ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000bb01', 'aula'),
    ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-00000000bb02', 'aula');

-- En Supabase el rol authenticated ya tiene estos permisos; en un PostgreSQL normal no.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    admin    CONSTANT TEXT := '00000000-0000-0000-0000-00000000bb00';
    carmen   CONSTANT TEXT := '00000000-0000-0000-0000-00000000bb01';
    otro     CONSTANT TEXT := '00000000-0000-0000-0000-00000000bb02';
    madre    CONSTANT TEXT := '00000000-0000-0000-0000-00000000bb03';
    otra     CONSTANT TEXT := '00000000-0000-0000-0000-00000000bb04';
    alejandro CONSTANT UUID := '00000000-0000-0000-0000-0000000000d1';
    miriam    CONSTANT UUID := '00000000-0000-0000-0000-0000000000d2';
    n INTEGER;
    valor TEXT;
BEGIN
    SET LOCAL ROLE authenticated;

    -- ===== Perfiles =====
    PERFORM set_config('request.jwt.claim.sub', madre, true);

    -- 1. Una familia no puede hacerse administradora
    BEGIN
        UPDATE public.perfiles SET rol = 'admin' WHERE id = madre::UUID;
        RAISE EXCEPTION 'FALLA rol: una familia ha podido cambiarse el rol';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 2. Tampoco el estado, el centro ni el correo
    BEGIN
        UPDATE public.perfiles SET activo = false WHERE id = madre::UUID;
        RAISE EXCEPTION 'FALLA activo: una familia ha podido cambiarse el estado';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        UPDATE public.perfiles SET centro_id = '00000000-0000-0000-0000-0000000000c3' WHERE id = madre::UUID;
        RAISE EXCEPTION 'FALLA centro: una familia ha podido cambiarse el centro';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        UPDATE public.perfiles SET email = 'otro@correo.es' WHERE id = madre::UUID;
        RAISE EXCEPTION 'FALLA correo: una familia ha podido cambiarse el correo';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 3. Su nombre sí lo puede cambiar
    UPDATE public.perfiles SET nombre_completo = 'Madre García' WHERE id = madre::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA nombre: una familia no ha podido cambiar su nombre'; END IF;

    -- 4. Los perfiles siguen como estaban
    RESET ROLE;
    SELECT rol INTO valor FROM public.perfiles WHERE id = madre::UUID;
    IF valor <> 'familiar' THEN RAISE EXCEPTION 'FALLA rol guardado: %', valor; END IF;
    SET LOCAL ROLE authenticated;

    -- 5. Administración sí puede cambiar el rol de otro perfil
    PERFORM set_config('request.jwt.claim.sub', admin, true);
    UPDATE public.perfiles SET rol = 'especialista' WHERE id = otra::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA admin: no ha podido cambiar un rol'; END IF;

    -- 6. El editor SQL de Supabase (sin rol «authenticated») no se bloquea
    RESET ROLE;
    UPDATE public.perfiles SET rol = 'familiar' WHERE id = otra::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA editor SQL: se ha bloqueado'; END IF;
    SET LOCAL ROLE authenticated;

    -- ===== Vínculos =====
    -- 7. Una familia no puede vincularse a un alumno que no es suyo
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    BEGIN
        INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo)
        VALUES (miriam, madre::UUID, 'familiar');
        RAISE EXCEPTION 'FALLA vincular: una familia se ha vinculado a un alumno ajeno';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;

    -- 8. Una familia no puede borrar ni cambiar vínculos de otros
    PERFORM set_config('request.jwt.claim.sub', otra, true);
    DELETE FROM public.vinculos_alumno_supervisor WHERE alumno_id = alejandro;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA borrar: una familia ha borrado % vínculos ajenos', n; END IF;
    PERFORM set_config('request.jwt.claim.sub', madre, true);
    UPDATE public.vinculos_alumno_supervisor SET activo = false WHERE alumno_id = alejandro;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA desactivar: una familia ha desactivado % vínculos', n; END IF;

    -- 9. El tutor de aula puede vincular a un alumno de su aula…
    PERFORM set_config('request.jwt.claim.sub', carmen, true);
    INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo)
    VALUES (alejandro, otra::UUID, 'especialista_pt');

    -- 10. …pero no a uno de otra aula, ni tocar sus vínculos
    BEGIN
        INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo)
        VALUES (miriam, carmen::UUID, 'aula');
        RAISE EXCEPTION 'FALLA tutor ajeno: Carmen se ha vinculado a un alumno de otra aula';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    DELETE FROM public.vinculos_alumno_supervisor WHERE alumno_id = miriam;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA tutor ajeno: ha borrado % vínculos de otra aula', n; END IF;

    -- 11. El otro tutor tampoco puede borrar los vínculos del aula de Carmen
    PERFORM set_config('request.jwt.claim.sub', otro, true);
    DELETE FROM public.vinculos_alumno_supervisor WHERE alumno_id = alejandro;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA tutor ajeno: ha borrado % vínculos', n; END IF;

    -- 12. Administración puede crear y borrar vínculos de cualquiera
    PERFORM set_config('request.jwt.claim.sub', admin, true);
    INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo)
    VALUES (miriam, madre::UUID, 'familiar');
    DELETE FROM public.vinculos_alumno_supervisor WHERE alumno_id = miriam AND supervisor_id = madre::UUID;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FALLA admin vínculos: no ha podido borrar'; END IF;

    -- 13. Al final no se ha perdido ningún vínculo de Alejandro (los 2 de partida + el que añadió Carmen)
    RESET ROLE;
    SELECT count(*) INTO n FROM public.vinculos_alumno_supervisor WHERE alumno_id = alejandro;
    IF n <> 3 THEN RAISE EXCEPTION 'FALLA vínculos de Alejandro: quedan %', n; END IF;

    RAISE NOTICE 'seguridad_perfiles_vinculos: las 13 comprobaciones pasan';
END $$;

ROLLBACK;
