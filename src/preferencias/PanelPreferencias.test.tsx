import { describe, expect, it } from "@jest/globals";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import React from "react";

import { TemaProvider } from "../temas";
import { PanelPreferencias } from "./PanelPreferencias";
import { PreferenciasProvider } from "./PreferenciasProvider";

const montar = () =>
  render(
    <TemaProvider>
      <PreferenciasProvider>
        <PanelPreferencias />
      </PreferenciasProvider>
    </TemaProvider>,
  );

const grupo = (nombre: string) => within(screen.getByLabelText(nombre));
const elegida = (nombreGrupo: string) =>
  grupo(nombreGrupo)
    .getAllByRole("radio")
    .filter((o) => o.props.accessibilityState?.checked)
    .map((o) => o.props.accessibilityLabel);

describe("PanelPreferencias (T-04.3)", () => {
  it("muestra en una sola pantalla los seis grupos de apariencia (RNF3.3)", async () => {
    await montar();
    for (const g of [
      "Qué se ve (Dibujos y palabras)",
      "Fondo y colores",
      "Tipo de letra",
      "Tamaño de letra",
      "Tamaño de los botones",
      "Forma de los botones",
    ]) {
      expect(screen.getByLabelText(g)).toBeTruthy();
    }
    expect(screen.getByRole("header", { name: "Cómo quieres ver la agenda" })).toBeTruthy();
  });

  it("ofrece 3 canales, 5 paletas, 3 fuentes, 3 tamaños de letra, 3 de botón y 3 formas", async () => {
    await montar();
    expect(grupo("Qué se ve (Dibujos y palabras)").getAllByRole("radio")).toHaveLength(3);
    expect(grupo("Fondo y colores").getAllByRole("radio")).toHaveLength(5);
    expect(grupo("Tipo de letra").getAllByRole("radio")).toHaveLength(3);
    expect(grupo("Tamaño de letra").getAllByRole("radio")).toHaveLength(3);
    expect(grupo("Tamaño de los botones").getAllByRole("radio")).toHaveLength(3);
    expect(grupo("Forma de los botones").getAllByRole("radio")).toHaveLength(3);
  });

  it("al abrir está elegido lo de la variante A del prototipo", async () => {
    await montar();
    expect(elegida("Qué se ve (Dibujos y palabras)")).toEqual(["🖼️🔤 Dibujo y texto"]);
    expect(elegida("Fondo y colores")).toEqual(["Claro"]);
    expect(elegida("Tipo de letra")).toEqual(["Atkinson Hyperlegible"]);
    expect(elegida("Tamaño de letra")).toEqual(["Normal"]);
    expect(elegida("Tamaño de los botones")).toEqual(["Grande"]);
    expect(elegida("Forma de los botones")).toEqual(["Redondeados"]);
  });

  it("elegir una opción la marca (solo una por grupo) y la muestra con ✓", async () => {
    const user = userEvent.setup();
    await montar();
    await user.press(
      grupo("Qué se ve (Dibujos y palabras)").getByRole("radio", {
        name: "🖼️ Solo pictograma",
      }),
    );
    await user.press(grupo("Fondo y colores").getByRole("radio", { name: "Pastel" }));
    await user.press(grupo("Tipo de letra").getByRole("radio", { name: "Lexend" }));
    await user.press(grupo("Tamaño de los botones").getByRole("radio", { name: "Extra grande" }));
    await user.press(grupo("Forma de los botones").getByRole("radio", { name: "Circulares" }));
    await user.press(grupo("Tamaño de letra").getByRole("radio", { name: "Grande" }));

    expect(elegida("Qué se ve (Dibujos y palabras)")).toEqual(["🖼️ Solo pictograma"]);
    expect(elegida("Fondo y colores")).toEqual(["Pastel"]);
    expect(elegida("Tipo de letra")).toEqual(["Lexend"]);
    expect(elegida("Tamaño de los botones")).toEqual(["Extra grande"]);
    expect(elegida("Forma de los botones")).toEqual(["Circulares"]);
    expect(elegida("Tamaño de letra")).toEqual(["Grande"]);
    // Una ✓ por cada grupo: la elección no depende solo del color (RNF14.4)
    expect(screen.getAllByText("✓", { includeHiddenElements: true })).toHaveLength(6);
  });

  it("al elegir solo pictograma oculta el texto y al elegir solo texto oculta el pictograma", async () => {
    const user = userEvent.setup();
    await montar();

    // Inicialmente ambos están visibles
    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();

    // Cambiar a solo pictograma
    await user.press(
      grupo("Qué se ve (Dibujos y palabras)").getByRole("radio", {
        name: "🖼️ Solo pictograma",
      }),
    );
    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.queryByTestId("preview-titulo-texto")).toBeNull();

    // Cambiar a solo texto
    await user.press(
      grupo("Qué se ve (Dibujos y palabras)").getByRole("radio", {
        name: "🔤 Solo texto",
      }),
    );
    expect(screen.queryByTestId("preview-pictograma")).toBeNull();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();
  });

  it("la vista previa cambia de tamaño y de forma al momento (RF3.15)", async () => {
    const user = userEvent.setup();
    await montar();
    const alto = (nombre: string) => {
      const boton = screen.getByRole("button", { name: nombre });
      const estilo = Object.assign({}, ...[boton.props.style].flat(3).filter(Boolean));
      return { minHeight: estilo.minHeight, borderRadius: estilo.borderRadius };
    };
    expect(alto("Empezar")).toEqual({ minHeight: 73.6, borderRadius: 16 });

    await user.press(grupo("Tamaño de los botones").getByRole("radio", { name: "Mediano" }));
    await user.press(grupo("Forma de los botones").getByRole("radio", { name: "Cuadrados" }));
    expect(alto("Empezar")).toEqual({ minHeight: 64, borderRadius: 4 });
  });

  it("«Volver a lo de siempre» restablece todo", async () => {
    const user = userEvent.setup();
    await montar();
    await user.press(
      grupo("Qué se ve (Dibujos y palabras)").getByRole("radio", {
        name: "🔤 Solo texto",
      }),
    );
    await user.press(grupo("Fondo y colores").getByRole("radio", { name: "Oscuro" }));
    await user.press(grupo("Forma de los botones").getByRole("radio", { name: "Circulares" }));
    await user.press(screen.getByRole("button", { name: "Volver a lo de siempre" }));
    expect(elegida("Qué se ve (Dibujos y palabras)")).toEqual(["🖼️🔤 Dibujo y texto"]);
    expect(elegida("Fondo y colores")).toEqual(["Claro"]);
    expect(elegida("Forma de los botones")).toEqual(["Redondeados"]);
  });
});
