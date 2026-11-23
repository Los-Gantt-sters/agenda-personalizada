/**
 * Catálogo de las 9 aulas geométricas del CEE Fundación Purísima Concepción y su alumnado
 * (SCRUM-233 / SCRUM-252 · Pantalla 35: 9 clases a la vez sin paginación).
 */

import { ESTUDIANTES_MOCK, type Estudiante } from "../../tipos/estudiante";

export interface AulaTutor {
  id: string;
  nombre: string;
  simbolo: string;
  color: string;
  totalAlumnos: number;
}

/**
 * Las 9 aulas del centro escolar que se muestran simultáneamente en una cuadrícula 3x3
 * en la Pantalla 35 del Tutor (sin paginación).
 */
export const AULAS_TUTOR: AulaTutor[] = [
  { id: "tri", nombre: "Clase Triángulo", simbolo: "🔺", color: "#B42318", totalAlumnos: 4 },
  { id: "cir", nombre: "Clase Círculo", simbolo: "🔵", color: "#2F5FBF", totalAlumnos: 5 },
  { id: "cua", nombre: "Clase Cuadrado", simbolo: "🟩", color: "#1E7A46", totalAlumnos: 3 },
  { id: "est", nombre: "Clase Estrella", simbolo: "⭐", color: "#D97706", totalAlumnos: 4 },
  { id: "rom", nombre: "Clase Rombo", simbolo: "🔷", color: "#7A1F4D", totalAlumnos: 5 },
  { id: "hex", nombre: "Clase Hexágono", simbolo: "⬢", color: "#0F766E", totalAlumnos: 4 },
  { id: "pen", nombre: "Clase Pentágono", simbolo: "⬟", color: "#6D28D9", totalAlumnos: 4 },
  { id: "ova", nombre: "Clase Óvalo", simbolo: "🥚", color: "#C2410C", totalAlumnos: 3 },
  { id: "oct", nombre: "Clase Octógono", simbolo: "🛑", color: "#0369A1", totalAlumnos: 5 },
];

const ALUMNOS_EXTRA_AULAS: Estudiante[] = [
  {
    id: "lci",
    nombre: "Lucía",
    nombreCompleto: "Lucía Fernández",
    claseId: "cir",
    icono: "🐼",
    color: "#2F5FBF",
  },
  {
    id: "sof",
    nombre: "Sofía",
    nombreCompleto: "Sofía Martín",
    claseId: "cua",
    icono: "🦊",
    color: "#1E7A46",
  },
  {
    id: "hug",
    nombre: "Hugo",
    nombreCompleto: "Hugo Navarro",
    claseId: "cua",
    icono: "🐯",
    color: "#2D6A3E",
  },
  {
    id: "val",
    nombre: "Valeria",
    nombreCompleto: "Valeria Molina",
    claseId: "est",
    icono: "🦄",
    color: "#D97706",
  },
  {
    id: "mat",
    nombre: "Mateo",
    nombreCompleto: "Mateo Ortega",
    claseId: "est",
    icono: "🐬",
    color: "#B45309",
  },
  {
    id: "pau",
    nombre: "Paula",
    nombreCompleto: "Paula Serrano",
    claseId: "est",
    icono: "🦉",
    color: "#92400E",
  },
  {
    id: "adr",
    nombre: "Adrián",
    nombreCompleto: "Adrián Cano",
    claseId: "est",
    icono: "🐨",
    color: "#D97706",
  },
  {
    id: "cla",
    nombre: "Claudia",
    nombreCompleto: "Claudia Reyes",
    claseId: "rom",
    icono: "🦩",
    color: "#7A1F4D",
  },
  {
    id: "alv",
    nombre: "Álvaro",
    nombreCompleto: "Álvaro Domínguez",
    claseId: "rom",
    icono: "🐻",
    color: "#9D174D",
  },
  {
    id: "ire",
    nombre: "Irene",
    nombreCompleto: "Irene Pascual",
    claseId: "rom",
    icono: "🐰",
    color: "#7A1F4D",
  },
  {
    id: "gon",
    nombre: "Gonzalo",
    nombreCompleto: "Gonzalo Rubio",
    claseId: "rom",
    icono: "🐸",
    color: "#831843",
  },
  {
    id: "alb",
    nombre: "Alba",
    nombreCompleto: "Alba Méndez",
    claseId: "rom",
    icono: "🐝",
    color: "#7A1F4D",
  },
  {
    id: "pab",
    nombre: "Pablo",
    nombreCompleto: "Pablo Guerrero",
    claseId: "hex",
    icono: "🐙",
    color: "#0F766E",
  },
  {
    id: "car",
    nombre: "Carmen",
    nombreCompleto: "Carmen Aguilera",
    claseId: "hex",
    icono: "🐞",
    color: "#115E59",
  },
  {
    id: "die",
    nombre: "Diego",
    nombreCompleto: "Diego Lozano",
    claseId: "hex",
    icono: "🐳",
    color: "#0F766E",
  },
  {
    id: "jul",
    nombre: "Julia",
    nombreCompleto: "Julia Prieto",
    claseId: "hex",
    icono: "🐿️",
    color: "#134E4A",
  },
  {
    id: "rub",
    nombre: "Rubén",
    nombreCompleto: "Rubén Soler",
    claseId: "pen",
    icono: "🦅",
    color: "#6D28D9",
  },
  {
    id: "mrn",
    nombre: "Marina",
    nombreCompleto: "Marina Campos",
    claseId: "pen",
    icono: "🦢",
    color: "#5B21B6",
  },
  {
    id: "iva",
    nombre: "Iván",
    nombreCompleto: "Iván Cabrera",
    claseId: "pen",
    icono: "🦔",
    color: "#6D28D9",
  },
  {
    id: "sar",
    nombre: "Sara",
    nombreCompleto: "Sara Vega",
    claseId: "pen",
    icono: "🦜",
    color: "#4C1D95",
  },
  {
    id: "noa",
    nombre: "Noa",
    nombreCompleto: "Noa Hidalgo",
    claseId: "ova",
    icono: "🦒",
    color: "#C2410C",
  },
  {
    id: "leo",
    nombre: "Leo",
    nombreCompleto: "Leo Carmona",
    claseId: "ova",
    icono: "🦓",
    color: "#9A3412",
  },
  {
    id: "bru",
    nombre: "Bruno",
    nombreCompleto: "Bruno Gallego",
    claseId: "ova",
    icono: "🦘",
    color: "#C2410C",
  },
  {
    id: "crl",
    nombre: "Carla",
    nombreCompleto: "Carla Peña",
    claseId: "oct",
    icono: "🦭",
    color: "#0369A1",
  },
  {
    id: "mrt",
    nombre: "Martín",
    nombreCompleto: "Martín León",
    claseId: "oct",
    icono: "🐧",
    color: "#075985",
  },
  {
    id: "veg",
    nombre: "Vega",
    nombreCompleto: "Vega Calvo",
    claseId: "oct",
    icono: "🦦",
    color: "#0369A1",
  },
  {
    id: "enz",
    nombre: "Enzo",
    nombreCompleto: "Enzo Vidal",
    claseId: "oct",
    icono: "🐊",
    color: "#0C4A6E",
  },
  {
    id: "lol",
    nombre: "Lola",
    nombreCompleto: "Lola Arias",
    claseId: "oct",
    icono: "🦚",
    color: "#0369A1",
  },
];

/** Catálogo completo de estudiantes de las 9 aulas. */
export const TODOS_ESTUDIANTES_TUTOR: Estudiante[] = [...ESTUDIANTES_MOCK, ...ALUMNOS_EXTRA_AULAS];

/**
 * Obtiene los datos de un aula por su identificador (`tri`, `cir`, `cua`, etc.).
 * @param aulaId Identificador corto del aula
 * @returns Objeto `AulaTutor` o la Clase Triángulo por defecto
 */
export function obtenerAulaTutor(aulaId: string): AulaTutor {
  return AULAS_TUTOR.find((a) => a.id === aulaId) ?? AULAS_TUTOR[0];
}

/**
 * Devuelve la lista de estudiantes matriculados en un aula determinada.
 * @param aulaId Identificador del aula
 * @returns Lista de estudiantes pertenecientes al aula
 */
export function obtenerAlumnosDeAula(aulaId: string): Estudiante[] {
  return TODOS_ESTUDIANTES_TUTOR.filter((e) => e.claseId === aulaId);
}

/**
 * Busca un estudiante por su identificador en el catálogo completo del centro.
 * @param alumnoId Identificador del estudiante (p. ej. `luc`, `ale`)
 * @returns El estudiante encontrado o Alejandro (`ale`) por defecto
 */
export function obtenerAlumnoTutor(alumnoId: string): Estudiante {
  return TODOS_ESTUDIANTES_TUTOR.find((e) => e.id === alumnoId) ?? TODOS_ESTUDIANTES_TUTOR[0];
}
