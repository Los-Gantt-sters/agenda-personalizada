import { describe, expect, it } from "@jest/globals";

import {
  FORMAS_BOTON,
  FUENTES,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  normalizarPreferencias,
} from "./opciones";

describe("opciones del prototipo (FONTS, FS, BS y SHAPES)", () => {
  it("ofrece las tres fuentes de Lectura Fácil del prototipo (RF3.2)", () => {
    expect(Object.values(FUENTES).map((f) => f.etiqueta)).toEqual([
      "Atkinson Hyperlegible",
      "Lexend",
      "Andika",
    ]);
  });

  it("tamaños de letra: normal 1 · grande 1,15 · extra grande 1,3 (RF3.3)", () => {
    expect(TAMANOS_LETRA.normal.escala).toBe(1);
    expect(TAMANOS_LETRA.grande.escala).toBe(1.15);
    expect(TAMANOS_LETRA.extra.escala).toBe(1.3);
  });

  it("al menos tres tamaños de botón: mediano 1 · grande 1,15 · extra grande 1,32 (RF3.4)", () => {
    expect(Object.keys(TAMANOS_BOTON)).toHaveLength(3);
    expect(TAMANOS_BOTON.M.escala).toBe(1);
    expect(TAMANOS_BOTON.L.escala).toBe(1.15);
    expect(TAMANOS_BOTON.XL.escala).toBe(1.32);
  });

  it("formas de botón del prototipo: redondeados, cuadrados y circulares (RF3.5)", () => {
    expect(FORMAS_BOTON.round).toMatchObject({ radioTarjeta: 20, radioBoton: 16 });
    expect(FORMAS_BOTON.square).toMatchObject({ radioTarjeta: 4, radioBoton: 4 });
    expect(FORMAS_BOTON.pill).toMatchObject({ radioTarjeta: 32, radioBoton: 999 });
  });

  it("los valores por defecto son los de la variante A del prototipo", () => {
    expect(PREFERENCIAS_POR_DEFECTO).toEqual({
      tema: "claro",
      fuente: "atkinson",
      tamanoLetra: "normal",
      tamanoBoton: "L",
      forma: "round",
    });
  });
});

describe("normalizarPreferencias", () => {
  it("con datos que no son un objeto devuelve los valores por defecto", () => {
    expect(normalizarPreferencias(null)).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(normalizarPreferencias("hola")).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(normalizarPreferencias(undefined)).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it("conserva lo válido y sustituye lo que no existe o falta", () => {
    expect(
      normalizarPreferencias({
        tema: "pastel",
        fuente: "comic",
        tamanoBoton: "XL",
        forma: "toString",
      }),
    ).toEqual({
      tema: "pastel",
      fuente: "atkinson",
      tamanoLetra: "normal",
      tamanoBoton: "XL",
      forma: "round",
    });
  });
});
