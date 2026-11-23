/**
 * Pruebas unitarias para la Pantalla 42b (Familia hogar: misma interfaz editable que 41 para tareas de casa)
 * (SCRUM-234 / SCRUM-258 · T-TF.4).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as servicioVoz from "../../../servicios/voz";
import { VistaTareaFamiliaCasa42b } from "../VistaTareaFamiliaCasa42b";

jest.spyOn(servicioVoz, "leer").mockImplementation(() => {});

describe("VistaTareaFamiliaCasa42b - Pantalla 42b (SCRUM-258)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra la interfaz editable para tareas de casa SIN reloj, SIN Plan B y con SOLO 3 acciones", async () => {
    const alEditar = jest.fn();
    const alReprogramar = jest.fn();
    const alMarcarPendiente = jest.fn();

    await render(
      <VistaTareaFamiliaCasa42b
        alEditarTareaCasa={alEditar}
        alReprogramarHoraCasa={alReprogramar}
        alMarcarPendienteCasa={alMarcarPendiente}
      />,
    );

    expect(screen.getByTestId("pantalla-42b-familia-casa")).toBeTruthy();
    expect(
      screen.getByText("Preparar la mochila · Vista Familia (Tarea de casa · Editable)"),
    ).toBeTruthy();
    expect(screen.getByText("Familia · Ramón")).toBeTruthy();
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();
    expect(screen.getByTestId("aviso-auto-pendiente-42b")).toBeTruthy();

    // SIN reloj superior y SIN Plan B (igual que 41)
    expect(screen.queryByText(/Quedan \d+ minutos/i)).toBeNull();
    expect(screen.queryByText(/Plan B/i)).toBeNull();
    expect(screen.queryByText("Ayuda")).toBeNull();
    expect(screen.queryByText("Accesibilidad")).toBeNull();

    // Verifica las 3 acciones sobre la tarea doméstica
    await fireEvent.press(screen.getByTestId("btn-42b-editar-tarea"));
    expect(alEditar).toHaveBeenCalledWith("t-preparar-mochila", "luc");

    await fireEvent.press(screen.getByTestId("btn-42b-reprogramar-hora"));
    expect(alReprogramar).toHaveBeenCalledWith("t-preparar-mochila", "luc");

    await fireEvent.press(screen.getByTestId("btn-42b-marcar-pendiente"));
    expect(alMarcarPendiente).toHaveBeenCalledWith("t-preparar-mochila", "luc");
  });

  it("permite alternar entre los 5 formatos multimedia y navegar por los pasos de la tarea de casa", async () => {
    const alVolverAgenda = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <VistaTareaFamiliaCasa42b
        pasoInicial={0}
        alVolverAgenda={alVolverAgenda}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    expect(screen.getByText("1. Abre la mochila encima de la mesa de tu habitación.")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42b-texto"));
    await fireEvent.press(screen.getByTestId("btn-formato-42b-foto"));
    expect(screen.getByTestId("vista-formato-foto-42b")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42b-video"));
    expect(screen.getByTestId("vista-formato-video-42b")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42b-audio"));
    expect(screen.getByTestId("vista-formato-audio-42b")).toBeTruthy();
    expect(servicioVoz.leer).toHaveBeenCalledWith(
      "1. Abre la mochila encima de la mesa de tu habitación.",
    );

    await fireEvent.press(screen.getByTestId("btn-formato-42b-pictograma"));

    // Volver a la agenda (40) desde el paso 1
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alVolverAgenda).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByText("Paso 1 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("boton-salir-42b"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
