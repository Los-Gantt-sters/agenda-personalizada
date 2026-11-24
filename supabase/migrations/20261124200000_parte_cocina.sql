-- ==============================================================================
-- SCRUM-261 · T-ADM.3 [Backend] Sincronización de menús y alergias (46) con el Parte de Cocina (54)
-- Devuelve, en una sola llamada, lo que necesita el parte diario de Cocina:
--   total   → comensales (alumnos activos).
--   menus   → cuántos comensales hay de cada tipo de menú (normal, turmix, sin_gluten...).
--   avisos  → alumnos con alergias u observaciones para Cocina: nombre, aula, alergias y nota.
--
-- Es una consulta: no copia nada, así que lo que Administración cambia en la pantalla 46 se ve en
-- el parte al momento. Las ausencias del día se apuntan en un folio y las gestiona Cocina; por eso
-- se cuenta a todo el alumnado activo.
--
-- Va después de 20261124100000_menus_y_alergias.sql: usa sus columnas alergias y observaciones_cocina.
-- SECURITY INVOKER: respeta las políticas RLS de quien la llama (hoy, solo administración lee todos
-- los alumnos; para un usuario de Cocina habría que añadir ese rol).
--
--   supabase.rpc("parte_cocina")
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.parte_cocina()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'total', (SELECT count(*) FROM public.alumnos WHERE activo = true),
        'menus', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object('tipo', m.dieta_comedor, 'total', m.total)
                ORDER BY m.dieta_comedor
            )
            FROM (
                SELECT dieta_comedor, count(*) AS total
                FROM public.alumnos
                WHERE activo = true
                GROUP BY dieta_comedor
            ) m
        ), '[]'::jsonb),
        'avisos', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'alumno_id', a.id,
                    'nombre', a.nombre,
                    'apellidos', a.apellidos,
                    'aula', au.nombre,
                    'alergias', a.alergias,
                    'observaciones', a.observaciones_cocina
                )
                ORDER BY au.nombre, a.nombre
            )
            FROM public.alumnos a
            LEFT JOIN public.aulas au ON au.id = a.aula_id
            WHERE a.activo = true
              AND (cardinality(a.alergias) > 0 OR a.observaciones_cocina IS NOT NULL)
        ), '[]'::jsonb)
    );
$$;
