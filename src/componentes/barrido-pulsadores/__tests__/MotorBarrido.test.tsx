import React from "react";
import { StyleSheet, Text } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { TemaProvider } from "../../../temas";
import {
  BarraEstadoBarrido,
  ElementoBarrido,
  GROSOR_FOCO_BARRIDO_PX,
  MotorBarridoProvider,
  PantallaConfiguracionBarrido,
} from "../index";

describe("SCRUM-120: T-05.1 Motor de barrido visual automático y manual con foco grueso", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("recorre automáticamente los elementos en orden cíclico con foco grueso (>= 6 px) y permite activar con 1 pulsador", async () => {
    const activarEmpezar = jest.fn();
    const activarPasos = jest.fn();
    const activarAyuda = jest.fn();

    await render(
      <TemaProvider>
        <MotorBarridoProvider configuracionInicial={{ modo: "automatico", intervaloMs: 1600 }}>
          <BarraEstadoBarrido />
          <ElementoBarrido
            id="btn-empezar"
            etiqueta="Empezar tarea"
            orden={1}
            alActivar={activarEmpezar}
          >
            <Text>Empezar tarea</Text>
          </ElementoBarrido>
          <ElementoBarrido
            id="btn-pasos"
            etiqueta="Mostrar pasos"
            orden={2}
            alActivar={activarPasos}
          >
            <Text>Mostrar pasos</Text>
          </ElementoBarrido>
          <ElementoBarrido id="btn-ayuda" etiqueta="Ayuda" orden={3} alActivar={activarAyuda}>
            <Text>Ayuda</Text>
          </ElementoBarrido>
        </MotorBarridoProvider>
      </TemaProvider>,
    );

    // Al inicio el foco grueso está en el primer elemento (orden 1)
    expect(screen.getByTestId("insignia-foco-btn-empezar")).toBeTruthy();
    const estiloInicial = StyleSheet.flatten(
      screen.getByTestId("elemento-barrido-btn-empezar").props.style,
    );
    expect(estiloInicial.borderWidth).toBe(GROSOR_FOCO_BARRIDO_PX);

    // Avanzar 1 intervalo (1600 ms) mueve el foco al segundo elemento
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.queryByTestId("insignia-foco-btn-empezar")).toBeNull();
    expect(screen.getByTestId("insignia-foco-btn-pasos")).toBeTruthy();

    // Accionar el único pulsador elige el elemento actualmente enfocado ("Mostrar pasos")
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(activarPasos).toHaveBeenCalledTimes(1);
    expect(activarEmpezar).not.toHaveBeenCalled();

    // Dos intervalos más hacen que el barrido vuelva cíclicamente al primer elemento
    await act(async () => {
      jest.advanceTimersByTime(3200);
    });
    expect(screen.getByTestId("insignia-foco-btn-empezar")).toBeTruthy();
  });

  it("permite configurar el modo manual y la velocidad con el stepper (+ y −) en PantallaConfiguracionBarrido", async () => {
    await render(
      <TemaProvider>
        <MotorBarridoProvider configuracionInicial={{ modo: "automatico", intervaloMs: 1600 }}>
          <PantallaConfiguracionBarrido />
        </MotorBarridoProvider>
      </TemaProvider>,
    );

    expect(screen.getByTestId("valor-velocidad-barrido")).toHaveTextContent("1,6 segundos");

    // Incrementar velocidad con + pasa a 2,4 segundos
    await fireEvent.press(screen.getByTestId("btn-velocidad-inc"));
    expect(screen.getByTestId("valor-velocidad-barrido")).toHaveTextContent("2,4 segundos");

    // Cambiar a modo Manual (2 pulsadores)
    await fireEvent.press(screen.getByTestId("opcion-modo-barrido-manual"));
    expect(screen.getByTestId("preview-foco-actual")).toHaveTextContent(
      "Foco grueso en: Ahora: Lavarse las manos",
    );

    // Avanzar foco manualmente en la vista previa
    await fireEvent.press(screen.getByTestId("btn-preview-avanzar-foco"));
    expect(screen.getByTestId("preview-foco-actual")).toHaveTextContent(
      "Foco grueso en: Empezar tarea",
    );
  });
});
