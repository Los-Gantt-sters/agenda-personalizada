/**
 * Tipos y contratos para la Segregación de Permisos y Cumplimiento RGPD (SCRUM-62 / T-03.4)
 * Principios RGPD: Minimización de datos (Art. 5.1.c), Segregación de ámbitos escolar vs doméstico,
 * y control estricto de acceso basado en roles y vínculos (RBAC + ABAC).
 */

import { AmbitoActuacion } from "./alumnos";
import { SupervisorProfile } from "./auth";

export type AccionPermiso = "leer" | "crear" | "actualizar" | "eliminar";

export interface ContextoPermiso {
  usuario: SupervisorProfile;
  alumnoId: string;
  ambito?: AmbitoActuacion;
  accion: AccionPermiso;
}

export interface PermisoCheckResult {
  permitido: boolean;
  motivo?: string;
  codigoError?: string;
}

// Códigos y constantes de error para trazabilidad RGPD
export const ERROR_PERMISO_DENEGADO =
  "ACCESO_DENEGADO_RGPD: No dispone de permisos para este recurso.";
export const ERROR_AMBITO_RESTRINGIDO =
  "AMBITO_RESTRINGIDO_RGPD: No tiene autorización para operar en este ámbito.";
export const ERROR_ALUMNO_NO_VINCULADO =
  "VINCULO_INEXISTENTE_RGPD: El supervisor no está vinculado al estudiante solicitado.";
export const ERROR_ROL_NO_AUTORIZADO =
  "ROL_NO_AUTORIZADO: El rol del usuario no tiene privilegios para esta acción.";
export const ERROR_USUARIO_INVALIDO =
  "USUARIO_INVALIDO: Los datos del usuario supervisor no son válidos o están incompletos.";
