/**
 * Pruebas unitarias para la Pantalla 12 — Reprografía paso a paso adaptada a 07 con 5 formatos y «Terminar tarea»
 * (HU-14 / SCRUM-108 / SCRUM-110 · T-14.2).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as servicioVoz from "../../../servicios/voz";
import { PantallaReprografia12 } from "../PantallaReprografia12";

jest.spyOn(servicioVoz, "leer").mockImplementation(() => {});

describe("PantallaReprografia12 - Pantalla 12 (SCRUM-110)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza la Pantalla 12 con la misma estructura que 07: Paso X de 5, reloj visual y 5 formatos multimedia", async () => {
    await render(<PantallaReprografia12 />);

    expect(screen.getByTestId("pantalla-12-reprografia")).toBeTruthy();
    expect(screen.getByText("Reprografía · Fotocopias")).toBeTruthy();
    expect(screen.getByText("Paso 3 de 5")).toBeTruthy();
    expect(screen.getByText("Fase 2: Taller")).toBeTruthy();
    expect(
      screen.getByText("3. Pulsa en la pantalla táctil: 20 copias, 2 caras y blanco y negro."),
    ).toBeTruthy();

    // Reloj visual regresivo superior
    expect(screen.getByTestId("reloj-reprografia-12")).toBeTruthy();
    expect(screen.getAllByText("Quedan 45 minutos").length).toBeGreaterThan(0);

    // 5 botones multimedia debajo del paso
    await fireEvent.press(screen.getByTestId("btn-formato-12-texto"));
    await fireEvent.press(screen.getByTestId("btn-formato-12-foto"));
    expect(screen.getByTestId("vista-formato-foto-12")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-12-video"));
    expect(screen.getByTestId("vista-formato-video-12")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-12-audio"));
    expect(screen.getByTestId("vista-formato-audio-12")).toBeTruthy();
    expect(servicioVoz.leer).toHaveBeenCalledWith(
      "3. Pulsa en la pantalla táctil: 20 copias, 2 caras y blanco y negro.",
    );

    await fireEvent.press(screen.getByTestId("btn-formato-12-pictograma"));
  });

  it("recorre los 5 pasos (Recogida -> Taller -> Reparto) y transforma Siguiente en «Terminar tarea» en el Paso 5", async () => {
    const alCambiarPaso = jest.fn();
    const alTerminarTarea = jest.fn();
    const alVolverAgenda = jest.fn();
    const alPedirAyuda = jest.fn();
    const alAbrirPreferencias = jest.fn();

    await render(
      <PantallaReprografia12
        pasoInicial={1}
        alCambiarPaso={alCambiarPaso}
        alTerminarTarea={alTerminarTarea}
        alVolverAgenda={alVolverAgenda}
        alPedirAyuda={alPedirAyuda}
        alAbrirPreferencias={alAbrirPreferencias}
      />,
    );

    expect(screen.getByText("Paso 1 de 5")).toBeTruthy();
    expect(screen.getByText("Fase 1: Recogida")).toBeTruthy();

    // Estando en el Paso 1, Atrás vuelve a la agenda
    await fireEvent.press(screen.getByTestId("btn-12-atras"));
    expect(alVolverAgenda).toHaveBeenCalledTimes(1);

    // Avanzar por los pasos 1 -> 2 -> 3 -> 4 -> 5
    await fireEvent.press(screen.getByTestId("btn-12-siguiente"));
    expect(screen.getByText("Paso 2 de 5")).toBeTruthy();
    expect(screen.getByText("Fase 2: Taller")).toBeTruthy();
    expect(alCambiarPaso).toHaveBeenLastCalledWith(2, "taller");

    // Retroceder del paso 2 al 1 y volver al 2
    await fireEvent.press(screen.getByTestId("btn-12-atras"));
    expect(screen.getByText("Paso 1 de 5")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-12-siguiente"));

    await fireEvent.press(screen.getByTestId("btn-12-siguiente"));
    expect(screen.getByText("Paso 3 de 5")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-12-siguiente"));
    expect(screen.getByText("Paso 4 de 5")).toBeTruthy();

    // En los pasos 1 a 4 no aparece «Terminar tarea»
    expect(screen.queryByTestId("btn-12-terminar-tarea")).toBeNull();

    // Al llegar al Paso 5 (Reparto), Siguiente desaparece y aparece «Terminar tarea»
    await fireEvent.press(screen.getByTestId("btn-12-siguiente"));
    expect(screen.getByText("Paso 5 de 5")).toBeTruthy();
    expect(screen.getByText("Fase 3: Reparto")).toBeTruthy();
    expect(screen.queryByTestId("btn-12-siguiente")).toBeNull();

    const btnTerminar = screen.getByTestId("btn-12-terminar-tarea");
    expect(btnTerminar).toBeTruthy();
    await fireEvent.press(btnTerminar);
    expect(alTerminarTarea).toHaveBeenCalledTimes(1);

    // Botones de barra inferior de alumno: Ayuda y Preferencias
    await fireEvent.press(screen.getByTestId("btn-12-ayuda"));
    expect(alPedirAyuda).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("btn-12-preferencias"));
    expect(alAbrirPreferencias).toHaveBeenCalledTimes(1);
  });
});
