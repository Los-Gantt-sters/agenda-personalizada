import {
  destinoTrasLoginAlumno,
  esIdDeAlumnoReal,
  obtenerVistaAgenda,
  rutaAgendaAlumno,
} from "../destinoAgendaAlumno";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const sb = supabase as unknown as { from: jest.Mock };

const ID_REAL = "3f2b8c1e-7d4a-4e9b-9c55-0a1b2c3d4e5f";

/** Consulta de Supabase: from → select → eq → maybeSingle, que devuelve `resultado`. */
function consultaVista(resultado: { data: unknown; error: unknown } | Error) {
  const maybeSingle = jest.fn(() =>
    resultado instanceof Error ? Promise.reject(resultado) : Promise.resolve(resultado),
  );
  const eq = jest.fn(() => ({ maybeSingle }));
  const select = jest.fn(() => ({ eq }));
  sb.from.mockReturnValue({ select });
  return { select, eq, maybeSingle };
}

describe("destinoAgendaAlumno (SCRUM-227: llevar al alumno a su agenda tras el login)", () => {
  afterEach(() => jest.clearAllMocks());

  describe("esIdDeAlumnoReal", () => {
    it("acepta un UUID y rechaza los alumnos de ejemplo del acceso", () => {
      expect(esIdDeAlumnoReal(ID_REAL)).toBe(true);
      expect(esIdDeAlumnoReal("ale")).toBe(false);
      expect(esIdDeAlumnoReal("")).toBe(false);
    });
  });

  describe("rutaAgendaAlumno", () => {
    it("lleva a la agenda diaria con el id del alumno", () => {
      expect(rutaAgendaAlumno(ID_REAL, "diaria")).toBe(`/agenda?estudiante=${ID_REAL}`);
    });

    it("usa la diaria si no se indica la vista", () => {
      expect(rutaAgendaAlumno(ID_REAL)).toBe(`/agenda?estudiante=${ID_REAL}`);
    });

    it("añade vista=semanal cuando el alumno tiene la agenda semanal", () => {
      expect(rutaAgendaAlumno(ID_REAL, "semanal")).toBe(
        `/agenda?estudiante=${ID_REAL}&vista=semanal`,
      );
    });

    it("con un alumno de ejemplo abre la demo, sin id", () => {
      expect(rutaAgendaAlumno("ale", "semanal")).toBe("/agenda");
    });
  });

  describe("obtenerVistaAgenda", () => {
    it("lee vista_agenda del alumno en preferencias_alumnos", async () => {
      const q = consultaVista({ data: { vista_agenda: "semanal" }, error: null });
      await expect(obtenerVistaAgenda(ID_REAL)).resolves.toBe("semanal");
      expect(sb.from).toHaveBeenCalledWith("preferencias_alumnos");
      expect(q.select).toHaveBeenCalledWith("vista_agenda");
      expect(q.eq).toHaveBeenCalledWith("alumno_id", ID_REAL);
    });

    it("devuelve diaria si así lo tiene configurado", async () => {
      consultaVista({ data: { vista_agenda: "diaria" }, error: null });
      await expect(obtenerVistaAgenda(ID_REAL)).resolves.toBe("diaria");
    });

    it("devuelve diaria si el alumno aún no tiene preferencias guardadas", async () => {
      consultaVista({ data: null, error: null });
      await expect(obtenerVistaAgenda(ID_REAL)).resolves.toBe("diaria");
    });

    it("devuelve diaria si Supabase da un error", async () => {
      consultaVista({ data: null, error: { message: "fallo" } });
      await expect(obtenerVistaAgenda(ID_REAL)).resolves.toBe("diaria");
    });

    it("devuelve diaria si falla la conexión", async () => {
      consultaVista(new Error("sin red"));
      await expect(obtenerVistaAgenda(ID_REAL)).resolves.toBe("diaria");
    });

    it("no consulta Supabase con un alumno de ejemplo", async () => {
      await expect(obtenerVistaAgenda("ale")).resolves.toBe("diaria");
      expect(sb.from).not.toHaveBeenCalled();
    });
  });

  describe("destinoTrasLoginAlumno", () => {
    it("manda a la agenda semanal a quien la tiene configurada", async () => {
      consultaVista({ data: { vista_agenda: "semanal" }, error: null });
      await expect(destinoTrasLoginAlumno(ID_REAL)).resolves.toBe(
        `/agenda?estudiante=${ID_REAL}&vista=semanal`,
      );
    });

    it("manda a la agenda diaria por defecto", async () => {
      consultaVista({ data: null, error: null });
      await expect(destinoTrasLoginAlumno(ID_REAL)).resolves.toBe(`/agenda?estudiante=${ID_REAL}`);
    });

    it("con un alumno de ejemplo mantiene la demo de la agenda", async () => {
      await expect(destinoTrasLoginAlumno("mir")).resolves.toBe("/agenda");
    });
  });
});
