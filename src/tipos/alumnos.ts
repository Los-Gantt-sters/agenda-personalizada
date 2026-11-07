/**
 * Tipos y contratos del modelo de datos para Alumnos, Tutores y Vínculos (HU-03 / SCRUM-59)
 * Alineado con requisitos: OE2, OE3, RF2.1-RF2.13, RF3.1-RF3.13, RF15.1, RF15.2, RI2.1-RI2.5
 * Integrado con el esquema relacional de Supabase y el prototipo oficial (tuagendita-prototipos.html).
 */

import { SupervisorProfile } from "./auth";

// ==============================================================================
// 1. TIPOS BÁSICOS Y ENUMS
// ==============================================================================

export type DietaComedor = "basal" | "turmix" | "texturizada" | "cetogenica";

export type TipoVinculo = "aula" | "familiar";

export type AmbitoActuacion = "centro" | "hogar";

export type TemaInteres =
  "general" | "futbol" | "coches" | "motos" | "animales" | "dinosaurios" | "musica" | "dibujo";

export type FormaBoton = "cuadrado" | "redondeado" | "circular";

export type TamanoElemento = "normal" | "grande" | "gigante";

export type TemaColor = "claro" | "oscuro" | "pastel" | "alto_contraste";

export type TipoRepresentacion = "pictograma" | "foto" | "video";

export type TipoTono = "campana" | "xilofono" | "suave";

export type ModoPulsacion = "simple" | "sostenida";

export type NivelPermisos = "ninguno" | "parcial" | "total";

// ==============================================================================
// 2. MODELOS PRINCIPALES
// ==============================================================================

/**
 * Aula escolar del PTVAL (Programa de Transición a la Vida Adulta y Laboral)
 * Requisitos: RI2.5, RF2.10, RF2.11
 */
export interface Aula {
  id: string;
  centroId: string;
  nombre: string;
  iconoForma?: "triangulo" | "circulo" | "cuadrado" | string;
  colorDistintivo?: string;
  nivel: string;
  tutorTitularId?: string;
  creadoEn?: string;
}

/**
 * Extensión de perfil para docentes y especialistas del centro escolar
 * Requisitos: RI2.3, RF2.2
 */
export interface TutorDocente {
  id: string;
  perfil?: SupervisorProfile;
  aulaId?: string;
  especialidad: string;
  telefonoContacto?: string;
  creadoEn?: string;
}

/**
 * Extensión de perfil para familiares y tutores legales del hogar
 * Requisitos: RI2.3, RF2.2
 */
export interface Familiar {
  id: string;
  perfil?: SupervisorProfile;
  parentesco: string;
  telefonoEmergencia?: string;
  creadoEn?: string;
}

/**
 * Vínculo multidireccional entre un alumno y un supervisor (docente o familiar)
 * Requisitos: RI2.4, RF2.4, RF2.8, RF2.9
 * Restricción: como máximo 1 tutor familiar activo por estudiante.
 */
export interface VinculoAlumnoSupervisor {
  id: string;
  alumnoId: string;
  supervisorId: string;
  tipoVinculo: TipoVinculo;
  activo: boolean;
  fechaAlta: string;
  creadoEn?: string;
  supervisor?: SupervisorProfile;
}

/**
 * Preferencias estéticas, sensoriales y tema de interés favorito del estudiante
 * Requisitos: OE3, RF3.1-RF3.13
 */
export interface PreferenciaAlumno {
  alumnoId: string;
  temaInteres: TemaInteres;
  temaColor: TemaColor;
  tipoRepresentacion: TipoRepresentacion;
  tamanoLetra: TamanoElemento;
  tamanoBotones: TamanoElemento;
  formaBotones: FormaBoton;
  vistaAgenda: "diaria" | "semanal";
  relojVisualActivo: boolean;
  relojVisualFijo: boolean;
  sonidosActivos: boolean;
  tipoTono: TipoTono;
  avisosSoloVisuales: boolean;
  modoCalma: boolean;
  modoPulsacion: ModoPulsacion;
  permisoCrearTareas: boolean;
  nivelPermisosPreferencias: NivelPermisos;
  actualizadoEn?: string;
}

/**
 * Estudiante / Alumno del Centro de Educación Especial
 * Requisitos: RI2.2, RF2.3, RF2.5, RF2.6, RNF15.1 (RGPD - Seudonimización)
 */
export interface Alumno {
  id: string;
  centroId: string;
  aulaId: string;
  codigoExpediente: string; // Seudonimizado para proteger RGPD (ej: 'EXP-3A71')
  nombre: string;
  apellidos?: string;
  colorIdentificativo?: string;
  fotoUrl?: string; // Fotografía táctil de rostro (CA-01.1)
  iconoPersonal?: string; // Icono o animal identificativo (ej: '🦁', '🚗', '⭐')
  secuenciaAcceso?: string[]; // 3 pictogramas ordenados para inicio de sesión visual
  requiereTutorPresencial: boolean; // RF2.5: Etiqueta visible obligatoria
  dietaComedor: DietaComedor;
  activo: boolean;
  creadoEn?: string;
  actualizadoEn?: string;
}

/**
 * Alumno con información relacional completa agregada
 */
export interface AlumnoDetalle extends Alumno {
  aula?: Aula;
  preferencias?: PreferenciaAlumno;
  vinculos?: VinculoAlumnoSupervisor[];
  tutorDocenteTitular?: SupervisorProfile;
  tutorFamiliarPrincipal?: SupervisorProfile;
}

// ==============================================================================
// 3. ENTRADAS Y CONTRATOS PARA OPERACIONES CRUD
// ==============================================================================

/**
 * Datos requeridos para dar de alta un estudiante (RF2.3, RF2.4, RF2.5)
 * Nota de negocio obligatoria (SCRUM-60): La asignación de tutor titular es obligatoria.
 */
export interface CrearAlumnoInput {
  nombre: string;
  aulaId: string;
  tutorTitularId: string; // Tutor docente responsable obligatorio
  codigoExpediente?: string;
  centroId?: string;
  apellidos?: string;
  colorIdentificativo?: string;
  fotoUrl?: string;
  iconoPersonal?: string;
  secuenciaAcceso?: string[];
  requiereTutorPresencial?: boolean;
  dietaComedor?: DietaComedor;
  tutorFamiliarId?: string; // Tutor familiar opcional al dar de alta
  temaInteres?: TemaInteres; // Centro de interés: fútbol, coches, motos...
}

/**
 * Datos actualizables de un estudiante
 */
export interface ActualizarAlumnoInput extends Partial<Omit<CrearAlumnoInput, "tutorTitularId">> {
  tutorTitularId?: string;
  activo?: boolean;
}

/**
 * Resultado de operaciones de la API de Alumnos
 */
export interface AlumnosResult<T = AlumnoDetalle> {
  success: boolean;
  data?: T;
  error?: string;
}
