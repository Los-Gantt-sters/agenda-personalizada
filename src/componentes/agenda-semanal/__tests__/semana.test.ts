import {
  diaDeLaSemana,
  diasDeLaSemana,
  lunesDe,
  moverMes,
  rejillaMes,
  sumarDias,
  textoMes,
  textoSemana,
  textoTareas,
} from "../semana";
import { agendaDemoSemana } from "../datosDemoSemana";

describe("cálculos de la semana (SCRUM-124: T-17.1)", () => {
  it("la semana va de lunes a domingo, también desde el domingo", () => {
    // 15/11/2026 es domingo y 12/11/2026, jueves.
    expect(diaDeLaSemana("2026-11-16")).toBe(0);
    expect(diaDeLaSemana("2026-11-22")).toBe(6);
    expect(lunesDe("2026-11-12")).toBe("2026-11-09");
    expect(lunesDe("2026-11-15")).toBe("2026-11-09");
    expect(lunesDe("2026-11-16")).toBe("2026-11-16");
    expect(diasDeLaSemana("2026-11-09")).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
  });

  it("suma días cambiando de mes y de año", () => {
    expect(sumarDias("2026-11-30", 1)).toBe("2026-12-01");
    expect(sumarDias("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("escribe la semana como en el boceto", () => {
    expect(textoSemana("2026-11-09")).toBe("Del 9 al 15 de noviembre");
    expect(textoSemana("2026-11-30")).toBe("Del 30 de noviembre al 6 de diciembre");
    expect(textoSemana("2026-12-28")).toBe("Del 28 de diciembre al 3 de enero de 2027");
  });

  it("monta el mes del calendario empezando en lunes", () => {
    const filas = rejillaMes(2026, 10); // noviembre de 2026: el 1 es domingo
    expect(filas[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(filas.every((f) => f.length === 7)).toBe(true);
    expect(filas.flat().filter(Boolean)).toHaveLength(30);
    expect(textoMes(2026, 10)).toBe("Noviembre 2026");
    expect(moverMes(2026, 11, 1)).toEqual({ anio: 2027, mes: 0 });
    expect(moverMes(2026, 0, -1)).toEqual({ anio: 2025, mes: 11 });
  });

  it("cuenta las tareas en Lectura Fácil", () => {
    expect(textoTareas(0)).toBe("Sin tareas");
    expect(textoTareas(1)).toBe("1 tarea");
    expect(textoTareas(5)).toBe("5 tareas");
  });

  it("la semana de ejemplo tiene tareas los 7 días y hoy es la agenda de siempre", () => {
    const hoy = "2026-11-12";
    const semana = agendaDemoSemana(hoy);
    const porDia = diasDeLaSemana(lunesDe(hoy)).map(
      (f) => semana.filter((e) => e.fecha === f).length,
    );
    expect(porDia.every((n) => n > 0)).toBe(true);
    expect(porDia.slice(5)).toEqual([3, 2]); // sábado y domingo, menos tareas
    expect(semana.filter((e) => e.fecha === hoy).map((e) => e.id)).toContain("e2");
    // Los días que ya han pasado salen hechos.
    expect(semana.filter((e) => e.fecha === "2026-11-09").every((e) => e.estado === "hecha")).toBe(
      true,
    );
    // Sin ids repetidos.
    expect(new Set(semana.map((e) => e.id)).size).toBe(semana.length);
  });
});
