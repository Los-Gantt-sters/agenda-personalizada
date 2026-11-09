import { describe, expect, it } from "@jest/globals";

import {
  COMBINACIONES_DE_USO,
  Combinacion,
  auditarContraste,
  auditarTema,
  evaluarCombinacion,
  informeMarkdown,
  minimoExigido,
} from "./auditoriaContraste";
import { NOMBRES_TEMAS, TEMAS } from "./paletas";

// RNF3.2 y RNF14.1/14.2: cada combinación que usan las pantallas llega a su mínimo en cada tema
describe.each(NOMBRES_TEMAS.map((n) => [n, TEMAS[n]] as const))(
  "auditoría de contraste del tema %s",
  (_nombre, tema) => {
    it.each(auditarTema(tema).map((r) => [r.combinacion.id, r] as const))(
      "%s llega al mínimo",
      (_id, resultado) => {
        expect(resultado.ratio).toBeGreaterThanOrEqual(resultado.minimo);
      },
    );
  },
);

describe("reglas de la auditoría", () => {
  it("exige 4,5:1 al texto, 7:1 en alto contraste y 3:1 a los componentes", () => {
    expect(minimoExigido("texto", TEMAS.claro)).toBe(4.5);
    expect(minimoExigido("texto", TEMAS.altoContrasteOscuro)).toBe(7);
    expect(minimoExigido("componente", TEMAS.claro)).toBe(3);
    expect(minimoExigido("componente", TEMAS.altoContrasteClaro)).toBe(3);
    expect(minimoExigido("texto", null)).toBe(4.5);
  });

  it("con varios pares se queda con el de mejor contraste", () => {
    const combinacion: Combinacion = {
      id: "prueba",
      elemento: "Caja de prueba",
      usoEn: "test",
      tipo: "componente",
      pares: [
        ["#FFFFFF", "#FFFFFF"],
        ["#000000", "#FFFFFF"],
      ],
    };
    const resultado = evaluarCombinacion(combinacion, null);
    expect(resultado.frente).toBe("#000000");
    expect(resultado.ratio).toBeCloseTo(21, 5);
    expect(resultado.cumple).toBe(true);
  });

  it("detecta una combinación que no llega al mínimo", () => {
    const resultado = evaluarCombinacion(
      {
        id: "gris-claro",
        elemento: "Texto gris claro",
        usoEn: "test",
        tipo: "texto",
        pares: [["#C6D1E2", "#FFFFFF"]],
      },
      null,
    );
    expect(resultado.cumple).toBe(false);
  });

  it("pide un tema para resolver colores de la paleta", () => {
    expect(() => evaluarCombinacion(COMBINACIONES_DE_USO[0], null)).toThrow(/necesita un tema/);
  });

  it("los identificadores no se repiten", () => {
    const ids = COMBINACIONES_DE_USO.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("audita cada combinación de uso en los cinco temas", () => {
    expect(auditarContraste()).toHaveLength(COMBINACIONES_DE_USO.length * NOMBRES_TEMAS.length);
  });

  it("el informe tiene una fila por resultado y marca los que no cumplen", () => {
    const resultados = auditarTema(TEMAS.pastel);
    const informe = informeMarkdown(resultados);
    expect(informe.split("\n")).toHaveLength(resultados.length + 2);
    expect(informe).toContain("| Pastel |");

    const fallo = evaluarCombinacion(
      {
        id: "x",
        elemento: "Fallo",
        usoEn: "test",
        tipo: "texto",
        pares: [["#777777", "#777777"]],
      },
      null,
    );
    expect(informeMarkdown([fallo])).toContain("**No cumple**");
  });
});
