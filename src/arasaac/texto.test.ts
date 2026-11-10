import { describe, expect, it } from "@jest/globals";

import { limpiarTermino, normalizarTexto } from "./texto";

describe("normalizarTexto", () => {
  it("ignora mayúsculas, tildes y espacios sobrantes", () => {
    expect(normalizarTexto("  AutoBÚS  ")).toBe("autobus");
    expect(normalizarTexto("cuarto   de  baño")).toBe("cuarto de baño");
  });

  it("conserva la ñ: baño y bano son palabras distintas", () => {
    expect(normalizarTexto("Baño")).toBe("baño");
    expect(normalizarTexto("baño")).not.toBe(normalizarTexto("bano"));
  });
});

describe("limpiarTermino", () => {
  it("recorta y colapsa espacios sin cambiar letras", () => {
    expect(limpiarTermino("  Lavarse   las manos ")).toBe("Lavarse las manos");
  });
});
