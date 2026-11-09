/**
 * SCRUM-57 · T-02.3 [Testing] Pruebas de expiración de sesión y seguridad de acceso (HU-02).
 */
import { getCurrentSession, signInSupervisor, signOutSupervisor } from "../authService";
import { checkRouteAccess, isSessionExpired, SESSION_EXPIRY_MARGIN_SECONDS } from "../sessionGuard";
import { supabase } from "../../lib/supabaseClient";
import { AUTH_GENERIC_ERROR_MESSAGE, AuthSession, SupervisorRole } from "../../tipos/auth";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
    },
  },
}));

const auth = supabase.auth as unknown as Record<string, jest.Mock>;

// Instante fijo de referencia: 2026-11-05T10:00:00Z
const NOW_MS = Date.UTC(2026, 10, 5, 10, 0, 0);
const NOW_S = Math.floor(NOW_MS / 1000);

function buildSession(
  role: SupervisorRole,
  expiresAt: number | undefined = NOW_S + 3600,
): AuthSession {
  return {
    accessToken: "jwt-valido",
    refreshToken: "refresh-valido",
    expiresAt,
    user: { id: `id-${role}`, email: `${role}@purisima.es`, fullName: "Test", role },
  };
}

function rawSupabaseSession(expiresAt: number, token = "jwt", role = "tutor_docente") {
  return {
    access_token: token,
    refresh_token: `refresh-${token}`,
    expires_at: expiresAt,
    user: {
      id: "usr-1",
      email: "tutor@purisima.es",
      user_metadata: { role, full_name: "Ana Docente" },
      created_at: "2026-10-01T00:00:00Z",
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  auth.signOut.mockResolvedValue({ error: null });
});

describe("SCRUM-57 · Expiración de sesión", () => {
  describe("isSessionExpired", () => {
    it("considera vigente una sesión con tiempo de vida por delante", () => {
      expect(isSessionExpired(buildSession("admin", NOW_S + 3600), NOW_MS)).toBe(false);
    });

    it("considera expirada una sesión cuyo expires_at ya pasó", () => {
      expect(isSessionExpired(buildSession("admin", NOW_S - 1), NOW_MS)).toBe(true);
    });

    it("considera expirada una sesión justo en el instante de expiración", () => {
      expect(isSessionExpired(buildSession("admin", NOW_S), NOW_MS, 0)).toBe(true);
    });

    it("aplica el margen de seguridad antes de la expiración real", () => {
      const casiExpirada = buildSession("admin", NOW_S + SESSION_EXPIRY_MARGIN_SECONDS - 1);
      const conMargen = buildSession("admin", NOW_S + SESSION_EXPIRY_MARGIN_SECONDS + 1);
      expect(isSessionExpired(casiExpirada, NOW_MS)).toBe(true);
      expect(isSessionExpired(conMargen, NOW_MS)).toBe(false);
    });

    it("trata como expirada (fail-closed) una sesión nula, sin token o sin expiración", () => {
      expect(isSessionExpired(null, NOW_MS)).toBe(true);
      expect(isSessionExpired(undefined, NOW_MS)).toBe(true);
      expect(isSessionExpired({ accessToken: "", expiresAt: NOW_S + 3600 }, NOW_MS)).toBe(true);
      expect(isSessionExpired({ ...buildSession("admin"), expiresAt: undefined }, NOW_MS)).toBe(
        true,
      );
      expect(isSessionExpired(buildSession("admin", Number.NaN), NOW_MS)).toBe(true);
    });

    it("detecta la expiración al avanzar el reloj (timers simulados)", () => {
      jest.useFakeTimers().setSystemTime(NOW_MS);
      const session = buildSession("tutor_docente", NOW_S + 3600);
      expect(isSessionExpired(session)).toBe(false);
      jest.setSystemTime(NOW_MS + 3600 * 1000);
      expect(isSessionExpired(session)).toBe(true);
      jest.useRealTimers();
    });
  });

  describe("getCurrentSession con token expirado", () => {
    it("devuelve la sesión si el token sigue vigente sin intentar refrescar", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S + 3600, "jwt-vigente") },
        error: null,
      });

      const session = await getCurrentSession(NOW_MS);

      expect(session?.accessToken).toBe("jwt-vigente");
      expect(auth.refreshSession).not.toHaveBeenCalled();
      expect(auth.signOut).not.toHaveBeenCalled();
    });

    it("renueva el token con el refresh token cuando ha expirado", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S - 60, "jwt-caducado") },
        error: null,
      });
      auth.refreshSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S + 3600, "jwt-renovado") },
        error: null,
      });

      const session = await getCurrentSession(NOW_MS);

      expect(auth.refreshSession).toHaveBeenCalledTimes(1);
      expect(session?.accessToken).toBe("jwt-renovado");
      expect(auth.signOut).not.toHaveBeenCalled();
    });

    it("cierra la sesión y devuelve null si el refresh token también es inválido", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S - 60) },
        error: null,
      });
      auth.refreshSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Invalid Refresh Token: Refresh Token Not Found" },
      });

      const session = await getCurrentSession(NOW_MS);

      expect(session).toBeNull();
      expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    });

    it("no acepta un refresh que devuelve otro token ya expirado", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S - 60) },
        error: null,
      });
      auth.refreshSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S - 10, "jwt-tambien-caducado") },
        error: null,
      });

      expect(await getCurrentSession(NOW_MS)).toBeNull();
      expect(auth.signOut).toHaveBeenCalled();
    });

    it("devuelve null si el refresh lanza una excepción de red", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: rawSupabaseSession(NOW_S - 60) },
        error: null,
      });
      auth.refreshSession.mockRejectedValueOnce(new Error("Network error"));

      expect(await getCurrentSession(NOW_MS)).toBeNull();
    });

    it("devuelve null si Supabase informa de un error al leer la sesión", async () => {
      auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Storage corrupto" },
      });

      expect(await getCurrentSession(NOW_MS)).toBeNull();
    });
  });

  describe("Cierre de sesión", () => {
    it("tras cerrar sesión no queda ninguna sesión recuperable", async () => {
      const ok = await signOutSupervisor();
      auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

      expect(ok.success).toBe(true);
      expect(await getCurrentSession(NOW_MS)).toBeNull();
    });

    it("informa del fallo si signOut lanza una excepción", async () => {
      auth.signOut.mockRejectedValueOnce(new Error("Sin conexión"));
      const result = await signOutSupervisor();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Sin conexión");
    });
  });
});

describe("SCRUM-57 · Seguridad de acceso", () => {
  describe("Control de acceso a rutas (RBAC, RF1.4)", () => {
    it("permite las rutas públicas sin sesión", () => {
      expect(checkRouteAccess(null, "/", NOW_MS)).toEqual({ allowed: true });
      expect(checkRouteAccess(null, "/login", NOW_MS)).toEqual({ allowed: true });
    });

    it.each(["/admin/dashboard", "/docente/agenda", "/familiar/resumen", "/especialista/terapias"])(
      "redirige a /login al acceder sin sesión a %s",
      (route) => {
        expect(checkRouteAccess(null, route, NOW_MS)).toEqual({
          allowed: false,
          reason: "unauthenticated",
          redirectTo: "/login",
        });
      },
    );

    it("bloquea una ruta protegida con sesión expirada aunque el rol sea correcto", () => {
      const expirada = buildSession("admin", NOW_S - 1);
      expect(checkRouteAccess(expirada, "/admin/dashboard", NOW_MS)).toEqual({
        allowed: false,
        reason: "expired",
        redirectTo: "/login",
      });
    });

    it.each<[SupervisorRole, string]>([
      ["tutor_docente", "/docente/agenda"],
      ["familiar", "/familiar/resumen"],
      ["especialista", "/especialista/terapias"],
      ["admin", "/admin/dashboard"],
    ])("permite al rol %s acceder a su zona %s", (role, route) => {
      expect(checkRouteAccess(buildSession(role), route, NOW_MS)).toEqual({ allowed: true });
    });

    it.each<[SupervisorRole, string]>([
      ["tutor_docente", "/admin/dashboard"],
      ["familiar", "/admin/dashboard"],
      ["especialista", "/admin/dashboard"],
      ["familiar", "/docente/agenda"],
      ["familiar", "/especialista/terapias"],
      ["tutor_docente", "/familiar/resumen"],
      ["especialista", "/docente/agenda"],
    ])("deniega al rol %s el acceso a %s (escalada de privilegios)", (role, route) => {
      expect(checkRouteAccess(buildSession(role), route, NOW_MS)).toMatchObject({
        allowed: false,
        reason: "forbidden",
      });
    });

    it("el administrador puede supervisar todas las zonas", () => {
      const admin = buildSession("admin");
      ["/docente/agenda", "/familiar/resumen", "/especialista/terapias"].forEach((route) =>
        expect(checkRouteAccess(admin, route, NOW_MS)).toEqual({ allowed: true }),
      );
    });

    it("no se deja engañar por variantes de la URL (mayúsculas, barras, query, hash)", () => {
      const familiar = buildSession("familiar");
      ["/ADMIN/dashboard", "//admin//dashboard", "/admin/", "/admin?x=1", "/admin#top"].forEach(
        (route) =>
          expect(checkRouteAccess(familiar, route, NOW_MS)).toMatchObject({ allowed: false }),
      );
    });

    it("bloquea intentos de path traversal", () => {
      const familiar = buildSession("familiar");
      expect(checkRouteAccess(familiar, "/familiar/../admin/dashboard", NOW_MS)).toMatchObject({
        allowed: false,
      });
    });

    it("no confunde prefijos parecidos (/administrador no es /admin)", () => {
      const admin = buildSession("admin");
      expect(checkRouteAccess(admin, "/administrador", NOW_MS)).toMatchObject({
        allowed: false,
        reason: "forbidden",
      });
    });

    it("deniega por defecto las rutas privadas no registradas", () => {
      expect(checkRouteAccess(buildSession("admin"), "/zona-secreta", NOW_MS)).toMatchObject({
        allowed: false,
      });
    });
  });

  describe("Login seguro (RF1.8)", () => {
    it("no permite escalar privilegios con un rol inventado en la metadata", async () => {
      auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: "u", email: "x@purisima.es", user_metadata: { role: "superadmin" } },
          session: { access_token: "jwt", refresh_token: "r", expires_at: NOW_S + 3600 },
        },
        error: null,
      });

      const result = await signInSupervisor("x@purisima.es", "Password123!");

      expect(result.session?.user.role).toBe("tutor_docente");
      expect(checkRouteAccess(result.session, "/admin/dashboard", NOW_MS)).toMatchObject({
        allowed: false,
      });
    });

    it("devuelve el mismo mensaje genérico para usuario inexistente y contraseña errónea (anti-enumeración)", async () => {
      auth.signInWithPassword
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: "User not found", status: 400 },
        })
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials", status: 400 },
        });

      const noExiste = await signInSupervisor("nadie@purisima.es", "Password123!");
      const malaClave = await signInSupervisor("tutor@purisima.es", "incorrecta");

      expect(noExiste.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
      expect(malaClave.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
      expect(noExiste).toEqual(malaClave);
    });

    it("no devuelve sesión si Supabase responde sin token aunque no haya error", async () => {
      auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: "u", email: "x@purisima.es" }, session: null },
        error: null,
      });

      const result = await signInSupervisor("x@purisima.es", "Password123!");
      expect(result.success).toBe(false);
      expect(result.session).toBeUndefined();
    });

    it("no expone la contraseña en el resultado del login", async () => {
      auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: "u", email: "x@purisima.es", user_metadata: { role: "admin" } },
          session: { access_token: "jwt", refresh_token: "r", expires_at: NOW_S + 3600 },
        },
        error: null,
      });

      const result = await signInSupervisor("x@purisima.es", "MiClaveSecreta!");
      expect(JSON.stringify(result)).not.toContain("MiClaveSecreta!");
    });

    it("rechaza credenciales formadas solo por espacios sin llamar a Supabase", async () => {
      const result = await signInSupervisor("   ", "Password123!");
      expect(result).toEqual({ success: false, error: AUTH_GENERIC_ERROR_MESSAGE });
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });
});
