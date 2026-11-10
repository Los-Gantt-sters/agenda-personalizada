import { AuthSession, UserRole } from "../tipos/auth";

/**
 * Guardas de seguridad de sesión y acceso (SCRUM-57 / T-02.3).
 * Funciones puras para poder probarlas sin depender de Supabase ni del reloj real.
 */

/** Margen de seguridad: se considera expirada una sesión a la que le quedan menos de estos segundos. */
export const SESSION_EXPIRY_MARGIN_SECONDS = 30;

/**
 * Indica si una sesión ha expirado. `expiresAt` viene en segundos epoch (formato Supabase/JWT `exp`).
 * Una sesión sin token o sin fecha de expiración se trata como expirada (fail-closed).
 */
export function isSessionExpired(
  session: Pick<AuthSession, "accessToken" | "expiresAt"> | null | undefined,
  nowMs: number = Date.now(),
  marginSeconds: number = SESSION_EXPIRY_MARGIN_SECONDS,
): boolean {
  if (!session || !session.accessToken) return true;
  if (typeof session.expiresAt !== "number" || !Number.isFinite(session.expiresAt)) return true;
  const nowSeconds = Math.floor(nowMs / 1000);
  return session.expiresAt - marginSeconds <= nowSeconds;
}

/**
 * Zonas privadas de la app y roles autorizados en cada una (RBAC, RF1.4).
 * Con UserRole porque la sesión también puede ser de un estudiante (HU-01), que no entra en ninguna.
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/admin": ["admin"],
  "/docente": ["tutor_docente", "admin"],
  "/familiar": ["familiar", "admin"],
  "/especialista": ["especialista", "admin"],
};

/** Rutas públicas accesibles sin sesión. */
export const PUBLIC_ROUTES = ["/", "/login"];

function normalizePath(route: string): string {
  const path = (route ?? "").split(/[?#]/)[0].trim().toLowerCase();
  const collapsed = path.replace(/\/{2,}/g, "/");
  if (!collapsed || collapsed === "/") return "/";
  return collapsed.replace(/\/+$/, "");
}

function findProtectedPrefix(path: string): string | null {
  for (const prefix of Object.keys(PROTECTED_ROUTES)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return prefix;
  }
  return null;
}

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "expired" | "forbidden"; redirectTo: string };

/**
 * Decide si una sesión puede acceder a una ruta.
 * - Rutas públicas: siempre permitidas.
 * - Rutas protegidas o desconocidas: requieren sesión vigente y rol autorizado (deny by default).
 */
export function checkRouteAccess(
  session: AuthSession | null | undefined,
  route: string,
  nowMs: number = Date.now(),
): AccessDecision {
  const path = normalizePath(route);
  if (path.includes("..")) {
    return { allowed: false, reason: "forbidden", redirectTo: "/login" };
  }
  if (PUBLIC_ROUTES.includes(path)) return { allowed: true };

  if (!session) return { allowed: false, reason: "unauthenticated", redirectTo: "/login" };
  if (isSessionExpired(session, nowMs)) {
    return { allowed: false, reason: "expired", redirectTo: "/login" };
  }

  const prefix = findProtectedPrefix(path);
  if (!prefix) return { allowed: false, reason: "forbidden", redirectTo: "/login" };

  const allowedRoles = PROTECTED_ROUTES[prefix];
  if (!allowedRoles.includes(session.user.role)) {
    return { allowed: false, reason: "forbidden", redirectTo: "/login" };
  }
  return { allowed: true };
}
