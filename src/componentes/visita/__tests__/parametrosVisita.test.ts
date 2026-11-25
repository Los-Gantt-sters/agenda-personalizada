// HU-15 · SCRUM-114: los parámetros de la ruta /visita llegan de la URL y se comprueban.
import { leerDuracion, leerInicio } from "../parametrosVisita";

describe("leerDuracion", () => {
  it("acepta minutos enteros entre 1 y 480", () => {
    expect(leerDuracion("30")).toBe(30);
    expect(leerDuracion("480")).toBe(480);
  });

  it.each([undefined, "", "0", "481", "1e9", "0.5", "-5", "treinta", ["5"]])(
    "rechaza %p",
    (valor) => {
      expect(leerDuracion(valor)).toBeUndefined();
    },
  );
});

describe("leerInicio", () => {
  const ahora = Date.parse("2026-11-25T11:00:00Z");

  it("acepta una hora ISO de hace un rato, dentro de la visita", () => {
    expect(leerInicio("2026-11-25T10:45:00Z", 30, ahora)).toBe("2026-11-25T10:45:00.000Z");
  });

  it.each([
    ["1", "no es ISO"],
    ["2026-11-25T11:30:00Z", "en el futuro"],
    ["2026-11-25T09:00:00Z", "antes de que empezara la visita"],
    ["2026-13-45T99:99:00Z", "fecha imposible"],
  ])("rechaza %s (%s)", (valor) => {
    expect(leerInicio(valor, 30, ahora)).toBeUndefined();
  });

  it("rechaza lo que no es texto (p. ej. un parámetro repetido)", () => {
    expect(leerInicio(["2026-11-25T10:45:00Z"], 30, ahora)).toBeUndefined();
  });
});
