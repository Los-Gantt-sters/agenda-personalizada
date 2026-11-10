import {
  AREA_LOGIN_VISUAL_MINIMA_PX,
  AREA_TACTIL_MINIMA_PX,
  COLORS,
  GROSOR_BORDE_FOCO_PX,
  INDICADORES_ESTADO,
  NOMBRES_CUATRO_TEMAS,
  NombreTemaAccesible,
  PALETAS_COLOR,
  PULSACION_SOSTENIDA_MS,
  SEPARACION_MINIMA_TACTIL_PX,
  TEMAS_ACCESIBLES,
  WCAG_AAA_TEXTO,
  WCAG_AA_ELEMENTO_TACTIL,
  WCAG_AA_TEXTO,
  calcularLuminanciaRelativa,
  calcularRatioContraste,
  cumpleContrasteElementoTactilAA,
  cumpleContrasteTextoAA,
  cumpleContrasteTextoAAA,
  hexARgb,
  validarContrasteTema,
} from "../colors";

describe("SCRUM-164: Design System - Tokens de color y contrastes WCAG 2.1 AA/AAA", () => {
  it("convierte correctamente colores hexadecimales a RGB y rechaza formatos inválidos", () => {
    expect(hexARgb("#000000")).toEqual([0, 0, 0]);
    expect(hexARgb("#FFFFFF")).toEqual([255, 255, 255]);
    expect(hexARgb("#1F5FA8")).toEqual([31, 95, 168]);
    expect(() => hexARgb("azul")).toThrow("Formato hexadecimal no válido");
  });

  it("calcula la luminancia relativa y el ratio de contraste según la fórmula oficial WCAG 2.1", () => {
    expect(calcularLuminanciaRelativa("#000000")).toBe(0);
    expect(calcularLuminanciaRelativa("#FFFFFF")).toBe(1);
    expect(calcularRatioContraste("#FFFFFF", "#000000")).toBe(21);
    expect(calcularRatioContraste("#000000", "#FFFFFF")).toBe(21);
    expect(calcularRatioContraste("#14213D", "#14213D")).toBe(1);
  });

  it("define las constantes mínimas de área táctil, foco y pulsación sostenida (RNF1.1, RNF6.1, RNF14.3)", () => {
    expect(AREA_TACTIL_MINIMA_PX).toBeGreaterThanOrEqual(48);
    expect(AREA_LOGIN_VISUAL_MINIMA_PX).toBeGreaterThanOrEqual(120);
    expect(SEPARACION_MINIMA_TACTIL_PX).toBeGreaterThanOrEqual(8);
    expect(GROSOR_BORDE_FOCO_PX).toBeGreaterThanOrEqual(3);
    expect(PULSACION_SOSTENIDA_MS).toBe(1500);
  });

  it("incluye los 4 temas troncales del informe de accesibilidad y sus variantes de alto contraste", () => {
    expect(NOMBRES_CUATRO_TEMAS).toEqual(["claro", "oscuro", "pastel", "altoContraste"]);
    expect(COLORS).toBe(PALETAS_COLOR);
    expect(Object.keys(TEMAS_ACCESIBLES)).toEqual([
      "claro",
      "oscuro",
      "pastel",
      "altoContraste",
      "altoContrasteClaro",
      "altoContrasteOscuro",
    ]);
  });

  it.each<NombreTemaAccesible>([
    "claro",
    "oscuro",
    "pastel",
    "altoContraste",
    "altoContrasteClaro",
    "altoContrasteOscuro",
  ])(
    "valida que el tema «%s» cumple contraste WCAG 2.1 AA en textos (>= 4.5:1) y elementos táctiles (>= 3:1)",
    (tema) => {
      const resultado = validarContrasteTema(tema);

      expect(resultado.cumpleTextoAA).toBe(true);
      expect(resultado.ratioMinimoTexto).toBeGreaterThanOrEqual(WCAG_AA_TEXTO);

      expect(resultado.cumpleElementosTactilesAA).toBe(true);
      expect(resultado.ratioMinimoElementoTactil).toBeGreaterThanOrEqual(WCAG_AA_ELEMENTO_TACTIL);

      if (TEMAS_ACCESIBLES[tema].esAltoContraste) {
        expect(resultado.cumpleTextoAAA).toBe(true);
        expect(resultado.ratioMinimoTexto).toBeGreaterThanOrEqual(WCAG_AAA_TEXTO);
      }
    },
  );

  it("expone funciones auxiliares de validación rápida AA y AAA", () => {
    expect(cumpleContrasteTextoAA("#14213D", "#F4F7FB")).toBe(true);
    expect(cumpleContrasteTextoAAA("#FFFFFF", "#000000")).toBe(true);
    expect(cumpleContrasteElementoTactilAA("#64728A", "#FFFFFF")).toBe(true);
    expect(cumpleContrasteTextoAA("#CCCCCC", "#FFFFFF")).toBe(false);
  });

  it("garantiza independencia del color mediante iconos y etiquetas en Lectura Fácil (RNF14.4)", () => {
    for (const indicador of Object.values(INDICADORES_ESTADO)) {
      expect(indicador.icono.length).toBeGreaterThan(0);
      expect(indicador.etiquetaLecturaFacil.length).toBeGreaterThan(0);
    }
  });
});
