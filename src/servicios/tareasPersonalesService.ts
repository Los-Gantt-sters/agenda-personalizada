/**
 * Servicio de lógica y validación para la Biblioteca unificada (31),
 * Editor F11 (28/28p/28ok), Asignación con alumnos marcados por defecto (28b)
 * y Horario único restringido por rol (28c: Tutor 08:00-15:00 vs Familia 15:00-08:00)
 * (SCRUM-89 / SCRUM-91 / SCRUM-92 · HU-07).
 */

import type {
  RolBibliotecaAdulto,
  TareaBiblioteca31,
} from "../componentes/tareas-personales/datosTareasPersonales";

export type DestinoRetorno28ok = "31" | "39" | "40";
export type DuracionTarea28c = 15 | 30 | 45 | 60;

export interface ProgramacionHorario28c {
  rol: RolBibliotecaAdulto;
  tareaId: string;
  claseId: string;
  todasLasClases: boolean;
  alumnosIds: string[];
  diasSemana: string[];
  horaInicio: string;
  duracionMinutos: DuracionTarea28c;
}

export interface ResultadoValidacionHorario28c {
  valido: boolean;
  error?: string;
}

/**
 * Convierte una cadena `"HH:MM"` en minutos desde medianoche (`0..1439`).
 * @param hora Cadena en formato `"HH:MM"`
 * @returns Minutos desde las 00:00 o `NaN` si el formato no es válido
 */
export function convertirHoraAMinutos(hora: string): number {
  const partes = /^(\d{2}):(\d{2})$/.exec(hora.trim());
  if (!partes) return Number.NaN;
  const hh = Number(partes[1]);
  const mm = Number(partes[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return Number.NaN;
  return hh * 60 + mm;
}

/**
 * Comprueba si una hora de inicio pertenece a la franja permitida del rol activo:
 * - Tutor / Profesor: solo horario lectivo de mañana (`08:00` a `15:00`, inicio en `[08:00, 15:00)`).
 * - Familia: resto del día (`15:00` a `08:00`, inicio `>= 15:00` o `< 08:00`).
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param horaInicio Hora en formato `"HH:MM"`
 * @returns `true` si la hora está permitida para el rol
 */
export function esHoraPermitidaParaRol28c(rol: RolBibliotecaAdulto, horaInicio: string): boolean {
  const minutos = convertirHoraAMinutos(horaInicio);
  if (Number.isNaN(minutos)) return false;

  const OCHO_MANANA = 8 * 60; // 480
  const TRES_TARDE = 15 * 60; // 900

  if (rol === "tutor") {
    return minutos >= OCHO_MANANA && minutos < TRES_TARDE;
  }
  return minutos >= TRES_TARDE || minutos < OCHO_MANANA;
}

/**
 * Valida una programación de horario en la Pantalla 28c según el perfil activo.
 * @param datos Configuración de días, hora de inicio y duración
 * @returns Resultado de validación con mensaje claro si hay error
 */
export function validarProgramacionHorario28c(
  datos: Pick<
    ProgramacionHorario28c,
    "rol" | "diasSemana" | "horaInicio" | "duracionMinutos" | "alumnosIds"
  >,
): ResultadoValidacionHorario28c {
  if (!datos.alumnosIds || datos.alumnosIds.length === 0) {
    return {
      valido: false,
      error: "Debes mantener al menos un alumno marcado para asignar la tarea.",
    };
  }

  if (!datos.diasSemana || datos.diasSemana.length === 0) {
    return {
      valido: false,
      error: "Selecciona al menos un día de la semana para realizar la tarea.",
    };
  }

  if (!esHoraPermitidaParaRol28c(datos.rol, datos.horaInicio)) {
    return {
      valido: false,
      error:
        datos.rol === "tutor"
          ? "El perfil Tutor solo puede programar tareas entre las 08:00 y las 15:00."
          : "El perfil Familia solo puede programar tareas entre las 15:00 y las 08:00.",
    };
  }

  if (![15, 30, 45, 60].includes(datos.duracionMinutos)) {
    return {
      valido: false,
      error: "La duración debe ser de 15, 30, 45 o 60 minutos.",
    };
  }

  return { valido: true };
}

/**
 * Resuelve la pantalla de destino tras pulsar «Aceptar» en la Pantalla 28ok:
 * - Si se editó para un alumno concreto desde su agenda (41/42b), vuelve a `39` (Tutor) o `40` (Familia).
 * - Si se creó o editó desde la Biblioteca de tareas, vuelve a `31`.
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param alumnoEditado Nombre del alumno si fue edición individual, o `null` si fue en biblioteca
 * @returns Pantalla destino (`"31"`, `"39"` o `"40"`)
 */
export function resolverDestinoConfirmacion28ok(
  rol: RolBibliotecaAdulto,
  alumnoEditado?: string | null,
): DestinoRetorno28ok {
  if (alumnoEditado && alumnoEditado.trim().length > 0) {
    return rol === "familia" ? "40" : "39";
  }
  return "31";
}

/**
 * Aplica una edición de tarea garantizando que:
 * - Si `alumnoEditado` está definido, NO modifica la tarea base de la Biblioteca general,
 *   sino que devuelve una copia personalizada únicamente para ese alumno.
 * - Si `alumnoEditado` es `null`, actualiza o inserta la tarea en la Biblioteca del rol activo (`mine: true`).
 * @param catalogo Catálogo actual de tareas
 * @param rol Rol activo (`"tutor"` o `"familia"`)
 * @param cambios Datos generales editados en la Pantalla 28
 * @param tareaIdEditar ID de la tarea editada (o `null` si es nueva)
 * @param alumnoEditado Nombre del alumno concreto si es edición individual
 * @returns Nuevo catálogo de biblioteca y registro de personalización por alumno
 */
export function aplicarGuardadoTarea28(
  catalogo: TareaBiblioteca31[],
  rol: RolBibliotecaAdulto,
  cambios: {
    titulo: string;
    descripcion: string;
    pictogramaId: number;
    pictogramaUrl: string;
    pasosCount: number;
  },
  tareaIdEditar: string | null = null,
  alumnoEditado: string | null = null,
): {
  catalogoActualizado: TareaBiblioteca31[];
  overrideAlumno: { alumno: string; tarea: TareaBiblioteca31 } | null;
} {
  if (alumnoEditado && alumnoEditado.trim().length > 0) {
    const base =
      catalogo.find((t) => t.id === tareaIdEditar) ??
      catalogo.find((t) => t.owner === rol) ??
      catalogo[0];

    const tareaPersonalizada: TareaBiblioteca31 = {
      ...base,
      id: `${base.id}-alumno-${alumnoEditado.toLowerCase().replace(/\s+/g, "-")}`,
      owner: rol,
      titulo: cambios.titulo,
      descripcion: cambios.descripcion,
      pictogramaId: cambios.pictogramaId,
      pictogramaUrl: cambios.pictogramaUrl,
      pasosCount: cambios.pasosCount,
      subtitulo: `Personalizada para ${alumnoEditado} · ${cambios.pasosCount} pasos`,
    };

    // El catálogo general permanece intacto cuando se edita solo para un alumno concreto
    return {
      catalogoActualizado: catalogo,
      overrideAlumno: {
        alumno: alumnoEditado,
        tarea: tareaPersonalizada,
      },
    };
  }

  if (tareaIdEditar) {
    const existe = catalogo.some((t) => t.id === tareaIdEditar && t.owner === rol);
    if (existe) {
      return {
        catalogoActualizado: catalogo.map((t) =>
          t.id === tareaIdEditar && t.owner === rol
            ? {
                ...t,
                mine: true,
                titulo: cambios.titulo,
                descripcion: cambios.descripcion,
                pictogramaId: cambios.pictogramaId,
                pictogramaUrl: cambios.pictogramaUrl,
                pasosCount: cambios.pasosCount,
                subtitulo: `Creada por mí · ${cambios.pasosCount} ${
                  cambios.pasosCount === 1 ? "paso" : "pasos"
                }`,
              }
            : t,
        ),
        overrideAlumno: null,
      };
    }
  }

  const nuevaTarea: TareaBiblioteca31 = {
    id: `${rol}-nueva-${catalogo.length + 1}`,
    owner: rol,
    mine: true,
    titulo: cambios.titulo,
    descripcion: cambios.descripcion,
    pictogramaId: cambios.pictogramaId,
    pictogramaUrl: cambios.pictogramaUrl,
    pasosCount: cambios.pasosCount,
    subtitulo: `Creada por mí · ${cambios.pasosCount} ${
      cambios.pasosCount === 1 ? "paso" : "pasos"
    }`,
  };

  return {
    catalogoActualizado: [nuevaTarea, ...catalogo],
    overrideAlumno: null,
  };
}
