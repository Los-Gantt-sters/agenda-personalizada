import { describe, expect, it } from "@jest/globals";

import { AREA_TACTIL_MINIMA, estilosApariencia } from "./estilos";
import { PREFERENCIAS_POR_DEFECTO, PreferenciasApariencia } from "./opciones";

const con = (cambios: Partial<PreferenciasApariencia>) =>
  estilosApariencia({ ...PREFERENCIAS_POR_DEFECTO, ...cambios });

describe("estilosApariencia (fórmulas de .sbtn del prototipo)", () => {
  it("con los valores por defecto el botón mide 64 × 1,15 y el texto 16 × 1,2 × 1,15", () => {
    const { boton, tamanoTexto } = con({});
    expect(boton.altoMinimo).toBe(73.6);
    expect(boton.anchoMinimo).toBe(73.6);
    expect(boton.paddingHorizontal).toBe(27.6);
    expect(boton.tamanoTexto).toBe(22.08);
    expect(tamanoTexto).toBe(16);
  });

  it("el tamaño del botón escala altura, anchura, relleno y texto", () => {
    expect(con({ tamanoBoton: "M" }).boton).toMatchObject({
      altoMinimo: 64,
      paddingHorizontal: 24,
      tamanoTexto: 19.2,
    });
    expect(con({ tamanoBoton: "XL" }).boton).toMatchObject({
      altoMinimo: 84.48,
      paddingHorizontal: 31.68,
      tamanoTexto: 25.34,
    });
  });

  it("el tamaño de letra escala el texto base y el de los botones", () => {
    expect(con({ tamanoLetra: "extra" }).tamanoTexto).toBe(20.8);
    expect(con({ tamanoLetra: "extra", tamanoBoton: "M" }).boton.tamanoTexto).toBe(24.96);
    expect(con({ tamanoLetra: "grande" }).texto(20)).toBe(23);
  });

  it("la forma cambia el radio de tarjetas y botones", () => {
    expect(con({ forma: "square" })).toMatchObject({ radioTarjeta: 4, boton: { radio: 4 } });
    expect(con({ forma: "pill" })).toMatchObject({ radioTarjeta: 32, boton: { radio: 999 } });
  });

  it("la fuente elegida da el nombre de su familia normal y en negrita", () => {
    expect(con({ fuente: "lexend" })).toMatchObject({
      fuenteNormal: "Lexend_400Regular",
      fuenteNegrita: "Lexend_700Bold",
    });
  });

  it("ningún botón baja del área táctil mínima de 48 px (RNF14.3) con ninguna combinación", () => {
    for (const b of ["M", "L", "XL"] as const) {
      expect(con({ tamanoBoton: b }).boton.altoMinimo).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA);
      expect(con({ tamanoBoton: b }).boton.anchoMinimo).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA);
    }
  });
});
