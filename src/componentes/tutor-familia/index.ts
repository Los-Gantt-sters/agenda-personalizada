/**
 * Punto de entrada del módulo compartido Tutor / Familia (SCRUM-234 · Pantallas 39, 40, 41, 42 y 42b).
 */

export {
  AGENDA_ADULTO_DEMO,
  FORMATOS_MULTIMEDIA,
  PASOS_LAVARSE_MANOS,
  PASOS_PREPARAR_MOCHILA,
  TAREA_ESCOLAR_LAVARSE_MANOS,
  TAREA_HOGAR_PREPARAR_MOCHILA,
} from "./datosAgendaAdulto";
export type {
  FormatoMultimediaPaso,
  PasoTareaAdulto,
  TareaAgendaAdulto,
} from "./datosAgendaAdulto";

export { AgendaAdultoAlumno, resolverDestinoTareaAdulto } from "./AgendaAdultoAlumno";
export type {
  AgendaAdultoAlumnoProps,
  DestinoTareaAdulto,
  RolAdultoAgenda,
} from "./AgendaAdultoAlumno";

export { VistaTareaTutor41 } from "./VistaTareaTutor41";
export type { VistaTareaTutor41Props } from "./VistaTareaTutor41";

export { VistaTareaFamiliaClase42 } from "./VistaTareaFamiliaClase42";
export type { VistaTareaFamiliaClase42Props } from "./VistaTareaFamiliaClase42";

export { VistaTareaFamiliaCasa42b } from "./VistaTareaFamiliaCasa42b";
export type { VistaTareaFamiliaCasa42bProps } from "./VistaTareaFamiliaCasa42b";

export * from "../tareas-personales";
