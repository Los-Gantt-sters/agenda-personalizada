// Qué deja ver el tutor dentro de las tareas del alumno (pantalla 26d, HU-23 · SCRUM-141).
// Los formatos se guardan en preferencias_alumnos.formatos_multimedia_permitidos. En la pantalla de
// la tarea (PantallaTarea) cada formato es una parte:
//   - «pictograma»: el dibujo de la tarea y de los pasos;
//   - «texto»: el título, la descripción y el texto de los pasos;
//   - «audio»: el botón «Escuchar»;
//   - «video»: el botón «Ver vídeo».
// «foto» todavía no sale en esta pantalla (llegará con los pasos multimedia de la HU-10).
// Si el tutor quita a la vez el dibujo y el texto, se deja el dibujo: sin él no se sabría qué tarea es.
import type { ModoCanal } from "../../preferencias/opciones";
import type { FormatoMultimediaAlumno } from "../../tipos/permisosAlumno";

export interface PermisosVistaTarea {
  dibujo: boolean;
  texto: boolean;
  audio: boolean;
  video: boolean;
}

const TODO_PERMITIDO: PermisosVistaTarea = { dibujo: true, texto: true, audio: true, video: true };

/** Qué partes de la tarea se pueden ver. Sin formatos (o con la lista vacía), todas. */
export function permisosDeVista(
  formatos?: readonly FormatoMultimediaAlumno[] | null,
): PermisosVistaTarea {
  if (!formatos || formatos.length === 0) return TODO_PERMITIDO;
  const texto = formatos.includes("texto");
  return {
    dibujo: formatos.includes("pictograma") || !texto,
    texto,
    audio: formatos.includes("audio"),
    video: formatos.includes("video"),
  };
}

/** Si uno de los tres botones de «Cómo se ve la tarea» está permitido. */
export function formatoPermitido(modo: ModoCanal, permisos: PermisosVistaTarea): boolean {
  if (modo === "ambos") return permisos.dibujo && permisos.texto;
  if (modo === "soloPictograma") return permisos.dibujo;
  return permisos.texto;
}

/** El formato elegido (o el de las preferencias), cambiado por uno permitido si hace falta. */
export function ajustarFormato(modo: ModoCanal, permisos: PermisosVistaTarea): ModoCanal {
  if (formatoPermitido(modo, permisos)) return modo;
  if (!permisos.texto) return "soloPictograma";
  return "soloTexto";
}
