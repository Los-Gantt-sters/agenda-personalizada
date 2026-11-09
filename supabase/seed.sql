-- ==============================================================================
-- AGENSIBLE (TuAgendita) - CEE Fundación Purísima Concepción (Granada)
-- Datos semilla de prueba (Seed Data) para desarrollo y testing
-- Cumple CA-T01.2: Inicialización con esquema y datos semilla de prueba
-- Datos alineados con el Prototipo Oficial (tuagendita-prototipos.html)
-- ==============================================================================

-- 1. Insertar Centro Educativo de referencia
INSERT INTO public.centros (id, nombre, codigo, direccion, telefono)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'CEE Fundación Purísima Concepción',
    'CEE-PURISIMA-GR',
    'Calle San Juan de Dios, 18001 Granada',
    '958 20 00 00'
) ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar Aulas del PTVAL (Programa de Transición a la Vida Adulta y Laboral)
-- Coincide con CLASSES del prototipo: Triángulo (🔺), Círculo (🔵), Cuadrado (🟩)
INSERT INTO public.aulas (id, centro_id, nombre, icono_forma, color_distintivo, nivel)
VALUES 
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Aula Triángulo', 'triangulo', '#b8492f', 'PTVAL 1'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Aula Círculo', 'circulo', '#2f62b8', 'PTVAL 2'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Aula Cuadrado', 'cuadrado', '#3e6fa3', 'PTVAL 3')
ON CONFLICT DO NOTHING;

-- 3. Supervisores y Perfiles de Usuario (según SUP del prototipo)
-- 3.1 Administrador (Gonzalo Navas)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'gonzalo.navas@fpurisima.es',
    'Gonzalo Navas (Administración · TIC)',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- 3.2 Tutora Docente: Carmen Heredia (Aula Triángulo / PTVAL 2)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'carmen.heredia@fpurisima.es',
    'Carmen Heredia',
    'tutor_docente',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tutores_docentes (id, aula_id, especialidad, telefono_contacto)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222221',
    'Pedagogía Terapéutica y Audición y Lenguaje',
    '654 11 22 33'
) ON CONFLICT (id) DO NOTHING;

UPDATE public.aulas 
SET tutor_titular_id = 'b0000000-0000-0000-0000-000000000002' 
WHERE id = '22222222-2222-2222-2222-222222222221';

-- 3.3 Familiares (Ramón Gil y Familia Benítez)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES 
    (
        'c0000000-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        'familia.gil@correo.es',
        'Ramón Gil (Padre de Sergio)',
        'familiar',
        true
    ),
    (
        'c0000000-0000-0000-0000-000000000004',
        '11111111-1111-1111-1111-111111111111',
        'benitez.garrido@correo.es',
        'Familia Benítez (Marcos)',
        'familiar',
        true
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.familiares (id, parentesco, telefono_emergencia)
VALUES 
    ('c0000000-0000-0000-0000-000000000003', 'Padre', '611 99 88 77'),
    ('c0000000-0000-0000-0000-000000000004', 'Madre', '622 33 44 55')
ON CONFLICT (id) DO NOTHING;

-- 4. Alumnos / Estudiantes (Coinciden con STU del prototipo)
INSERT INTO public.alumnos (
    id, centro_id, aula_id, codigo_expediente, nombre, apellidos, 
    color_identificativo, foto_url, icono_personal, secuencia_acceso, 
    requiere_tutor_presencial, dieta_comedor, activo
)
VALUES 
    -- Alejandro (León 🦁, Reprografía, Dieta Basal)
    (
        'e0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222221',
        'EXP-3A71',
        'Alejandro',
        'Castillo Vega',
        '#b8492f',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop',
        '🦁',
        '["🍎", "⭐", "🦁"]'::jsonb,
        true,
        'basal',
        true
    ),
    -- Sergio (Tortuga 🐢, Dieta Texturizada)
    (
        'e0000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222221',
        'EXP-C4D3',
        'Sergio',
        'Gil Fernández',
        '#44546b',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop',
        '🐢',
        '["⭐", "🐶", "🐢"]'::jsonb,
        true,
        'texturizada',
        true
    ),
    -- Daniel (Coche 🚗, Comedor, Dieta Túrmix)
    (
        'e0000000-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'EXP-90C2',
        'Daniel',
        'Romero Soto',
        '#2f62b8',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop',
        '🚗',
        '["🚗", "🏠", "🌞"]'::jsonb,
        false,
        'turmix',
        true
    )
ON CONFLICT (codigo_expediente) DO NOTHING;

-- 5. Vínculos alumno-supervisor (Multidireccionales)
INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, tipo_vinculo, activo)
VALUES 
    -- Sergio vinculado a Docente Carmen (aula) y Ramón Gil (familiar)
    ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'aula', true),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'familiar', true),

    -- Alejandro vinculado a Docente Carmen (aula)
    ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'aula', true)
ON CONFLICT (alumno_id, supervisor_id) DO NOTHING;

-- 6. Preferencias de Alumno (Con temas de interés: fútbol, coches, motos, dinosaurios...)
INSERT INTO public.preferencias_alumnos (
    alumno_id, tema_interes, tema_color, tipo_representacion, tamano_letra, tamano_botones, 
    forma_botones, vista_agenda, reloj_visual_activo, reloj_visual_fijo, 
    sonidos_activos, tipo_tono, avisos_solo_visuales, modo_calma, modo_pulsacion,
    permiso_crear_tareas, nivel_permisos_preferencias
)
VALUES 
    -- Alejandro: Le encantan los COCHES y MOTOS 🚗🏍️
    (
        'e0000000-0000-0000-0000-000000000001',
        'coches',
        'claro',
        'pictograma',
        'grande',
        'gigante',
        'redondeado',
        'diaria',
        true,
        true,
        true,
        'campana',
        false,
        false,
        'sostenida', -- 1.5s antipulsación
        true,
        'total'
    ),
    -- Sergio: Le apasiona el FÚTBOL y los DEPORTES ⚽
    (
        'e0000000-0000-0000-0000-000000000002',
        'futbol',
        'pastel',
        'pictograma',
        'normal',
        'grande',
        'redondeado',
        'diaria',
        true,
        false,
        true,
        'xilofono',
        false,
        true, -- Modo calma activado ante sobrecarga sensorial
        'simple',
        false,
        'parcial'
    ),
    -- Daniel: Le apasionan los DINOSAURIOS y ANIMALES 🦖🦁
    (
        'e0000000-0000-0000-0000-000000000003',
        'dinosaurios',
        'alto_contraste',
        'foto',
        'gigante',
        'gigante',
        'redondeado',
        'diaria',
        true,
        true,
        false, -- Avisos solo visuales sin sonido
        'suave',
        true,
        false,
        'simple',
        false,
        'ninguno'
    )
ON CONFLICT (alumno_id) DO NOTHING;

-- 7. Tareas de prueba estructuradas (Hecho - Ahora - Después, Pasos y Plan B)
INSERT INTO public.tareas (
    alumno_id, titulo, descripcion, pictograma_id, pictograma_url, 
    ambito, estado, hora_inicio, hora_fin, duracion_minutos, orden, 
    pasos, planes_b, requiere_presencia_tutor, creado_por
)
VALUES 
    -- Tareas del Centro
    (
        'e0000000-0000-0000-0000-000000000002',
        'Asamblea de la mañana',
        'Saludo, calendario del día y reparto de responsabilidades.',
        2841,
        'https://static.arasaac.org/pictograms/2841/2841_500.png',
        'centro',
        'hecho',
        '09:30:00',
        '09:58:00',
        30,
        1,
        NULL,
        NULL,
        false,
        'b0000000-0000-0000-0000-000000000002'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'Huerto escolar',
        'Cuidado y riego de las hortalizas.',
        3120,
        'https://static.arasaac.org/pictograms/3120/3120_500.png',
        'centro',
        'bloqueada', -- Ejemplo del prototipo: bloqueada por lluvia
        '11:30:00',
        '12:30:00',
        60,
        2,
        NULL,
        '[{"titulo": "Taller de manualidades", "pictograma": "✂️"}, {"titulo": "Leer un cuento", "pictograma": "📚"}]'::jsonb,
        true,
        'b0000000-0000-0000-0000-000000000002'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'Lavarse las manos',
        'Higiene antes del almuerzo.',
        2450,
        'https://static.arasaac.org/pictograms/2450/2450_500.png',
        'centro',
        'en_curso',
        '13:15:00',
        '13:20:00',
        5,
        3,
        '[
            {"orden": 1, "texto": "Abre el grifo y moja las manos", "pictograma": "🚰"},
            {"orden": 2, "texto": "Echa jabón", "pictograma": "🧴"},
            {"orden": 3, "texto": "Frota las manos", "pictograma": "👐"},
            {"orden": 4, "texto": "Aclara con agua", "pictograma": "💦"},
            {"orden": 5, "texto": "Sécate con la toalla", "pictograma": "🧻"}
        ]'::jsonb,
        NULL,
        false,
        'b0000000-0000-0000-0000-000000000002'
    ),
    -- Tareas del Hogar
    (
        'e0000000-0000-0000-0000-000000000002',
        'Preparar la merienda',
        'Merendar en casa.',
        2345,
        'https://static.arasaac.org/pictograms/2345/2345_500.png',
        'hogar',
        'pendiente',
        '17:00:00',
        '17:15:00',
        15,
        1,
        '[
            {"orden": 1, "texto": "Saca el pan y el queso", "pictograma": "🍞"},
            {"orden": 2, "texto": "Pon el queso en el pan", "pictograma": "🧀"},
            {"orden": 3, "texto": "Echa el zumo en el vaso", "pictograma": "🧃"}
        ]'::jsonb,
        NULL,
        false,
        'c0000000-0000-0000-0000-000000000003'
    );
