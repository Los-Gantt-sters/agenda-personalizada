import {
  ERROR_TIPO_MENU,
  guardarMenuAlumno,
  limpiarAlergias,
  listarMenusAlumnos,
} from "../menusService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

/** Cadena de Supabase «thenable»: cualquier método devuelve la misma cadena y al esperarla da `resultado`. */
function cadena(resultado: { data?: unknown; error?: unknown }) {
  const c: any = {};
  for (const m of ["select", "order", "eq", "update"]) c[m] = jest.fn(() => c);
  c.then = (resolve: (v: unknown) => unknown) => resolve(resultado);
  return c;
}

describe("menusService - SCRUM-260 (menús y alergias, pantallas 46 y 46b)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("limpiarAlergias", () => {
    it("quita espacios, vacías y repetidas sin distinguir mayúsculas", () => {
      expect(limpiarAlergias([" huevo ", "", "Huevo", "kiwi", "  "])).toEqual(["huevo", "kiwi"]);
    });
  });

  describe("listarMenusAlumnos", () => {
    it("devuelve cada alumno con su aula, menú, alergias y observaciones", async () => {
      const c = cadena({
        data: [
          {
            id: "a1",
            nombre: "Miriam",
            apellidos: "Núñez",
            dieta_comedor: "sin_gluten",
            alergias: ["frutos_secos"],
            observaciones_cocina: "Pan sin gluten precintado",
            aulas: { nombre: "Clase Triángulo" },
          },
          {
            id: "a2",
            nombre: "Sergio",
            dieta_comedor: "normal",
            alergias: null,
            observaciones_cocina: null,
            aulas: [{ nombre: "Clase Triángulo" }],
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(c);

      const r = await listarMenusAlumnos();

      expect(mockFrom).toHaveBeenCalledWith("alumnos");
      expect(c.eq).toHaveBeenCalledWith("activo", true);
      expect(r.data?.[0]).toEqual({
        id: "a1",
        nombre: "Miriam",
        apellidos: "Núñez",
        aula: "Clase Triángulo",
        dietaComedor: "sin_gluten",
        alergias: ["frutos_secos"],
        observacionesCocina: "Pan sin gluten precintado",
      });
      expect(r.data?.[1]).toMatchObject({
        aula: "Clase Triángulo",
        alergias: [],
        observacionesCocina: "",
      });
    });

    it("devuelve el error de Supabase", async () => {
      mockFrom.mockReturnValue(cadena({ data: null, error: { message: "sin permiso" } }));
      expect(await listarMenusAlumnos()).toEqual({ success: false, error: "sin permiso" });
    });

    it("devuelve el mensaje si lanza una excepción", async () => {
      mockFrom.mockImplementation(() => {
        throw new Error("sin red");
      });
      expect(await listarMenusAlumnos()).toEqual({ success: false, error: "sin red" });
    });
  });

  describe("guardarMenuAlumno", () => {
    it("guarda el menú, las alergias limpias y las observaciones", async () => {
      const c = cadena({ error: null });
      mockFrom.mockReturnValue(c);

      const r = await guardarMenuAlumno("a1", {
        dietaComedor: "sin_gluten",
        alergias: ["huevo", " kiwi ", "Huevo"],
        observacionesCocina: "  Revisar trazas  ",
      });

      expect(c.update).toHaveBeenCalledWith({
        dieta_comedor: "sin_gluten",
        alergias: ["huevo", "kiwi"],
        observaciones_cocina: "Revisar trazas",
      });
      expect(c.eq).toHaveBeenCalledWith("id", "a1");
      expect(r.success).toBe(true);
      expect(r.data?.alergias).toEqual(["huevo", "kiwi"]);
    });

    it("guarda las observaciones vacías como null", async () => {
      const c = cadena({ error: null });
      mockFrom.mockReturnValue(c);
      await guardarMenuAlumno("a1", {
        dietaComedor: "normal",
        alergias: [],
        observacionesCocina: " ",
      });
      expect(c.update).toHaveBeenCalledWith(
        expect.objectContaining({ observaciones_cocina: null }),
      );
    });

    it("rechaza un tipo de menú que no existe sin llamar a Supabase", async () => {
      const r = await guardarMenuAlumno("a1", {
        dietaComedor: "basal" as never,
        alergias: [],
        observacionesCocina: "",
      });
      expect(r).toEqual({ success: false, error: ERROR_TIPO_MENU });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("devuelve el error de Supabase", async () => {
      mockFrom.mockReturnValue(cadena({ error: { message: "solo administradores" } }));
      const r = await guardarMenuAlumno("a1", {
        dietaComedor: "normal",
        alergias: [],
        observacionesCocina: "",
      });
      expect(r).toEqual({ success: false, error: "solo administradores" });
    });
  });
});
