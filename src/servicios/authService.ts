import { supabase } from "../lib/supabaseClient";
import {
  AuthResult,
  AuthSession,
  UserRole,
  SupervisorProfile,
  AUTH_GENERIC_ERROR_MESSAGE,
} from "../tipos/auth";
import { isSessionExpired } from "./sessionGuard";

/**
 * Valida el rol leído de la tabla perfiles. Si no es uno de los roles de la app devuelve null,
 * para que el acceso se deniegue (SCRUM-280: antes se ponía tutor_docente por defecto).
 */
export function normalizeRole(roleCandidate?: string | null): UserRole | null {
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
  return null;
}

/** Datos del usuario que la sesión toma de su fila en public.perfiles. */
interface PerfilSesion {
  role: UserRole;
  fullName: string;
  centroId?: string;
}

/**
 * Lee el rol, el nombre y el centro del usuario en la tabla perfiles (SCRUM-280).
 * Es la misma fuente que usan las políticas RLS de la base de datos. No se usa user_metadata
 * porque el propio usuario puede cambiarlo con supabase.auth.updateUser y darse otro rol.
 * Devuelve null, y entonces no hay sesión, si no hay perfil, está desactivado o el rol no es válido.
 */
async function leerPerfil(userId: string): Promise<PerfilSesion | null> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("rol, nombre_completo, centro_id, activo")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data || data.activo !== true) return null;

  const role = normalizeRole(data.rol);
  if (!role) return null;
  return { role, fullName: data.nombre_completo, centroId: data.centro_id ?? undefined };
}

/** Cierra en este dispositivo la sesión que Supabase acaba de abrir a un usuario sin perfil válido. */
async function cerrarSesionLocal(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
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

    // El rol sale de perfiles, no de user_metadata (SCRUM-280)
    const perfil = await leerPerfil(data.user.id);
    if (!perfil) {
      await cerrarSesionLocal();
      return {
        success: false,
        error: AUTH_GENERIC_ERROR_MESSAGE,
      };
    }

    return {
      success: true,
      session: construirSesion(
        { ...data.session, user: data.user },
        perfil,
        data.user.email ?? sanitizedEmail,
      ),
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

    // Solo entra por aquí quien tiene perfil de estudiante en la tabla perfiles (SCRUM-280)
    const perfil = await leerPerfil(data.user.id);
    if (perfil?.role !== "estudiante") {
      await cerrarSesionLocal();
      return {
        success: false,
        error: "La secuencia de dibujos no coincide. Inténtalo de nuevo.",
      };
    }

    return {
      success: true,
      session: construirSesion({ ...data.session, user: data.user }, perfil, emailTecnico),
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

type SupabaseSessionLike = {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
};

/** Junta los tokens de Supabase Auth con los datos del perfil del usuario. */
function construirSesion(
  raw: SupabaseSessionLike,
  perfil: PerfilSesion,
  email: string = raw.user.email ?? "",
): AuthSession {
  const user: SupervisorProfile = {
    id: raw.user.id,
    email,
    fullName: perfil.fullName,
    role: perfil.role,
    centroId: perfil.centroId,
    createdAt: raw.user.created_at,
  };
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: raw.expires_at,
    user,
  };
}

/** Comprueba la caducidad del token tal como lo devuelve Supabase, antes de leer el perfil. */
function tokenCaducado(raw: SupabaseSessionLike, nowMs: number): boolean {
  return isSessionExpired({ accessToken: raw.access_token, expiresAt: raw.expires_at }, nowMs);
}

/**
 * Recupera la sesión actual activa de Supabase (SCRUM-57).
 * Si el token JWT ha expirado intenta renovarlo con el refresh token;
 * si no es posible, cierra la sesión localmente y devuelve null (fail-closed).
 * El rol se lee cada vez de la tabla perfiles (SCRUM-280): sin perfil válido devuelve null.
 */
export async function getCurrentSession(nowMs: number = Date.now()): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }

    let actual: SupabaseSessionLike = data.session;
    if (tokenCaducado(actual, nowMs)) {
      const refreshed = await supabase.auth.refreshSession();
      if (
        refreshed.error ||
        !refreshed.data?.session ||
        tokenCaducado(refreshed.data.session, nowMs)
      ) {
        await cerrarSesionLocal();
        return null;
      }
      actual = refreshed.data.session;
    }

    const perfil = await leerPerfil(actual.user.id);
    return perfil ? construirSesion(actual, perfil) : null;
  } catch {
    return null;
  }
}
