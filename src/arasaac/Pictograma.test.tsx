import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { TEMAS, TemaProvider } from "../temas";
import { COLOR_INSIGNIA_HECHO, Pictograma } from "./Pictograma";
import { pictogramaDelCatalogo } from "./catalogo";

const AGUA = pictogramaDelCatalogo("agua")!;

describe("Pictograma", () => {
  it("lleva la descripción como etiqueta accesible y la imagen de ARASAAC", async () => {
    await render(<Pictograma pictograma={AGUA} />);
    const imagen = screen.getByLabelText("Pictograma de agua");
    expect(imagen.props.source).toEqual({ uri: AGUA.urlImagen });
    expect(imagen.props.accessibilityRole).toBe("image");
  });

  it("nunca se pinta por debajo de 48 px en modo normal (RNF14.3) y usa fondo blanco (.pic)", async () => {
    const { toJSON } = await render(<Pictograma pictograma={AGUA} tamano={20} />);
    const arbol = toJSON() as unknown as { props: { style: unknown } };
    const estilos = [arbol.props.style].flat(2);
    expect(estilos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: "#FFFFFF" }),
        expect.objectContaining({ width: 48, height: 48 }),
      ]),
    );
  });

  const bordeDe = (arbol: unknown) =>
    [(arbol as { props: { style: unknown } }).props.style]
      .flat(2)
      .reduce<string | undefined>(
        (color, e) => (e as { borderColor?: string } | null)?.borderColor ?? color,
        undefined,
      );

  it("sin TemaProvider, el borde por defecto es el del tema claro", async () => {
    const { toJSON } = await render(<Pictograma pictograma={AGUA} />);
    expect(bordeDe(toJSON())).toBe(TEMAS.claro.paleta.borde);
  });

  it("dentro de TemaProvider, el borde por defecto es el del tema activo", async () => {
    const { toJSON } = await render(
      <TemaProvider temaInicial="pastel">
        <Pictograma pictograma={AGUA} />
      </TemaProvider>,
    );
    expect(bordeDe(toJSON())).toBe(TEMAS.pastel.paleta.borde);
  });

  it("respeta el colorBorde que se le pase", async () => {
    const { toJSON } = await render(<Pictograma pictograma={AGUA} colorBorde="#1F5FA8" />);
    expect(bordeDe(toJSON())).toBe("#1F5FA8");
  });

  it("la insignia de hecho usa el verde oscuro que llega a 7:1 con el ✓ blanco", () => {
    expect(COLOR_INSIGNIA_HECHO).toBe("#005A1E");
  });

  it("soporta la variante mini (.mpic de 34 px) y el estado completado (.pic.done ✓)", async () => {
    await render(<Pictograma pictograma={AGUA} variante="mini" tamano={20} completado />);
    expect(screen.getByLabelText("Pictograma de agua (hecho)")).toBeTruthy();
    expect(screen.getByText("✓", { includeHiddenElements: true })).toBeTruthy();
  });
});
