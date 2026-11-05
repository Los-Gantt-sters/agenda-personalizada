/**
 * Tipos y contratos para el módulo de Autenticación y RBAC (HU-01, HU-02)
 * Alineado con requisitos RF1.1, RF1.2, RF1.3, RF1.4, RF1.8 y RNF1.3.
 */

export type SupervisorRole = "tutor_docente" | "familiar" | "admin" | "especialista";
export type UserRole = SupervisorRole | "estudiante";

export interface SupervisorProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  centroId?: string;
  createdAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: SupervisorProfile;
  expiresAt?: number;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface EstudianteAuthPayload {
  alumnoId: string;
  secuenciaDibujos: string[]; // 3 pictogramas/dibujos seleccionados
}

/**
 * Mensaje de error genérico exigido por RF1.8 para prevenir ataques
 * de enumeración de usuarios y proteger la privacidad RGPD.
 */
export const AUTH_GENERIC_ERROR_MESSAGE = "Credenciales incorrectas o usuario no autorizado.";
