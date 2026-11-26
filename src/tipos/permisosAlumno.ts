/**
 * Tipos de dominio para los permisos simplificados del alumno (Pantalla 26d)
 * y la ejecución restringida de tareas paso a paso (Pantalla 07e)
 * (HU-23 / SCRUM-141 / SCRUM-142 · T-23.1).
 *
 * Sigue exactamente los bocetos definitivos `26d.html` y `07e.html`:
 *   1. Formatos multimedia habilitados debajo de cada paso:
 *      `pictograma`, `texto`, `foto`, `video`, `audio` (mínimo 1 activo).
 *   2. Acceso a Preferencias y pantallas:
 *      - `entradaTrasLogin`: `"06b"` (Semana 06b) o `"06"` (Solo Hoy 06).
 *      - `mostrarBotonPreferencias16`: si el alumno ve el botón «Preferencias» (16)
 *        en la esquina inferior derecha de sus pantallas.
 */

export type FormatoMultimediaAlumno = "pictograma" | "texto" | "foto" | "video" | "audio";

export type DestinoEntradaLoginAlumno = "06b" | "06";

export interface DefinicionFormatoMultimedia {
  clave: FormatoMultimediaAlumno;
  etiqueta: string;
  pictogramaId: number;
}

export interface PermisosAlumno26d {
  /** Identificador del alumno (p. ej. `"ale"`, `"luc"`, UUID). */
  alumnoId: string;
  /** Nombre visible del alumno en la cabecera de 26d y 07e (`"Alejandro"` por defecto). */
  nombreAlumno: string;
  /** Formatos multimedia habilitados bajo cada paso (siempre al menos 1). */
  formatosPermitidos: FormatoMultimediaAlumno[];
  /** Pantalla inicial tras el inicio de sesión del alumno: `"06b"` (Semana) o `"06"` (Solo Hoy). */
  entradaTrasLogin: DestinoEntradaLoginAlumno;
  /** Si se muestra el botón «Preferencias» (menú 16) abajo a la derecha en las pantallas del alumno. */
  mostrarBotonPreferencias16: boolean;
  /** Marca temporal ISO de última actualización. */
  actualizadoEn: string;
}

export interface ActualizarPermisosAlumnoInput {
  alumnoId: string;
  nombreAlumno?: string;
  formatosPermitidos?: FormatoMultimediaAlumno[];
  entradaTrasLogin?: DestinoEntradaLoginAlumno;
  mostrarBotonPreferencias16?: boolean;
}

export interface PasoEjecucionTarea07e {
  orden: number;
  titulo: string;
  textoLecturaFacil: string;
  pictogramaId: number;
  descripcionFoto: string;
  descripcionVideo: string;
  textoAudio: string;
}
