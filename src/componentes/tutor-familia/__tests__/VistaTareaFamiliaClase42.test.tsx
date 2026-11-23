/**
 * Pruebas unitarias para la Pantalla 42 (Familia clase: espejo de la vista de alumno en modo lectura)
 * (SCRUM-234 / SCRUM-257 · T-TF.3).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as servicioVoz from "../../../servicios/voz";
import { VistaTareaFamiliaClase42 } from "../VistaTareaFamiliaClase42";

jest.spyOn(servicioVoz, "leer").mockImplementation(() => {});

describe("VistaTareaFamiliaClase42 - Pantalla 42 (SCRUM-257)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el espejo de la vista del alumno con reloj visual y en modo solo lectura (sin acciones de edición)", async () => {
    await render(<VistaTareaFamiliaClase42 />);

    expect(screen.getByTestId("pantalla-42-familia-clase")).toBeTruthy();
    expect(screen.getByText("Lavarse las manos · Vista Familia (Solo lectura)")).toBeTruthy();
    expect(screen.getByText("Familia · Ramón")).toBeTruthy();
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();
    expect(screen.getByText("En clase · Solo lectura (gestiona tutor)")).toBeTruthy();

    // SÍ muestra el reloj regresivo espejo del alumno
    expect(screen.getByTestId("reloj-espejo-42")).toBeTruthy();
    expect(screen.getAllByText("Quedan 45 minutos").length).toBeGreaterThan(0);
    expect(screen.getByText("Empezaste a las 9:30")).toBeTruthy();

    // NO muestra acciones de edición en horario escolar
    expect(screen.queryByText("Editar tarea")).toBeNull();
    expect(screen.queryByText("Reprogramar hora")).toBeNull();
    expect(screen.queryByText("Marcar como pendiente")).toBeNull();
    expect(screen.queryByText(/Plan B/i)).toBeNull();
  });

  it("permite consultar los 5 formatos multimedia y recorrer los pasos en modo lectura", async () => {
    const alVolverAgenda = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <VistaTareaFamiliaClase42
        pasoInicial={0}
        alVolverAgenda={alVolverAgenda}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    expect(screen.getByText("Paso 1 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42-texto"));
    await fireEvent.press(screen.getByTestId("btn-formato-42-foto"));
    expect(screen.getByTestId("vista-formato-foto-42")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42-video"));
    expect(screen.getByTestId("vista-formato-video-42")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-formato-42-audio"));
    expect(screen.getByTestId("vista-formato-audio-42")).toBeTruthy();
    expect(servicioVoz.leer).toHaveBeenCalledWith("1. Abre el grifo con cuidado.");

    await fireEvent.press(screen.getByTestId("btn-formato-42-pictograma"));

    // Volver a la agenda (40) desde el primer paso
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alVolverAgenda).toHaveBeenCalledTimes(1);

    // Avanzar y retroceder pasos
    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByText("Paso 2 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByText("Paso 1 de 4")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("boton-salir-42"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
