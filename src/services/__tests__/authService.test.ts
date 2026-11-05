import {
  signInSupervisor,
  signOutSupervisor,
  getCurrentSession,
  getRoleHomeRoute,
  normalizeRole,
} from "../authService";
import { supabase } from "../../lib/supabaseClient";
import { AUTH_GENERIC_ERROR_MESSAGE } from "../../types/auth";

jest.mock("../../lib/supabaseClient", () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
      },
    },
  };
});

describe("authService - SCRUM-56 (Backend JWT, bcrypt & RBAC)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeRole & getRoleHomeRoute (RBAC)", () => {
    it("debe asignar la ruta correcta según el rol del supervisor (RF1.4)", () => {
      expect(getRoleHomeRoute("admin")).toBe("/admin/dashboard");
      expect(getRoleHomeRoute("familiar")).toBe("/familiar/resumen");
      expect(getRoleHomeRoute("especialista")).toBe("/especialista/terapias");
      expect(getRoleHomeRoute("tutor_docente")).toBe("/docente/agenda");
    });

    it("debe validar y normalizar roles desconocidos al default tutor_docente", () => {
      expect(normalizeRole("admin")).toBe("admin");
      expect(normalizeRole("familiar")).toBe("familiar");
      expect(normalizeRole("rol_inexistente")).toBe("tutor_docente");
      expect(normalizeRole(undefined)).toBe("tutor_docente");
    });
  });

  describe("signInSupervisor", () => {
    it("inicia sesión con éxito y retorna token JWT y perfil RBAC (RF1.3, RNF1.3)", async () => {
      const mockUser = {
        id: "usr-123",
        email: "tutor@purisima.es",
        user_metadata: {
          role: "tutor_docente",
          full_name: "Ana Docente",
          centro_id: "centro-granada-1",
        },
        created_at: "2026-10-01T08:00:00Z",
      };

      const mockSession = {
        access_token: "mock-jwt-token-purisima",
        refresh_token: "mock-refresh-token",
        expires_at: 1761800000,
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await signInSupervisor("tutor@purisima.es", "PasswordSeguro123!");

      expect(result.success).toBe(true);
      expect(result.session?.accessToken).toBe("mock-jwt-token-purisima");
      expect(result.session?.user.role).toBe("tutor_docente");
      expect(result.session?.user.email).toBe("tutor@purisima.es");
      expect(result.session?.user.fullName).toBe("Ana Docente");
    });

    it("emite un mensaje de error genérico cuando las credenciales son inválidas (RF1.8)", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      const result = await signInSupervisor("usuario@purisima.es", "clave_incorrecta");

      expect(result.success).toBe(false);
      expect(result.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
      expect(result.session).toBeUndefined();
    });

    it("rechaza credenciales vacías devolviendo el error genérico sin llamar a Supabase", async () => {
      const resultEmpty = await signInSupervisor("", "");
      expect(resultEmpty.success).toBe(false);
      expect(resultEmpty.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("captura excepciones imprevistas y responde con el error genérico seguro", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await signInSupervisor("test@purisima.es", "pass");
      expect(result.success).toBe(false);
      expect(result.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
    });
  });

  describe("signOutSupervisor", () => {
    it("cierra la sesión correctamente", async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

      const result = await signOutSupervisor();
      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it("gestiona error de cierre de sesión", async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: { message: "Fallo de red al revocar token" },
      });

      const result = await signOutSupervisor();
      expect(result.success).toBe(false);
      expect(result.error).toContain("Fallo de red");
    });
  });

  describe("getCurrentSession", () => {
    it("obtiene la sesión activa con perfil RBAC", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: {
          session: {
            access_token: "jwt-activo",
            refresh_token: "refresh-activo",
            expires_at: 4102444800, // 2100-01-01: sesión vigente
            user: {
              id: "admin-1",
              email: "admin@purisima.es",
              user_metadata: { role: "admin", full_name: "Admin Purísima" },
              created_at: "2026-10-01T00:00:00Z",
            },
          },
        },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.accessToken).toBe("jwt-activo");
      expect(session?.user.role).toBe("admin");
    });

    it("retorna null si no hay sesión activa", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });
  });
});
