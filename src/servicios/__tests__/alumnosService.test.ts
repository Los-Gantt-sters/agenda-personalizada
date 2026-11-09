import {
  crearAlumno,
  obtenerAlumnos,
  obtenerAlumnoPorId,
  actualizarAlumno,
  eliminarAlumno,
  subirFotoAlumno,
  generarCodigoExpediente,
  ERROR_TUTOR_OBLIGATORIO,
  ERROR_NOMBRE_OBLIGATORIO,
  ERROR_AULA_OBLIGATORIA,
} from "../alumnosService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => {
  return {
    supabase: {
      from: jest.fn(),
      storage: {
        from: jest.fn(),
      },
    },
  };
});

describe("alumnosService - SCRUM-60 (Backend CRUD de Alumnos & Validación de Tutor)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generarCodigoExpediente (RI2.2)", () => {
    it("genera un código seudonimizado con formato EXP-XXXX", () => {
      const codigo = generarCodigoExpediente();
      expect(codigo).toMatch(/^EXP-[0-9A-F]{4}$/);
    });
  });

  describe("crearAlumno - Reglas de Negocio y Validación (SCRUM-60)", () => {
    it("rechaza la creación si no se proporciona tutor titular obligatorio (RF2.4 / SCRUM-60)", async () => {
      const inputSinTutor = {
        nombre: "Alejandro",
        aulaId: "aula-triangulo-id",
        tutorTitularId: "", // Vacío
      };

      const result = await crearAlumno(inputSinTutor);

      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_TUTOR_OBLIGATORIO);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("rechaza la creación si falta el nombre del alumno", async () => {
      const inputSinNombre = {
        nombre: "   ",
        aulaId: "aula-1",
        tutorTitularId: "tutor-1",
      };

      const result = await crearAlumno(inputSinNombre);

      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_NOMBRE_OBLIGATORIO);
    });

    it("rechaza la creación si falta el aula del alumno", async () => {
      const inputSinAula = {
        nombre: "Alejandro",
        aulaId: "",
        tutorTitularId: "tutor-1",
      };

      const result = await crearAlumno(inputSinAula);

      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_AULA_OBLIGATORIA);
    });

    it("crea un alumno correctamente con su tutor de aula y preferencias de tema de interés", async () => {
      const mockAlumnoDb = {
        id: "alu-101",
        nombre: "Alejandro",
        aula_id: "aula-triangulo",
        codigo_expediente: "EXP-3A71",
        requiere_tutor_presencial: true,
        dieta_comedor: "basal",
        creado_en: "2026-11-05T09:00:00Z",
        actualizado_en: "2026-11-05T09:00:00Z",
      };

      const mockSingle = jest.fn().mockResolvedValue({ data: mockAlumnoDb, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsertAlumnos = jest.fn().mockReturnValue({ select: mockSelect });

      const mockInsertVinculos = jest.fn().mockResolvedValue({ error: null });
      const mockInsertPreferencias = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockImplementation((tabla: string) => {
        if (tabla === "alumnos") {
          return { insert: mockInsertAlumnos };
        }
        if (tabla === "vinculos_alumno_supervisor") {
          return { insert: mockInsertVinculos };
        }
        if (tabla === "preferencias_alumnos") {
          return { insert: mockInsertPreferencias };
        }
        return { insert: jest.fn().mockResolvedValue({ error: null }) };
      });

      const inputCompleto = {
        nombre: "Alejandro",
        apellidos: "Castillo Vega",
        aulaId: "aula-triangulo",
        tutorTitularId: "tutor-docente-carmen",
        tutorFamiliarId: "familiar-ramon",
        temaInteres: "coches" as const,
        iconoPersonal: "🦁",
        requiereTutorPresencial: true,
      };

      const result = await crearAlumno(inputCompleto);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("alu-101");
      expect(result.data?.nombre).toBe("Alejandro");
      expect(result.data?.requiereTutorPresencial).toBe(true);

      expect(mockInsertVinculos).toHaveBeenCalledWith(
        expect.objectContaining({
          alumno_id: "alu-101",
          supervisor_id: "tutor-docente-carmen",
          tipo_vinculo: "aula",
        }),
      );

      expect(mockInsertVinculos).toHaveBeenCalledWith(
        expect.objectContaining({
          alumno_id: "alu-101",
          supervisor_id: "familiar-ramon",
          tipo_vinculo: "familiar",
        }),
      );

      expect(mockInsertPreferencias).toHaveBeenCalledWith(
        expect.objectContaining({
          alumno_id: "alu-101",
          tema_interes: "coches",
        }),
      );
    });

    it("captura errores de base de datos durante la inserción", async () => {
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Error de clave duplicada" } });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsertAlumnos = jest.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsertAlumnos });

      const result = await crearAlumno({
        nombre: "Alejandro",
        aulaId: "aula-1",
        tutorTitularId: "tutor-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Error de clave duplicada");
    });
  });

  describe("obtenerAlumnos", () => {
    it("obtiene la lista de alumnos activos filtrados por aula", async () => {
      const mockRows = [
        {
          id: "alu-1",
          nombre: "Alejandro",
          codigo_expediente: "EXP-01",
          aula_id: "aula-triangulo",
          requiere_tutor_presencial: true,
          activo: true,
        },
        {
          id: "alu-2",
          nombre: "Sergio",
          codigo_expediente: "EXP-02",
          aula_id: "aula-triangulo",
          requiere_tutor_presencial: false,
          activo: true,
        },
      ];

      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.then = (resolve: any) => resolve({ data: mockRows, error: null });

      (supabase.from as jest.Mock).mockReturnValue(chain);

      const result = await obtenerAlumnos({ aulaId: "aula-triangulo", soloActivos: true });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].nombre).toBe("Alejandro");
      expect(result.data?.[1].codigoExpediente).toBe("EXP-02");
    });

    it("maneja errores de consulta en la base de datos", async () => {
      const chain: any = {};
      chain.select = jest.fn().mockReturnValue(chain);
      chain.order = jest.fn().mockReturnValue(chain);
      chain.eq = jest.fn().mockReturnValue(chain);
      chain.then = (resolve: any) =>
        resolve({ data: null, error: { message: "Error de conexión" } });

      (supabase.from as jest.Mock).mockReturnValue(chain);

      const result = await obtenerAlumnos({ aulaId: "aula-1" });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Error de conexión");
    });
  });

  describe("obtenerAlumnoPorId", () => {
    it("retorna el detalle completo de un alumno con sus preferencias y vínculos", async () => {
      const mockAlumno = {
        id: "alu-1",
        nombre: "Alejandro",
        codigo_expediente: "EXP-01",
        aula_id: "aula-triangulo",
        requiere_tutor_presencial: true,
        dieta_comedor: "basal",
        activo: true,
      };

      const mockPrefs = {
        alumno_id: "alu-1",
        tema_interes: "futbol",
        tema_color: "pastel",
        tamano_letra: "grande",
        tamano_botones: "gigante",
        sonidos_activos: true,
        reloj_visual_activo: true,
      };

      (supabase.from as jest.Mock).mockImplementation((tabla: string) => {
        if (tabla === "alumnos") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockReturnValue({ single: jest.fn().mockResolvedValue({ data: mockAlumno }) }),
          };
        }
        if (tabla === "preferencias_alumnos") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: mockPrefs }) }),
          };
        }
        if (tabla === "vinculos_alumno_supervisor") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });

      const result = await obtenerAlumnoPorId("alu-1");

      expect(result.success).toBe(true);
      expect(result.data?.nombre).toBe("Alejandro");
      expect(result.data?.preferencias?.temaInteres).toBe("futbol");
    });

    it("retorna error si el identificador es inválido", async () => {
      const result = await obtenerAlumnoPorId("");
      expect(result.success).toBe(false);
      expect(result.error).toContain("no proporcionado");
    });
  });

  describe("actualizarAlumno", () => {
    it("actualiza campos permitidos del alumno", async () => {
      const mockUpdated = {
        id: "alu-1",
        nombre: "Alejandro Editado",
        codigo_expediente: "EXP-01",
        aula_id: "aula-circulo",
        requiere_tutor_presencial: false,
        dieta_comedor: "texturizada",
        activo: true,
      };

      (supabase.from as jest.Mock).mockImplementation((tabla: string) => {
        if (tabla === "alumnos") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
              }),
            }),
          };
        }
        if (tabla === "preferencias_alumnos") {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
            eq: jest
              .fn()
              .mockReturnValue({ maybeSingle: jest.fn().mockResolvedValue({ data: null }) }),
          };
        }
        if (tabla === "vinculos_alumno_supervisor") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: [] }),
            }),
          };
        }
        return {};
      });

      const result = await actualizarAlumno("alu-1", {
        nombre: "Alejandro Editado",
        requiereTutorPresencial: false,
        dietaComedor: "texturizada",
      });

      expect(result.success).toBe(true);
      expect(result.data?.nombre).toBe("Alejandro Editado");
    });
  });

  describe("eliminarAlumno (Baja Lógica RGPD)", () => {
    it("realiza baja lógica estableciendo activo = false", async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const result = await eliminarAlumno("alu-1");
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ activo: false });
    });

    it("realiza baja física si se indica explícitamente", async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEq });

      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      const result = await eliminarAlumno("alu-1", true);
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe("subirFotoAlumno (CA-01.1)", () => {
    it("sube foto al storage de Supabase y actualiza la URL del alumno", async () => {
      const mockUpload = jest.fn().mockResolvedValue({ error: null });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: "https://supabase.co/storage/fotos-alumnos/alu-1.jpg" },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });

      const fakeBlob = new Blob(["foto-binaria"], { type: "image/jpeg" });
      const result = await subirFotoAlumno("alu-1", fakeBlob, "jpg");

      expect(result.success).toBe(true);
      expect(result.url).toBe("https://supabase.co/storage/fotos-alumnos/alu-1.jpg");
      expect(mockUpload).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith({
        foto_url: "https://supabase.co/storage/fotos-alumnos/alu-1.jpg",
      });
    });

    it("retorna error si falla la subida a Storage", async () => {
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: { message: "Bucket no encontrado" } }),
      });

      const fakeBlob = new Blob(["foto-binaria"]);
      const result = await subirFotoAlumno("alu-1", fakeBlob);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Bucket no encontrado");
    });
  });
});
