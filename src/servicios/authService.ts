import { supabase } from "../lib/supabaseClient";
import {
  AuthResult,
  AuthSession,
  UserRole,
  SupervisorProfile,
  AUTH_GENERIC_ERROR_MESSAGE,
} from "../tipos/auth";

/**
 * Normaliza y valida el rol recibido de la metadata o base de datos.
 */
export function normalizeRole(roleCandidate?: string | null): UserRole {
  const validRoles: UserRole[] = [
    "tutor_docente",
    "familiar",
    "admin",
    "especialista",
    "estudiante",
  ];
  if (roleCandidate && validRoles.includes(roleCandidate as UserRole)) {
    return roleCandidate as UserRole;
  }
  return "tutor_docente";
}

/**
 * Determina la ruta de redirección según el rol del usuario (RF1.4).
 */
export function getRoleHomeRoute(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "familiar":
      return "/familiar/resumen";
    case "especialista":
      return "/especialista/terapias";
    case "estudiante":
      return "/estudiante/agenda";
    case "tutor_docente":
    default:
      return "/docente/agenda";
  }
}

/**
 * Inicia sesión estándar para supervisores (RF1.3, RF1.8, RNF1.3).
 */
export async function signInSupervisor(email: string, password: string): Promise<AuthResult> {
  const sanitizedEmail = email?.trim() ?? "";
  const sanitizedPassword = password ?? "";

  if (!sanitizedEmail || !sanitizedPassword) {
    return {
      success: false,
      error: AUTH_GENERIC_ERROR_MESSAGE,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    });

    if (error || !data.session || !data.user) {
      return {
        success: false,
        error: AUTH_GENERIC_ERROR_MESSAGE,
      };
    }

    const rawRole = data.user.user_metadata?.role;
    const role: UserRole = normalizeRole(rawRole);

    const userProfile: SupervisorProfile = {
      id: data.user.id,
      email: data.user.email ?? sanitizedEmail,
      fullName:
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        "Supervisor Purísima",
      role,
      centroId: data.user.user_metadata?.centro_id,
      createdAt: data.user.created_at,
    };

    const session: AuthSession = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: userProfile,
    };

    return {
      success: true,
      session,
    };
  } catch {
    return {
      success: false,
      error: AUTH_GENERIC_ERROR_MESSAGE,
    };
  }
}

/**
 * Inicia sesión adaptada para estudiantes mediante su secuencia de 3 pictogramas (HU-01 / SCRUM-51).
 * Convierte los 3 dibujos seleccionados en una contraseña hasheada y usa un email interno transparente.
 */
export async function signInEstudianteConDibujos(
  alumnoId: string,
  secuenciaDibujos: string[],
): Promise<AuthResult> {
  if (!alumnoId || !secuenciaDibujos || secuenciaDibujos.length !== 3) {
    return {
      success: false,
      error: "Se requiere seleccionar la secuencia de 3 dibujos.",
    };
  }

  // Correo técnico transparente que el alumno nunca ve ni escribe
  const emailTecnico = `alu-${alumnoId.trim().toLowerCase()}@alumnos.agensible`;
  // La contraseña se forma uniendo los slugs normalizados de los 3 dibujos
  const passwordDibujos = secuenciaDibujos.map((d) => d.trim().toLowerCase()).join("-");

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTecnico,
      password: passwordDibujos,
    });

    if (error || !data.session || !data.user) {
      return {
        success: false,
        error: "La secuencia de dibujos no coincide. Inténtalo de nuevo.",
      };
    }

    const userProfile: SupervisorProfile = {
      id: data.user.id,
      email: emailTecnico,
      fullName: data.user.user_metadata?.full_name || `Estudiante ${alumnoId}`,
      role: "estudiante",
      centroId: data.user.user_metadata?.centro_id,
      createdAt: data.user.created_at,
    };

    return {
      success: true,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        user: userProfile,
      },
    };
  } catch {
    return {
      success: false,
      error: "Error de conexión al verificar los dibujos.",
    };
  }
}

/**
 * Cierre de sesión seguro invalidando el token JWT (RF1.8).
 */
export async function signOutSupervisor(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al cerrar sesión";
    return { success: false, error: message };
  }
}

/**
 * Recupera la sesión actual activa de Supabase.
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }

    const { user } = data.session;
    const role = normalizeRole(user.user_metadata?.role);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
      user: {
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || "Usuario Purísima",
        role,
        centroId: user.user_metadata?.centro_id,
        createdAt: user.created_at,
      },
    };
  } catch {
    return null;
  }
}
