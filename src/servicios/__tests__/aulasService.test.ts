import {
  obtenerAulas,
  crearAula,
  actualizarAula,
  guardarConfiguracionAulas,
  eliminarAula,
  obtenerCursosAbiertos,
  ERROR_CURSO_AULA_OBLIGATORIO,
  ERROR_NOMBRE_AULA_OBLIGATORIO,
  ERROR_AULA_CON_ALUMNOS,
} from "../aulasService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

/** Cadena de Supabase «thenable»: cualquier método devuelve la misma cadena y al esperarla da `resultado`. */
function cadena(resultado: { data?: unknown; error?: unknown }) {
  const c: any = {};
  for (const m of ["select", "order", "eq", "limit", "insert", "update", "delete", "single"]) {
    c[m] = jest.fn(() => c);
  }
  c.then = (resolve: (v: unknown) => unknown) => resolve(resultado);
  return c;
}

const FILA = {
  id: "a1",
  centro_id: "c1",
  nombre: "Clase Triángulo",
  icono_forma: "triangulo",
  icono_url: null,
  color_distintivo: "#b8492f",
  nivel: "PTVAL",
  orden: 0,
};

describe("aulasService - SCRUM-259 (aulas configurables, pantalla 48b)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("obtenerAulas", () => {
    it("devuelve las aulas ordenadas, convertidas al formato de la aplicación", async () => {
      const c = cadena({ data: [FILA], error: null });
      mockFrom.mockReturnValue(c);

      const r = await obtenerAulas();

      expect(mockFrom).toHaveBeenCalledWith("aulas");
      expect(c.order).toHaveBeenNthCalledWith(1, "orden", { ascending: true });
      expect(c.order).toHaveBeenNthCalledWith(2, "nombre", { ascending: true });
      expect(r.success).toBe(true);
      expect(r.data?.[0]).toMatchObject({
        id: "a1",
        nombre: "Clase Triángulo",
        iconoForma: "triangulo",
        iconoUrl: null,
        orden: 0,
      });
    });

    it("filtra por centro si se indica", async () => {
      const c = cadena({ data: [], error: null });
      mockFrom.mockReturnValue(c);
      await obtenerAulas("c1");
      expect(c.eq).toHaveBeenCalledWith("centro_id", "c1");
    });

    it("devuelve el error de Supabase", async () => {
      mockFrom.mockReturnValue(cadena({ data: null, error: { message: "sin permiso" } }));
      const r = await obtenerAulas();
      expect(r).toEqual({ success: false, error: "sin permiso" });
    });

    it("devuelve el mensaje si la llamada lanza una excepción", async () => {
      mockFrom.mockImplementation(() => {
        throw new Error("sin red");
      });
      const r = await obtenerAulas();
      expect(r).toEqual({ success: false, error: "sin red" });
    });
  });

  describe("obtenerCursosAbiertos (SCRUM-249)", () => {
    it("pide los cursos no cerrados, del más antiguo al más nuevo", async () => {
      const c = cadena({
        data: [
          { id: "c26", anio_escolar: "2026-2027", activo: true },
          { id: "c27", anio_escolar: "2027-2028", activo: false },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(c);

      const r = await obtenerCursosAbiertos();

      expect(mockFrom).toHaveBeenCalledWith("cursos_lectivos");
      expect(c.eq).toHaveBeenCalledWith("cerrado", false);
      expect(c.order).toHaveBeenCalledWith("fecha_inicio", { ascending: true });
      expect(r).toEqual({
        success: true,
        data: [
          { id: "c26", anioEscolar: "2026-2027", activo: true },
          { id: "c27", anioEscolar: "2027-2028", activo: false },
        ],
      });
    });

    it("devuelve el error de Supabase", async () => {
      mockFrom.mockReturnValue(cadena({ data: null, error: { message: "sin permiso" } }));
      expect(await obtenerCursosAbiertos()).toEqual({ success: false, error: "sin permiso" });
    });
  });

  describe("crearAula", () => {
    it("rechaza un aula sin curso sin llamar a Supabase (SCRUM-249)", async () => {
      const r = await crearAula({ nombre: "Clase Luna", cursoLectivoId: "" });
      expect(r).toEqual({ success: false, error: ERROR_CURSO_AULA_OBLIGATORIO });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("rechaza un nombre vacío sin llamar a Supabase", async () => {
      const r = await crearAula({ nombre: "   ", cursoLectivoId: "curso-1" });
      expect(r).toEqual({ success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("la crea al final (orden = último + 1) con la forma por defecto", async () => {
      const ultima = cadena({ data: [{ orden: 8 }], error: null });
      const insercion = cadena({
        data: { ...FILA, id: "a10", nombre: "Clase Luna", orden: 9 },
        error: null,
      });
      mockFrom.mockReturnValueOnce(ultima).mockReturnValueOnce(insercion);

      const r = await crearAula({ nombre: "  Clase Luna ", cursoLectivoId: "curso-1" });

      expect(insercion.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Clase Luna",
          icono_forma: "tri",
          orden: 9,
          curso_lectivo_id: "curso-1",
        }),
      );
      expect(r.success).toBe(true);
      expect(r.data?.orden).toBe(9);
    });

    it("empieza en orden 0 si todavía no hay aulas y guarda el pictograma indicado", async () => {
      const ultima = cadena({ data: [], error: null });
      const insercion = cadena({ data: FILA, error: null });
      mockFrom.mockReturnValueOnce(ultima).mockReturnValueOnce(insercion);

      await crearAula({
        nombre: "Clase Sol",
        cursoLectivoId: "curso-1",
        iconoForma: "estrella",
        iconoUrl: "https://x/sol.png",
      });

      expect(insercion.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          orden: 0,
          icono_forma: "estrella",
          icono_url: "https://x/sol.png",
        }),
      );
    });

    it("devuelve el error si falla la inserción", async () => {
      mockFrom
        .mockReturnValueOnce(cadena({ data: [], error: null }))
        .mockReturnValueOnce(cadena({ data: null, error: { message: "solo administradores" } }));
      const r = await crearAula({ nombre: "Clase Luna", cursoLectivoId: "curso-1" });
      expect(r).toEqual({ success: false, error: "solo administradores" });
    });
  });

  describe("actualizarAula", () => {
    it("solo envía los campos que cambian", async () => {
      const c = cadena({ data: { ...FILA, nombre: "Clase Nueva" }, error: null });
      mockFrom.mockReturnValue(c);

      const r = await actualizarAula("a1", { nombre: " Clase Nueva " });

      expect(c.update).toHaveBeenCalledWith({ nombre: "Clase Nueva" });
      expect(c.eq).toHaveBeenCalledWith("id", "a1");
      expect(r.data?.nombre).toBe("Clase Nueva");
    });

    it("permite cambiar el icono o quitar la imagen propia", async () => {
      const c = cadena({ data: FILA, error: null });
      mockFrom.mockReturnValue(c);
      await actualizarAula("a1", { iconoForma: "rombo", iconoUrl: null });
      expect(c.update).toHaveBeenCalledWith({ icono_forma: "rombo", icono_url: null });
    });

    it("rechaza un nombre vacío", async () => {
      const r = await actualizarAula("a1", { nombre: "" });
      expect(r).toEqual({ success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO });
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe("guardarConfiguracionAulas", () => {
    it("guarda cada aula con su posición según el orden de la lista", async () => {
      const cadenas = [cadena({ data: FILA, error: null }), cadena({ data: FILA, error: null })];
      mockFrom.mockReturnValueOnce(cadenas[0]).mockReturnValueOnce(cadenas[1]);

      const r = await guardarConfiguracionAulas([
        { id: "a2", nombre: "Clase Círculo", iconoForma: "circulo" },
        {
          id: "a1",
          nombre: "Clase Triángulo",
          iconoForma: "triangulo",
          iconoUrl: "https://x/t.png",
        },
      ]);

      expect(cadenas[0].update).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Clase Círculo", orden: 0 }),
      );
      expect(cadenas[1].update).toHaveBeenCalledWith(
        expect.objectContaining({ orden: 1, icono_url: "https://x/t.png" }),
      );
      expect(r.success).toBe(true);
      expect(r.data).toHaveLength(2);
    });

    it("no guarda nada si algún nombre está vacío", async () => {
      const r = await guardarConfiguracionAulas([{ id: "a1", nombre: " " }]);
      expect(r).toEqual({ success: false, error: ERROR_NOMBRE_AULA_OBLIGATORIO });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("se detiene y devuelve el error si falla una aula", async () => {
      mockFrom.mockReturnValueOnce(cadena({ data: null, error: { message: "fallo" } }));
      const r = await guardarConfiguracionAulas([{ id: "a1", nombre: "Clase Triángulo" }]);
      expect(r).toEqual({ success: false, error: "fallo" });
    });
  });

  describe("eliminarAula", () => {
    it("elimina un aula vacía", async () => {
      const c = cadena({ error: null });
      mockFrom.mockReturnValue(c);
      const r = await eliminarAula("a1");
      expect(c.eq).toHaveBeenCalledWith("id", "a1");
      expect(r).toEqual({ success: true, data: null });
    });

    it("explica que no se puede si tiene alumnos (clave foránea)", async () => {
      mockFrom.mockReturnValue(cadena({ error: { code: "23503", message: "violates fk" } }));
      const r = await eliminarAula("a1");
      expect(r).toEqual({ success: false, error: ERROR_AULA_CON_ALUMNOS });
    });

    it("devuelve cualquier otro error tal cual", async () => {
      mockFrom.mockReturnValue(cadena({ error: { message: "sin permiso" } }));
      const r = await eliminarAula("a1");
      expect(r).toEqual({ success: false, error: "sin permiso" });
    });
  });
});
