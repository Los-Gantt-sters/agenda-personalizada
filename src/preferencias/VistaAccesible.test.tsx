import { describe, expect, it } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import React, { useState } from "react";
import { Text } from "react-native";

import { TemaProvider } from "../temas";
import { BotonVistaAccesible } from "./BotonVistaAccesible";
import { PantallaVistaAccesible } from "./PantallaVistaAccesible";
import { PreferenciasProvider, usePreferencias } from "./PreferenciasProvider";

function ComponentePruebaVista() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { preferencias } = usePreferencias();

  return (
    <>
      <BotonVistaAccesible onPress={() => setModalAbierto(true)} />
      <PantallaVistaAccesible visible={modalAbierto} alCerrar={() => setModalAbierto(false)} />
      <Text testID="valor-canal">{preferencias.canal}</Text>
      <Text testID="valor-letra">{preferencias.tamanoLetra}</Text>
    </>
  );
}

// Con la pantalla de Accesibilidad encima, lo de debajo queda oculto al lector de pantalla
// (accessibilityViewIsModal): para leer los valores de prueba hay que incluir lo oculto.
const valor = (id: string) => screen.getByTestId(id, { includeHiddenElements: true });

const montar = () =>
  render(
    <TemaProvider>
      <PreferenciasProvider>
        <ComponentePruebaVista />
      </PreferenciasProvider>
    </TemaProvider>,
  );

describe("BotonVistaAccesible y PantallaVistaAccesible (a11yb y a11yPanel)", () => {
  it("renderiza el botón flotante en la esquina inferior derecha con icono ♿ y etiqueta Vista", async () => {
    await montar();
    const boton = screen.getByTestId("btn-vista-accesible-flotante");
    expect(boton).toBeTruthy();
    expect(screen.getByText("Vista")).toBeTruthy();
    expect(screen.getByText("♿")).toBeTruthy();
    expect(boton.props.accessibilityLabel).toBe("Accesibilidad y vista de pantalla");
  });

  it("al pulsar el botón abre la pantalla y permite conmutar a solo pictograma o solo texto", async () => {
    const user = userEvent.setup();
    await montar();

    // Abre la pantalla (completa, con su cabecera; no es una ventana emergente)
    await user.press(screen.getByTestId("btn-vista-accesible-flotante"));
    expect(screen.getByTestId("titulo-accesibilidad")).toHaveTextContent(
      "¿Cómo quieres ver la pantalla?",
    );

    // Cambiar a solo pictograma
    await user.press(screen.getByTestId("opcion-canal-soloPictograma"));
    expect(valor("valor-canal").props.children).toBe("soloPictograma");

    // Cambiar a solo texto
    await user.press(screen.getByTestId("opcion-canal-soloTexto"));
    expect(valor("valor-canal").props.children).toBe("soloTexto");

    // «Listo» (Adelante en la barra) vuelve a la pantalla de antes
    await user.press(screen.getByTestId("btn-cerrar-modal-vista"));
    expect(screen.queryByText("¿Cómo quieres ver la pantalla?")).toBeNull();
  });

  it("permite cambiar rápidamente el tamaño de letra; «Atrás» también vuelve", async () => {
    const user = userEvent.setup();
    await montar();

    await user.press(screen.getByTestId("btn-vista-accesible-flotante"));
    await user.press(screen.getByTestId("opcion-letra-grande"));
    expect(valor("valor-letra").props.children).toBe("grande");

    await user.press(screen.getByTestId("opcion-letra-extra"));
    expect(valor("valor-letra").props.children).toBe("extra");

    await user.press(screen.getByTestId("btn-cerrar-vista"));
    expect(screen.queryByTestId("titulo-accesibilidad")).toBeNull();
  });
});
