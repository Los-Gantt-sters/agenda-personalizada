import {
  cambiarTipo,
  esPeriodoActual,
  esPeriodoFuturo,
  moverPeriodo,
  nombreMes,
  periodoDelMes,
  periodoQueContiene,
  semanasDelMes,
  textoDia,
  textoDiaCorto,
  textoDiaSinMes,
  textoPeriodo,
} from "../periodos";

// Jueves 26 de noviembre de 2026, a media tarde.
const HOY = new Date(2026, 10, 26, 17, 30);

describe("periodos de la pantalla 43 (HU-25)", () => {
  it("el día, la semana (de lunes a domingo) y el mes que contienen una fecha", () => {
    expect(periodoQueContiene("dia", HOY)).toEqual({
      tipo: "dia",
      desde: "2026-11-26",
      hasta: "2026-11-26",
    });
    expect(periodoQueContiene("semana", HOY)).toEqual({
      tipo: "semana",
      desde: "2026-11-23",
      hasta: "2026-11-29",
    });
    expect(periodoQueContiene("mes", HOY)).toEqual({
      tipo: "mes",
      desde: "2026-11-01",
      hasta: "2026-11-30",
    });
  });

  it("un domingo es el último día de su semana, no el primero", () => {
    expect(periodoQueContiene("semana", "2026-11-29")).toMatchObject({
      desde: "2026-11-23",
      hasta: "2026-11-29",
    });
  });

  it("los meses de distinta longitud y los años bisiestos", () => {
    expect(periodoQueContiene("mes", "2028-02-10").hasta).toBe("2028-02-29");
    expect(periodoQueContiene("mes", "2027-02-10").hasta).toBe("2027-02-28");
  });

  it("anterior y siguiente, también cruzando de mes y de año", () => {
    const semana = periodoQueContiene("semana", HOY);
    expect(moverPeriodo(semana, 1)).toMatchObject({ desde: "2026-11-30", hasta: "2026-12-06" });
    expect(moverPeriodo(semana, -1)).toMatchObject({ desde: "2026-11-16", hasta: "2026-11-22" });
    expect(moverPeriodo(periodoQueContiene("mes", "2026-01-31"), -1)).toMatchObject({
      desde: "2025-12-01",
      hasta: "2025-12-31",
    });
    expect(moverPeriodo(periodoQueContiene("dia", "2026-12-31"), 1).desde).toBe("2027-01-01");
  });

  it("no se pierde un día con el cambio de hora (último domingo de octubre)", () => {
    const semana = periodoQueContiene("semana", "2026-10-25");
    expect(semana).toMatchObject({ desde: "2026-10-19", hasta: "2026-10-25" });
    expect(moverPeriodo(semana, 1)).toMatchObject({ desde: "2026-10-26", hasta: "2026-11-01" });
  });

  it("al cambiar de tipo se queda con hoy si el periodo lo contiene y si no, con su primer día", () => {
    const mes = periodoQueContiene("mes", HOY);
    expect(cambiarTipo(mes, "dia", HOY).desde).toBe("2026-11-26");
    const octubre = moverPeriodo(mes, -1);
    expect(cambiarTipo(octubre, "semana", HOY)).toMatchObject({
      desde: "2026-09-28",
      hasta: "2026-10-04",
    });
  });

  it("sabe si el periodo es el actual o uno futuro", () => {
    const semana = periodoQueContiene("semana", HOY);
    expect(esPeriodoActual(semana, HOY)).toBe(true);
    expect(esPeriodoActual(moverPeriodo(semana, -1), HOY)).toBe(false);
    expect(esPeriodoFuturo(moverPeriodo(semana, 1), HOY)).toBe(true);
    expect(esPeriodoFuturo(semana, HOY)).toBe(false);
  });

  it("nombres de los periodos en Lectura Fácil", () => {
    const semana = periodoQueContiene("semana", HOY);
    const mes = periodoQueContiene("mes", HOY);
    expect(textoDia("2026-11-26")).toBe("Jueves 26 de noviembre");
    expect(textoDiaCorto("2026-11-23")).toBe("Lun 23");
    expect(textoDiaSinMes("2026-11-23")).toBe("lunes 23");
    // Con el año, porque desde el calendario se puede ir a años anteriores
    expect(textoPeriodo(periodoQueContiene("dia", HOY), HOY)).toBe(
      "Hoy, jueves 26 de noviembre de 2026",
    );
    expect(textoPeriodo(moverPeriodo(periodoQueContiene("dia", HOY), -1), HOY)).toBe(
      "Miércoles 25 de noviembre de 2026",
    );
    expect(textoPeriodo(semana, HOY)).toBe("Esta semana: del 23 al 29 de noviembre de 2026");
    expect(textoPeriodo(moverPeriodo(semana, -1), HOY)).toBe(
      "Semana anterior: del 16 al 22 de noviembre de 2026",
    );
    expect(textoPeriodo(moverPeriodo(semana, 1), HOY)).toBe(
      "Del 30 de noviembre al 6 de diciembre de 2026",
    );
    expect(textoPeriodo(periodoQueContiene("semana", "2025-12-31"), HOY)).toBe(
      "Del 29 de diciembre de 2025 al 4 de enero de 2026",
    );
    expect(textoPeriodo(mes, HOY)).toBe("Este mes: noviembre de 2026");
    expect(textoPeriodo(moverPeriodo(mes, -1), HOY)).toBe("Octubre de 2026");
  });

  it("calendario: nombre del mes, el periodo de un mes y sus semanas de lunes a domingo", () => {
    expect(nombreMes(8)).toBe("Septiembre");
    expect(periodoDelMes(2025, 8)).toEqual({
      tipo: "mes",
      desde: "2025-09-01",
      hasta: "2025-09-30",
    });
    // Noviembre de 2026 empieza en domingo: 6 filas, de la del 26 de octubre a la del 30
    const noviembre = semanasDelMes(2026, 10);
    expect(noviembre).toHaveLength(6);
    expect(noviembre[0]).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
    expect(noviembre[5][0]).toBe("2026-11-30");
    // Febrero de 2027 empieza en lunes y tiene 28 días: 4 filas justas
    const febrero = semanasDelMes(2027, 1);
    expect(febrero).toHaveLength(4);
    expect(febrero[0][0]).toBe("2027-02-01");
    expect(febrero[3][6]).toBe("2027-02-28");
  });
});
