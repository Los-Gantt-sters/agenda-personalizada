/**
 * Pruebas unitarias para la Pantalla 41 (Tarea vista Tutor: sin reloj, sin Plan B y con SOLO 3 acciones)
 * (SCRUM-234 / SCRUM-256 · T-TF.2).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as servicioVoz from "../../../servicios/voz";
import { VistaTareaTutor41 } from "../VistaTareaTutor41";

jest.spyOn(servicioVoz, "leer").mockImplementation(() => {});

describe("VistaTareaTutor41 - Pantalla 41 (SCRUM-256)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra la vista del tutor SIN reloj, SIN Plan B y con SOLO las 3 acciones permitidas", async () => {
    const alEditar = jest.fn();
    const alReprogramar = jest.fn();
    const alMarcarPendiente = jest.fn();

    await render(
      <VistaTareaTutor41
        alEditarTareaSoloAlumno={alEditar}
        alReprogramarHora={alReprogramar}
        alMarcarPendiente={alMarcarPendiente}
      />,
    );

    expect(screen.getByTestId("pantalla-41-tarea-tutor")).toBeTruthy();
    expect(screen.getByText("Lavarse las manos · Vista Tutor (Lucas)")).toBeTruthy();
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();
    expect(screen.getByTestId("aviso-auto-pendiente-41")).toBeTruthy();

    // SIN reloj superior y SIN botón Plan B
    expect(screen.queryByText(/Quedan \d+ minutos/i)).toBeNull();
    expect(screen.queryByText(/Plan B/i)).toBeNull();
    expect(screen.queryByText("Ayuda")).toBeNull();
    expect(screen.queryByText("Accesibilidad")).toBeNull();

    // Verifica las 3 únicas acciones del tutor
    await fireEvent.press(screen.getByTestId("btn-41-editar-tarea"));
    expect(alEditar).toHaveBeenCalledWith("t-lavarse-manos", "luc");

    await fireEvent.press(screen.getByTestId("btn-41-reprogramar-hora"));
    expect(alReprogramar).toHaveBeenCalledWith("t-lavarse-manos", "luc");

    await fireEvent.press(screen.getByTestId("btn-41-marcar-pendiente"));
    expect(alMarcarPendiente).toHaveBeenCalledWith("t-lavarse-manos", "luc");
  });

  it("permite alternar entre los 5 formatos multimedia y navegar por los pasos con Atrás y Adelante", async () => {
    const alVolverAgenda = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <VistaTareaTutor41
        pasoInicial={0}
        alVolverAgenda={alVolverAgenda}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    expect(screen.getByText("Paso 1 de 4")).toBeTruthy();
    expect(screen.getByText("1. Abre el grifo con cuidado.")).toBeTruthy();

    // Probar los 5 formatos multimedia debajo del paso
    await fireEvent.press(screen.getByTestId("btn-formato-texto"));
    await fireEvent.press(screen.getByTestId("btn-formato-foto"));
    expect(screen.getByTestId("vista-formato-foto-41")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-video"));
    expect(screen.getByTestId("vista-formato-video-41")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-audio"));
    expect(screen.getByTestId("vista-formato-audio-41")).toBeTruthy();
    expect(servicioVoz.leer).toHaveBeenCalledWith("1. Abre el grifo con cuidado.");

    await fireEvent.press(screen.getByTestId("btn-formato-pictograma"));

    // En el paso 1, Atrás vuelve a la agenda (39)
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alVolverAgenda).toHaveBeenCalledTimes(1);

    // Avanzar al paso 2 y retroceder al paso 1
    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByText("Paso 1 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("boton-salir-41"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
