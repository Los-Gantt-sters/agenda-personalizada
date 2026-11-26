import { describe, expect, it } from "@jest/globals";

import { AYUDAS_POR_DEFECTO } from "./ayudas";

import {
  CAJAS_LETRA,
  FORMAS_BOTON,
  FUENTES,
  MODOS_CANAL,
  ORDEN_MODOS_CANAL,
  ORDEN_TAREAS_VISIBLES,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_BOTON,
  TAMANOS_LETRA,
  TAREAS_VISIBLES,
  VISTAS_AGENDA,
  moverTareasVisibles,
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
      formatoTarea: "pictograma",
      locucion: "automatica",
      caja: "normal",
      tareasVisibles: "tres",
      vistaAgenda: "diaria",
      reloj: "si",
      avisoPrevio: "si",
      necesidades: ["bano", "agua", "descanso"],
      ayudas: [...AYUDAS_POR_DEFECTO],
      modoBarrido: "desactivado",
      intervaloBarridoMs: 1600,
    });
  });
});

describe("mayúsculas y tareas que se ven (mejoras de la profesora y SCRUM-251)", () => {
  it("ofrece minúsculas o MAYÚSCULAS y de 1 a 5 tareas y después «Todas»", () => {
    expect(CAJAS_LETRA.normal.etiqueta).toBe("Minúsculas");
    expect(CAJAS_LETRA.mayusculas.etiqueta).toBe("MAYÚSCULAS");
    expect(TAREAS_VISIBLES.una.maximo).toBe(1);
    expect(TAREAS_VISIBLES.tres.maximo).toBe(3);
    expect(TAREAS_VISIBLES.todas.maximo).toBeGreaterThan(20);
    expect(ORDEN_TAREAS_VISIBLES.map((t) => TAREAS_VISIBLES[t].maximo).slice(0, 5)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(moverTareasVisibles("tres", 1)).toBe("cuatro");
    expect(moverTareasVisibles("cinco", 1)).toBe("todas");
    expect(moverTareasVisibles("todas", 1)).toBe("todas");
    expect(moverTareasVisibles("una", -1)).toBe("una");
  });

  it("normalizarPreferencias conserva caja, tareas y vistaAgenda válidas y sanea las demás", () => {
    expect(
      normalizarPreferencias({
        caja: "mayusculas",
        tareasVisibles: "todas",
        vistaAgenda: "semanal",
      }),
    ).toMatchObject({
      caja: "mayusculas",
      tareasVisibles: "todas",
      vistaAgenda: "semanal",
    });
    expect(
      normalizarPreferencias({ caja: "cursiva", tareasVisibles: 7, vistaAgenda: "mensual" }),
    ).toMatchObject({
      caja: "normal",
      tareasVisibles: "tres",
      vistaAgenda: "diaria",
      reloj: "si",
      necesidades: ["bano", "agua", "descanso"],
    });
    expect(VISTAS_AGENDA.diaria.etiqueta).toBe("Ir directo a Hoy");
    expect(VISTAS_AGENDA.semanal.etiqueta).toBe("Semana completa");
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
        locucion: "manual",
        avisoPrevio: "no",
        modoBarrido: "automatico",
        intervaloBarridoMs: 2400,
      }),
    ).toEqual({
      tema: "pastel",
      fuente: "lexend",
      tamanoLetra: "normal",
      tamanoBoton: "XL",
      forma: "round",
      canal: "soloPictograma",
      formatoTarea: "soloPictograma",
      locucion: "manual",
      caja: "normal",
      tareasVisibles: "tres",
      vistaAgenda: "diaria",
      reloj: "si",
      avisoPrevio: "no",
      necesidades: ["bano", "agua", "descanso"],
      ayudas: [...AYUDAS_POR_DEFECTO],
      modoBarrido: "automatico",
      intervaloBarridoMs: 2400,
    });
  });
});

describe("reloj, aviso previo 5m y necesidades de Ayuda (pantallas 25 y 26)", () => {
  it("el reloj y el aviso previo se ven por defecto y solo admiten sí o no", () => {
    expect(PREFERENCIAS_POR_DEFECTO.reloj).toBe("si");
    expect(PREFERENCIAS_POR_DEFECTO.avisoPrevio).toBe("si");
    expect(normalizarPreferencias({ reloj: "no", avisoPrevio: "no" })).toMatchObject({
      reloj: "no",
      avisoPrevio: "no",
    });
    expect(normalizarPreferencias({ reloj: "a veces", avisoPrevio: "quizas" })).toMatchObject({
      reloj: "si",
      avisoPrevio: "si",
    });
  });

  it("las necesidades y ayudas se quedan con las válidas, sin repetir y máximo 3; vacías, todas", () => {
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
    // Los códigos antiguos del catálogo de la 26 se convierten en ayudas completas (MOD HU-18).
    expect(
      normalizarPreferencias({ ayudas: ["casa", "libro", "futbol", "ayuda"] }).ayudas.map(
        (a) => a.id,
      ),
    ).toEqual(["arasaac:6964", "propio:libro", "arasaac:7137"]);
  });
});
