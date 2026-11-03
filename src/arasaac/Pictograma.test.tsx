import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";

import { Pictograma } from "./Pictograma";
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

  it("soporta la variante mini (.mpic de 34 px) y el estado completado (.pic.done ✓)", async () => {
    await render(<Pictograma pictograma={AGUA} variante="mini" tamano={20} completado />);
    expect(screen.getByLabelText("Pictograma de agua (hecho)")).toBeTruthy();
    expect(screen.getByText("✓", { includeHiddenElements: true })).toBeTruthy();
  });
});
