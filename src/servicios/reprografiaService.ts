/**
 * Servicio y Máquina de Estados para el Taller de Reprografía (HU-14 / SCRUM-108 / SCRUM-109 · T-14.1).
 * Gestiona el flujo de trabajo estructurado para alumnos de PTVAL:
 *   pendiente -> recogida -> taller -> reparto -> completado (o cancelado)
 * Genera automáticamente los 5 pasos en Lectura Fácil alineados con la Pantalla 12 del prototipo definitivo.
 */

import { urlImagenPictograma } from "../arasaac/urls";
import { supabase } from "../lib/supabaseClient";
import type {
  CrearEncargoReprografiaInput,
  EncargoReprografia,
  EstadoEncargoReprografia,
  PasoReprografia,
  ReprografiaResult,
} from "../tipos/reprografia";

const encargosMemoria = new Map<string, EncargoReprografia>();

/**
 * Grafo de transiciones permitidas en la máquina de estados de Reprografía.
 */
export const TRANSICIONES_REPROGRAFIA: Record<
  EstadoEncargoReprografia,
  readonly EstadoEncargoReprografia[]
> = {
  pendiente: ["recogida", "cancelado"],
  recogida: ["taller", "cancelado"],
  taller: ["reparto", "recogida", "cancelado"],
  reparto: ["completado", "taller", "cancelado"],
  completado: [],
  cancelado: [],
};

/**
 * Determina la fase de la máquina de estados asociada a cada uno de los 5 pasos de Pantalla 12.
 * @param numeroPaso Número de paso entre 1 y 5
 * @returns Fase correspondiente (`"recogida"`, `"taller"` o `"reparto"`)
 */
export function obtenerFaseDePaso(
  numeroPaso: 1 | 2 | 3 | 4 | 5,
): "recogida" | "taller" | "reparto" {
  if (numeroPaso === 1) return "recogida";
  if (numeroPaso === 5) return "reparto";
  return "taller";
}

/**
 * Genera los 5 pasos estándar en Lectura Fácil para un encargo de reprografía (Pantalla 12).
 * @param input Datos desglosados del encargo solicitado por el docente
 * @returns Lista ordenada de los 5 pasos con sus pictogramas ARASAAC y recursos multimedia
 */
export function generarPasosReprografia(
  input: Pick<
    CrearEncargoReprografiaInput,
    "copias" | "modoColor" | "modoCaras" | "aulaDestino" | "profesorSolicitante"
  >,
): PasoReprografia[] {
  const textoCaras = input.modoCaras === "dos_caras" ? "2 caras" : "1 cara";
  const textoColor = input.modoColor === "color" ? "en color" : "blanco y negro";
  const aula = input.aulaDestino.trim();
  const profesor = input.profesorSolicitante.trim();
  const copias = input.copias;

  return [
    {
      orden: 1,
      fase: "recogida",
      titulo: "Recoger el encargo",
      texto: `Ve a secretaría y recoge el encargo de ${aula} (${copias} hojas).`,
      pictogramaId: 6961,
      pictogramaUrl: urlImagenPictograma(6961, 500),
      descripcionFoto: `Fotografía de la bandeja de entrada en secretaría con el encargo de ${aula}.`,
      descripcionVideo: "Vídeo demostrativo: recoger la carpeta de originales en secretaría.",
      completado: false,
    },
    {
      orden: 2,
      fase: "taller",
      titulo: "Poner en la máquina",
      texto: "Coloca las hojas originales en la bandeja de la fotocopiadora.",
      pictogramaId: 3092,
      pictogramaUrl: urlImagenPictograma(3092, 500),
      descripcionFoto: "Fotografía del alimentador superior de la fotocopiadora del taller PTVAL.",
      descripcionVideo: "Vídeo demostrativo: alinear los folios boca arriba en la bandeja.",
      completado: false,
    },
    {
      orden: 3,
      fase: "taller",
      titulo: "Elegir copias y color",
      texto: `Pulsa en la pantalla táctil: ${copias} copias, ${textoCaras} y ${textoColor}.`,
      pictogramaId: 24508,
      pictogramaUrl: urlImagenPictograma(24508, 500),
      descripcionFoto: `Fotografía del panel táctil marcando ${copias} copias (${textoCaras}, ${textoColor}).`,
      descripcionVideo:
        "Vídeo demostrativo: seleccionar número de copias, caras y pulsar botón verde.",
      completado: false,
    },
    {
      orden: 4,
      fase: "taller",
      titulo: `Recoger las ${copias} copias`,
      texto: "Espera a que salgan las copias y comprueba que estén bien.",
      pictogramaId: 2475,
      pictogramaUrl: urlImagenPictograma(2475, 500),
      descripcionFoto: "Fotografía de la bandeja lateral con las copias recién impresas.",
      descripcionVideo:
        "Vídeo demostrativo: retirar las copias y los originales sin olvidar ninguna hoja.",
      completado: false,
    },
    {
      orden: 5,
      fase: "reparto",
      titulo: `Llevar a ${aula}`,
      texto: `Lleva las fotocopias a la clase de ${profesor} (${aula}).`,
      pictogramaId: 6964,
      pictogramaUrl: urlImagenPictograma(6964, 500),
      descripcionFoto: `Fotografía de la puerta de ${aula} para entregar el trabajo a ${profesor}.`,
      descripcionVideo: `Vídeo demostrativo: entregar el encargo en mano en ${aula}.`,
      completado: false,
    },
  ];
}

/**
 * Crea un nuevo encargo de reprografía validando todos los parámetros de negocio.
 * @param input Datos del formulario docente de solicitud de reprografía
 * @returns Resultado con el encargo creado en estado `"pendiente"` y sus 5 pasos generados
 */
export async function crearEncargoReprografia(
  input: CrearEncargoReprografiaInput,
): Promise<ReprografiaResult<EncargoReprografia>> {
  if (!input.tituloDocumento?.trim()) {
    return {
      success: false,
      error: "VALIDACION_ERROR: El título o tipo de documento es obligatorio.",
    };
  }
  if (
    typeof input.copias !== "number" ||
    !Number.isInteger(input.copias) ||
    input.copias < 1 ||
    input.copias > 500
  ) {
    return {
      success: false,
      error: "VALIDACION_ERROR: El número de copias debe ser un entero entre 1 y 500.",
    };
  }
  if (!input.aulaDestino?.trim()) {
    return {
      success: false,
      error: "VALIDACION_ERROR: El aula de destino es obligatoria.",
    };
  }
  if (!input.profesorSolicitante?.trim()) {
    return {
      success: false,
      error: "VALIDACION_ERROR: El nombre del docente solicitante es obligatorio.",
    };
  }
  if (!input.estudianteId?.trim()) {
    return {
      success: false,
      error: "VALIDACION_ERROR: Debe asignarse un alumno responsable de PTVAL.",
    };
  }

  const ahoraIso = new Date().toISOString();
  const id = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const pasos = generarPasosReprografia(input);

  const nuevoEncargo: EncargoReprografia = {
    id,
    tituloDocumento: input.tituloDocumento.trim(),
    copias: input.copias,
    modoColor: input.modoColor,
    modoCaras: input.modoCaras,
    acabado: input.acabado ?? "ninguno",
    aulaDestino: input.aulaDestino.trim(),
    profesorSolicitante: input.profesorSolicitante.trim(),
    estudianteId: input.estudianteId.trim(),
    estado: "pendiente",
    pasoActual: 1,
    duracionEstimadaMinutos: input.duracionEstimadaMinutos ?? 45,
    pasos,
    observaciones: input.observaciones?.trim(),
    creadoEn: ahoraIso,
    actualizadoEn: ahoraIso,
  };

  encargosMemoria.set(id, nuevoEncargo);

  try {
    const builder = supabase?.from?.("encargos_reprografia");
    if (builder && typeof builder.insert === "function") {
      await builder.insert({
        id: nuevoEncargo.id,
        titulo_documento: nuevoEncargo.tituloDocumento,
        copias: nuevoEncargo.copias,
        modo_color: nuevoEncargo.modoColor,
        modo_caras: nuevoEncargo.modoCaras,
        acabado: nuevoEncargo.acabado,
        aula_destino: nuevoEncargo.aulaDestino,
        profesor_solicitante: nuevoEncargo.profesorSolicitante,
        estudiante_id: nuevoEncargo.estudianteId,
        estado: nuevoEncargo.estado,
        paso_actual: nuevoEncargo.pasoActual,
        pasos: nuevoEncargo.pasos,
      });
    }
  } catch {
    // Resiliencia offline: el encargo permanece disponible en memoria
  }

  return { success: true, data: nuevoEncargo };
}

/**
 * Avanza o cambia el estado de un encargo de reprografía respetando la máquina de estados.
 * @param encargoId Identificador del encargo
 * @param nuevoEstado Estado destino (`"recogida"`, `"taller"`, `"reparto"`, `"completado"`, `"cancelado"`)
 * @returns Resultado con el encargo actualizado o error si la transición no es válida
 */
export async function avanzarFaseReprografia(
  encargoId: string,
  nuevoEstado: EstadoEncargoReprografia,
): Promise<ReprografiaResult<EncargoReprografia>> {
  const encargo = encargosMemoria.get(encargoId?.trim());
  if (!encargo) {
    return {
      success: false,
      error: "ENCARGO_NO_ENCONTRADO: No existe el encargo de reprografía indicado.",
    };
  }

  const permitidos = TRANSICIONES_REPROGRAFIA[encargo.estado];
  if (!permitidos.includes(nuevoEstado)) {
    return {
      success: false,
      error: `TRANSICION_INVALIDA: No se puede pasar de '${encargo.estado}' a '${nuevoEstado}'.`,
    };
  }

  const ahoraIso = new Date().toISOString();
  const pasoSincronizado: 1 | 2 | 3 | 4 | 5 =
    nuevoEstado === "recogida"
      ? 1
      : nuevoEstado === "taller" && encargo.pasoActual < 2
        ? 2
        : nuevoEstado === "reparto" || nuevoEstado === "completado"
          ? 5
          : encargo.pasoActual;

  const actualizado: EncargoReprografia = {
    ...encargo,
    estado: nuevoEstado,
    pasoActual: pasoSincronizado,
    actualizadoEn: ahoraIso,
    completadoEn: nuevoEstado === "completado" ? ahoraIso : encargo.completadoEn,
  };

  encargosMemoria.set(encargo.id, actualizado);
  return { success: true, data: actualizado };
}

/**
 * Actualiza el paso activo (1..5) durante la ejecución del alumno en Pantalla 12 y sincroniza
 * automáticamente la fase de la máquina de estados (`recogida` -> `taller` -> `reparto`).
 * @param encargoId Identificador del encargo
 * @param numeroPaso Paso al que avanza o retrocede el alumno (1 a 5)
 * @returns Encargo con el paso actual, los pasos previos marcados y la fase sincronizada
 */
export async function avanzarPasoReprografia(
  encargoId: string,
  numeroPaso: 1 | 2 | 3 | 4 | 5,
): Promise<ReprografiaResult<EncargoReprografia>> {
  const encargo = encargosMemoria.get(encargoId?.trim());
  if (!encargo) {
    return {
      success: false,
      error: "ENCARGO_NO_ENCONTRADO: No existe el encargo de reprografía indicado.",
    };
  }
  if (numeroPaso < 1 || numeroPaso > 5) {
    return {
      success: false,
      error: "PASO_INVALIDO: El paso de reprografía debe estar entre 1 y 5.",
    };
  }
  if (encargo.estado === "completado" || encargo.estado === "cancelado") {
    return {
      success: false,
      error: `ESTADO_FINALIZADO: El encargo ya está '${encargo.estado}'.`,
    };
  }

  const nuevaFase = obtenerFaseDePaso(numeroPaso);
  const pasosActualizados = encargo.pasos.map((p) => ({
    ...p,
    completado: p.orden < numeroPaso,
  }));

  const actualizado: EncargoReprografia = {
    ...encargo,
    estado: nuevaFase,
    pasoActual: numeroPaso,
    pasos: pasosActualizados,
    actualizadoEn: new Date().toISOString(),
  };

  encargosMemoria.set(encargo.id, actualizado);
  return { success: true, data: actualizado };
}

/**
 * Marca un encargo como completado al pulsar «Terminar tarea» en el paso 5 (fase de reparto).
 * @param encargoId Identificador del encargo
 * @returns Resultado con el encargo finalizado y todos sus pasos marcados como completados
 */
export async function completarEncargoReprografia(
  encargoId: string,
): Promise<ReprografiaResult<EncargoReprografia>> {
  const encargo = encargosMemoria.get(encargoId?.trim());
  if (!encargo) {
    return {
      success: false,
      error: "ENCARGO_NO_ENCONTRADO: No existe el encargo de reprografía indicado.",
    };
  }
  if (encargo.estado !== "reparto" && encargo.pasoActual !== 5) {
    return {
      success: false,
      error:
        "TRANSICION_INVALIDA: Solo se puede completar el encargo tras llegar al paso 5 (Reparto).",
    };
  }

  const ahoraIso = new Date().toISOString();
  const actualizado: EncargoReprografia = {
    ...encargo,
    estado: "completado",
    pasoActual: 5,
    pasos: encargo.pasos.map((p) => ({ ...p, completado: true })),
    actualizadoEn: ahoraIso,
    completadoEn: ahoraIso,
  };

  encargosMemoria.set(encargo.id, actualizado);
  return { success: true, data: actualizado };
}

/**
 * Obtiene un encargo de reprografía por su identificador.
 * @param encargoId Identificador del encargo
 * @returns El encargo encontrado o error si no existe
 */
export async function obtenerEncargoReprografia(
  encargoId: string,
): Promise<ReprografiaResult<EncargoReprografia>> {
  const encargo = encargosMemoria.get(encargoId?.trim());
  if (!encargo) {
    return {
      success: false,
      error: "ENCARGO_NO_ENCONTRADO: Encargo no encontrado.",
    };
  }
  return { success: true, data: encargo };
}

/**
 * Lista los encargos de reprografía filtrados opcionalmente por estudiante o estado.
 * @param filtro Filtro opcional por `estudianteId` o `estado`
 * @returns Lista de encargos que cumplen el filtro
 */
export async function listarEncargosReprografia(filtro?: {
  estudianteId?: string;
  estado?: EstadoEncargoReprografia;
}): Promise<ReprografiaResult<EncargoReprografia[]>> {
  let lista = Array.from(encargosMemoria.values());
  if (filtro?.estudianteId) {
    lista = lista.filter((e) => e.estudianteId === filtro.estudianteId);
  }
  if (filtro?.estado) {
    lista = lista.filter((e) => e.estado === filtro.estado);
  }
  return { success: true, data: lista };
}

/**
 * Limpia el almacén en memoria de encargos (útil en pruebas unitarias).
 */
export function limpiarEncargosMemoria(): void {
  encargosMemoria.clear();
}
