import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { TemaProvider } from "../../../temas";
import { FlujoAgendaBarridoUnPulsador, MotorBarridoProvider } from "../index";

describe("SCRUM-122: T-05.3 Verificación de navegación completa con un único pulsador", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("completa una tarea estándar paso a paso (06 -> 07 -> 09 -> 06) usando únicamente 1 pulsador", async () => {
    const alCompletar = jest.fn();

    await render(
      <TemaProvider>
        <MotorBarridoProvider configuracionInicial={{ modo: "automatico", intervaloMs: 1600 }}>
          <FlujoAgendaBarridoUnPulsador tareaInicial="manos" alCompletarTarea={alCompletar} />
        </MotorBarridoProvider>
      </TemaProvider>,
    );

    // 1. Estamos en la agenda (06.html) y el foco grueso apunta a "Empezar tarea"
    expect(screen.getByTestId("pantalla-barrido-agenda-06")).toBeTruthy();
    expect(screen.getByTestId("insignia-foco-agenda-btn-empezar")).toBeTruthy();

    // Pulsamos el único pulsador para empezar la tarea -> entra en 07 (Paso 1 de 3)
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("pantalla-barrido-tarea-07")).toBeTruthy();
    expect(screen.getByTestId("badge-paso-actual")).toHaveTextContent("Paso 1 de 3");
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent("Abre el grifo");

    // 2. El foco está en "Siguiente paso" (orden 1): pulsamos el único pulsador -> Paso 2 de 3
    expect(screen.getByTestId("insignia-foco-btn-paso-siguiente")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("badge-paso-actual")).toHaveTextContent("Paso 2 de 3");
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent(
      "Frota con agua y jabón",
    );

    // 3. Pulsamos el único pulsador -> Paso 3 de 3
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("badge-paso-actual")).toHaveTextContent("Paso 3 de 3");
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent(
      "Aclara y seca las manos",
    );

    // 4. Pulsamos el único pulsador en el último paso -> Pantalla 09 (Tarea terminada)
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("pantalla-barrido-completada-09")).toBeTruthy();

    // 5. En la pantalla 09 dejamos que el barrido automático avance a la segunda emoción ("Tranquilo") y pulsamos
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.getByTestId("insignia-foco-emocion-tranquilo")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));

    // Verifica que se completó la tarea y volvió a la agenda 06 con la tarea en HECHO
    expect(alCompletar).toHaveBeenCalledWith("manos", "tranquilo");
    expect(screen.getByTestId("pantalla-barrido-agenda-06")).toBeTruthy();
    expect(screen.getByTestId("tarea-hecha-manos")).toBeTruthy();
  });

  it("permite cambiar a la tarea vocacional de Comedor (11.html) y completarla por aulas con 1 único pulsador (RNF3.4, RF8.1)", async () => {
    const alCompletar = jest.fn();

    await render(
      <TemaProvider>
        <MotorBarridoProvider configuracionInicial={{ modo: "automatico", intervaloMs: 1600 }}>
          <FlujoAgendaBarridoUnPulsador tareaInicial="manos" alCompletarTarea={alCompletar} />
        </MotorBarridoProvider>
      </TemaProvider>,
    );

    // Avanzamos 1 tick del barrido automático en 06 para enfocar "Seleccionar tarea Recuento comedor (11)"
    await act(async () => {
      jest.advanceTimersByTime(1600);
    });
    expect(screen.getByTestId("insignia-foco-agenda-btn-cambiar-comedor")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("titulo-ahora-06")).toHaveTextContent("Comedor · Recuento por aulas");

    // Dejamos que el barrido dé la vuelta hasta "Empezar tarea" (2 ticks: preferencias -> empezar)
    await act(async () => {
      jest.advanceTimersByTime(3200);
    });
    expect(screen.getByTestId("insignia-foco-agenda-btn-empezar")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));

    // Estamos en Pantalla 11 (Comedor · Recuento por aulas)
    expect(screen.getByTestId("pantalla-barrido-comedor-11")).toBeTruthy();
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent(
      "Clase Triángulo · Entrega 4 comensales",
    );

    // Completamos las 3 aulas con 1 único pulsador
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent(
      "Clase Círculo · Entrega 5 comensales",
    );

    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("instruccion-paso-actual")).toHaveTextContent(
      "Clase Cuadrado · Enviar parte a cocina",
    );

    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(screen.getByTestId("pantalla-barrido-completada-09")).toBeTruthy();

    // Elegimos "Contento" con el pulsador
    await fireEvent.press(screen.getByTestId("btn-barrido-pulsador"));
    expect(alCompletar).toHaveBeenCalledWith("comedor", "contento");
    expect(screen.getByTestId("tarea-hecha-comedor")).toBeTruthy();
  });
});
