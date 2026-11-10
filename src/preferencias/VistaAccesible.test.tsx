import { describe, expect, it } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import React, { useState } from "react";
import { Text } from "react-native";

import { TemaProvider } from "../temas";
import { BotonVistaAccesible } from "./BotonVistaAccesible";
import { ModalVistaAccesible } from "./ModalVistaAccesible";
import { PreferenciasProvider, usePreferencias } from "./PreferenciasProvider";

function ComponentePruebaVista() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const { preferencias } = usePreferencias();

  return (
    <>
      <BotonVistaAccesible onPress={() => setModalAbierto(true)} />
      <ModalVistaAccesible visible={modalAbierto} alCerrar={() => setModalAbierto(false)} />
      <Text testID="valor-canal">{preferencias.canal}</Text>
      <Text testID="valor-letra">{preferencias.tamanoLetra}</Text>
    </>
  );
}

const montar = () =>
  render(
    <TemaProvider>
      <PreferenciasProvider>
        <ComponentePruebaVista />
      </PreferenciasProvider>
    </TemaProvider>,
  );

describe("BotonVistaAccesible y ModalVistaAccesible (a11yb y a11yPanel)", () => {
  it("renderiza el botón flotante en la esquina inferior derecha con icono ♿ y etiqueta Vista", async () => {
    await montar();
    const boton = screen.getByTestId("btn-vista-accesible-flotante");
    expect(boton).toBeTruthy();
    expect(screen.getByText("Vista")).toBeTruthy();
    expect(screen.getByText("♿")).toBeTruthy();
    expect(boton.props.accessibilityLabel).toBe("Accesibilidad y vista de pantalla");
  });

  it("al pulsar el botón abre el modal y permite conmutar a solo pictograma o solo texto", async () => {
    const user = userEvent.setup();
    await montar();

    // Abre el modal
    await user.press(screen.getByTestId("btn-vista-accesible-flotante"));
    expect(screen.getByText("¿Cómo quieres ver la pantalla?")).toBeTruthy();

    // Cambiar a solo pictograma
    await user.press(screen.getByTestId("opcion-canal-soloPictograma"));
    expect(screen.getByTestId("valor-canal").props.children).toBe("soloPictograma");

    // Cambiar a solo texto
    await user.press(screen.getByTestId("opcion-canal-soloTexto"));
    expect(screen.getByTestId("valor-canal").props.children).toBe("soloTexto");

    // Cerrar modal
    await user.press(screen.getByTestId("btn-cerrar-modal-vista"));
    expect(screen.queryByText("¿Cómo quieres ver la pantalla?")).toBeNull();
  });

  it("permite cambiar rápidamente el tamaño de letra desde el modal", async () => {
    const user = userEvent.setup();
    await montar();

    await user.press(screen.getByTestId("btn-vista-accesible-flotante"));
    await user.press(screen.getByTestId("opcion-letra-grande"));
    expect(screen.getByTestId("valor-letra").props.children).toBe("grande");

    await user.press(screen.getByTestId("opcion-letra-extra"));
    expect(screen.getByTestId("valor-letra").props.children).toBe("extra");
  });
});
