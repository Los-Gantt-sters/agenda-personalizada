-- ==============================================================================
-- SCRUM-138 · T-22.1 [Backend/Modelo] Vincular una tarea Plan B ya creada a una tarea principal ya
-- creada (HU-22, pantallas 47b y 47c).
--
-- El vínculo se guarda en cada asignación (la tarea de un alumno un día concreto), no en la tarea:
-- tareas.plan_b_tarea_id es común a todos los alumnos y un tutor no puede cambiar el catálogo. Ese
-- campo se sigue usando como Plan B por defecto cuando la asignación no tiene uno propio.
-- Activar y desactivar usa asignaciones.plan_b_activado, que ya existía.
--
-- Los permisos son los de asignaciones (el tutor, solo sus alumnos). Estas columnas no disparan la
-- comprobación de tramo horario, que solo mira día, hora, tarea y alumno.
--
-- No cambia secuencia_dia: la app lee el Plan B aparte, para no pisar otras migraciones que la
-- redefinen (SCRUM-94).
-- ==============================================================================

ALTER TABLE public.asignaciones
    ADD COLUMN IF NOT EXISTS plan_b_tarea_id UUID REFERENCES public.tareas(id) ON DELETE SET NULL;

ALTER TABLE public.asignaciones DROP CONSTRAINT IF EXISTS asignaciones_plan_b_distinta;
ALTER TABLE public.asignaciones ADD CONSTRAINT asignaciones_plan_b_distinta
    CHECK (plan_b_tarea_id IS DISTINCT FROM tarea_id);

COMMENT ON COLUMN public.asignaciones.plan_b_tarea_id IS
    'SCRUM-138 (HU-22): tarea Plan B vinculada a esta asignación; sin valor, vale la de la tarea.';
