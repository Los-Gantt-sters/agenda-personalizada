-- Pruebas del recuento del comedor y del parte del día (SCRUM-102 · T-12.1, HU-12).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Si una comprobación falla, se para con un error que dice cuál.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

-- ---- Datos de prueba --------------------------------------------------------
INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-00000000c0c0', 'CEE Purísima', 'PRUEBA-COM');

INSERT INTO public.aulas (id, centro_id, nombre, icono_forma, orden) VALUES
    ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-00000000c0c0', 'Clase Triángulo', 'tri', 0),
    ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-00000000c0c0', 'Clase Círculo', 'cir', 1),
    ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-00000000c0c0', 'Clase Vacía', 'cua', 2);

-- Triángulo: Miriam (normal, alergia) y Alejandro (turmix). Círculo: Nora (normal) y Hugo
-- (sin_gluten). Carla está archivada: no cuenta para nada.
INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre, estado, activo,
                            dieta_comedor, alergias, icono_personal) VALUES
    ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-0000000000f1',
     'EXP-COM1', 'Miriam', 'activo', true, 'normal', '{frutos secos}', '🦋'),
    ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-0000000000f1',
     'EXP-COM2', 'Alejandro', 'activo', true, 'turmix', '{}', '🦁'),
    ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-0000000000f2',
     'EXP-COM3', 'Nora', 'activo', true, 'normal', '{}', '🐢'),
    ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-0000000000f2',
     'EXP-COM4', 'Hugo', 'activo', true, 'sin_gluten', '{}', '🚀'),
    ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-00000000c0c0', '00000000-0000-0000-0000-0000000000f1',
     'EXP-COM5', 'Carla', 'archivado', true, 'normal', '{huevo}', '⚽');

-- Usuarios: el alumno encargado, la cocina (rol nuevo), una familia (sin permiso), un alumno que
-- NO es encargado, un tutor y una cuenta de cocina desactivada
INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'encargado@prueba'),
    ('00000000-0000-0000-0000-0000000000a2', 'cocina@prueba'),
    ('00000000-0000-0000-0000-0000000000a3', 'familia@prueba'),
    ('00000000-0000-0000-0000-0000000000a4', 'alumno@prueba'),
    ('00000000-0000-0000-0000-0000000000a5', 'tutor@prueba'),
    ('00000000-0000-0000-0000-0000000000a6', 'cocina.baja@prueba');
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000c0c0', 'encargado@prueba', 'Alumno encargado', 'estudiante'),
    ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000c0c0', 'cocina@prueba', 'Cocina Central', 'cocina'),
    ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000c0c0', 'familia@prueba', 'Familia', 'familiar'),
    ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-00000000c0c0', 'alumno@prueba', 'Otro alumno', 'estudiante'),
    ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-00000000c0c0', 'tutor@prueba', 'Tutora', 'tutor_docente'),
    ('00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-00000000c0c0', 'cocina.baja@prueba', 'Cocina antigua', 'cocina');
UPDATE public.perfiles SET encargado_comedor = true WHERE id = '00000000-0000-0000-0000-0000000000a1';
UPDATE public.perfiles SET activo = false WHERE id = '00000000-0000-0000-0000-0000000000a6';

-- Un recuento de AYER no debe contar hoy
INSERT INTO public.recuentos_comedor (fecha, aula_id, ausentes)
VALUES (public.hoy_centro() - 1, '00000000-0000-0000-0000-0000000000f2',
        ARRAY['00000000-0000-0000-0000-0000000000e3'::UUID]);

-- ---- Comprobaciones ---------------------------------------------------------
DO $$
DECLARE
    encargado CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a1';
    cocina    CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a2';
    familia   CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a3';
    alumno    CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a4';
    tutor     CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a5';
    cocina_baja CONSTANT TEXT := '00000000-0000-0000-0000-0000000000a6';
    triangulo CONSTANT UUID := '00000000-0000-0000-0000-0000000000f1';
    circulo   CONSTANT UUID := '00000000-0000-0000-0000-0000000000f2';
    miriam    CONSTANT UUID := '00000000-0000-0000-0000-0000000000e1';
    nora      CONSTANT UUID := '00000000-0000-0000-0000-0000000000e3';
    parte     JSONB;
    filas     TEXT[];
    r         RECORD;
    fallo     BOOLEAN;
BEGIN
    -- 1. El alumno encargado ve las clases con alumnos (no la vacía), en orden, sin los archivados
    PERFORM set_config('request.jwt.claim.sub', encargado, true);
    SELECT array_agg(x.nombre ORDER BY ord) INTO filas
    FROM public.recuento_comedor_hoy() WITH ORDINALITY
         AS x(aula_id, nombre, icono_forma, icono_url, alumnos, confirmado, ausentes, confirmado_en, ord)
    WHERE x.aula_id IN (triangulo, circulo, '00000000-0000-0000-0000-0000000000f3');
    IF filas IS DISTINCT FROM ARRAY['Clase Triángulo', 'Clase Círculo'] THEN
        RAISE EXCEPTION 'FALLA clases del recuento: %', filas;
    END IF;
    SELECT * INTO r FROM public.recuento_comedor_hoy() x WHERE x.aula_id = triangulo;
    IF jsonb_array_length(r.alumnos) <> 2 OR r.alumnos::TEXT LIKE '%Carla%' OR r.confirmado THEN
        RAISE EXCEPTION 'FALLA alumnos de Triángulo: % / %', r.alumnos, r.confirmado;
    END IF;
    IF r.alumnos->0 ?| ARRAY['apellidos', 'dieta_comedor', 'alergias', 'secuencia_acceso'] THEN
        RAISE EXCEPTION 'FALLA el recuento devuelve datos de más: %', r.alumnos->0;
    END IF;

    -- 2. Antes de contar: comen todos los activos, 0 de 2 aulas, sin última actualización
    --    (el recuento de ayer no cuenta)
    PERFORM set_config('request.jwt.claim.sub', cocina, true);
    parte := public.parte_cocina_dia();
    IF (parte->>'total')::INT <> 4 OR (parte->>'aulas_confirmadas')::INT <> 0
       OR (parte->>'aulas_total')::INT <> 2 OR parte->'ultima' <> 'null'::jsonb THEN
        RAISE EXCEPTION 'FALLA parte sin recuento: %', parte;
    END IF;

    -- 3. El encargado confirma Triángulo: falta Miriam
    PERFORM set_config('request.jwt.claim.sub', encargado, true);
    PERFORM public.confirmar_recuento_comedor(triangulo, ARRAY[miriam, miriam]);
    SELECT * INTO r FROM public.recuento_comedor_hoy() x WHERE x.aula_id = triangulo;
    IF NOT r.confirmado OR r.ausentes <> ARRAY[miriam] THEN
        RAISE EXCEPTION 'FALLA recuento guardado: % / %', r.confirmado, r.ausentes;
    END IF;

    -- 4. Cocina: 3 comensales, el menú normal baja a 1, 1 de 2 aulas, última Triángulo, y la
    --    alergia de Miriam ya no sale porque hoy no come
    PERFORM set_config('request.jwt.claim.sub', cocina, true);
    parte := public.parte_cocina_dia();
    IF (parte->>'total')::INT <> 3 OR (parte->>'ausentes')::INT <> 1
       OR (parte->>'aulas_confirmadas')::INT <> 1
       OR parte->'ultima'->>'aula' <> 'Clase Triángulo' THEN
        RAISE EXCEPTION 'FALLA parte con un recuento: %', parte;
    END IF;
    IF parte->'menus' <> '[{"tipo": "normal", "total": 1}, {"tipo": "sin_gluten", "total": 1}, {"tipo": "turmix", "total": 1}]'::jsonb THEN
        RAISE EXCEPTION 'FALLA menús: %', parte->'menus';
    END IF;
    IF jsonb_array_length(parte->'avisos') <> 0 THEN
        RAISE EXCEPTION 'FALLA avisos de alguien que no come: %', parte->'avisos';
    END IF;

    -- 5. Corregir: se vuelve a contar Triángulo y no falta nadie (no se duplica la fila)
    PERFORM set_config('request.jwt.claim.sub', encargado, true);
    PERFORM public.confirmar_recuento_comedor(triangulo, '{}');
    PERFORM public.confirmar_recuento_comedor(circulo, '{}');
    PERFORM set_config('request.jwt.claim.sub', cocina, true);
    parte := public.parte_cocina_dia();
    IF (parte->>'total')::INT <> 4 OR (parte->>'aulas_confirmadas')::INT <> 2
       OR jsonb_array_length(parte->'avisos') <> 1
       OR parte->'avisos'->0->>'nombre' <> 'Miriam' THEN
        RAISE EXCEPTION 'FALLA corrección del recuento: %', parte;
    END IF;
    IF (SELECT count(*) FROM public.recuentos_comedor
        WHERE fecha = public.hoy_centro() AND aula_id = triangulo) <> 1 THEN
        RAISE EXCEPTION 'FALLA recuento duplicado';
    END IF;

    -- 6. No se puede apuntar como ausente a alguien de otra clase, ni contar una clase vacía
    PERFORM set_config('request.jwt.claim.sub', encargado, true);
    fallo := false;
    BEGIN
        PERFORM public.confirmar_recuento_comedor(triangulo, ARRAY[nora]);
    EXCEPTION WHEN invalid_parameter_value THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA acepta un ausente de otra clase'; END IF;
    fallo := false;
    BEGIN
        PERFORM public.confirmar_recuento_comedor('00000000-0000-0000-0000-0000000000f3', '{}');
    EXCEPTION WHEN invalid_parameter_value THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA acepta contar una clase vacía'; END IF;

    -- 7. Permisos por rol: el alumno no ve el parte; la familia no hace ni ve nada
    fallo := false;
    BEGIN
        PERFORM public.parte_cocina_dia();
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA un alumno ve el parte de cocina'; END IF;

    PERFORM set_config('request.jwt.claim.sub', familia, true);
    fallo := false;
    BEGIN
        PERFORM public.confirmar_recuento_comedor(triangulo, '{}');
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA una familia confirma el recuento'; END IF;
    fallo := false;
    BEGIN
        PERFORM * FROM public.recuento_comedor_hoy();
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA una familia ve el recuento'; END IF;

    -- Un alumno que no es el encargado no puede ver ni cambiar el recuento (falsearía el parte)
    PERFORM set_config('request.jwt.claim.sub', alumno, true);
    fallo := false;
    BEGIN
        PERFORM public.confirmar_recuento_comedor(triangulo, ARRAY[miriam]);
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA un alumno que no es encargado cambia el recuento'; END IF;
    fallo := false;
    BEGIN
        PERFORM * FROM public.recuento_comedor_hoy();
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA un alumno que no es encargado ve el recuento'; END IF;

    -- Un tutor sí puede contar (por si no está el alumno encargado)
    PERFORM set_config('request.jwt.claim.sub', tutor, true);
    IF (SELECT count(*) FROM public.recuento_comedor_hoy()) < 2 THEN
        RAISE EXCEPTION 'FALLA el tutor no ve el recuento';
    END IF;

    -- Una cuenta de cocina desactivada ya no ve el parte
    PERFORM set_config('request.jwt.claim.sub', cocina_baja, true);
    fallo := false;
    BEGIN
        PERFORM public.parte_cocina_dia();
    EXCEPTION WHEN insufficient_privilege THEN fallo := true;
    END;
    IF NOT fallo THEN RAISE EXCEPTION 'FALLA una cuenta de cocina desactivada ve el parte'; END IF;

    -- 8. Sin sesión (anon) no se puede llamar a nada
    IF has_function_privilege('anon', 'public.parte_cocina_dia()', 'EXECUTE')
       OR has_function_privilege('anon', 'public.recuento_comedor_hoy()', 'EXECUTE')
       OR has_function_privilege('anon', 'public.confirmar_recuento_comedor(uuid, uuid[])', 'EXECUTE')
       OR NOT has_function_privilege('authenticated', 'public.parte_cocina_dia()', 'EXECUTE') THEN
        RAISE EXCEPTION 'FALLA permisos de ejecución';
    END IF;

    RAISE NOTICE 'recuento_comedor: las 8 comprobaciones pasan';
END $$;

ROLLBACK;
