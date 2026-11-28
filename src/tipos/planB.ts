// Plan B (HU-22 · SCRUM-137): una tarea ya creada que sustituye a otra cuando hace falta.

/** Tarea de la biblioteca, para elegirla como Plan B. */
export interface TareaPlanB {
  id: string;
  titulo: string;
  pictogramaUrl: string | null;
}

/** Una fila de 47b o 47c: la tarea principal de hoy y su Plan B. */
export interface FilaPlanB {
  clave: string;
  /** En 47b es una; en 47c, la de cada alumno de la clase que tiene esa tarea a esa hora. */
  asignacionIds: string[];
  tareaId: string;
  titulo: string;
  pictogramaUrl: string | null;
  /** HH:MM, o "" si no tiene hora. */
  hora: string;
  planB: TareaPlanB | null;
  /** true si el Plan B está activo en todas las asignaciones de la fila. */
  activo: boolean;
}

export interface DatosPlanB {
  filas: FilaPlanB[];
  /** Tareas ya creadas que se pueden elegir como Plan B. */
  biblioteca: TareaPlanB[];
}

/** Acceso a los datos del Plan B: Supabase en la app y memoria en la demo y las pruebas. */
export interface RepositorioPlanB {
  cargar(estudianteIds: string[], fecha: string): Promise<DatosPlanB>;
  vincular(asignacionIds: string[], tareaPlanBId: string): Promise<void>;
  activar(asignacionIds: string[], activo: boolean): Promise<void>;
}
