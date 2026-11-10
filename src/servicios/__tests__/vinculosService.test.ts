import {
  asignarSupervisor,
  listarAlumnosConVinculos,
  listarSupervisores,
  ERROR_ASIGNAR_VINCULO,
  ERROR_TUTOR_AULA_OBLIGATORIO,
} from "../vinculosService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

/**
 * Consulta falsa de Supabase: cada método (.select, .eq…) devuelve la misma consulta, y al
 * esperarla con `await` da el resultado indicado. Guarda las llamadas para comprobarlas.
 */
function consulta(resultado: { data?: unknown; error?: { message: string } | null }) {
  const q: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const metodo of ["select", "eq", "order", "update", "upsert"]) {
    q[metodo] = jest.fn(() => q);
  }
  q.then = (ok: (v: unknown) => unknown, ko: (e: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null, ...resultado }).then(ok, ko);
  return q;
}

describe("vinculosService - SCRUM-61 (asignación de tutores y familias)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listarAlumnosConVinculos", () => {
    it("junta cada estudiante con su aula, su tutor de aula y su familia", async () => {
      mockFrom
        .mockReturnValueOnce(
          consulta({
            data: [
              {
                id: "a1",
                nombre: "Sergio",
                apellidos: "Gil",
                requiere_tutor_presencial: true,
                aulas: { nombre: "PTVAL 2" },
              },
              { id: "a2", nombre: "Nora", requiere_tutor_presencial: false, aulas: null },
            ],
          }),
        )
        .mockReturnValueOnce(
          consulta({
            data: [
              {
                alumno_id: "a1",
                tipo_vinculo: "aula",
                perfiles: { id: "t1", nombre_completo: "Carmen Heredia" },
              },
              {
                alumno_id: "a1",
                tipo_vinculo: "familiar",
                perfiles: [{ id: "f1", nombre_completo: "Familia Gil" }],
              },
            ],
          }),
        );

      const r = await listarAlumnosConVinculos();

      expect(r.success).toBe(true);
      expect(r.data).toEqual([
        {
          id: "a1",
          nombre: "Sergio",
          apellidos: "Gil",
          aula: "PTVAL 2",
          requiereTutorPresencial: true,
          tutorAula: { id: "t1", nombre: "Carmen Heredia" },
          familia: { id: "f1", nombre: "Familia Gil" },
        },
        {
          id: "a2",
          nombre: "Nora",
          apellidos: undefined,
          aula: undefined,
          requiereTutorPresencial: false,
          tutorAula: null,
          familia: null,
        },
      ]);
      expect(mockFrom).toHaveBeenNthCalledWith(1, "alumnos");
      expect(mockFrom).toHaveBeenNthCalledWith(2, "vinculos_alumno_supervisor");
    });

    it("devuelve el error si falla la consulta", async () => {
      mockFrom.mockReturnValueOnce(consulta({ error: { message: "sin permiso" } }));

      const r = await listarAlumnosConVinculos();

      expect(r).toEqual({ success: false, error: "sin permiso" });
    });
  });

  describe("listarSupervisores", () => {
    it("pide los tutores docentes activos para el vínculo de aula", async () => {
      const q = consulta({ data: [{ id: "t1", nombre_completo: "Carmen Heredia" }] });
      mockFrom.mockReturnValueOnce(q);

      const r = await listarSupervisores("aula");

      expect(r.data).toEqual([{ id: "t1", nombre: "Carmen Heredia" }]);
      expect(mockFrom).toHaveBeenCalledWith("perfiles");
      expect(q.eq).toHaveBeenCalledWith("rol", "tutor_docente");
      expect(q.eq).toHaveBeenCalledWith("activo", true);
    });

    it("pide las familias para el vínculo familiar", async () => {
      const q = consulta({ data: [] });
      mockFrom.mockReturnValueOnce(q);

      await listarSupervisores("familiar");

      expect(q.eq).toHaveBeenCalledWith("rol", "familiar");
    });
  });

  describe("asignarSupervisor", () => {
    it("no deja a un estudiante sin tutor de aula", async () => {
      const r = await asignarSupervisor("a1", "aula", null);

      expect(r).toEqual({ success: false, error: ERROR_TUTOR_AULA_OBLIGATORIO });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("desactiva el vínculo anterior y activa el nuevo", async () => {
      const desactivar = consulta({ data: [{ supervisor_id: "t1" }] });
      const activar = consulta({});
      mockFrom.mockReturnValueOnce(desactivar).mockReturnValueOnce(activar);

      const r = await asignarSupervisor("a1", "aula", "t2");

      expect(r.success).toBe(true);
      expect(desactivar.update).toHaveBeenCalledWith({ activo: false });
      expect(desactivar.eq).toHaveBeenCalledWith("tipo_vinculo", "aula");
      expect(activar.upsert).toHaveBeenCalledWith(
        { alumno_id: "a1", supervisor_id: "t2", tipo_vinculo: "aula", activo: true },
        { onConflict: "alumno_id,supervisor_id" },
      );
    });

    it("con null deja al estudiante sin familia", async () => {
      const desactivar = consulta({ data: [{ supervisor_id: "f1" }] });
      mockFrom.mockReturnValueOnce(desactivar);

      const r = await asignarSupervisor("a1", "familiar", null);

      expect(r.success).toBe(true);
      expect(desactivar.eq).toHaveBeenCalledWith("tipo_vinculo", "familiar");
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it("si no se puede activar el nuevo, restaura el anterior", async () => {
      const desactivar = consulta({ data: [{ supervisor_id: "t1" }] });
      const activar = consulta({ error: { message: "duplicado" } });
      const restaurar = consulta({});
      mockFrom
        .mockReturnValueOnce(desactivar)
        .mockReturnValueOnce(activar)
        .mockReturnValueOnce(restaurar);

      const r = await asignarSupervisor("a1", "aula", "t2");

      expect(r).toEqual({ success: false, error: ERROR_ASIGNAR_VINCULO });
      expect(restaurar.update).toHaveBeenCalledWith({ activo: true });
      expect(restaurar.eq).toHaveBeenCalledWith("supervisor_id", "t1");
    });

    it("si falla al desactivar, no toca nada más", async () => {
      mockFrom.mockReturnValueOnce(consulta({ error: { message: "sin permiso" } }));

      const r = await asignarSupervisor("a1", "familiar", "f2");

      expect(r).toEqual({ success: false, error: ERROR_ASIGNAR_VINCULO });
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });
});
