import {
  signInSupervisor,
  signInEstudianteConDibujos,
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

describe("authService - HU-01 y HU-02 (Backend JWT, bcrypt & RBAC)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeRole & getRoleHomeRoute (RBAC)", () => {
    it("debe asignar la ruta correcta según el rol del usuario (RF1.4)", () => {
      expect(getRoleHomeRoute("admin")).toBe("/admin/dashboard");
      expect(getRoleHomeRoute("familiar")).toBe("/familiar/resumen");
      expect(getRoleHomeRoute("especialista")).toBe("/especialista/terapias");
      expect(getRoleHomeRoute("estudiante")).toBe("/estudiante/agenda");
      expect(getRoleHomeRoute("tutor_docente")).toBe("/docente/agenda");
    });

    it("debe validar y normalizar roles desconocidos al default tutor_docente", () => {
      expect(normalizeRole("admin")).toBe("admin");
      expect(normalizeRole("familiar")).toBe("familiar");
      expect(normalizeRole("estudiante")).toBe("estudiante");
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
    });

    it("emite un mensaje de error genérico cuando las credenciales son inválidas (RF1.8)", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials", status: 400 },
      });

      const result = await signInSupervisor("usuario@purisima.es", "clave_incorrecta");

      expect(result.success).toBe(false);
      expect(result.error).toBe(AUTH_GENERIC_ERROR_MESSAGE);
    });
  });

  describe("signInEstudianteConDibujos (HU-01 / SCRUM-51)", () => {
    it("autentica al estudiante uniendo la secuencia de 3 dibujos con email interno", async () => {
      const mockEstudianteUser = {
        id: "est-456",
        email: "alu-carlos@alumnos.agensible",
        user_metadata: {
          role: "estudiante",
          full_name: "Carlos Estudiante",
        },
        created_at: "2026-10-15T08:00:00Z",
      };

      const mockSession = {
        access_token: "jwt-estudiante-123",
        refresh_token: "refresh-estudiante-123",
        expires_at: 1761805000,
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockEstudianteUser, session: mockSession },
        error: null,
      });

      const result = await signInEstudianteConDibujos("carlos", ["manzana", "perro", "estrella"]);

      expect(result.success).toBe(true);
      expect(result.session?.user.role).toBe("estudiante");
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "alu-carlos@alumnos.agensible",
        password: "manzana-perro-estrella",
      });
    });

    it("rechaza llamadas sin exactamente 3 dibujos", async () => {
      const result = await signInEstudianteConDibujos("carlos", ["manzana", "perro"]);
      expect(result.success).toBe(false);
      expect(result.error).toContain("3 dibujos");
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe("signOutSupervisor", () => {
    it("cierra la sesión correctamente", async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

      const result = await signOutSupervisor();
      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("getCurrentSession", () => {
    it("obtiene la sesión activa con perfil RBAC", async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: {
          session: {
            access_token: "jwt-activo",
            refresh_token: "refresh-activo",
            expires_at: 1761900000,
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
  });
});
