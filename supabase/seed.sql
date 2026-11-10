-- ==============================================================================
-- AGENSIBLE (TuAgendita) - CEE Fundación Purísima Concepción (Granada)
-- Datos semilla de prueba (Seed Data) v2 para desarrollo y testing
-- Cumple CA-T01.2: Inicialización con esquema y datos semilla de prueba
-- Alineado al 100% con profeV2-1.pdf (Sección 5) y Figura 3 (Modelo conceptual)
-- ==============================================================================

-- 1. Insertar Centro Educativo de referencia
INSERT INTO public.centros (id, nombre, codigo, direccion, telefono)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'CEE Fundación Purísima Concepción',
    'CEE-PURISIMA-GR',
    'Calle San Juan de Dios, 18001 Granada',
    '958 20 00 00'
) ON CONFLICT (codigo) DO UPDATE 
SET nombre = EXCLUDED.nombre;

-- 2. Cursos Lectivos / Académicos (profeV2-1 Secc. 5.1.1 y 5.2.1)
INSERT INTO public.cursos_lectivos (id, anio_escolar, fecha_inicio, fecha_fin, activo, cerrado)
VALUES 
    (
        '33333333-3333-3333-3333-333333333330',
        '2025-2026',
        '2025-09-10',
        '2026-06-22',
        false,
        true
    ),
    (
        '33333333-3333-3333-3333-333333333331',
        '2026-2027',
        '2026-09-15',
        '2027-06-25',
        true,
        false
    )
ON CONFLICT (anio_escolar) DO UPDATE 
SET activo = EXCLUDED.activo, cerrado = EXCLUDED.cerrado;

-- 3. Aulas del PTVAL (Programa de Transición a la Vida Adulta y Laboral)
-- Coincide con CLASSES del prototipo: Triángulo (🔺), Círculo (🔵), Cuadrado (🟩)
INSERT INTO public.aulas (id, centro_id, curso_lectivo_id, nombre, icono_forma, color_distintivo, nivel)
VALUES 
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Aula Triángulo', 'triangulo', '#b8492f', 'PTVAL 1'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Aula Círculo', 'circulo', '#2f62b8', 'PTVAL 2'),
    ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'Aula Cuadrado', 'cuadrado', '#3e6fa3', 'PTVAL 3')
ON CONFLICT (id) DO UPDATE 
SET curso_lectivo_id = EXCLUDED.curso_lectivo_id, nombre = EXCLUDED.nombre;

-- 4. Supervisores y Perfiles de Usuario (según SUP del prototipo)
-- 4.1 Administrador (Gonzalo Navas)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'gonzalo.navas@fpurisima.es',
    'Gonzalo Navas (Administración · TIC)',
    'admin',
    true
) ON CONFLICT (id) DO NOTHING;

-- 4.2 Tutora Docente: Carmen Heredia (Aula Triángulo / PTVAL 2)
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

-- 4.3 Tutor Docente: Manuel Gómez (Aula Círculo)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES (
    'b0000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'manuel.gomez@fpurisima.es',
    'Manuel Gómez',
    'tutor_docente',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tutores_docentes (id, aula_id, especialidad, telefono_contacto)
VALUES (
    'b0000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    'Educación Especial y Habilidades Vocacionales',
    '654 22 33 44'
) ON CONFLICT (id) DO NOTHING;

UPDATE public.aulas 
SET tutor_titular_id = 'b0000000-0000-0000-0000-000000000003' 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 4.4 Tutora Familiar: Rosa Castillo (Madre de Lucas)
INSERT INTO public.perfiles (id, centro_id, email, nombre_completo, rol, activo)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'rosa.castillo@correo.es',
    'Rosa Castillo (Madre de Lucas)',
    'familiar',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.familiares (id, parentesco, telefono_emergencia)
VALUES (
    'c0000000-0000-0000-0000-000000000003',
    'Madre / Tutora Legal',
    '655 44 33 22'
) ON CONFLICT (id) DO NOTHING;

-- 5. Estudiantes del PTVAL (Alineados con el Prototipo y Figura 3)
INSERT INTO public.alumnos (
    id, centro_id, aula_id, curso_lectivo_id, codigo_expediente, 
    nombre, apellidos, fecha_nacimiento, estado, metodo_acceso,
    color_identificativo, foto_url, icono_personal, secuencia_acceso, 
    requiere_tutor_presencial, dieta_comedor, activo
)
VALUES 
    (
        'e0000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222221',
        '33333333-3333-3333-3333-333333333331',
        'EXP-3A71',
        'Lucas',
        'García Pérez',
        '2006-04-12',
        'activo',
        'visual',
        '#2f62b8',
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
        '⚽',
        '["🍎", "⭐", "🐶"]'::jsonb,
        false,
        'basal',
        true
    ),
    (
        'e0000000-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222221',
        '33333333-3333-3333-3333-333333333331',
        'EXP-3A70',
        'Mario',
        'López Ruiz',
        '2005-11-20',
        'activo',
        'visual',
        '#b8492f',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&auto=format&fit=crop&q=80',
        '🚗',
        '["⚽", "🚗", "🌟"]'::jsonb,
        true,
        'turmix',
        true
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222221',
        '33333333-3333-3333-3333-333333333331',
        'EXP-3A72',
        'Elena',
        'Morales Sanz',
        '2006-08-15',
        'activo',
        'visual',
        '#2d8659',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80',
        '🦖',
        '["🦖", "🏀", "🍕"]'::jsonb,
        false,
        'basal',
        true
    )
ON CONFLICT (codigo_expediente) DO UPDATE
SET aula_id = EXCLUDED.aula_id, curso_lectivo_id = EXCLUDED.curso_lectivo_id, estado = EXCLUDED.estado;

-- 6. Histórico de Matrícula (Lucas promovido el año anterior, Secc. 5.1.2)
INSERT INTO public.historico_matriculas (id, alumno_id, aula_id, curso_lectivo_id, fecha_inicio, fecha_fin, estado)
VALUES 
    (
        '44444444-4444-4444-4444-444444444441',
        'e0000000-0000-0000-0000-000000000002',
        '22222222-2222-2222-2222-222222222221',
        '33333333-3333-3333-3333-333333333330',
        '2025-09-10',
        '2026-06-22',
        'promocionada'
    )
ON CONFLICT (id) DO NOTHING;

-- 7. Vínculos Multidireccionales
INSERT INTO public.vinculos_alumno_supervisor (alumno_id, supervisor_id, curso_lectivo_id, tipo_vinculo, activo)
VALUES 
    ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', 'aula', true),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, 'familiar', true),
    ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', 'aula', true),
    ('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', 'aula', true)
ON CONFLICT DO NOTHING;

-- 8. Preferencias Sensoriales y Centros de Interés
INSERT INTO public.preferencias_alumnos (
    alumno_id, tema_interes, tema_color, paleta, tamano_letra, letra,
    tamano_botones, botones, forma_botones, vista_agenda, tipo_representacion,
    reloj, reloj_visual_activo, reloj_visual_fijo, sonidos_activos, tipo_tono,
    avisos, avisos_solo_visuales, foco, modo_calma, modo_pulsacion,
    permiso_crear_tareas, nivel_permisos_preferencias
)
VALUES 
    (
        'e0000000-0000-0000-0000-000000000002',
        'futbol',
        'claro', 'claro',
        'grande', 'grande',
        'gigante', 'gigante',
        'redondeado',
        'diaria',
        'pictograma',
        'time_timer', true, false,
        true, 'suave',
        'combinado', false,
        'borde_azul', false,
        'mantener',
        true,
        'total'
    ),
    (
        'e0000000-0000-0000-0000-000000000001',
        'coches',
        'pastel', 'pastel',
        'normal', 'normal',
        'grande', 'grande',
        'circular',
        'diaria',
        'pictograma',
        'time_timer', true, false,
        true, 'xilofono',
        'sonoro', false,
        'alto_contraste', true,
        'simple',
        false,
        'parcial'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'dinosaurios',
        'alto_contraste', 'alto_contraste',
        'gigante', 'gigante',
        'gigante', 'gigante',
        'redondeado',
        'diaria',
        'foto',
        'time_timer', true, true,
        false, 'suave',
        'visual', true,
        'amarillo_grueso', false,
        'simple',
        false,
        'ninguno'
    )
ON CONFLICT (alumno_id) DO UPDATE
SET tema_interes = EXCLUDED.tema_interes, tema_color = EXCLUDED.tema_color;

-- 9. Catálogo de Tareas y Encargos del Centro (con Plan B y duración)
-- Plan B maestro: Actividad tranquila en biblioteca
INSERT INTO public.tareas (
    id, titulo, descripcion, tipo, subtipo, pictograma_id, pictograma_url,
    ambito, prioridad, duracion_estimada_minutos, estado, requiere_presencia_tutor, creado_por
)
VALUES (
    '55555555-5555-5555-5555-555555555550',
    'Biblioteca y lectura tranquila',
    'Lectura relajada de cuentos adaptados o fichas en la biblioteca.',
    'pedagogica',
    'general',
    2849,
    'https://static.arasaac.org/pictograms/2849/2849_500.png',
    'centro',
    'media',
    45,
    'pendiente',
    false,
    'b0000000-0000-0000-0000-000000000002'
) ON CONFLICT (id) DO NOTHING;

-- Tareas de catálogo asociadas a Lucas
INSERT INTO public.tareas (
    id, alumno_id, titulo, descripcion, tipo, subtipo, pictograma_id, pictograma_url,
    ambito, prioridad, plan_b_tarea_id, duracion_estimada_minutos, estado, hora_inicio, hora_fin, orden,
    requiere_presencia_tutor, creado_por
)
VALUES 
    (
        '55555555-5555-5555-5555-555555555551',
        'e0000000-0000-0000-0000-000000000002',
        'Asamblea de la mañana',
        'Saludo, calendario del día y reparto de responsabilidades.',
        'rutina',
        'general',
        2841,
        'https://static.arasaac.org/pictograms/2841/2841_500.png',
        'centro',
        'alta',
        NULL,
        30,
        'hecho',
        '09:30:00',
        '10:00:00',
        1,
        false,
        'b0000000-0000-0000-0000-000000000002'
    ),
    (
        '55555555-5555-5555-5555-555555555552',
        'e0000000-0000-0000-0000-000000000002',
        'Taller de Reprografía',
        'Encargo vocacional: encuadernar y plastificar documentos del colegio.',
        'encargo',
        'reprografia',
        3120,
        'https://static.arasaac.org/pictograms/3120/3120_500.png',
        'centro',
        'alta',
        '55555555-5555-5555-5555-555555555550',
        45,
        'en_curso',
        '10:00:00',
        '10:45:00',
        2,
        true,
        'b0000000-0000-0000-0000-000000000002'
    ),
    (
        '55555555-5555-5555-5555-555555555553',
        'e0000000-0000-0000-0000-000000000002',
        'Lavarse las manos',
        'Higiene antes del almuerzo.',
        'rutina',
        'general',
        2450,
        'https://static.arasaac.org/pictograms/2450/2450_500.png',
        'centro',
        'media',
        NULL,
        10,
        'pendiente',
        '13:15:00',
        '13:25:00',
        3,
        false,
        'b0000000-0000-0000-0000-000000000002'
    ),
    (
        '55555555-5555-5555-5555-555555555554',
        'e0000000-0000-0000-0000-000000000002',
        'Preparar la merienda',
        'Merendar en casa.',
        'personal',
        'general',
        2345,
        'https://static.arasaac.org/pictograms/2345/2345_500.png',
        'hogar',
        'baja',
        NULL,
        15,
        'pendiente',
        '17:00:00',
        '17:15:00',
        1,
        false,
        'c0000000-0000-0000-0000-000000000003'
    )
ON CONFLICT (id) DO UPDATE
SET titulo = EXCLUDED.titulo, tipo = EXCLUDED.tipo, subtipo = EXCLUDED.subtipo;

-- 10. Pasos y Recursos Multimedia
INSERT INTO public.pasos_tarea (id, tarea_id, orden, texto, imagen_url)
VALUES 
    ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555552', 1, 'Recoger folios en secretaría', 'https://static.arasaac.org/pictograms/6120/6120_500.png'),
    ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', 2, 'Colocar la espiral de encuadernar', 'https://static.arasaac.org/pictograms/6121/6121_500.png'),
    ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555552', 3, 'Entregar los cuadernos terminados', 'https://static.arasaac.org/pictograms/6122/6122_500.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recursos_multimedia (id, paso_id, tipo, archivo_url, descripcion_alternativa, origen)
VALUES 
    ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', 'pictograma', 'https://static.arasaac.org/pictograms/6120/6120_500.png', 'Folios de papel', 'arasaac'),
    ('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666662', 'imagen', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=240', 'Máquina encuadernadora', 'propio')
ON CONFLICT (id) DO NOTHING;

-- 11. Planificación Diaria / Asignaciones
INSERT INTO public.asignaciones (id, estudiante_id, tarea_id, curso_lectivo_id, fecha, hora_inicio, hora_fin, orden, estado)
VALUES 
    (
        '88888888-8888-8888-8888-888888888881',
        'e0000000-0000-0000-0000-000000000002',
        '55555555-5555-5555-5555-555555555551',
        '33333333-3333-3333-3333-333333333331',
        CURRENT_DATE,
        '09:30:00',
        '10:00:00',
        1,
        'completada'
    ),
    (
        '88888888-8888-8888-8888-888888888882',
        'e0000000-0000-0000-0000-000000000002',
        '55555555-5555-5555-5555-555555555552',
        '33333333-3333-3333-3333-333333333331',
        CURRENT_DATE,
        '10:00:00',
        '10:45:00',
        2,
        'en_curso'
    ),
    (
        '88888888-8888-8888-8888-888888888883',
        'e0000000-0000-0000-0000-000000000002',
        '55555555-5555-5555-5555-555555555553',
        '33333333-3333-3333-3333-333333333331',
        CURRENT_DATE,
        '13:15:00',
        '13:25:00',
        3,
        'pendiente'
    )
ON CONFLICT (id) DO UPDATE
SET estado = EXCLUDED.estado;

-- 12. Telemetría y Marcas de Tiempo Reales (SCRUM-76)
INSERT INTO public.ejecuciones (
    id, asignacion_id, estudiante_id, inicio, fin, 
    duracion_real_segundos, desviacion_segundos, estado_final, 
    pasos_confirmados, valoracion_emocional, observaciones
)
VALUES 
    (
        '99999999-9999-9999-9999-999999999991',
        '88888888-8888-8888-8888-888888888881',
        'e0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '1 hour 32 minutes',
        1680, -- 28 minutos reales (frente a 30 min estimados)
        -120, -- Acabó 2 minutos antes
        'completada',
        '[{"paso": 1, "confirmado_en": "2026-11-09T09:35:00Z"}]'::jsonb,
        'contento',
        'Excelente participación en la asamblea.'
    ),
    (
        '99999999-9999-9999-9999-999999999992',
        '88888888-8888-8888-8888-888888888882',
        'e0000000-0000-0000-0000-000000000002',
        NOW() - INTERVAL '25 minutes',
        NULL,
        NULL,
        NULL,
        NULL,
        '[{"paso": 1, "confirmado_en": "2026-11-09T10:10:00Z"}]'::jsonb,
        NULL,
        'Tarea actualmente en progreso.'
    )
ON CONFLICT (asignacion_id) DO UPDATE
SET duracion_real_segundos = EXCLUDED.duracion_real_segundos;

-- 13. Peticiones de Necesidades Fisiológicas Básicas (HU-18 / SCRUM-85)
INSERT INTO public.avisos_peticiones (id, estudiante_id, necesidad, urgencia, sala_actual, atendido)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'e0000000-0000-0000-0000-000000000002', 'agua', false, 'Aula Triángulo', true),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'e0000000-0000-0000-0000-000000000001', 'bano', true, 'Taller de Jardinería', false)
ON CONFLICT (id) DO NOTHING;
