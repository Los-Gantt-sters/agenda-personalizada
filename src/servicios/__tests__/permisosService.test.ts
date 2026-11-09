import {
  esTutorDocenteDeAlumno,
  esFamiliarDeAlumno,
  validarAccesoAlumno,
  validarAccesoTarea,
  puedeModificarAmbito,
  obtenerAmbitosEscritura,
  obtenerAmbitosLectura,
  filtrarAlumnosPorPermiso,
  filtrarTareasPorAmbito,
} from "../permisosService";
import { supabase } from "../../lib/supabaseClient";
import { SupervisorProfile } from "../../tipos/auth";
import { Alumno } from "../../tipos/alumnos";
import { Tarea } from "../../tipos/tareas";
import {
  ERROR_AMBITO_RESTRINGIDO,
  ERROR_ALUMNO_NO_VINCULADO,
  ERROR_USUARIO_INVALIDO,
} from "../../tipos/permisos";

jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("permisosService - Segregación de permisos y cumplimiento RGPD (SCRUM-62 / T-03.4)", () => {
  const adminUser: SupervisorProfile = {
    id: "admin-uuid-001",
    email: "admin@purisima.org",
    fullName: "Director Centro",
    role: "admin",
    centroId: "centro-uuid",
  };

  const docenteUser: SupervisorProfile = {
    id: "docente-uuid-001",
    email: "docente@purisima.org",
    fullName: "Carmen Heredia",
    role: "tutor_docente",
    centroId: "centro-uuid",
  };

  const familiarUser: SupervisorProfile = {
    id: "familiar-uuid-001",
    email: "madre@familia.es",
    fullName: "Elena Romero",
    role: "familiar",
  };

  const alumnoPropioId = "alumno-propio-uuid";
  const alumnoAjenoId = "alumno-ajeno-uuid";
  const aulaDocenteId = "aula-triangulo-uuid";
  const aulaAjenaId = "aula-cuadrado-uuid";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("esTutorDocenteDeAlumno", () => {
    it("debe retornar true si existe un vínculo activo de tipo 'aula'", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn();
      let eqCallCount = 0;

      mockEq.mockImplementation(() => {
        eqCallCount++;
        if (eqCallCount < 4) {
          return { eq: mockEq };
        }
        return {
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: "vinculo-01" },
            error: null,
          }),
        };
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
      });

      const resultado = await esTutorDocenteDeAlumno(docenteUser.id, alumnoPropioId);
      expect(resultado).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("vinculos_alumno_supervisor");
    });

    it("debe retornar true si el docente y el alumno comparten aula_id", async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "vinculos_alumno_supervisor") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "tutores_docentes") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { aula_id: aulaDocenteId },
                error: null,
              }),
            }),
          };
        }
        if (table === "alumnos") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { aula_id: aulaDocenteId },
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const resultado = await esTutorDocenteDeAlumno(docenteUser.id, alumnoPropioId);
      expect(resultado).toBe(true);
    });

    it("debe retornar false si el docente no está vinculado ni comparte aula con el alumno", async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === "vinculos_alumno_supervisor") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "tutores_docentes") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { aula_id: aulaDocenteId },
                error: null,
              }),
            }),
          };
        }
        if (table === "alumnos") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { aula_id: aulaAjenaId },
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const resultado = await esTutorDocenteDeAlumno(docenteUser.id, alumnoAjenoId);
      expect(resultado).toBe(false);
    });

    it("debe retornar false si los parámetros son inválidos", async () => {
      expect(await esTutorDocenteDeAlumno("", "alumno-1")).toBe(false);
      expect(await esTutorDocenteDeAlumno("docente-1", "")).toBe(false);
    });
  });

  describe("esFamiliarDeAlumno", () => {
    it("debe retornar true si existe vínculo familiar activo", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: "vinculo-fam-01" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const resultado = await esFamiliarDeAlumno(familiarUser.id, alumnoPropioId);
      expect(resultado).toBe(true);
    });

    it("debe retornar false si no existe vínculo familiar activo", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });

      const resultado = await esFamiliarDeAlumno(familiarUser.id, alumnoAjenoId);
      expect(resultado).toBe(false);
    });
  });

  describe("validarAccesoAlumno (Minimización y Confidencialidad RGPD)", () => {
    it("debe permitir acceso total al Administrador sin consultar vínculos", async () => {
      const res = await validarAccesoAlumno(adminUser, alumnoAjenoId);
      expect(res.permitido).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("debe permitir acceso al Familiar de su propio hijo vinculado", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: "vinculo-01" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const res = await validarAccesoAlumno(familiarUser, alumnoPropioId);
      expect(res.permitido).toBe(true);
    });

    it("RGPD: debe DENEGAR el acceso al Familiar si intenta consultar los datos de un alumno ajeno", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });

      const res = await validarAccesoAlumno(familiarUser, alumnoAjenoId);
      expect(res.permitido).toBe(false);
      expect(res.codigoError).toBe(ERROR_ALUMNO_NO_VINCULADO);
      expect(res.motivo).toContain("RGPD");
    });

    it("debe rechazar acceso si los parámetros son inválidos", async () => {
      const res = await validarAccesoAlumno(null as unknown as SupervisorProfile, alumnoPropioId);
      expect(res.permitido).toBe(false);
      expect(res.codigoError).toBe(ERROR_USUARIO_INVALIDO);
    });
  });

  describe("Reglas de ámbito: puedeModificarAmbito, obtenerAmbitosEscritura, obtenerAmbitosLectura", () => {
    it("admin puede modificar tanto centro como hogar", () => {
      expect(puedeModificarAmbito("admin", "centro")).toBe(true);
      expect(puedeModificarAmbito("admin", "hogar")).toBe(true);
      expect(obtenerAmbitosEscritura("admin")).toEqual(["centro", "hogar"]);
      expect(obtenerAmbitosLectura("admin")).toEqual(["centro", "hogar"]);
    });

    it("tutor_docente solo puede modificar centro, no hogar", () => {
      expect(puedeModificarAmbito("tutor_docente", "centro")).toBe(true);
      expect(puedeModificarAmbito("tutor_docente", "hogar")).toBe(false);
      expect(obtenerAmbitosEscritura("tutor_docente")).toEqual(["centro"]);
      expect(obtenerAmbitosLectura("tutor_docente")).toEqual(["centro", "hogar"]);
    });

    it("familiar solo puede modificar hogar, no centro", () => {
      expect(puedeModificarAmbito("familiar", "hogar")).toBe(true);
      expect(puedeModificarAmbito("familiar", "centro")).toBe(false);
      expect(obtenerAmbitosEscritura("familiar")).toEqual(["hogar"]);
      expect(obtenerAmbitosLectura("familiar")).toEqual(["centro", "hogar"]);
    });
  });

  describe("validarAccesoTarea (Segregación Centro vs Hogar)", () => {
    const mockVinculoExitoso = () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: "vinculo-01" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
    };

    it("Admin tiene permiso total en cualquier ámbito y cualquier acción", async () => {
      const res1 = await validarAccesoTarea(adminUser, alumnoPropioId, "centro", "crear");
      expect(res1.permitido).toBe(true);

      const res2 = await validarAccesoTarea(adminUser, alumnoPropioId, "hogar", "eliminar");
      expect(res2.permitido).toBe(true);
    });

    it("Tutor docente: Puede crear, actualizar y eliminar tareas de ámbito 'centro'", async () => {
      mockVinculoExitoso();
      const resCrear = await validarAccesoTarea(docenteUser, alumnoPropioId, "centro", "crear");
      expect(resCrear.permitido).toBe(true);

      const resActualizar = await validarAccesoTarea(
        docenteUser,
        alumnoPropioId,
        "centro",
        "actualizar",
      );
      expect(resActualizar.permitido).toBe(true);

      const resEliminar = await validarAccesoTarea(
        docenteUser,
        alumnoPropioId,
        "centro",
        "eliminar",
      );
      expect(resEliminar.permitido).toBe(true);
    });

    it("Tutor docente: Puede leer tareas de 'hogar' pero NO modificarlas ni eliminarlas", async () => {
      mockVinculoExitoso();
      const resLectura = await validarAccesoTarea(docenteUser, alumnoPropioId, "hogar", "leer");
      expect(resLectura.permitido).toBe(true);

      const resCrear = await validarAccesoTarea(docenteUser, alumnoPropioId, "hogar", "crear");
      expect(resCrear.permitido).toBe(false);
      expect(resCrear.codigoError).toBe(ERROR_AMBITO_RESTRINGIDO);

      const resEliminar = await validarAccesoTarea(
        docenteUser,
        alumnoPropioId,
        "hogar",
        "eliminar",
      );
      expect(resEliminar.permitido).toBe(false);
      expect(resEliminar.codigoError).toBe(ERROR_AMBITO_RESTRINGIDO);
    });

    it("Familiar: Puede crear, actualizar y eliminar tareas de ámbito 'hogar'", async () => {
      mockVinculoExitoso();
      const resCrear = await validarAccesoTarea(familiarUser, alumnoPropioId, "hogar", "crear");
      expect(resCrear.permitido).toBe(true);

      const resActualizar = await validarAccesoTarea(
        familiarUser,
        alumnoPropioId,
        "hogar",
        "actualizar",
      );
      expect(resActualizar.permitido).toBe(true);
    });

    it("Familiar: Puede leer tareas de 'centro' pero NO crearlas, modificarlas ni eliminarlas", async () => {
      mockVinculoExitoso();
      const resLectura = await validarAccesoTarea(familiarUser, alumnoPropioId, "centro", "leer");
      expect(resLectura.permitido).toBe(true);

      const resCrear = await validarAccesoTarea(familiarUser, alumnoPropioId, "centro", "crear");
      expect(resCrear.permitido).toBe(false);
      expect(resCrear.codigoError).toBe(ERROR_AMBITO_RESTRINGIDO);

      const resEliminar = await validarAccesoTarea(
        familiarUser,
        alumnoPropioId,
        "centro",
        "eliminar",
      );
      expect(resEliminar.permitido).toBe(false);
      expect(resEliminar.codigoError).toBe(ERROR_AMBITO_RESTRINGIDO);
    });

    it("RGPD: Si el usuario no tiene acceso al alumno, se deniega inmediatamente cualquier tarea", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });

      const res = await validarAccesoTarea(familiarUser, alumnoAjenoId, "hogar", "leer");
      expect(res.permitido).toBe(false);
      expect(res.codigoError).toBe(ERROR_ALUMNO_NO_VINCULADO);
    });
  });

  describe("filtrarAlumnosPorPermiso y filtrarTareasPorAmbito", () => {
    const mockAlumnos: Alumno[] = [
      {
        id: alumnoPropioId,
        nombre: "Alejandro",
        aulaId: aulaDocenteId,
        centroId: "centro-uuid",
        codigoExpediente: "EXP-1111",
        requiereTutorPresencial: true,
        dietaComedor: "basal",
        activo: true,
      },
      {
        id: alumnoAjenoId,
        nombre: "Sergio",
        aulaId: aulaAjenaId,
        centroId: "centro-uuid",
        codigoExpediente: "EXP-2222",
        requiereTutorPresencial: false,
        dietaComedor: "turmix",
        activo: true,
      },
    ];

    it("admin recibe la lista completa de alumnos", async () => {
      const filtrados = await filtrarAlumnosPorPermiso(adminUser, mockAlumnos);
      expect(filtrados).toHaveLength(2);
    });

    it("familiar solo recibe a su hijo vinculado y se filtran los demás", async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        let currentAlumnoId = "";
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockImplementation((col: string, val: string) => {
            if (col === "alumno_id") {
              currentAlumnoId = val;
            }
            return chain;
          }),
          maybeSingle: jest.fn().mockImplementation(async () => {
            return {
              data: currentAlumnoId === alumnoPropioId ? { id: "v1" } : null,
              error: null,
            };
          }),
        };
        return chain;
      });

      const filtrados = await filtrarAlumnosPorPermiso(familiarUser, mockAlumnos);
      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].id).toBe(alumnoPropioId);
    });

    it("filtrarTareasPorAmbito devuelve tareas si el usuario tiene acceso al alumno", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { id: "v1" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const mockTareas: Tarea[] = [
        {
          id: "t1",
          alumnoId: alumnoPropioId,
          titulo: "Asamblea mañanera",
          ambito: "centro",
          estado: "pendiente",
          orden: 1,
          requierePresenciaTutor: false,
        },
        {
          id: "t2",
          alumnoId: alumnoPropioId,
          titulo: "Poner pijama",
          ambito: "hogar",
          estado: "pendiente",
          orden: 2,
          requierePresenciaTutor: true,
        },
      ];

      const filtradas = await filtrarTareasPorAmbito(familiarUser, mockTareas, alumnoPropioId);
      expect(filtradas).toHaveLength(2);
    });
  });
});
