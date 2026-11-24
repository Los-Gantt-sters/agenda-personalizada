/**
 * Pruebas unitarias del servicio `tareasPersonalesService` y filtrado por rol
 * (SCRUM-89 / SCRUM-92 · T-07.3).
 */

import {
  CATALOGO_BIBLIOTECA_31,
  filtrarTareasBiblioteca31,
} from "../../componentes/tareas-personales/datosTareasPersonales";
import {
  aplicarGuardadoTarea28,
  convertirHoraAMinutos,
  esHoraPermitidaParaRol28c,
  resolverDestinoConfirmacion28ok,
  validarProgramacionHorario28c,
} from "../tareasPersonalesService";

describe("SCRUM-92 · tareasPersonalesService (Aislamiento por rol y edición individual)", () => {
  it("aísla estrictamente el catálogo de Biblioteca (31) entre Tutor y Familia", () => {
    const tareasTutor = filtrarTareasBiblioteca31(CATALOGO_BIBLIOTECA_31, "tutor", "all");
    const tareasFamilia = filtrarTareasBiblioteca31(CATALOGO_BIBLIOTECA_31, "familia", "all");

    expect(tareasTutor.every((t) => t.owner === "tutor")).toBe(true);
    expect(tareasFamilia.every((t) => t.owner === "familia")).toBe(true);

    const soloMiasTutor = filtrarTareasBiblioteca31(CATALOGO_BIBLIOTECA_31, "tutor", "mine");
    expect(soloMiasTutor.every((t) => t.mine && t.owner === "tutor")).toBe(true);
  });

  it("valida las franjas horarias por rol (Tutor 08:00-15:00 vs Familia 15:00-08:00)", () => {
    expect(convertirHoraAMinutos("08:00")).toBe(480);
    expect(convertirHoraAMinutos("15:00")).toBe(900);
    expect(Number.isNaN(convertirHoraAMinutos("hora-invalida"))).toBe(true);

    // Tutor: solo 08:00 a 14:59
    expect(esHoraPermitidaParaRol28c("tutor", "08:00")).toBe(true);
    expect(esHoraPermitidaParaRol28c("tutor", "12:30")).toBe(true);
    expect(esHoraPermitidaParaRol28c("tutor", "15:00")).toBe(false);
    expect(esHoraPermitidaParaRol28c("tutor", "07:30")).toBe(false);

    // Familia: 15:00 a 07:59
    expect(esHoraPermitidaParaRol28c("familia", "15:00")).toBe(true);
    expect(esHoraPermitidaParaRol28c("familia", "19:00")).toBe(true);
    expect(esHoraPermitidaParaRol28c("familia", "07:30")).toBe(true);
    expect(esHoraPermitidaParaRol28c("familia", "09:30")).toBe(false);

    expect(
      validarProgramacionHorario28c({
        rol: "tutor",
        alumnosIds: [],
        diasSemana: ["Lunes"],
        horaInicio: "09:30",
        duracionMinutos: 30,
      }).valido,
    ).toBe(false);

    expect(
      validarProgramacionHorario28c({
        rol: "familia",
        alumnosIds: ["ale"],
        diasSemana: [],
        horaInicio: "17:30",
        duracionMinutos: 30,
      }).valido,
    ).toBe(false);
  });

  it("aplica edición individual para un alumno concreto SIN alterar el catálogo general de la Biblioteca", () => {
    const resultadoIndividual = aplicarGuardadoTarea28(
      CATALOGO_BIBLIOTECA_31,
      "tutor",
      {
        titulo: "Lavarse las manos con apoyo visual",
        descripcion: "Versión adaptada solo para Alejandro Pérez.",
        pictogramaId: 2443,
        pictogramaUrl: "https://static.arasaac.org/pictograms/2443/2443_500.png",
        pasosCount: 3,
      },
      "t1",
      "Alejandro Pérez",
    );

    // El catálogo general NO se modifica
    expect(resultadoIndividual.catalogoActualizado).toBe(CATALOGO_BIBLIOTECA_31);
    expect(resultadoIndividual.catalogoActualizado.find((t) => t.id === "t1")?.titulo).toBe(
      "Lavarse las manos",
    );

    // Se genera el override exclusivo para Alejandro Pérez
    expect(resultadoIndividual.overrideAlumno).toEqual(
      expect.objectContaining({
        alumno: "Alejandro Pérez",
        tarea: expect.objectContaining({
          titulo: "Lavarse las manos con apoyo visual",
          pasosCount: 3,
        }),
      }),
    );

    // Si alumnoEditado es null, sí actualiza la tarea en la Biblioteca del rol
    const resultadoBiblioteca = aplicarGuardadoTarea28(
      CATALOGO_BIBLIOTECA_31,
      "tutor",
      {
        titulo: "Lavarse las manos antes de comer",
        descripcion: "Actualizada en mi biblioteca.",
        pictogramaId: 2443,
        pictogramaUrl: "https://static.arasaac.org/pictograms/2443/2443_500.png",
        pasosCount: 4,
      },
      "t1",
      null,
    );

    expect(resultadoBiblioteca.overrideAlumno).toBeNull();
    expect(resultadoBiblioteca.catalogoActualizado.find((t) => t.id === "t1")?.titulo).toBe(
      "Lavarse las manos antes de comer",
    );

    expect(resolverDestinoConfirmacion28ok("tutor", null)).toBe("31");
    expect(resolverDestinoConfirmacion28ok("tutor", "Alejandro Pérez")).toBe("39");
    expect(resolverDestinoConfirmacion28ok("familia", "Alejandro Pérez")).toBe("40");
  });
});
