/**
 * Servicio API CRUD de Alumnos y Gestión de Vínculos de Tutores (HU-03 / SCRUM-60)
 * Alineado con requisitos: OE2, RF2.3, RF2.4, RF2.5, RF2.6, RNF15.1, RI2.2, RI2.4
 * Regla clave: La asignación de tutor titular es obligatoria al crear un estudiante.
 */

import { supabase } from "../lib/supabaseClient";
import {
  Alumno,
  AlumnoDetalle,
  CrearAlumnoInput,
  ActualizarAlumnoInput,
  AlumnosResult,
  PreferenciaAlumno,
} from "../tipos/alumnos";

export const ERROR_TUTOR_OBLIGATORIO =
  "Es obligatorio asignar un tutor titular al dar de alta a un estudiante.";
export const ERROR_NOMBRE_OBLIGATORIO = "El nombre del estudiante es obligatorio.";
export const ERROR_AULA_OBLIGATORIA = "El aula es obligatoria para registrar al estudiante.";

/**
 * Genera un código de expediente seudonimizado único si no se proporciona (RI2.2, RNF15.1)
 * Formato: EXP-XXXX (ej. EXP-3A71)
 */
export function generarCodigoExpediente(): string {
  const caracteres = "0123456789ABCDEF";
  let sufijo = "";
  for (let i = 0; i < 4; i++) {
    sufijo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return `EXP-${sufijo}`;
}

/**
 * Dar de alta a un estudiante en el sistema (RF2.3, RF2.4, RF2.5).
 * Valida obligatoriamente la presencia de tutor titular docente.
 * Inserta alumno, vínculo de tutor y preferencias iniciales en Supabase.
 */
export async function crearAlumno(input: CrearAlumnoInput): Promise<AlumnosResult<AlumnoDetalle>> {
  const nombre = input.nombre?.trim();
  const aulaId = input.aulaId?.trim();
  const tutorTitularId = input.tutorTitularId?.trim();

  // 1. Validaciones de negocio
  if (!nombre) {
    return { success: false, error: ERROR_NOMBRE_OBLIGATORIO };
  }
  if (!aulaId) {
    return { success: false, error: ERROR_AULA_OBLIGATORIA };
  }
  if (!tutorTitularId) {
    return { success: false, error: ERROR_TUTOR_OBLIGATORIO };
  }

  const codigoExpediente = input.codigoExpediente?.trim() || generarCodigoExpediente();
  const centroId = input.centroId || "11111111-1111-1111-1111-111111111111"; // Centro CEE Purísima por defecto
  const requiereTutorPresencial = input.requiereTutorPresencial ?? true;
  const dietaComedor = input.dietaComedor || "basal";
  const iconoPersonal = input.iconoPersonal || "⭐";
  const secuenciaAcceso = input.secuenciaAcceso || ["🍎", "⭐", "🐶"];
  const colorIdentificativo = input.colorIdentificativo || "#2f62b8";

  try {
    // 2. Insertar alumno en tabla 'alumnos'
    const { data: alumnoData, error: alumnoError } = await supabase
      .from("alumnos")
      .insert({
        centro_id: centroId,
        aula_id: aulaId,
        codigo_expediente: codigoExpediente,
        nombre,
        apellidos: input.apellidos?.trim() || null,
        color_identificativo: colorIdentificativo,
        foto_url: input.fotoUrl || null,
        icono_personal: iconoPersonal,
        secuencia_acceso: secuenciaAcceso,
        requiere_tutor_presencial: requiereTutorPresencial,
        dieta_comedor: dietaComedor,
        activo: true,
      })
      .select()
      .single();

    if (alumnoError || !alumnoData) {
      return {
        success: false,
        error: alumnoError?.message || "No se pudo registrar el estudiante en la base de datos.",
      };
    }

    const nuevoAlumnoId = alumnoData.id;

    // 3. Crear vínculo obligatorio con el tutor titular docente (RF2.4)
    const { error: vinculoTutorError } = await supabase.from("vinculos_alumno_supervisor").insert({
      alumno_id: nuevoAlumnoId,
      supervisor_id: tutorTitularId,
      tipo_vinculo: "aula",
      activo: true,
    });

    if (vinculoTutorError) {
      return {
        success: false,
        error: `Estudiante creado pero falló la asignación de tutor: ${vinculoTutorError.message}`,
      };
    }

    // 4. Si se especificó tutor familiar, crear vínculo de tipo 'familiar' (RF2.4, RF2.9)
    if (input.tutorFamiliarId?.trim()) {
      await supabase.from("vinculos_alumno_supervisor").insert({
        alumno_id: nuevoAlumnoId,
        supervisor_id: input.tutorFamiliarId.trim(),
        tipo_vinculo: "familiar",
        activo: true,
      });
    }

    // 5. Crear preferencias iniciales con el tema de interés favorito (OE3)
    const temaInteres = input.temaInteres || "general";
    await supabase.from("preferencias_alumnos").insert({
      alumno_id: nuevoAlumnoId,
      tema_interes: temaInteres,
      tema_color: "claro",
      tipo_representacion: "pictograma",
      tamano_letra: "normal",
      tamano_botones: "grande",
      forma_botones: "redondeado",
      vista_agenda: "diaria",
      sonidos_activos: true,
      reloj_visual_activo: true,
    });

    const alumnoCreado: AlumnoDetalle = {
      id: nuevoAlumnoId,
      centroId,
      aulaId,
      codigoExpediente,
      nombre,
      apellidos: input.apellidos?.trim(),
      colorIdentificativo,
      fotoUrl: input.fotoUrl,
      iconoPersonal,
      secuenciaAcceso,
      requiereTutorPresencial,
      dietaComedor,
      activo: true,
      creadoEn: alumnoData.creado_en,
      actualizadoEn: alumnoData.actualizado_en,
    };

    return { success: true, data: alumnoCreado };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado al crear estudiante.";
    return { success: false, error: msg };
  }
}

/**
 * Consulta listado de estudiantes (RF2.1, RF2.11)
 * Permite filtrar por aula, centro o estado activo.
 */
export async function obtenerAlumnos(filtro?: {
  aulaId?: string;
  centroId?: string;
  soloActivos?: boolean;
}): Promise<AlumnosResult<Alumno[]>> {
  try {
    let query = supabase.from("alumnos").select("*").order("nombre", { ascending: true });

    if (filtro?.aulaId) {
      query = query.eq("aula_id", filtro.aulaId);
    }
    if (filtro?.centroId) {
      query = query.eq("centro_id", filtro.centroId);
    }
    if (filtro?.soloActivos ?? true) {
      query = query.eq("activo", true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const alumnos: Alumno[] = (data || []).map((row: any) => ({
      id: row.id,
      centroId: row.centro_id,
      aulaId: row.aula_id,
      codigoExpediente: row.codigo_expediente,
      nombre: row.nombre,
      apellidos: row.apellidos,
      colorIdentificativo: row.color_identificativo,
      fotoUrl: row.foto_url,
      iconoPersonal: row.icono_personal,
      secuenciaAcceso: row.secuencia_acceso,
      requiereTutorPresencial: row.requiere_tutor_presencial,
      dietaComedor: row.dieta_comedor,
      activo: row.activo,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
    }));

    return { success: true, data: alumnos as any };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener estudiantes.";
    return { success: false, error: msg };
  }
}

/**
 * Obtener detalle completo de un estudiante por su ID o código de expediente
 */
export async function obtenerAlumnoPorId(id: string): Promise<AlumnosResult<AlumnoDetalle>> {
  if (!id?.trim()) {
    return { success: false, error: "Identificador de estudiante no proporcionado." };
  }

  try {
    const { data: alumno, error: alumnoError } = await supabase
      .from("alumnos")
      .select("*, aulas(*)")
      .eq("id", id.trim())
      .single();

    if (alumnoError || !alumno) {
      return {
        success: false,
        error: alumnoError?.message || "Estudiante no encontrado.",
      };
    }

    // Obtener preferencias
    const { data: prefs } = await supabase
      .from("preferencias_alumnos")
      .select("*")
      .eq("alumno_id", id.trim())
      .maybeSingle();

    // Obtener vínculos
    const { data: vinculosRaw } = await supabase
      .from("vinculos_alumno_supervisor")
      .select("*, perfiles(*)")
      .eq("alumno_id", id.trim())
      .eq("activo", true);

    const vinculos = (vinculosRaw || []).map((v: any) => ({
      id: v.id,
      alumnoId: v.alumno_id,
      supervisorId: v.supervisor_id,
      tipoVinculo: v.tipo_vinculo,
      activo: v.activo,
      fechaAlta: v.fecha_alta,
      creadoEn: v.creado_en,
      supervisor: v.perfiles
        ? {
            id: v.perfiles.id,
            email: v.perfiles.email,
            fullName: v.perfiles.nombre_completo,
            role: v.perfiles.rol,
            centroId: v.perfiles.centro_id,
            createdAt: v.perfiles.creado_en,
          }
        : undefined,
    }));

    const tutorDocenteTitular = vinculos.find((v: any) => v.tipoVinculo === "aula")?.supervisor;
    const tutorFamiliarPrincipal = vinculos.find(
      (v: any) => v.tipoVinculo === "familiar",
    )?.supervisor;

    const preferencias: PreferenciaAlumno | undefined = prefs
      ? {
          alumnoId: prefs.alumno_id,
          temaInteres: prefs.tema_interes,
          temaColor: prefs.tema_color,
          tipoRepresentacion: prefs.tipo_representacion,
          tamanoLetra: prefs.tamano_letra,
          tamanoBotones: prefs.tamano_botones,
          formaBotones: prefs.forma_botones,
          vistaAgenda: prefs.vista_agenda,
          relojVisualActivo: prefs.reloj_visual_activo,
          relojVisualFijo: prefs.reloj_visual_fijo,
          sonidosActivos: prefs.sonidos_activos,
          tipoTono: prefs.tipo_tono,
          avisosSoloVisuales: prefs.avisos_solo_visuales,
          modoCalma: prefs.modo_calma,
          modoPulsacion: prefs.modo_pulsacion,
          permisoCrearTareas: prefs.permiso_crear_tareas,
          nivelPermisosPreferencias: prefs.nivel_permisos_preferencias,
          actualizadoEn: prefs.actualizado_en,
        }
      : undefined;

    const alumnoDetalle: AlumnoDetalle = {
      id: alumno.id,
      centroId: alumno.centro_id,
      aulaId: alumno.aula_id,
      codigoExpediente: alumno.codigo_expediente,
      nombre: alumno.nombre,
      apellidos: alumno.apellidos,
      colorIdentificativo: alumno.color_identificativo,
      fotoUrl: alumno.foto_url,
      iconoPersonal: alumno.icono_personal,
      secuenciaAcceso: alumno.secuencia_acceso,
      requiereTutorPresencial: alumno.requiere_tutor_presencial,
      dietaComedor: alumno.dieta_comedor,
      activo: alumno.activo,
      preferencias,
      vinculos,
      tutorDocenteTitular,
      tutorFamiliarPrincipal,
      creadoEn: alumno.creado_en,
      actualizadoEn: alumno.actualizado_en,
    };

    return { success: true, data: alumnoDetalle };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al obtener detalle del estudiante.";
    return { success: false, error: msg };
  }
}

/**
 * Modificar datos de un estudiante existente (RF2.1)
 */
export async function actualizarAlumno(
  id: string,
  input: ActualizarAlumnoInput,
): Promise<AlumnosResult<AlumnoDetalle>> {
  if (!id?.trim()) {
    return { success: false, error: "Identificador de estudiante inválido." };
  }

  try {
    const updatePayload: Record<string, any> = {};

    if (input.nombre !== undefined) updatePayload.nombre = input.nombre.trim();
    if (input.apellidos !== undefined) updatePayload.apellidos = input.apellidos.trim();
    if (input.aulaId !== undefined) updatePayload.aula_id = input.aulaId;
    if (input.fotoUrl !== undefined) updatePayload.foto_url = input.fotoUrl;
    if (input.iconoPersonal !== undefined) updatePayload.icono_personal = input.iconoPersonal;
    if (input.secuenciaAcceso !== undefined) updatePayload.secuencia_acceso = input.secuenciaAcceso;
    if (input.colorIdentificativo !== undefined)
      updatePayload.color_identificativo = input.colorIdentificativo;
    if (input.requiereTutorPresencial !== undefined)
      updatePayload.requiere_tutor_presencial = input.requiereTutorPresencial;
    if (input.dietaComedor !== undefined) updatePayload.dieta_comedor = input.dietaComedor;
    if (input.activo !== undefined) updatePayload.activo = input.activo;

    const { data, error } = await supabase
      .from("alumnos")
      .update(updatePayload)
      .eq("id", id.trim())
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "No se pudo actualizar el estudiante." };
    }

    // Si se especificó cambio de tema favorito en preferencias
    if (input.temaInteres) {
      await supabase
        .from("preferencias_alumnos")
        .update({ tema_interes: input.temaInteres })
        .eq("alumno_id", id.trim());
    }

    return obtenerAlumnoPorId(id.trim());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar estudiante.";
    return { success: false, error: msg };
  }
}

/**
 * Baja de estudiante (RF2.1).
 * Por defecto realiza baja lógica (activo = false) para cumplir minimización y trazabilidad RGPD.
 */
export async function eliminarAlumno(
  id: string,
  bajaFisica = false,
): Promise<{ success: boolean; error?: string }> {
  if (!id?.trim()) {
    return { success: false, error: "Identificador de estudiante inválido." };
  }

  try {
    if (bajaFisica) {
      const { error } = await supabase.from("alumnos").delete().eq("id", id.trim());
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("alumnos")
        .update({ activo: false })
        .eq("id", id.trim());
      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al dar de baja al estudiante.";
    return { success: false, error: msg };
  }
}

/**
 * Subida de fotografía táctil de alumno a Supabase Storage (CA-01.1)
 */
export async function subirFotoAlumno(
  alumnoId: string,
  archivoBlob: Blob,
  extension = "jpg",
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!alumnoId?.trim()) {
    return { success: false, error: "Identificador de alumno no proporcionado." };
  }

  try {
    const rutaArchivo = `alumnos/${alumnoId.trim()}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("fotos-alumnos")
      .upload(rutaArchivo, archivoBlob, { upsert: true });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from("fotos-alumnos").getPublicUrl(rutaArchivo);

    const publicUrl = urlData?.publicUrl || "";

    // Actualizar foto en la ficha del alumno
    await supabase.from("alumnos").update({ foto_url: publicUrl }).eq("id", alumnoId.trim());

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al subir la fotografía.";
    return { success: false, error: msg };
  }
}
