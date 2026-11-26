-- Pruebas de la migración 20261128400000_guardar_vista_agenda.sql (SCRUM-125 · T-17.2, MOD HU-17).
-- Se ejecutan dentro de una transacción que se deshace al final: no dejan datos.
-- Cómo ejecutarlas: ver supabase/tests/README.md.
BEGIN;

INSERT INTO auth.users (id, email) VALUES
    ('00000000-0000-0000-0000-00000000bb01', 'carmen@prueba.es'),
    ('00000000-0000-0000-0000-00000000bb04', 'alu-00000000-0000-0000-0000-000000000011@alumnos.agensible'),
    ('00000000-0000-0000-0000-00000000bb05', 'alu-00000000-0000-0000-0000-000000000012@alumnos.agensible');

INSERT INTO public.perfiles (id, email, nombre_completo, rol) VALUES
    ('00000000-0000-0000-0000-00000000bb01', 'carmen@prueba.es', 'Carmen Ruiz', 'tutor_docente'),
    ('00000000-0000-0000-0000-00000000bb04', 'alu-00000000-0000-0000-0000-000000000011@alumnos.agensible', 'Alejandro', 'estudiante'),
    ('00000000-0000-0000-0000-00000000bb05', 'alu-00000000-0000-0000-0000-000000000012@alumnos.agensible', 'Nora', 'estudiante');

INSERT INTO public.centros (id, nombre, codigo)
VALUES ('00000000-0000-0000-0000-0000000000c2', 'CEE Purísima', 'PRUEBA-17');

INSERT INTO public.aulas (id, centro_id, nombre, tutor_titular_id) VALUES
    ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c2', 'Aula Triángulo',
     '00000000-0000-0000-0000-00000000bb01');

INSERT INTO public.alumnos (id, centro_id, aula_id, codigo_expediente, nombre) VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-0000000000c2',
     '00000000-0000-0000-0000-0000000000b1', 'EXP-H17A', 'Alejandro'),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-0000000000c2',
     '00000000-0000-0000-0000-0000000000b1', 'EXP-H17B', 'Nora');

-- Alejandro ya tiene preferencias; Nora todavía no.
INSERT INTO public.preferencias_alumnos (alumno_id) VALUES ('00000000-0000-0000-0000-000000000011');

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

DO $$
DECLARE
    ale    CONSTANT UUID := '00000000-0000-0000-0000-000000000011';
    nora   CONSTANT UUID := '00000000-0000-0000-0000-000000000012';
    v      TEXT;
    n      INTEGER;
BEGIN
    -- 1. Como en la revisión de Jaime: con un UPDATE directo, el alumno no cambia nada (0 filas)...
    PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb04', true);
    SET LOCAL ROLE authenticated;
    UPDATE public.preferencias_alumnos SET vista_agenda = 'semanal' WHERE alumno_id = ale;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FALLA RLS: el alumno ha cambiado % filas a mano', n; END IF;

    -- 2. ...pero con la función sí guarda su pantalla al entrar.
    IF NOT public.guardar_vista_agenda(ale, 'semanal') THEN
        RAISE EXCEPTION 'FALLA: el alumno no ha podido guardar su vista';
    END IF;
    RESET ROLE;
    SELECT vista_agenda INTO v FROM public.preferencias_alumnos WHERE alumno_id = ale;
    IF v <> 'semanal' THEN RAISE EXCEPTION 'FALLA: vista_agenda es %', v; END IF;

    -- 3. Un alumno no puede cambiar la vista de otro.
    SET LOCAL ROLE authenticated;
    IF public.guardar_vista_agenda(nora, 'semanal') THEN
        RAISE EXCEPTION 'FALLA: Alejandro ha cambiado la vista de Nora';
    END IF;

    -- 4. Valores que no existen no se guardan.
    IF public.guardar_vista_agenda(ale, 'mensual') THEN
        RAISE EXCEPTION 'FALLA: se ha aceptado «mensual»';
    END IF;

    -- 5. La tutora sí la cambia; y si el alumno no tenía preferencias, se crean.
    PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb01', true);
    IF NOT public.guardar_vista_agenda(ale, 'diaria') THEN
        RAISE EXCEPTION 'FALLA: la tutora no ha podido guardar la vista';
    END IF;
    PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000bb05', true);
    IF NOT public.guardar_vista_agenda(nora, 'semanal') THEN
        RAISE EXCEPTION 'FALLA: Nora no ha podido guardar su vista sin preferencias previas';
    END IF;
    RESET ROLE;
    SELECT vista_agenda INTO v FROM public.preferencias_alumnos WHERE alumno_id = nora;
    IF v IS DISTINCT FROM 'semanal' THEN RAISE EXCEPTION 'FALLA: Nora tiene %', v; END IF;
    SELECT vista_agenda INTO v FROM public.preferencias_alumnos WHERE alumno_id = ale;
    IF v <> 'diaria' THEN RAISE EXCEPTION 'FALLA: la tutora no ha cambiado la vista (%)', v; END IF;

    RAISE NOTICE 'guardar_vista_agenda: las 5 comprobaciones pasan';
END $$;

ROLLBACK;
