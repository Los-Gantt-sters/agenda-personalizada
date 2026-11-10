import { supabase } from "../lib/supabaseClient";
import {
  AuthResult,
  AuthSession,
  SupervisorRole,
  SupervisorProfile,
  AUTH_GENERIC_ERROR_MESSAGE,
} from "../tipos/auth";
import { isSessionExpired } from "./sessionGuard";

/**
 * Normaliza y valida el rol recibido de la metadata o base de datos.
 */
export function normalizeRole(roleCandidate?: string | null): SupervisorRole {
  const validRoles: SupervisorRole[] = ["tutor_docente", "familiar", "admin", "especialista"];
  if (roleCandidate && validRoles.includes(roleCandidate as SupervisorRole)) {
    return roleCandidate as SupervisorRole;
  }
  return "tutor_docente";
}

/**
 * Determina la ruta de redirección según el rol del supervisor (RF1.4).
 */
export function getRoleHomeRoute(role: SupervisorRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "familiar":
      return "/familiar/resumen";
    case "especialista":
      return "/especialista/terapias";
    case "tutor_docente":
    default:
      return "/docente/agenda";
  }
}

/**
 * Inicia sesión estándar para supervisores (RF1.3, RF1.8, RNF1.3).
 * Utiliza Supabase Auth con cifrado seguro y emisión de tokens JWT.
 * Ante cualquier fallo de credenciales, emite un error genérico (RF1.8).
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
    const role: SupervisorRole = normalizeRole(rawRole);

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
    user_metadata?: Record<string, any>;
  };
};

function mapSupabaseSession(raw: SupabaseSessionLike): AuthSession {
  const { user } = raw;
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: raw.expires_at,
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name || user.user_metadata?.name || "Supervisor Purísima",
      role: normalizeRole(user.user_metadata?.role),
      centroId: user.user_metadata?.centro_id,
      createdAt: user.created_at,
    },
  };
}

/**
 * Recupera la sesión actual activa de Supabase (SCRUM-57).
 * Si el token JWT ha expirado intenta renovarlo con el refresh token;
 * si no es posible, cierra la sesión localmente y devuelve null (fail-closed).
 */
export async function getCurrentSession(nowMs: number = Date.now()): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return null;
    }

    const session = mapSupabaseSession(data.session);
    if (!isSessionExpired(session, nowMs)) {
      return session;
    }

    const refreshed = await supabase.auth.refreshSession();
    if (!refreshed.error && refreshed.data?.session) {
      const renewed = mapSupabaseSession(refreshed.data.session);
      if (!isSessionExpired(renewed, nowMs)) {
        return renewed;
      }
    }

    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return null;
  } catch {
    return null;
  }
}
