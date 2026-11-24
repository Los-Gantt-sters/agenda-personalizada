-- ==============================================================================
-- SCRUM-102 · T-12.1 [Backend] Recuento del comedor y parte del día para Cocina (HU-12 · SCRUM-101)
--
-- Cada mañana un alumno encargado (PTVAL) pasa por las clases y apunta quién falta (pantalla 11,
-- «Comedor · Recuento por aulas»; el colegio lo pidió así el 19/11: «solo apuntan quien falta»).
-- Cocina ve al momento cuántos menús de cada tipo preparar (pantalla 54, «Cocina · Parte del día»).
--
-- 1. Rol «cocina» en perfiles: la cocina entra con su propia cuenta y solo ve el parte.
-- 2. Tabla recuentos_comedor: una fila por clase y día con los alumnos que faltan.
-- 3. Funciones (SECURITY DEFINER, cada una comprueba el rol de quien llama):
--    - recuento_comedor_hoy():                  clases y compañeros para el alumno encargado.
--    - confirmar_recuento_comedor(aula, faltan): guarda el recuento de una clase.
--    - parte_cocina_dia():                       parte de la 54 restando a los que faltan.
--
-- «Clases del comedor» = aulas con algún alumno activo (una clase vacía no tiene nada que contar).
-- El día es el del centro (Europe/Madrid), aunque el servidor esté en UTC.
-- parte_cocina() (SCRUM-261, pantalla de Administración) no se toca.
-- ==============================================================================

-- ---- 1. Rol cocina -------------------------------------------------------------
ALTER TABLE public.perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE public.perfiles
    ADD CONSTRAINT perfiles_rol_check
    CHECK (rol IN ('admin', 'tutor_docente', 'familiar', 'especialista', 'estudiante', 'cocina'));

-- ---- 2. Recuentos del día ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recuentos_comedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    -- Alumnos de esa clase que no comen hoy
    ausentes UUID[] NOT NULL DEFAULT '{}',
    -- Quién lo confirmó (la sesión del alumno encargado) y cuándo
    confirmado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    confirmado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT recuentos_comedor_dia_aula UNIQUE (fecha, aula_id)
);

COMMENT ON TABLE public.recuentos_comedor IS
    'SCRUM-102 (HU-12): recuento diario del comedor por clase (pantalla 11). Se lee con parte_cocina_dia().';

-- Se escribe y se lee por las funciones; directamente, solo Administración.
ALTER TABLE public.recuentos_comedor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recuentos comedor: lectura administradores" ON public.recuentos_comedor;
CREATE POLICY "Recuentos comedor: lectura administradores" ON public.recuentos_comedor
    FOR SELECT TO authenticated USING (public.is_admin());

-- Día del centro
CREATE OR REPLACE FUNCTION public.hoy_centro()
RETURNS DATE
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
    SELECT (now() AT TIME ZONE 'Europe/Madrid')::DATE;
$$;

-- ---- 3a. Para el alumno encargado (pantalla 11) -----------------------------------------
-- Cada clase con sus compañeros (solo nombre de pila, icono y color) y si ya está contada hoy.
CREATE OR REPLACE FUNCTION public.recuento_comedor_hoy()
RETURNS TABLE (
    aula_id UUID,
    nombre TEXT,
    icono_forma TEXT,
    icono_url TEXT,
    alumnos JSONB,
    confirmado BOOLEAN,
    ausentes UUID[],
    confirmado_en TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF public.auth_user_role() IS DISTINCT FROM 'estudiante'
       AND public.auth_user_role() IS DISTINCT FROM 'tutor_docente'
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Sin permiso para el recuento del comedor' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        au.id,
        au.nombre::TEXT,
        au.icono_forma::TEXT,
        au.icono_url,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', al.id,
                    'nombre', al.nombre,
                    'icono', al.icono_personal,
                    'color', al.color_identificativo
                )
                ORDER BY al.nombre, al.id
            )
            FROM public.alumnos al
            WHERE al.aula_id = au.id AND al.activo AND al.estado = 'activo'
        ),
        r.id IS NOT NULL,
        COALESCE(r.ausentes, '{}'::UUID[]),
        r.confirmado_en
    FROM public.aulas au
    LEFT JOIN public.recuentos_comedor r ON r.aula_id = au.id AND r.fecha = public.hoy_centro()
    WHERE EXISTS (
        SELECT 1 FROM public.alumnos al
        WHERE al.aula_id = au.id AND al.activo AND al.estado = 'activo'
    )
    ORDER BY au.orden, au.nombre, au.id;
END;
$$;

COMMENT ON FUNCTION public.recuento_comedor_hoy() IS
    'SCRUM-102: clases y compañeros para el recuento del comedor de hoy (pantalla 11).';

-- ---- 3b. Confirmar una clase (pantalla 11, botón «Siguiente») -------------------------------
-- Si ya estaba contada hoy, se corrige (vale volver atrás y cambiar quién falta).
CREATE OR REPLACE FUNCTION public.confirmar_recuento_comedor(p_aula UUID, p_ausentes UUID[])
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ausentes UUID[];
    v_hora TIMESTAMPTZ;
BEGIN
    IF public.auth_user_role() IS DISTINCT FROM 'estudiante'
       AND public.auth_user_role() IS DISTINCT FROM 'tutor_docente'
       AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Sin permiso para el recuento del comedor' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.alumnos al
        WHERE al.aula_id = p_aula AND al.activo AND al.estado = 'activo'
    ) THEN
        RAISE EXCEPTION 'La clase no tiene alumnos que contar' USING ERRCODE = '22023';
    END IF;

    -- Sin repetidos, y todos tienen que ser alumnos activos de esa clase
    v_ausentes := ARRAY(SELECT DISTINCT x FROM unnest(COALESCE(p_ausentes, '{}'::UUID[])) AS x);
    IF EXISTS (
        SELECT 1 FROM unnest(v_ausentes) AS x
        WHERE NOT EXISTS (
            SELECT 1 FROM public.alumnos al
            WHERE al.id = x AND al.aula_id = p_aula AND al.activo AND al.estado = 'activo'
        )
    ) THEN
        RAISE EXCEPTION 'Hay ausentes que no son de esta clase' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.recuentos_comedor (fecha, aula_id, ausentes, confirmado_por, confirmado_en)
    VALUES (public.hoy_centro(), p_aula, v_ausentes, auth.uid(), now())
    ON CONFLICT (fecha, aula_id) DO UPDATE
        SET ausentes = EXCLUDED.ausentes,
            confirmado_por = EXCLUDED.confirmado_por,
            confirmado_en = EXCLUDED.confirmado_en
    RETURNING confirmado_en INTO v_hora;

    RETURN v_hora;
END;
$$;

COMMENT ON FUNCTION public.confirmar_recuento_comedor(UUID, UUID[]) IS
    'SCRUM-102: guarda quién falta hoy en una clase (pantalla 11).';

-- ---- 3c. Parte del día para Cocina (pantalla 54) ------------------------------------------
-- Menús por tipo y total de comensales SIN los que faltan; aulas confirmadas; última clase
-- confirmada con su hora; alergias y observaciones de los que comen hoy.
CREATE OR REPLACE FUNCTION public.parte_cocina_dia()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hoy DATE := public.hoy_centro();
    v_parte JSONB;
BEGIN
    IF public.auth_user_role() IS DISTINCT FROM 'cocina' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Sin permiso para el parte de cocina' USING ERRCODE = '42501';
    END IF;

    WITH recuentos AS (
        SELECT r.* FROM public.recuentos_comedor r WHERE r.fecha = v_hoy
    ),
    ausentes AS (
        SELECT DISTINCT unnest(r.ausentes) AS alumno_id FROM recuentos r
    ),
    activos AS (
        SELECT al.* FROM public.alumnos al WHERE al.activo AND al.estado = 'activo'
    ),
    comen AS (
        SELECT a.* FROM activos a WHERE a.id NOT IN (SELECT alumno_id FROM ausentes)
    ),
    aulas_comedor AS (
        SELECT DISTINCT a.aula_id FROM activos a
    )
    SELECT jsonb_build_object(
        'fecha', v_hoy,
        'total', (SELECT count(*) FROM comen),
        'ausentes', (SELECT count(*) FROM activos a WHERE a.id IN (SELECT alumno_id FROM ausentes)),
        'menus', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('tipo', m.dieta_comedor, 'total', m.total)
                             ORDER BY m.dieta_comedor)
            FROM (SELECT c.dieta_comedor, count(*) AS total FROM comen c GROUP BY c.dieta_comedor) m
        ), '[]'::jsonb),
        'aulas_total', (SELECT count(*) FROM aulas_comedor),
        'aulas_confirmadas', (
            SELECT count(*) FROM recuentos r WHERE r.aula_id IN (SELECT aula_id FROM aulas_comedor)
        ),
        'ultima', (
            SELECT jsonb_build_object(
                'aula', au.nombre,
                'hora', to_char(r.confirmado_en AT TIME ZONE 'Europe/Madrid', 'HH24:MI')
            )
            FROM recuentos r
            JOIN public.aulas au ON au.id = r.aula_id
            ORDER BY r.confirmado_en DESC
            LIMIT 1
        ),
        'avisos', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'alumno_id', c.id,
                    'nombre', c.nombre,
                    'aula', au.nombre,
                    'alergias', c.alergias,
                    'observaciones', c.observaciones_cocina
                )
                ORDER BY au.nombre, c.nombre
            )
            FROM comen c
            LEFT JOIN public.aulas au ON au.id = c.aula_id
            WHERE cardinality(c.alergias) > 0 OR c.observaciones_cocina IS NOT NULL
        ), '[]'::jsonb)
    ) INTO v_parte;

    RETURN v_parte;
END;
$$;

COMMENT ON FUNCTION public.parte_cocina_dia() IS
    'SCRUM-102: parte del día para Cocina (pantalla 54), restando a los que faltan según el recuento.';

REVOKE ALL ON FUNCTION public.hoy_centro() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recuento_comedor_hoy() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirmar_recuento_comedor(UUID, UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.parte_cocina_dia() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hoy_centro() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recuento_comedor_hoy() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_recuento_comedor(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.parte_cocina_dia() TO authenticated;
