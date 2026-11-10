import { describe, expect, it } from "@jest/globals";

import {
  CONTRASTE_AAA_TEXTO,
  CONTRASTE_AA_COMPONENTES,
  CONTRASTE_AA_TEXTO,
  ratioContraste,
} from "./contraste";
import { NOMBRES_TEMAS, TEMAS, esNombreTema } from "./paletas";

const todos = NOMBRES_TEMAS.map((n) => TEMAS[n]);
const altoContraste = todos.filter((t) => t.esAltoContraste);

describe("catálogo de temas", () => {
  it("incluye claro, oscuro, pastel y alto contraste claro y oscuro", () => {
    expect([...NOMBRES_TEMAS].sort()).toEqual(
      ["altoContrasteClaro", "altoContrasteOscuro", "claro", "oscuro", "pastel"].sort(),
    );
  });

  it("cada tema tiene el nombre de su clave y todos los colores en #RRGGBB", () => {
    for (const nombre of NOMBRES_TEMAS) {
      expect(TEMAS[nombre].nombre).toBe(nombre);
      for (const color of Object.values(TEMAS[nombre].paleta)) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it("esNombreTema reconoce solo nombres válidos", () => {
    expect(esNombreTema("pastel")).toBe(true);
    expect(esNombreTema("rosa")).toBe(false);
    expect(esNombreTema(undefined)).toBe(false);
    expect(esNombreTema("toString")).toBe(false);
  });
});

// RNF3.2: todas las paletas cumplen el contraste mínimo AA de WCAG 2.1
describe.each(todos.map((t) => [t.nombre, t] as const))(
  "contraste del tema %s",
  (_nombre, tema) => {
    const p = tema.paleta;
    const textosSobreFondos: [string, string, string][] = [
      ["texto", p.texto, p.fondo],
      ["texto", p.texto, p.superficie],
      ["texto", p.texto, p.superficieDestacada],
      ["textoSecundario", p.textoSecundario, p.fondo],
      ["textoSecundario", p.textoSecundario, p.superficie],
      ["textoSobrePrimario", p.textoSobrePrimario, p.primario],
      ["primario", p.primario, p.fondo],
      ["primario", p.primario, p.superficie],
      ["exito", p.exito, p.superficie],
      ["peligro", p.peligro, p.superficie],
      ["aviso", p.aviso, p.superficie],
    ];

    it.each(textosSobreFondos)("%s sobre su fondo llega a 4,5:1 (AA)", (_n, frente, fondo) => {
      expect(ratioContraste(frente, fondo)).toBeGreaterThanOrEqual(CONTRASTE_AA_TEXTO);
    });

    it("bordes y foco se distinguen del fondo (3:1)", () => {
      expect(ratioContraste(p.borde, p.superficie)).toBeGreaterThanOrEqual(
        CONTRASTE_AA_COMPONENTES,
      );
      expect(ratioContraste(p.borde, p.fondo)).toBeGreaterThanOrEqual(CONTRASTE_AA_COMPONENTES);
      expect(ratioContraste(p.foco, p.fondo)).toBeGreaterThanOrEqual(CONTRASTE_AA_COMPONENTES);
      expect(ratioContraste(p.foco, p.superficie)).toBeGreaterThanOrEqual(CONTRASTE_AA_COMPONENTES);
    });
  },
);

// Las variantes de alto contraste apuntan al nivel AAA (7:1) en todo el texto
describe.each(altoContraste.map((t) => [t.nombre, t] as const))(
  "alto contraste: tema %s",
  (_nombre, tema) => {
    const p = tema.paleta;
    it("el texto llega a 7:1 (AAA)", () => {
      expect(ratioContraste(p.texto, p.fondo)).toBeGreaterThanOrEqual(CONTRASTE_AAA_TEXTO);
      expect(ratioContraste(p.texto, p.superficie)).toBeGreaterThanOrEqual(CONTRASTE_AAA_TEXTO);
      expect(ratioContraste(p.textoSecundario, p.superficie)).toBeGreaterThanOrEqual(
        CONTRASTE_AAA_TEXTO,
      );
      expect(ratioContraste(p.textoSobrePrimario, p.primario)).toBeGreaterThanOrEqual(
        CONTRASTE_AAA_TEXTO,
      );
    });
  },
);
