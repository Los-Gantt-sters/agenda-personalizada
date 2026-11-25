-- ==============================================================================
-- SCRUM-249 · T-01.7 [Backend/Testing] Aulas (01/01b) y alumnos (02/02b) del acceso visual
-- desde la configuración del administrador (48b) (MOD HU-01 · SCRUM-231)
--
-- La pantalla de acceso del alumno se ve ANTES de iniciar sesión, y las políticas RLS de aulas y
-- alumnos solo dejan leer a usuarios con sesión. Estas dos funciones dan a esa pantalla lo justo
-- para pintar las tarjetas, y nada más:
--   - aulas_acceso():          id, nombre, icono (forma o imagen) y orden de cada aula.
--   - alumnos_acceso(aula):    id, nombre de pila, icono y color de los alumnos activos.
--
-- Protección de datos (hay menores): no salen apellidos, expediente, fecha de nacimiento, dieta,
-- método ni secuencia de acceso. SECURITY DEFINER: se saltan RLS a propósito, y por eso devuelven
-- solo esas columnas.
-- La FOTO del alumno tampoco sale, de momento: cualquiera con la clave pública (va dentro de la web)
-- podría verla junto al id del alumno, y con el id y 3 dibujos de 9 (729 combinaciones) se puede
-- intentar entrar a ciegas. Pendiente de decidir en el equipo cómo protegerla (código de la tableta
-- del centro, límite de intentos de acceso, enlaces a la foto que caducan...).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.aulas_acceso()
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    icono_forma TEXT,
    icono_url TEXT,
    orden INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    -- Mismo orden que fija el administrador en la pantalla 48b
    SELECT a.id, a.nombre::TEXT, a.icono_forma::TEXT, a.icono_url, a.orden
    FROM public.aulas a
    ORDER BY a.orden, a.nombre, a.id;
$$;

COMMENT ON FUNCTION public.aulas_acceso() IS
    'SCRUM-249: aulas de la pantalla 01 (acceso del alumno, sin sesión). Solo nombre, icono y orden.';

CREATE OR REPLACE FUNCTION public.alumnos_acceso(p_aula UUID)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    icono_personal TEXT,
    color_identificativo TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    -- Solo los alumnos activos del aula: ni bajas, ni egresados, ni archivados (RGPD)
    SELECT al.id, al.nombre::TEXT, al.icono_personal::TEXT, al.color_identificativo::TEXT
    FROM public.alumnos al
    WHERE al.aula_id = p_aula
      AND al.activo
      AND al.estado = 'activo'
    ORDER BY al.nombre, al.id;
$$;

COMMENT ON FUNCTION public.alumnos_acceso(UUID) IS
    'SCRUM-249: alumnos de la pantalla 02 (acceso del alumno, sin sesión). Solo nombre de pila, icono y color (sin foto).';

-- Las puede llamar la pantalla de acceso sin sesión (anon) y también con sesión
REVOKE ALL ON FUNCTION public.aulas_acceso() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.alumnos_acceso(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aulas_acceso() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alumnos_acceso(UUID) TO anon, authenticated;
