import {
  signInSupervisor,
  signInEstudianteConDibujos,
  signOutSupervisor,
  getCurrentSession,
  getRoleHomeRoute,
  normalizeRole,
} from "../authService";
import { supabase } from "../../lib/supabaseClient";
import { AUTH_GENERIC_ERROR_MESSAGE } from "../../tipos/auth";

// Carpeta de esta prueba (el proyecto no trae los tipos de Node).
declare const __dirname: string;

jest.mock("../../lib/supabaseClient", () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn(),
    },
  };
});

const mockFrom = supabase.from as jest.Mock;

/** Simula la fila del usuario en public.perfiles (SCRUM-280); null = el usuario no tiene perfil. */
function perfilEnBD(perfil: Record<string, unknown> | null, error: unknown = null) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: perfil, error });
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  mockFrom.mockReturnValueOnce({ select });
  return { select, eq };
}

const perfilTutora = {
  rol: "tutor_docente",
  nombre_completo: "Ana Docente",
  centro_id: "centro-granada-1",
  activo: true,
};

describe("authService - HU-01 y HU-02 (Backend JWT, bcrypt & RBAC)", () => {
  beforeEach(() => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeRole & getRoleHomeRoute (RBAC)", () => {
    it("debe asignar la ruta correcta según el rol del usuario (RF1.4)", () => {
      expect(getRoleHomeRoute("admin")).toBe("/admin/dashboard");
      expect(getRoleHomeRoute("familiar")).toBe("/familiar/resumen");
      expect(getRoleHomeRoute("especialista")).toBe("/especialista/terapias");
      // La ruta tiene que existir en app/: la agenda del alumno es /agenda.
      expect(getRoleHomeRoute("estudiante")).toBe("/agenda");
      expect(getRoleHomeRoute("tutor_docente")).toBe("/docente/agenda");
    });

    it("la ruta de inicio de cada rol existe en app/ (revisión de Álvaro, SCRUM-280)", () => {
      // El proyecto no trae los tipos de Node: basta con lo que se usa aquí.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as { existsSync: (ruta: string) => boolean };
      const roles = ["admin", "familiar", "especialista", "estudiante", "tutor_docente"] as const;
      for (const rol of roles) {
        const ruta = getRoleHomeRoute(rol);
        const archivo = `${__dirname}/../../../app${ruta}.tsx`;
        expect({ rol, ruta, existe: fs.existsSync(archivo) }).toEqual({ rol, ruta, existe: true });
      }
    });

    it("valida los roles y deniega (null) los desconocidos en vez de dar uno por defecto (SCRUM-280)", () => {
      expect(normalizeRole("admin")).toBe("admin");
      expect(normalizeRole("familiar")).toBe("familiar");
      expect(normalizeRole("estudiante")).toBe("estudiante");
      expect(normalizeRole("rol_inexistente")).toBeNull();
      expect(normalizeRole(undefined)).toBeNull();
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
      const consulta = perfilEnBD(perfilTutora);

      const result = await signInSupervisor("tutor@purisima.es", "PasswordSeguro123!");

      expect(result.success).toBe(true);
      expect(result.session?.accessToken).toBe("mock-jwt-token-purisima");
      expect(result.session?.user.role).toBe("tutor_docente");
      expect(mockFrom).toHaveBeenCalledWith("perfiles");
      expect(consulta.eq).toHaveBeenCalledWith("id", "usr-123");
    });

    // SCRUM-280 · criterios 1 y 2: el rol no se puede cambiar desde user_metadata
    it("toma el rol de la tabla perfiles aunque user_metadata diga admin", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: {
          user: { id: "fam-1", email: "familia@purisima.es", user_metadata: { role: "admin" } },
          session: { access_token: "jwt", refresh_token: "r", expires_at: 4102444800 },
        },
        error: null,
      });
      perfilEnBD({ ...perfilTutora, rol: "familiar", nombre_completo: "Familia López" });

      const result = await signInSupervisor("familia@purisima.es", "PasswordSeguro123!");

      expect(result.session?.user.role).toBe("familiar");
    });

    // SCRUM-280 · criterio 5: nombre y centro salen del perfil
    it("toma el nombre y el centro del perfil, no de user_metadata", async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: {
          user: {
            id: "usr-123",
            email: "tutor@purisima.es",
            user_metadata: { full_name: "Nombre falso", centro_id: "otro-centro" },
          },
          session: { access_token: "jwt", refresh_token: "r", expires_at: 4102444800 },
        },
        error: null,
      });
      perfilEnBD(perfilTutora);

      const result = await signInSupervisor("tutor@purisima.es", "PasswordSeguro123!");

      expect(result.session?.user.fullName).toBe("Ana Docente");
      expect(result.session?.user.centroId).toBe("centro-granada-1");
    });

    // SCRUM-280 · criterio 3: sin perfil válido no hay sesión
    it.each([
      ["no tiene perfil", null, null],
      ["tiene el perfil desactivado", { ...perfilTutora, activo: false }, null],
      ["tiene un rol que no existe", { ...perfilTutora, rol: "superadmin" }, null],
      ["falla la consulta del perfil", null, { message: "permission denied" }],
    ])(
      "deniega el acceso con el mensaje genérico y cierra la sesión si %s",
      async (_caso, perfil, error) => {
        (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
          data: {
            user: { id: "usr-9", email: "x@purisima.es", user_metadata: { role: "admin" } },
            session: { access_token: "jwt", refresh_token: "r", expires_at: 4102444800 },
          },
          error: null,
        });
        perfilEnBD(perfil, error);

        const result = await signInSupervisor("x@purisima.es", "PasswordSeguro123!");

        expect(result).toEqual({ success: false, error: AUTH_GENERIC_ERROR_MESSAGE });
        expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
      },
    );

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
      perfilEnBD({ ...perfilTutora, rol: "estudiante", nombre_completo: "Carlos" });

      const result = await signInEstudianteConDibujos("carlos", ["manzana", "perro", "estrella"]);

      expect(result.success).toBe(true);
      expect(result.session?.user.role).toBe("estudiante");
      expect(result.session?.user.email).toBe("alu-carlos@alumnos.agensible");
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "alu-carlos@alumnos.agensible",
        password: "manzana-perro-estrella",
      });
    });

    // SCRUM-280 · criterio 4: con dibujos solo entra quien tiene perfil de estudiante
    it.each([
      ["no tiene perfil", null],
      ["su perfil es de supervisor", perfilTutora],
    ])("no deja entrar con dibujos si la cuenta %s", async (_caso, perfil) => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: {
          user: { id: "est-456", user_metadata: { role: "estudiante" } },
          session: { access_token: "jwt", refresh_token: "r", expires_at: 4102444800 },
        },
        error: null,
      });
      perfilEnBD(perfil);

      const result = await signInEstudianteConDibujos("carlos", ["manzana", "perro", "estrella"]);

      expect(result.success).toBe(false);
      expect(result.session).toBeUndefined();
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
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
    function sesionGuardada(metadataRole: string) {
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: {
          session: {
            access_token: "jwt-activo",
            refresh_token: "refresh-activo",
            expires_at: 4102444800, // 2100-01-01: sesión vigente
            user: {
              id: "usr-1",
              email: "usuario@purisima.es",
              user_metadata: { role: metadataRole, full_name: "Nombre en metadata" },
              created_at: "2026-10-01T00:00:00Z",
            },
          },
        },
        error: null,
      });
    }

    it("obtiene la sesión activa con el rol de su perfil", async () => {
      sesionGuardada("admin");
      perfilEnBD({ ...perfilTutora, rol: "admin", nombre_completo: "Admin Purísima" });

      const session = await getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.accessToken).toBe("jwt-activo");
      expect(session?.user.role).toBe("admin");
      expect(session?.user.fullName).toBe("Admin Purísima");
    });

    // SCRUM-280 · criterio 2: cambiar user_metadata y recargar no da otro rol
    it("al recargar mantiene el rol del perfil aunque user_metadata se haya cambiado a admin", async () => {
      sesionGuardada("admin");
      perfilEnBD(perfilTutora);

      const session = await getCurrentSession();
      expect(session?.user.role).toBe("tutor_docente");
    });

    it("devuelve null si el usuario ya no tiene perfil activo", async () => {
      sesionGuardada("tutor_docente");
      perfilEnBD({ ...perfilTutora, activo: false });

      expect(await getCurrentSession()).toBeNull();
    });
  });
});
