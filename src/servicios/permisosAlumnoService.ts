/**
 * Servicio de gestión del modelo de permisos por alumno (Pantalla 26d)
 * y filtrado dinámico de formatos multimedia y navegación en ejecución (Pantalla 07e)
 * (HU-23 / SCRUM-141 / SCRUM-142 · T-23.1).
 */

import { supabase } from "../lib/supabaseClient";
import type {
  ActualizarPermisosAlumnoInput,
  DefinicionFormatoMultimedia,
  DestinoEntradaLoginAlumno,
  FormatoMultimediaAlumno,
  PasoEjecucionTarea07e,
  PermisosAlumno26d,
} from "../tipos/permisosAlumno";

export const ORDEN_FORMATOS_MULTIMEDIA: readonly FormatoMultimediaAlumno[] = [
  "pictograma",
  "texto",
  "foto",
  "video",
  "audio",
] as const;

export const CATALOGO_FORMATOS_MULTIMEDIA: readonly DefinicionFormatoMultimedia[] = [
  { clave: "pictograma", etiqueta: "Pictograma", pictogramaId: 31907 },
  { clave: "texto", etiqueta: "Texto", pictogramaId: 24508 },
  { clave: "foto", etiqueta: "Foto", pictogramaId: 6961 },
  { clave: "video", etiqueta: "Vídeo", pictogramaId: 6247 },
  { clave: "audio", etiqueta: "Audio", pictogramaId: 5993 },
] as const;

export const FORMATOS_RESTRINGIDOS_DEMO_07E: readonly FormatoMultimediaAlumno[] = [
  "pictograma",
  "audio",
] as const;

export const PASOS_LAVARSE_MANOS_07E: readonly PasoEjecucionTarea07e[] = [
  {
    orden: 1,
    titulo: "Abre el grifo",
    textoLecturaFacil: "1. Abre el grifo del lavabo con cuidado para que salga agua templada.",
    pictogramaId: 11737,
    descripcionFoto: "Fotografía real del grifo del lavabo del aula.",
    descripcionVideo: "Vídeo demostrativo (0:08): cómo abrir el grifo despacio.",
    textoAudio: "Paso 1. Abre el grifo.",
  },
  {
    orden: 2,
    titulo: "Echa jabón en las manos",
    textoLecturaFacil: "2. Pulsa una vez el dispensador para poner jabón en la palma de tu mano.",
    pictogramaId: 2433,
    descripcionFoto: "Fotografía real del dispensador de jabón junto al lavabo.",
    descripcionVideo: "Vídeo demostrativo (0:09): pulsar una vez el dispensador de jabón.",
    textoAudio: "Paso 2. Echa jabón en las manos.",
  },
  {
    orden: 3,
    titulo: "Frota las manos",
    textoLecturaFacil: "3. Frota las palmas y entre los dedos hasta hacer espuma limpia.",
    pictogramaId: 8988,
    descripcionFoto: "Fotografía real frotando las manos con espuma.",
    descripcionVideo: "Vídeo demostrativo (0:12): frotar palmas, dorso y dedos.",
    textoAudio: "Paso 3. Frota las manos.",
  },
  {
    orden: 4,
    titulo: "Aclara con agua",
    textoLecturaFacil:
      "4. Pon las manos bajo el agua hasta quitar toda la espuma y cierra el grifo.",
    pictogramaId: 2248,
    descripcionFoto: "Fotografía real aclarando las manos bajo el grifo.",
    descripcionVideo: "Vídeo demostrativo (0:10): aclarar la espuma y cerrar el grifo.",
    textoAudio: "Paso 4. Aclara con agua.",
  },
  {
    orden: 5,
    titulo: "Sécate con la toalla",
    textoLecturaFacil: "5. Seca bien tus manos con la toalla o papel antes de volver al aula.",
    pictogramaId: 2583,
    descripcionFoto: "Fotografía real de la toalla y papel secamanos del baño.",
    descripcionVideo: "Vídeo demostrativo (0:08): secarse las manos por completo.",
    textoAudio: "Paso 5. Sécate con la toalla.",
  },
] as const;

const NOMBRES_ALUMNOS_CONOCIDOS: Record<string, string> = {
  ale: "Alejandro",
  alejandro: "Alejandro",
  luc: "Lucas",
  mar: "Martina",
  hug: "Hugo",
  sof: "Sofía",
  mir: "Miriam",
  ser: "Sergio",
};

const almacenPermisosMemoria = new Map<string, PermisosAlumno26d>();

/**
 * Normaliza y ordena una lista de formatos multimedia según el orden oficial de la barra inferior
 * (`pictograma`, `texto`, `foto`, `video`, `audio`), eliminando duplicados o valores inválidos.
 * @param formatos Lista de formatos a normalizar
 * @returns Lista deduplicada y ordenada
 */
export function normalizarFormatosPermitidos(
  formatos: readonly FormatoMultimediaAlumno[],
): FormatoMultimediaAlumno[] {
  const conjunto = new Set<FormatoMultimediaAlumno>();
  for (const f of formatos) {
    if ((ORDEN_FORMATOS_MULTIMEDIA as readonly string[]).includes(f)) {
      conjunto.add(f);
    }
  }
  return ORDEN_FORMATOS_MULTIMEDIA.filter((f) => conjunto.has(f));
}

/**
 * Valida que el alumno tenga al menos un formato multimedia habilitado debajo de cada paso.
 * @param formatos Lista de formatos propuestos
 * @returns Lista normalizada si es válida; lanza Error si queda vacía
 */
export function validarFormatosPermitidos(
  formatos: readonly FormatoMultimediaAlumno[],
): FormatoMultimediaAlumno[] {
  const normalizados = normalizarFormatosPermitidos(formatos);
  if (normalizados.length === 0) {
    throw new Error(
      "El alumno debe tener al menos un formato multimedia habilitado debajo de cada paso.",
    );
  }
  return normalizados;
}

/**
 * Valida el destino de entrada tras login (`"06b"` Semana o `"06"` Solo Hoy).
 * @param destino Destino de entrada tras login
 * @returns Destino validado
 */
export function validarDestinoEntradaLogin(
  destino: DestinoEntradaLoginAlumno,
): DestinoEntradaLoginAlumno {
  if (destino !== "06b" && destino !== "06") {
    throw new Error('El destino de entrada tras login debe ser "06b" (Semana) o "06" (Solo Hoy).');
  }
  return destino;
}

/**
 * Construye los permisos por defecto de un alumno según la Pantalla 26d del prototipo
 * (los 5 formatos multimedia activos, entrada tras login en Semana `06b` y botón Preferencias `16` visible).
 * @param alumnoId Identificador del alumno
 * @param nombreAlumno Nombre opcional del alumno
 * @returns Objeto `PermisosAlumno26d` con la configuración inicial
 */
export function crearPermisosAlumnoPorDefecto(
  alumnoId: string = "ale",
  nombreAlumno?: string,
): PermisosAlumno26d {
  const idLimpio = alumnoId.trim() || "ale";
  const nombreResuelto =
    nombreAlumno?.trim() || NOMBRES_ALUMNOS_CONOCIDOS[idLimpio.toLowerCase()] || "Alejandro";

  return {
    alumnoId: idLimpio,
    nombreAlumno: nombreResuelto,
    formatosPermitidos: [...ORDEN_FORMATOS_MULTIMEDIA],
    entradaTrasLogin: "06b",
    mostrarBotonPreferencias16: true,
    actualizadoEn: "2026-11-26T08:00:00.000Z",
  };
}

/**
 * Construye el perfil de permisos restringidos de demostración de la Pantalla 07e (`07e.html`),
 * donde el alumno Alejandro solo tiene habilitados `Pictograma` y `Audio`.
 * @param alumnoId Identificador del alumno (`"ale"` por defecto)
 * @param nombreAlumno Nombre del alumno (`"Alejandro"` por defecto)
 * @returns Configuración `PermisosAlumno26d` restringida para 07e
 */
export function crearPermisosRestringidosDemo07e(
  alumnoId: string = "ale",
  nombreAlumno: string = "Alejandro",
): PermisosAlumno26d {
  return {
    alumnoId: alumnoId.trim() || "ale",
    nombreAlumno: nombreAlumno.trim() || "Alejandro",
    formatosPermitidos: [...FORMATOS_RESTRINGIDOS_DEMO_07E],
    entradaTrasLogin: "06b",
    mostrarBotonPreferencias16: true,
    actualizadoEn: "2026-11-26T08:00:00.000Z",
  };
}

/**
 * Conmuta un formato multimedia en la lista de formatos permitidos del alumno,
 * impidiendo desactivar el último formato activo para que el paso nunca quede sin representación.
 * @param actuales Formatos actualmente activos
 * @param formato Formato que el tutor pulsa en 26d
 * @returns Tupla con la nueva lista de formatos y un indicador `bloqueadoPorMinimo`
 */
export function alternarFormatoMultimediaAlumno(
  actuales: readonly FormatoMultimediaAlumno[],
  formato: FormatoMultimediaAlumno,
): { formatos: FormatoMultimediaAlumno[]; bloqueadoPorMinimo: boolean } {
  const normalizados = normalizarFormatosPermitidos(actuales);
  const yaActivo = normalizados.includes(formato);

  if (yaActivo) {
    if (normalizados.length <= 1) {
      return { formatos: normalizados, bloqueadoPorMinimo: true };
    }
    return {
      formatos: normalizados.filter((item) => item !== formato),
      bloqueadoPorMinimo: false,
    };
  }

  return {
    formatos: normalizarFormatosPermitidos([...normalizados, formato]),
    bloqueadoPorMinimo: false,
  };
}

/**
 * Filtra el catálogo de los 5 botones multimedia del paso (Pantalla 07 / 07e)
 * devolviendo únicamente las definiciones de los formatos habilitados en 26d para el alumno.
 * @param formatosPermitidos Lista de claves de formato permitidas
 * @returns Definiciones de botones multimedia visibles en 07e
 */
export function filtrarCatalogoFormatosPorPermiso(
  formatosPermitidos: readonly FormatoMultimediaAlumno[],
): DefinicionFormatoMultimedia[] {
  const permitidos = normalizarFormatosPermitidos(formatosPermitidos);
  const conjunto = new Set(permitidos);
  return CATALOGO_FORMATOS_MULTIMEDIA.filter((def) => conjunto.has(def.clave));
}

/**
 * Determina si el alumno puede conmutar a la vista de agenda semanal (06b)
 * según la opción «Entrada tras login: Semana (06b) / Solo Hoy (06)» configurada en 26d.
 * @param permisos Permisos actuales del alumno
 * @returns `true` si la entrada configurada incluye vista semanal (`"06b"`)
 */
export function puedeAccederAgendaSemanal06b(
  permisos: Pick<PermisosAlumno26d, "entradaTrasLogin">,
): boolean {
  return permisos.entradaTrasLogin === "06b";
}

/**
 * Obtiene los permisos simplificados (Pantalla 26d) de un alumno desde caché o Supabase,
 * retornando la configuración por defecto si aún no se han personalizado.
 * @param alumnoId Identificador del alumno
 * @param nombreAlumno Nombre opcional del alumno
 * @returns Permisos actuales del alumno
 */
export async function obtenerPermisosAlumno26d(
  alumnoId: string,
  nombreAlumno?: string,
): Promise<PermisosAlumno26d> {
  const idLimpio = alumnoId.trim() || "ale";
  const enMemoria = almacenPermisosMemoria.get(idLimpio);
  if (enMemoria) {
    return {
      ...enMemoria,
      formatosPermitidos: [...enMemoria.formatosPermitidos],
    };
  }

  try {
    const { data, error } = await supabase
      .from("permisos_alumno_26d")
      .select(
        "alumno_id, nombre_alumno, formatos_permitidos, entrada_tras_login, mostrar_boton_preferencias_16, actualizado_en",
      )
      .eq("alumno_id", idLimpio)
      .single();

    if (!error && data) {
      const fila = data as {
        alumno_id: string;
        nombre_alumno?: string | null;
        formatos_permitidos?: FormatoMultimediaAlumno[] | null;
        entrada_tras_login?: DestinoEntradaLoginAlumno | null;
        mostrar_boton_preferencias_16?: boolean | null;
        actualizado_en?: string | null;
      };
      const reconstruido: PermisosAlumno26d = {
        alumnoId: fila.alumno_id,
        nombreAlumno:
          fila.nombre_alumno?.trim() ||
          nombreAlumno?.trim() ||
          NOMBRES_ALUMNOS_CONOCIDOS[idLimpio.toLowerCase()] ||
          "Alejandro",
        formatosPermitidos: validarFormatosPermitidos(
          fila.formatos_permitidos && fila.formatos_permitidos.length > 0
            ? fila.formatos_permitidos
            : ORDEN_FORMATOS_MULTIMEDIA,
        ),
        entradaTrasLogin: fila.entrada_tras_login === "06" ? "06" : "06b",
        mostrarBotonPreferencias16:
          typeof fila.mostrar_boton_preferencias_16 === "boolean"
            ? fila.mostrar_boton_preferencias_16
            : true,
        actualizadoEn: fila.actualizado_en ?? new Date().toISOString(),
      };
      almacenPermisosMemoria.set(idLimpio, reconstruido);
      return {
        ...reconstruido,
        formatosPermitidos: [...reconstruido.formatosPermitidos],
      };
    }
  } catch {
    // Fallback seguro a memoria local cuando se ejecuta sin tabla remota o sin red
  }

  const porDefecto = crearPermisosAlumnoPorDefecto(idLimpio, nombreAlumno);
  almacenPermisosMemoria.set(idLimpio, porDefecto);
  return {
    ...porDefecto,
    formatosPermitidos: [...porDefecto.formatosPermitidos],
  };
}

/**
 * Actualiza y persiste los permisos simplificados de un alumno (Pantalla 26d).
 * @param input Campos a actualizar para el alumno
 * @returns Permisos actualizados y validados
 */
export async function guardarPermisosAlumno26d(
  input: ActualizarPermisosAlumnoInput,
): Promise<PermisosAlumno26d> {
  const idLimpio = input.alumnoId.trim();
  if (!idLimpio) {
    throw new Error("El identificador del alumno es obligatorio para guardar sus permisos.");
  }

  const base =
    almacenPermisosMemoria.get(idLimpio) ??
    crearPermisosAlumnoPorDefecto(idLimpio, input.nombreAlumno);

  const formatosValidados =
    input.formatosPermitidos !== undefined
      ? validarFormatosPermitidos(input.formatosPermitidos)
      : base.formatosPermitidos;

  const entradaValidada =
    input.entradaTrasLogin !== undefined
      ? validarDestinoEntradaLogin(input.entradaTrasLogin)
      : base.entradaTrasLogin;

  const mostrarPreferencias =
    typeof input.mostrarBotonPreferencias16 === "boolean"
      ? input.mostrarBotonPreferencias16
      : base.mostrarBotonPreferencias16;

  const actualizado: PermisosAlumno26d = {
    alumnoId: idLimpio,
    nombreAlumno: input.nombreAlumno?.trim() || base.nombreAlumno,
    formatosPermitidos: formatosValidados,
    entradaTrasLogin: entradaValidada,
    mostrarBotonPreferencias16: mostrarPreferencias,
    actualizadoEn: new Date().toISOString(),
  };

  almacenPermisosMemoria.set(idLimpio, actualizado);

  try {
    await supabase.from("permisos_alumno_26d").upsert(
      {
        alumno_id: actualizado.alumnoId,
        nombre_alumno: actualizado.nombreAlumno,
        formatos_permitidos: actualizado.formatosPermitidos,
        entrada_tras_login: actualizado.entradaTrasLogin,
        mostrar_boton_preferencias_16: actualizado.mostrarBotonPreferencias16,
        actualizado_en: actualizado.actualizadoEn,
      },
      { onConflict: "alumno_id" },
    );
  } catch {
    // Conserva la actualización en memoria si la sesión es local/offline
  }

  return {
    ...actualizado,
    formatosPermitidos: [...actualizado.formatosPermitidos],
  };
}

/**
 * Limpia la caché en memoria de permisos por alumno (utilidad para pruebas unitarias).
 */
export function reiniciarPermisosAlumnoMemoria(): void {
  almacenPermisosMemoria.clear();
}
