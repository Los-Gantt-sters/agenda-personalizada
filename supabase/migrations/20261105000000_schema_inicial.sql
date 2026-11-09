-- ==============================================================================
-- AGENSIBLE (TuAgendita) - CEE Fundación Purísima Concepción (Granada)
-- Tarea SCRUM-156 (T-T01.2 / HUT-01) - Revisión y Modelo Oficial v2
-- Esquema Relacional SQL y Políticas Row Level Security (RLS) en Supabase (PostgreSQL)
-- Alineado al 100% con:
--   - Documentación Oficial del Profesorado: profeV2-1.pdf (Sección 5: Base de Datos)
--   - Figura 3: Modelo conceptual de datos de Agensible con soporte para persistencia plurianual
--   - Requisitos: OE2, OE3, OE13, OE15, OE16, RF1.1-RF1.8, RF2.1-RF2.13, RF3.1-RF3.13,
--                 RF6.1-RF6.8, RF15.1, RF15.2, RNF15.1 (RGPD), RNF16.1, RI2.1-RI2.5, RI6.1
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS ESTRUCTURALES Y CICLO DE VIDA PLURIANUAL
-- ==============================================================================

-- 2.1 Centros educativos (RI2.5, RF2.1)
CREATE TABLE IF NOT EXISTS public.centros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(50),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Curso Académico / Lectivo (profeV2-1.pdf Secc. 5.1.1 y 5.2.1)
-- Identifica el año escolar (ej: 2026-2027) y contextualiza la vigencia temporal
CREATE TABLE IF NOT EXISTS public.cursos_lectivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anio_escolar VARCHAR(50) NOT NULL UNIQUE, -- ej: '2026-2027'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true, -- Solo un curso activo a la vez
    cerrado BOOLEAN NOT NULL DEFAULT false, -- True al ejecutar Cierre Anual (inmutable)
    fecha_cierre TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice parcial: garantiza que solo exista un curso lectivo activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_cursos_lectivos_solo_un_activo 
    ON public.cursos_lectivos (activo) 
    WHERE activo = true;

-- 2.3 Aulas / Clases del centro (RI2.5, RF2.10, RF2.11, profeV2-1 Secc. 5.2.1)
-- Identificadas visualmente por formas/colores (ej: Triángulo 🔺, Círculo 🔵, Cuadrado 🟩)
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES public.centros(id) ON DELETE CASCADE,
    curso_lectivo_id UUID REFERENCES public.cursos_lectivos(id) ON DELETE SET NULL,
    nombre VARCHAR(100) NOT NULL, -- Ej: 'Aula Triángulo', 'Aula Círculo'
    icono_forma VARCHAR(20) DEFAULT 'triangulo', -- 'triangulo' (🔺), 'circulo' (🔵), 'cuadrado' (🟩)
    color_distintivo VARCHAR(20) DEFAULT '#b8492f',
    nivel VARCHAR(100) NOT NULL DEFAULT 'PTVAL', -- Programa de Transición a la Vida Adulta y Laboral
    tutor_titular_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 Perfiles de supervisores y usuarios del sistema (Usuario en Fig. 3, RI2.1, RF2.1, RF2.2)
-- Mapea directamente con auth.users de Supabase
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    centro_id UUID REFERENCES public.centros(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    nombre_completo VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'tutor_docente', 'familiar', 'especialista', 'estudiante')),
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clave foránea diferida entre aulas y su tutor titular
ALTER TABLE public.aulas 
    DROP CONSTRAINT IF EXISTS fk_aulas_tutor_titular;
ALTER TABLE public.aulas 
    ADD CONSTRAINT fk_aulas_tutor_titular 
    FOREIGN KEY (tutor_titular_id) REFERENCES public.perfiles(id) ON DELETE SET NULL;

-- 2.5 Tutores docentes (Tutor en Fig. 3, RI2.3, RF2.2)
CREATE TABLE IF NOT EXISTS public.tutores_docentes (
    id UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
    aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
    especialidad VARCHAR(150) DEFAULT 'Pedagogía Terapéutica',
    telefono_contacto VARCHAR(50),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Familiares (Tutor en Fig. 3, RI2.3, RF2.2)
CREATE TABLE IF NOT EXISTS public.familiares (
    id UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
    parentesco VARCHAR(100) DEFAULT 'Tutor/a legal',
    telefono_emergencia VARCHAR(50),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Alumnos / Estudiantes (Estudiante en Fig. 3, RI2.2, RF2.3, RF2.5, RF2.6, profeV2-1 Secc. 5.1-5.2)
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES public.centros(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE RESTRICT,
    curso_lectivo_id UUID REFERENCES public.cursos_lectivos(id) ON DELETE SET NULL,
    codigo_expediente VARCHAR(100) NOT NULL UNIQUE, -- Seudonimizado RGPD (ej: 'EXP-3A71')
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    fecha_nacimiento DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'promocionado', 'egresado', 'archivado')),
    metodo_acceso VARCHAR(50) NOT NULL DEFAULT 'visual' CHECK (metodo_acceso IN ('visual', 'pin', 'usuario_password')),
    color_identificativo VARCHAR(20) DEFAULT '#2f62b8',
    foto_url TEXT, -- Fotografía táctil de rostro para login visual
    icono_personal VARCHAR(50) DEFAULT '⭐', -- Icono distintivo ('🦁', '🚗', '⚽', '🦖')
    secuencia_acceso JSONB DEFAULT '["🍎", "⭐", "🐶"]'::jsonb, -- 3 pictogramas ordenados para login accesible
    requiere_tutor_presencial BOOLEAN NOT NULL DEFAULT true, -- RF2.5: Etiqueta visible
    dieta_comedor VARCHAR(50) NOT NULL DEFAULT 'basal' CHECK (dieta_comedor IN ('basal', 'turmix', 'texturizada', 'cetogenica')),
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Histórico de asignaciones de aula y promociones (profeV2-1 Secc. 5.1.2)
CREATE TABLE IF NOT EXISTS public.historico_matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
    curso_lectivo_id UUID NOT NULL REFERENCES public.cursos_lectivos(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'promocionada', 'historica')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Vínculos multidireccionales Alumno-Supervisor (Vínculo en Fig. 3, RI2.4, RF2.4, RF2.8, RF2.9)
CREATE TABLE IF NOT EXISTS public.vinculos_alumno_supervisor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    curso_lectivo_id UUID REFERENCES public.cursos_lectivos(id) ON DELETE SET NULL,
    tipo_vinculo VARCHAR(50) NOT NULL CHECK (tipo_vinculo IN ('aula', 'familiar', 'especialista_pt')),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_alta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_baja TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regla de negocio RF2.9 / Fig. 3: Un estudiante tiene un único tutor familiar activo principal
CREATE UNIQUE INDEX IF NOT EXISTS idx_un_unico_tutor_familiar_activo 
    ON public.vinculos_alumno_supervisor (alumno_id) 
    WHERE (tipo_vinculo = 'familiar' AND activo = true);

-- 2.10 Preferencias sensoriales y de accesibilidad (Preferencias en Fig. 3, OE3, RF3.1-RF3.13)
CREATE TABLE IF NOT EXISTS public.preferencias_alumnos (
    alumno_id UUID PRIMARY KEY REFERENCES public.alumnos(id) ON DELETE CASCADE,
    tema_interes VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (
        tema_interes IN ('general', 'futbol', 'coches', 'motos', 'animales', 'dinosaurios', 'musica', 'dibujo')
    ),
    tema_color VARCHAR(50) NOT NULL DEFAULT 'claro' CHECK (
        tema_color IN ('claro', 'oscuro', 'pastel', 'alto_contraste')
    ),
    paleta VARCHAR(50) NOT NULL DEFAULT 'claro', -- Alias semántico Fig. 3
    tamano_letra VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (tamano_letra IN ('normal', 'grande', 'gigante')),
    letra VARCHAR(50) NOT NULL DEFAULT 'normal', -- Alias semántico Fig. 3
    tamano_botones VARCHAR(50) NOT NULL DEFAULT 'grande' CHECK (tamano_botones IN ('normal', 'grande', 'gigante')),
    botones VARCHAR(50) NOT NULL DEFAULT 'grande', -- Alias semántico Fig. 3
    forma_botones VARCHAR(50) NOT NULL DEFAULT 'redondeado' CHECK (forma_botones IN ('cuadrado', 'redondeado', 'circular')),
    vista_agenda VARCHAR(50) NOT NULL DEFAULT 'diaria' CHECK (vista_agenda IN ('diaria', 'semanal')),
    tipo_representacion VARCHAR(50) NOT NULL DEFAULT 'pictograma' CHECK (tipo_representacion IN ('pictograma', 'foto', 'video')),
    reloj VARCHAR(50) NOT NULL DEFAULT 'time_timer', -- Fig. 3: reloj
    reloj_visual_activo BOOLEAN NOT NULL DEFAULT true,
    reloj_visual_fijo BOOLEAN NOT NULL DEFAULT false,
    sonidos_activos BOOLEAN NOT NULL DEFAULT true,
    tipo_tono VARCHAR(50) NOT NULL DEFAULT 'suave' CHECK (tipo_tono IN ('campana', 'xilofono', 'suave')),
    avisos VARCHAR(50) NOT NULL DEFAULT 'combinado', -- Fig. 3: avisos
    avisos_solo_visuales BOOLEAN NOT NULL DEFAULT false,
    foco VARCHAR(50) NOT NULL DEFAULT 'borde_azul', -- Fig. 3: foco
    modo_calma BOOLEAN NOT NULL DEFAULT false,
    modo_pulsacion VARCHAR(50) NOT NULL DEFAULT 'mantener' CHECK (modo_pulsacion IN ('simple', 'mantener', 'sostenida')),
    permiso_crear_tareas BOOLEAN NOT NULL DEFAULT false,
    nivel_permisos_preferencias VARCHAR(50) NOT NULL DEFAULT 'ninguno' CHECK (nivel_permisos_preferencias IN ('ninguno', 'parcial', 'total')),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. CATÁLOGO DE TAREAS, ENCARGOS DEL CENTRO, PASOS Y MULTIMEDIA
-- ==============================================================================

-- 3.1 Catálogo maestro de Tareas (Tarea y Encargos del centro en Fig. 3, Secc. 5.2.1)
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID REFERENCES public.alumnos(id) ON DELETE CASCADE, -- Opcional si es plantilla/catálogo común
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT, -- Lectura fácil
    tipo VARCHAR(50) NOT NULL DEFAULT 'rutina' CHECK (tipo IN ('rutina', 'encargo', 'pedagogica', 'ocio', 'personal')),
    subtipo VARCHAR(50) DEFAULT 'general' CHECK (
        subtipo IN ('reprografia', 'comedor', 'reparto_menu', 'visita', 'general')
    ), -- Encargos del centro según Fig. 3
    pictograma_id INTEGER, -- Identificador oficial ARASAAC
    pictograma_url TEXT,
    ambito VARCHAR(50) NOT NULL DEFAULT 'centro' CHECK (ambito IN ('centro', 'hogar')),
    prioridad VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    plan_b_tarea_id UUID REFERENCES public.tareas(id) ON DELETE SET NULL, -- Plan B asociado (autorreferencial)
    duracion_estimada_minutos INTEGER NOT NULL DEFAULT 30, -- Duración
    dias_semana JSONB DEFAULT '["lunes", "martes", "miercoles", "jueves", "viernes"]'::jsonb, -- Días aplicables
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'hecho', 'bloqueada')),
    motivo_bloqueo TEXT,
    hora_inicio TIME,
    hora_fin TIME,
    duracion_minutos INTEGER DEFAULT 30,
    orden INTEGER NOT NULL DEFAULT 1,
    pasos JSONB DEFAULT '[]'::jsonb, -- Cache JSONB compatible con prototipo frontend
    planes_b JSONB DEFAULT '[]'::jsonb, -- Cache JSONB compatible
    requiere_presencia_tutor BOOLEAN NOT NULL DEFAULT false,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 Desglose en Pasos (Paso en Fig. 3, Secc. 5.2.1)
CREATE TABLE IF NOT EXISTS public.pasos_tarea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    texto VARCHAR(255) NOT NULL,
    imagen_url TEXT,
    audio_url TEXT,
    video_url TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Recursos multimedia (Recurso multimedia en Fig. 3)
CREATE TABLE IF NOT EXISTS public.recursos_multimedia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paso_id UUID REFERENCES public.pasos_tarea(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imagen', 'audio', 'video', 'pictograma')),
    archivo_url TEXT NOT NULL,
    descripcion_alternativa TEXT,
    origen VARCHAR(50) NOT NULL DEFAULT 'arasaac' CHECK (origen IN ('arasaac', 'propio', 'grabacion', 'externo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. PLANIFICACIÓN DIARIA, TELEMETRÍA Y MARCAS DE TIEMPO REALES
-- ==============================================================================

-- 4.1 Planificación temporal / Asignación concreta (Asignación en Fig. 3, Secc. 5.2.1)
CREATE TABLE IF NOT EXISTS public.asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
    curso_lectivo_id UUID REFERENCES public.cursos_lectivos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME,
    hora_fin TIME,
    orden INTEGER NOT NULL DEFAULT 1,
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (
        estado IN ('pendiente', 'en_curso', 'completada', 'hecho', 'bloqueada', 'cancelada')
    ),
    motivo_bloqueo TEXT,
    plan_b_activado BOOLEAN NOT NULL DEFAULT false,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.2 Telemetría y marcas de tiempo reales (Ejecución en Fig. 3, OE13, SCRUM-76, Secc. 5.2.1)
CREATE TABLE IF NOT EXISTS public.ejecuciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asignacion_id UUID NOT NULL UNIQUE REFERENCES public.asignaciones(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    inicio TIMESTAMPTZ NOT NULL, -- Marca de tiempo real al pulsar «Empezar» (RI6.1)
    fin TIMESTAMPTZ, -- Marca de tiempo real al pulsar «Terminar» (RI6.1)
    duracion_real_segundos INTEGER,
    desviacion_segundos INTEGER, -- Comparativa respecto al tiempo estimado
    estado_final VARCHAR(50) CHECK (estado_final IN ('completada', 'bloqueada', 'cancelada', 'incompleta')),
    pasos_confirmados JSONB DEFAULT '[]'::jsonb, -- Array de pasos con su timestamp de confirmación
    valoracion_emocional VARCHAR(50) CHECK (
        valoracion_emocional IN ('contento', 'neutral', 'triste', 'bien', 'regular', 'mal')
    ), -- Registro de 3 caritas (OE13)
    observaciones TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.3 Peticiones en tiempo real y eventos de auxilio (Aviso / petición en Fig. 3, HU-18 / SCRUM-85)
CREATE TABLE IF NOT EXISTS public.avisos_peticiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    necesidad VARCHAR(50) NOT NULL CHECK (
        necesidad IN ('bano', 'agua', 'descanso', 'urgencia', 'fin_de_tarea', 'ayuda')
    ),
    urgencia BOOLEAN NOT NULL DEFAULT false,
    sala_actual VARCHAR(100), -- Última sala registrada (ej: 'Aula Taller 2', 'Comedor')
    atendido BOOLEAN NOT NULL DEFAULT false,
    atendido_por_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    atendido_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. PROCEDIMIENTOS DE CICLO DE VIDA, RGPD Y RETENCIÓN ANUAL (Secc. 5.1.1-5.1.3)
-- ==============================================================================

-- 5.1 Procedimiento de Cierre Anual (profeV2-1 Secc. 5.1.1)
-- Desacopla automáticamente a los alumnos de sus aulas sin destruir historiales ni preferencias
CREATE OR REPLACE FUNCTION public.procedimiento_cierre_anual(p_curso_lectivo_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Marcar curso lectivo como cerrado e inactivo
    UPDATE public.cursos_lectivos
    SET activo = false, cerrado = true, fecha_cierre = NOW()
    WHERE id = p_curso_lectivo_id;

    -- 2. Archivar matriculaciones activas en el histórico
    INSERT INTO public.historico_matriculas (alumno_id, aula_id, curso_lectivo_id, fecha_inicio, fecha_fin, estado)
    SELECT id, aula_id, p_curso_lectivo_id, DATE(creado_en), CURRENT_DATE, 'historica'
    FROM public.alumnos
    WHERE activo = true AND curso_lectivo_id = p_curso_lectivo_id
    ON CONFLICT DO NOTHING;

    -- 3. Desactivar vínculos de aula del curso finalizado (manteniendo los familiares)
    UPDATE public.vinculos_alumno_supervisor
    SET activo = false, fecha_baja = NOW()
    WHERE tipo_vinculo != 'familiar' AND curso_lectivo_id = p_curso_lectivo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Archivado histórico y seudonimización estricta por baja/egreso RGPD (profeV2-1 Secc. 5.1.3)
CREATE OR REPLACE FUNCTION public.archivar_estudiante_rgpd(p_alumno_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.alumnos
    SET estado = 'archivado',
        activo = false,
        nombre = 'Alumno ' || SUBSTRING(codigo_expediente FROM 5),
        apellidos = NULL,
        foto_url = NULL, -- Disociación inmediata de fotografía facial
        secuencia_acceso = '[]'::jsonb,
        actualizado_en = NOW()
    WHERE id = p_alumno_id;

    -- Desactivar todos los vínculos del alumno
    UPDATE public.vinculos_alumno_supervisor
    SET activo = false, fecha_baja = NOW()
    WHERE alumno_id = p_alumno_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Purga de telemetría y ficheros circunstanciales a los 12 meses (profeV2-1 Secc. 5.1.3)
CREATE OR REPLACE FUNCTION public.purgar_telemetria_antigua(p_meses INT DEFAULT 12)
RETURNS INTEGER AS $$
DECLARE
    v_borrados INTEGER;
BEGIN
    -- Eliminar ejecuciones detalladas con antigüedad superior al umbral
    DELETE FROM public.ejecuciones
    WHERE creado_en < NOW() - (p_meses || ' months')::INTERVAL;
    GET DIAGNOSTICS v_borrados = ROW_COUNT;

    -- Limpiar avisos y peticiones antiguas resueltas
    DELETE FROM public.avisos_peticiones
    WHERE creado_en < NOW() - (p_meses || ' months')::INTERVAL;

    RETURN v_borrados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 6. FUNCIONES HELPER PARA ROW LEVEL SECURITY (RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS VARCHAR AS $$
    SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() AND rol = 'admin' AND activo = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_tutor_docente_of_student(student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.alumnos a
        JOIN public.aulas au ON au.id = a.aula_id
        LEFT JOIN public.cursos_lectivos cl ON cl.id = a.curso_lectivo_id
        WHERE a.id = student_id
          AND au.tutor_titular_id = auth.uid()
          AND (cl.id IS NULL OR cl.activo = true)
    )
    OR EXISTS (
        SELECT 1 
        FROM public.vinculos_alumno_supervisor v
        LEFT JOIN public.cursos_lectivos cl ON cl.id = v.curso_lectivo_id
        WHERE v.alumno_id = student_id
          AND v.supervisor_id = auth.uid()
          AND v.tipo_vinculo IN ('aula', 'especialista_pt')
          AND v.activo = true
          AND (cl.id IS NULL OR cl.activo = true)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_familiar_of_student(student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.vinculos_alumno_supervisor v
        WHERE v.alumno_id = student_id
          AND v.supervisor_id = auth.uid()
          AND v.tipo_vinculo = 'familiar'
          AND v.activo = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 7. ACTIVACIÓN DE ROW LEVEL SECURITY (RLS) Y POLÍTICAS DE SEGURIDAD
-- ==============================================================================

ALTER TABLE public.centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos_lectivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutores_docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_alumno_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferencias_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasos_tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_multimedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejecuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_peticiones ENABLE ROW LEVEL SECURITY;

-- 7.1 Políticas Centros y Cursos Lectivos
CREATE POLICY "Centros: Lectura autenticados" ON public.centros FOR SELECT TO authenticated USING (true);
CREATE POLICY "Centros: Modificación exclusiva administradores" ON public.centros FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Cursos: Lectura autenticados" ON public.cursos_lectivos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Cursos: Gestión administradores" ON public.cursos_lectivos FOR ALL TO authenticated USING (public.is_admin());

-- 7.2 Políticas Aulas
CREATE POLICY "Aulas: Lectura autenticados" ON public.aulas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Aulas: Modificación administradores" ON public.aulas FOR ALL TO authenticated USING (public.is_admin());

-- 7.3 Políticas Perfiles
CREATE POLICY "Perfiles: Lectura propia o administradores" ON public.perfiles FOR SELECT TO authenticated 
    USING (id = auth.uid() OR public.is_admin() OR public.auth_user_role() IN ('tutor_docente', 'familiar'));
CREATE POLICY "Perfiles: Actualización propia o admin" ON public.perfiles FOR UPDATE TO authenticated 
    USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Perfiles: Inserción y borrado administradores" ON public.perfiles FOR ALL TO authenticated USING (public.is_admin());

-- 7.4 Políticas Tutores Docentes y Familiares
CREATE POLICY "Tutores Docentes: Lectura autenticados" ON public.tutores_docentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tutores Docentes: Modificación propia o admin" ON public.tutores_docentes FOR ALL TO authenticated 
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Familiares: Lectura propia o admin" ON public.familiares FOR SELECT TO authenticated 
    USING (id = auth.uid() OR public.is_admin() OR public.auth_user_role() = 'tutor_docente');
CREATE POLICY "Familiares: Modificación propia o admin" ON public.familiares FOR ALL TO authenticated 
    USING (id = auth.uid() OR public.is_admin());

-- 7.5 Políticas Alumnos (profeV2-1 Secc. 5.3)
CREATE POLICY "Alumnos: Lectura según rol y vínculo" ON public.alumnos FOR SELECT TO authenticated 
    USING (
        public.is_admin() 
        OR public.is_tutor_docente_of_student(id)
        OR public.is_familiar_of_student(id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Alumnos: Inserción administradores o tutores" ON public.alumnos FOR INSERT TO authenticated 
    WITH CHECK (public.is_admin() OR public.auth_user_role() = 'tutor_docente');

CREATE POLICY "Alumnos: Actualización por tutores vinculados o admin" ON public.alumnos FOR UPDATE TO authenticated 
    USING (public.is_admin() OR public.is_tutor_docente_of_student(id))
    WITH CHECK (public.is_admin() OR public.is_tutor_docente_of_student(id));

CREATE POLICY "Alumnos: Eliminación exclusiva de administradores" ON public.alumnos FOR DELETE TO authenticated 
    USING (public.is_admin());

-- 7.6 Políticas Vínculos e Histórico de Matrículas
CREATE POLICY "Vínculos: Lectura administradores o involucrados" ON public.vinculos_alumno_supervisor FOR SELECT TO authenticated 
    USING (public.is_admin() OR supervisor_id = auth.uid() OR public.is_tutor_docente_of_student(alumno_id));

CREATE POLICY "Vínculos: Modificación por administradores o tutores" ON public.vinculos_alumno_supervisor FOR ALL TO authenticated 
    USING (public.is_admin() OR public.auth_user_role() IN ('tutor_docente', 'familiar'))
    WITH CHECK (public.is_admin() OR public.auth_user_role() IN ('tutor_docente', 'familiar'));

CREATE POLICY "Histórico: Lectura admin o tutores" ON public.historico_matriculas FOR SELECT TO authenticated 
    USING (public.is_admin() OR public.is_tutor_docente_of_student(alumno_id));
CREATE POLICY "Histórico: Modificación admin (inmutable tras cierre)" ON public.historico_matriculas FOR ALL TO authenticated 
    USING (public.is_admin());

-- 7.7 Políticas Preferencias Alumnos
CREATE POLICY "Preferencias: Lectura alumnos y supervisores" ON public.preferencias_alumnos FOR SELECT TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Preferencias: Gestión por tutores vinculados o admin" ON public.preferencias_alumnos FOR ALL TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
    );

-- 7.8 Políticas Tareas - SEGREGACIÓN ESTRICTA RGPD (profeV2-1 Secc. 5.3)
CREATE POLICY "Tareas: Lectura segregada RGPD" ON public.tareas FOR SELECT TO authenticated 
    USING (
        public.is_admin()
        OR (alumno_id IS NULL AND public.auth_user_role() IN ('tutor_docente', 'admin')) -- Plantillas de catálogo común
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
        OR (public.auth_user_role() = 'estudiante')
    );

CREATE POLICY "Tareas: Inserción segregada por ámbito" ON public.tareas FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

CREATE POLICY "Tareas: Actualización segregada por ámbito" ON public.tareas FOR UPDATE TO authenticated 
    USING (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

CREATE POLICY "Tareas: Eliminación segregada por ámbito" ON public.tareas FOR DELETE TO authenticated 
    USING (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

-- 7.9 Políticas Pasos y Recursos Multimedia
CREATE POLICY "Pasos: Lectura autenticados" ON public.pasos_tarea FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pasos: Modificación tutores o admin" ON public.pasos_tarea FOR ALL TO authenticated 
    USING (public.is_admin() OR public.auth_user_role() = 'tutor_docente');

CREATE POLICY "Multimedia: Lectura autenticados" ON public.recursos_multimedia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Multimedia: Modificación tutores o admin" ON public.recursos_multimedia FOR ALL TO authenticated 
    USING (public.is_admin() OR public.auth_user_role() = 'tutor_docente');

-- 7.10 Políticas Asignaciones y Ejecuciones (Telemetría / Marcas de Tiempo)
CREATE POLICY "Asignaciones: Lectura vinculados" ON public.asignaciones FOR SELECT TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Asignaciones: Modificación tutores o estudiante" ON public.asignaciones FOR ALL TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Ejecuciones: Lectura supervisores y estudiante" ON public.ejecuciones FOR SELECT TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Ejecuciones: Inserción y actualización estudiante o tutor" ON public.ejecuciones FOR ALL TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

-- 7.11 Políticas Avisos y Peticiones (WebSockets / Auxilio)
CREATE POLICY "Avisos: Lectura vinculados" ON public.avisos_peticiones FOR SELECT TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Avisos: Inserción estudiante o tutor" ON public.avisos_peticiones FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Avisos: Actualización resolución tutores o admin" ON public.avisos_peticiones FOR UPDATE TO authenticated 
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(estudiante_id)
        OR public.is_familiar_of_student(estudiante_id)
    );

-- ==============================================================================
-- 8. TRIGGERS PARA AUDITORÍA Y FECHAS DE ACTUALIZACIÓN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_perfiles_updated_at BEFORE UPDATE ON public.perfiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_alumnos_updated_at BEFORE UPDATE ON public.alumnos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_preferencias_updated_at BEFORE UPDATE ON public.preferencias_alumnos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_asignaciones_updated_at BEFORE UPDATE ON public.asignaciones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_ejecuciones_updated_at BEFORE UPDATE ON public.ejecuciones FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
