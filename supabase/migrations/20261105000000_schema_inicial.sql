-- ==============================================================================
-- AGENSIBLE (TuAgendita) - CEE Fundación Purísima Concepción (Granada)
-- Tarea SCRUM-156 (T-T01.2 / HUT-01)
-- Esquema Relacional SQL y Políticas Row Level Security (RLS) en Supabase (PostgreSQL)
-- Alineado con: OE2, OE3, OE15, OE16, RF2.1-RF2.13, RF3.1-RF3.13, RF15.1, RF15.2, RNF16.1, RI2.1-RI2.5
-- Integrado con funcionalidades del Prototipo Oficial (tuagendita-prototipos.html)
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLAS ESTRUCTURALES Y ENTIDADES PRINCIPALES
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

-- 2.2 Aulas / Clases del centro (RI2.5, RF2.10, RF2.11)
-- Identificadas visualmente por formas/colores (ej: Triángulo, Círculo, Cuadrado)
CREATE TABLE IF NOT EXISTS public.aulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES public.centros(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- Ej: 'Aula Triángulo', 'Aula Círculo'
    icono_forma VARCHAR(20) DEFAULT 'triangulo', -- 'triangulo' (🔺), 'circulo' (🔵), 'cuadrado' (🟩)
    color_distintivo VARCHAR(20) DEFAULT '#b8492f',
    nivel VARCHAR(100) NOT NULL DEFAULT 'PTVAL', -- Programa de Transición a la Vida Adulta y Laboral
    tutor_titular_id UUID,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Perfiles de supervisores y usuarios del sistema (RI2.1, RF2.1, RF2.2, RF2.7)
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

-- 2.4 Tutores docentes (RI2.3, RF2.2)
CREATE TABLE IF NOT EXISTS public.tutores_docentes (
    id UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
    aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
    especialidad VARCHAR(150) DEFAULT 'Pedagogía Terapéutica',
    telefono_contacto VARCHAR(50),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Familiares (RI2.3, RF2.2)
CREATE TABLE IF NOT EXISTS public.familiares (
    id UUID PRIMARY KEY REFERENCES public.perfiles(id) ON DELETE CASCADE,
    parentesco VARCHAR(100) DEFAULT 'Tutor/a legal',
    telefono_emergencia VARCHAR(50),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Alumnos / Estudiantes (RI2.2, RF2.3, RF2.5, RF2.6, RNF15.1 - RGPD)
CREATE TABLE IF NOT EXISTS public.alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID NOT NULL REFERENCES public.centros(id) ON DELETE CASCADE,
    aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE RESTRICT,
    codigo_expediente VARCHAR(100) NOT NULL UNIQUE, -- Seudonimizado para proteger RGPD (ej: 'EXP-3A71')
    nombre VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150),
    color_identificativo VARCHAR(20) DEFAULT '#2f62b8', -- Color distintivo para accesibilidad motriz/visual
    foto_url TEXT, -- Fotografía táctil de rostro para login visual (CA-01.1)
    icono_personal VARCHAR(50) DEFAULT '⭐', -- Icono/pictograma identificativo del alumno (ej: '🦁', '🚗', '⚽', '🦖')
    secuencia_acceso JSONB DEFAULT '["🍎", "⭐", "🐶"]'::jsonb, -- 3 pictogramas ordenados para login accesible sin contraseña
    requiere_tutor_presencial BOOLEAN NOT NULL DEFAULT true, -- RF2.5: Etiqueta visible en ficha y listados
    dieta_comedor VARCHAR(50) NOT NULL DEFAULT 'basal' CHECK (dieta_comedor IN ('basal', 'turmix', 'texturizada', 'cetogenica')),
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Vínculos entre alumnos y supervisores (RI2.4, RF2.4, RF2.8, RF2.9)
-- Relaciones multidireccionales: aula (docente) y hogar (familia)
CREATE TABLE IF NOT EXISTS public.vinculos_alumno_supervisor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    tipo_vinculo VARCHAR(50) NOT NULL CHECK (tipo_vinculo IN ('aula', 'familiar')),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_alta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_alumno_supervisor UNIQUE (alumno_id, supervisor_id)
);

-- Regla RF2.9 / RI2.4: Como máximo un tutor familiar activo por estudiante
CREATE UNIQUE INDEX IF NOT EXISTS uq_alumno_un_familiar_activo 
ON public.vinculos_alumno_supervisor (alumno_id) 
WHERE (tipo_vinculo = 'familiar' AND activo = true);

-- 2.8 Preferencias estéticas, sensoriales y tema de interés favorito (OE3, RF3.1-RF3.13)
CREATE TABLE IF NOT EXISTS public.preferencias_alumnos (
    alumno_id UUID PRIMARY KEY REFERENCES public.alumnos(id) ON DELETE CASCADE,
    
    -- Centro de interés y motivación (refuerzos positivos: fútbol, coches, motos, dinosaurios, etc.)
    tema_interes VARCHAR(100) NOT NULL DEFAULT 'general', -- 'futbol', 'coches', 'motos', 'animales', 'dinosaurios', 'musica', 'dibujos'
    
    -- Visual y apariencia (RF3.1, RF3.2, RF3.3)
    tema_color VARCHAR(50) NOT NULL DEFAULT 'claro' CHECK (tema_color IN ('claro', 'oscuro', 'pastel', 'alto_contraste')),
    tipo_representacion VARCHAR(50) NOT NULL DEFAULT 'pictograma' CHECK (tipo_representacion IN ('pictograma', 'foto', 'video')),
    tamano_letra VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (tamano_letra IN ('normal', 'grande', 'gigante')),
    tamano_botones VARCHAR(50) NOT NULL DEFAULT 'grande' CHECK (tamano_botones IN ('normal', 'grande', 'gigante')),
    forma_botones VARCHAR(50) NOT NULL DEFAULT 'redondeado' CHECK (forma_botones IN ('cuadrado', 'redondeado', 'circular')),
    
    -- Estructura de agenda y reloj Time Timer (OE4, HU-09, RF3.6-RF3.11)
    vista_agenda VARCHAR(50) NOT NULL DEFAULT 'diaria' CHECK (vista_agenda IN ('diaria', 'semanal')),
    reloj_visual_activo BOOLEAN NOT NULL DEFAULT true,
    reloj_visual_fijo BOOLEAN NOT NULL DEFAULT false,
    
    -- Accesibilidad auditiva y sensorial
    sonidos_activos BOOLEAN NOT NULL DEFAULT true,
    tipo_tono VARCHAR(50) NOT NULL DEFAULT 'campana' CHECK (tipo_tono IN ('campana', 'xilofono', 'suave')),
    avisos_solo_visuales BOOLEAN NOT NULL DEFAULT false,
    modo_calma BOOLEAN NOT NULL DEFAULT false, -- Reduce estímulos visuales ante crisis sensorial
    
    -- Accesibilidad motriz (RF3.4, CA-08.3)
    modo_pulsacion VARCHAR(50) NOT NULL DEFAULT 'simple' CHECK (modo_pulsacion IN ('simple', 'sostenida')), -- Sostenida: 1.5s para evitar toques accidentales
    
    -- Permisos de autonomía del alumno (RF3.12, RF3.13)
    permiso_crear_tareas BOOLEAN NOT NULL DEFAULT false,
    nivel_permisos_preferencias VARCHAR(50) NOT NULL DEFAULT 'ninguno' CHECK (nivel_permisos_preferencias IN ('ninguno', 'parcial', 'total')),
    
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 Tareas de la agenda estructurada (OE4, OE5, RF2.12, RF2.13, RF15.1, RF15.2)
CREATE TABLE IF NOT EXISTS public.tareas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    pictograma_id INTEGER, -- Identificador oficial ARASAAC
    pictograma_url TEXT,
    
    -- Segregación estricta por ámbito (RGPD)
    ambito VARCHAR(50) NOT NULL CHECK (ambito IN ('centro', 'hogar')),
    
    -- Estado en el flujo "Hecho - Ahora - Después" (HU-06)
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'hecho', 'bloqueada')),
    motivo_bloqueo TEXT, -- Ej: 'Hoy llueve'
    
    -- Horario y orden
    hora_inicio TIME,
    hora_fin TIME,
    duracion_minutos INTEGER DEFAULT 30,
    orden INTEGER NOT NULL DEFAULT 1,
    
    -- Tareas por pasos estructurados (OE5, RF10.1) y Planes B alternativos (RF11.1)
    pasos JSONB DEFAULT NULL, -- Array de pasos: [{"orden": 1, "texto": "Abrir grifo", "pictograma": "🚰"}, ...]
    planes_b JSONB DEFAULT NULL, -- Alternativas en caso de bloqueo: [{"titulo": "Taller manualidades", "pictograma": "✂️"}]
    
    requiere_presencia_tutor BOOLEAN NOT NULL DEFAULT false,
    creado_por UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 3. FUNCIONES DE APOYO PARA ROW LEVEL SECURITY (SECURITY DEFINER)
-- ==============================================================================

-- Obtener rol del usuario autenticado actual
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS VARCHAR AS $$
    SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Comprobar si el usuario actual es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE((SELECT rol = 'admin' FROM public.perfiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Comprobar si el usuario actual es tutor de aula del alumno
CREATE OR REPLACE FUNCTION public.is_tutor_docente_of_student(target_alumno_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.vinculos_alumno_supervisor v
        WHERE v.alumno_id = target_alumno_id 
          AND v.supervisor_id = auth.uid() 
          AND v.tipo_vinculo = 'aula' 
          AND v.activo = true
    ) OR EXISTS (
        SELECT 1
        FROM public.alumnos a
        JOIN public.tutores_docentes td ON td.aula_id = a.aula_id
        WHERE a.id = target_alumno_id
          AND td.id = auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Comprobar si el usuario actual es tutor familiar del alumno
CREATE OR REPLACE FUNCTION public.is_familiar_of_student(target_alumno_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.vinculos_alumno_supervisor v
        WHERE v.alumno_id = target_alumno_id 
          AND v.supervisor_id = auth.uid() 
          AND v.tipo_vinculo = 'familiar' 
          AND v.activo = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS) - SEGREGACIÓN RGPD
-- ==============================================================================

-- 4.1 Habilitar RLS en todas las tablas
ALTER TABLE public.centros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutores_docentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.familiares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vinculos_alumno_supervisor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preferencias_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- 4.2 Políticas para centros
CREATE POLICY "Centros: Lectura para usuarios autenticados"
    ON public.centros FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Centros: Administración exclusiva"
    ON public.centros FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.3 Políticas para aulas
CREATE POLICY "Aulas: Lectura para usuarios del centro"
    ON public.aulas FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Aulas: Administración exclusiva"
    ON public.aulas FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.4 Políticas para perfiles
CREATE POLICY "Perfiles: Lectura propia o administradores o supervisores"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() 
        OR public.is_admin() 
        OR public.auth_user_role() IN ('tutor_docente', 'especialista')
    );

CREATE POLICY "Perfiles: Actualización propia de datos básicos"
    ON public.perfiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "Perfiles: Inserción y eliminación por administradores"
    ON public.perfiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.5 Políticas para tutores_docentes y familiares
CREATE POLICY "Tutores docentes: Lectura autenticados"
    ON public.tutores_docentes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Tutores docentes: Gestión administradores"
    ON public.tutores_docentes FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Familiares: Lectura propia o administradores o docentes"
    ON public.familiares FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin() OR public.auth_user_role() = 'tutor_docente');

CREATE POLICY "Familiares: Gestión administradores"
    ON public.familiares FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4.6 Políticas para alumnos (RF2.1, RF2.3, RF2.6, RNF15.1)
CREATE POLICY "Alumnos: Lectura según rol y vínculos"
    ON public.alumnos FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(id)
        OR public.is_familiar_of_student(id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Alumnos: Creación por supervisores y admin"
    ON public.alumnos FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin() 
        OR public.auth_user_role() IN ('tutor_docente', 'familiar')
    );

CREATE POLICY "Alumnos: Modificación por tutores asignados o admin"
    ON public.alumnos FOR UPDATE
    TO authenticated
    USING (
        public.is_admin() 
        OR public.is_tutor_docente_of_student(id)
    )
    WITH CHECK (
        public.is_admin() 
        OR public.is_tutor_docente_of_student(id)
    );

CREATE POLICY "Alumnos: Eliminación exclusiva de administradores"
    ON public.alumnos FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 4.7 Políticas para vínculos alumno-supervisor (RI2.4, RF2.4)
CREATE POLICY "Vínculos: Lectura administradores o usuario involucrado"
    ON public.vinculos_alumno_supervisor FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR supervisor_id = auth.uid()
        OR public.is_tutor_docente_of_student(alumno_id)
    );

CREATE POLICY "Vínculos: Modificación por administradores o tutores"
    ON public.vinculos_alumno_supervisor FOR ALL
    TO authenticated
    USING (
        public.is_admin() 
        OR public.auth_user_role() IN ('tutor_docente', 'familiar')
    )
    WITH CHECK (
        public.is_admin() 
        OR public.auth_user_role() IN ('tutor_docente', 'familiar')
    );

-- 4.8 Políticas para preferencias de alumnos (OE3)
CREATE POLICY "Preferencias: Lectura alumnos y supervisores vinculados"
    ON public.preferencias_alumnos FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
        OR public.auth_user_role() = 'estudiante'
    );

CREATE POLICY "Preferencias: Actualización por tutores o admin"
    ON public.preferencias_alumnos FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
    )
    WITH CHECK (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
    );

CREATE POLICY "Preferencias: Creación inicial por supervisor o admin"
    ON public.preferencias_alumnos FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.is_tutor_docente_of_student(alumno_id)
        OR public.is_familiar_of_student(alumno_id)
    );

-- 4.9 Políticas para Tareas - SEGREGACIÓN ESTRICTA RGPD (RF2.12, RF2.13, RF15.1, RF15.2)
-- El familiar solo consulta y gestiona el hogar; el tutor escolar solo el centro
CREATE POLICY "Tareas: Lectura segregada RGPD"
    ON public.tareas FOR SELECT
    TO authenticated
    USING (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
        OR (public.auth_user_role() = 'estudiante')
    );

CREATE POLICY "Tareas: Inserción segregada por ámbito"
    ON public.tareas FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

CREATE POLICY "Tareas: Actualización segregada por ámbito"
    ON public.tareas FOR UPDATE
    TO authenticated
    USING (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    )
    WITH CHECK (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

CREATE POLICY "Tareas: Eliminación segregada por ámbito"
    ON public.tareas FOR DELETE
    TO authenticated
    USING (
        public.is_admin()
        OR (public.is_tutor_docente_of_student(alumno_id) AND ambito = 'centro')
        OR (public.is_familiar_of_student(alumno_id) AND ambito = 'hogar')
    );

-- ==============================================================================
-- 5. TRIGGERS PARA AUDITORÍA Y FECHAS DE ACTUALIZACIÓN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_alumnos_updated_at
    BEFORE UPDATE ON public.alumnos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_preferencias_updated_at
    BEFORE UPDATE ON public.preferencias_alumnos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_tareas_updated_at
    BEFORE UPDATE ON public.tareas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
