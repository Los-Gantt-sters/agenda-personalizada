import { describe, expect, it } from "@jest/globals";

import {
  CAJAS_LETRA,
  TAREAS_VISIBLES,
  FORMAS_BOTON,
  FUENTES,
  MODOS_CANAL,
  ORDEN_MODOS_CANAL,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  normalizarPreferencias,
} from "./opciones";

describe("opciones del prototipo (FONTS, FS, BS, SHAPES y CANAL)", () => {
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

  it("canales de presentación: ambos, soloPictograma y soloTexto (RF3.1, RI3.1, RNF4.4)", () => {
    expect(ORDEN_MODOS_CANAL).toEqual(["ambos", "soloPictograma", "soloTexto"]);
    expect(MODOS_CANAL.ambos.etiqueta).toBe("Dibujo y texto");
    expect(MODOS_CANAL.soloPictograma.etiqueta).toBe("Solo pictograma");
    expect(MODOS_CANAL.soloTexto.etiqueta).toBe("Solo texto");
  });

  it("los valores por defecto son los de la variante A del prototipo", () => {
    expect(PREFERENCIAS_POR_DEFECTO).toEqual({
      tema: "claro",
      fuente: "lexend",
      tamanoLetra: "normal",
      tamanoBoton: "L",
      forma: "round",
      canal: "ambos",
      caja: "normal",
      tareasVisibles: "tres",
      reloj: "si",
      necesidades: ["bano", "agua", "descanso"],
    });
  });
});

describe("mayúsculas y tareas que se ven (mejoras de la profesora)", () => {
  it("ofrece minúsculas o MAYÚSCULAS y 1, hasta 3 o todas las tareas", () => {
    expect(CAJAS_LETRA.normal.etiqueta).toBe("Minúsculas");
    expect(CAJAS_LETRA.mayusculas.etiqueta).toBe("MAYÚSCULAS");
    expect(TAREAS_VISIBLES.una.maximo).toBe(1);
    expect(TAREAS_VISIBLES.tres.maximo).toBe(3);
    expect(TAREAS_VISIBLES.todas.maximo).toBeGreaterThan(20);
  });

  it("normalizarPreferencias conserva caja y tareas válidas y sanea las demás", () => {
    expect(normalizarPreferencias({ caja: "mayusculas", tareasVisibles: "todas" })).toMatchObject({
      caja: "mayusculas",
      tareasVisibles: "todas",
    });
    expect(normalizarPreferencias({ caja: "cursiva", tareasVisibles: 7 })).toMatchObject({
      caja: "normal",
      tareasVisibles: "tres",
      reloj: "si",
      necesidades: ["bano", "agua", "descanso"],
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
        canal: "soloPictograma",
      }),
    ).toEqual({
      tema: "pastel",
      fuente: "lexend",
      tamanoLetra: "normal",
      tamanoBoton: "XL",
      forma: "round",
      canal: "soloPictograma",
      caja: "normal",
      tareasVisibles: "tres",
      reloj: "si",
      necesidades: ["bano", "agua", "descanso"],
    });
  });
});

describe("reloj y necesidades de Ayuda (segunda ronda de la profesora)", () => {
  it("el reloj se ve por defecto y solo admite sí o no", () => {
    expect(PREFERENCIAS_POR_DEFECTO.reloj).toBe("si");
    expect(normalizarPreferencias({ reloj: "no" }).reloj).toBe("no");
    expect(normalizarPreferencias({ reloj: "a veces" }).reloj).toBe("si");
  });

  it("las necesidades se quedan con las válidas, sin repetir y en orden; vacías, todas", () => {
    expect(
      normalizarPreferencias({ necesidades: ["descanso", "bano", "bano"] }).necesidades,
    ).toEqual(["bano", "descanso"]);
    expect(normalizarPreferencias({ necesidades: ["urgencia", "pizza"] }).necesidades).toEqual([
      "bano",
      "agua",
      "descanso",
    ]);
    expect(normalizarPreferencias({ necesidades: [] }).necesidades).toEqual([
      "bano",
      "agua",
      "descanso",
    ]);
    expect(normalizarPreferencias({ necesidades: "agua" }).necesidades).toHaveLength(3);
  });
});
