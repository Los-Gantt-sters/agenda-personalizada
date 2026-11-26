import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { TemaProvider } from "../../../temas";
import { CapturadorPulsadorExterno, ElementoBarrido, MotorBarridoProvider } from "../index";

describe("SCRUM-121: T-05.2 Componente CapturadorPulsadorExterno", () => {
  it("integra CapturadorPulsadorExterno con MotorBarridoProvider en modo manual de 2 pulsadores", async () => {
    const activarUno = jest.fn();
    const activarDos = jest.fn();

    await render(
      <TemaProvider>
        <MotorBarridoProvider configuracionInicial={{ modo: "manual" }}>
          <CapturadorPulsadorExterno configuracionPulsador={{ antiReboteMs: 0 }} />
          <ElementoBarrido id="op-1" etiqueta="Opción 1" orden={1} alActivar={activarUno}>
            <Text>Opción 1</Text>
          </ElementoBarrido>
          <ElementoBarrido id="op-2" etiqueta="Opción 2" orden={2} alActivar={activarDos}>
            <Text>Opción 2</Text>
          </ElementoBarrido>
        </MotorBarridoProvider>
      </TemaProvider>,
    );

    // Pulsador 1 avanza el foco de Opción 1 a Opción 2
    await fireEvent.press(screen.getByTestId("btn-switch-externo-1-avanzar"));
    expect(screen.getByTestId("insignia-foco-op-2")).toBeTruthy();

    // Pulsador 2 selecciona la opción enfocada (Opción 2)
    await fireEvent.press(screen.getByTestId("btn-switch-externo-seleccionar"));
    expect(activarDos).toHaveBeenCalledTimes(1);
    expect(activarUno).not.toHaveBeenCalled();
  });
});
