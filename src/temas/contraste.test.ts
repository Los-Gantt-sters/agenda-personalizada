import { describe, expect, it } from "@jest/globals";

import { hexARgb, ratioContraste } from "./contraste";

describe("ratioContraste", () => {
  it("negro sobre blanco es 21:1", () => {
    expect(ratioContraste("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("no depende del orden de los colores", () => {
    expect(ratioContraste("#2B6CB0", "#FFFFFF")).toBeCloseTo(
      ratioContraste("#FFFFFF", "#2B6CB0"),
      10,
    );
  });

  it("dos colores iguales dan 1:1", () => {
    expect(ratioContraste("#777777", "#777777")).toBeCloseTo(1, 10);
  });

  it("coincide con el valor de referencia de WCAG para #767676 sobre blanco (4,54)", () => {
    expect(ratioContraste("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });
});

describe("hexARgb", () => {
  it("convierte un color hexadecimal en sus canales", () => {
    expect(hexARgb("#1F5FA8")).toEqual([31, 95, 168]);
  });

  it("rechaza formatos que no sean #RRGGBB", () => {
    expect(() => hexARgb("azul")).toThrow();
    expect(() => hexARgb("#FFF")).toThrow();
  });
});
