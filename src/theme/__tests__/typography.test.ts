import { AREA_TACTIL_MINIMA_PX } from "../colors";
import {
  ESCALAS_BOTON,
  ESCALAS_TEXTO,
  FAMILIAS_TIPOGRAFICAS,
  RADIOS_FORMA,
  REGLAS_LECTURA_FACIL,
  calcularTokensTipografia,
} from "../typography";

describe("SCRUM-164: Design System - Tipografías y escalas en Lectura Fácil", () => {
  it("define las familias tipográficas sin serifa recomendadas para accesibilidad cognitiva y baja visión", () => {
    expect(FAMILIAS_TIPOGRAFICAS.atkinson.etiqueta).toContain("Atkinson Hyperlegible");
    expect(FAMILIAS_TIPOGRAFICAS.lexend.etiqueta).toContain("Lexend");
    expect(FAMILIAS_TIPOGRAFICAS.andika.etiqueta).toContain("Andika");
    expect(FAMILIAS_TIPOGRAFICAS.sistema.familiaRegular).toBe("System");
  });

  it("aplica interlineado amplio (>= 1.4) y límite de caracteres por línea para Lectura Fácil", () => {
    expect(REGLAS_LECTURA_FACIL.interlineadoMinimo).toBeGreaterThanOrEqual(1.4);
    expect(REGLAS_LECTURA_FACIL.maxCaracteresPorLinea).toBeLessThanOrEqual(65);
  });

  it("escala progresivamente los tamaños de texto y de botones manteniendo áreas >= 48x48 px", () => {
    const normal = calcularTokensTipografia({
      familia: "atkinson",
      tamanoTexto: "normal",
      tamanoBoton: "normal",
      forma: "redondeado",
    });
    const grande = calcularTokensTipografia({
      familia: "lexend",
      tamanoTexto: "grande",
      tamanoBoton: "grande",
      forma: "pastilla",
    });
    const gigante = calcularTokensTipografia({
      familia: "andika",
      tamanoTexto: "gigante",
      tamanoBoton: "gigante",
      forma: "cuadrado",
    });

    expect(normal.cuerpoPx).toBe(16);
    expect(grande.cuerpoPx).toBeGreaterThan(normal.cuerpoPx);
    expect(gigante.cuerpoPx).toBeGreaterThan(grande.cuerpoPx);

    expect(normal.altoMinimoBotonPx).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA_PX);
    expect(normal.anchoMinimoBotonPx).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA_PX);
    expect(grande.altoMinimoBotonPx).toBeGreaterThan(normal.altoMinimoBotonPx);
    expect(gigante.altoMinimoBotonPx).toBeGreaterThan(grande.altoMinimoBotonPx);

    expect(grande.radioBotonPx).toBe(RADIOS_FORMA.pastilla.boton);
    expect(gigante.radioBotonPx).toBe(RADIOS_FORMA.cuadrado.boton);
    expect(ESCALAS_TEXTO.gigante).toBeGreaterThan(ESCALAS_TEXTO.normal);
    expect(ESCALAS_BOTON.gigante).toBeGreaterThan(ESCALAS_BOTON.normal);
  });
});
