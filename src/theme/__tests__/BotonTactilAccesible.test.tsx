import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { BotonTactilAccesible } from "../BotonTactilAccesible";
import { AREA_TACTIL_MINIMA_PX, GROSOR_BORDE_FOCO_PX, PALETAS_COLOR } from "../colors";

describe("SCRUM-164: Design System - BotonTactilAccesible (BDD HUT-03)", () => {
  it("anuncia su función en Lectura Fácil con rol y estado para lectores de pantalla (RF14.1)", async () => {
    const alPulsar = jest.fn();
    await render(
      <BotonTactilAccesible
        testID="boton-empezar"
        etiqueta="Empezar tarea"
        descripcionLecturaFacil="Empezar la tarea de ahora"
        pistaAccesible="Pulsa una vez para iniciar la actividad"
        icono="▶"
        seleccionado={true}
        onPress={alPulsar}
      />,
    );

    const boton = screen.getByTestId("boton-empezar");
    expect(boton.props.accessibilityRole).toBe("button");
    expect(boton.props.accessibilityLabel).toBe("Empezar la tarea de ahora");
    expect(boton.props.accessibilityHint).toBe("Pulsa una vez para iniciar la actividad");
    expect(boton.props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });

    expect(screen.getByText("▶")).toBeTruthy();
    expect(screen.getByText("Empezar tarea")).toBeTruthy();

    await fireEvent.press(boton);
    expect(alPulsar).toHaveBeenCalledTimes(1);
  });

  it("garantiza un área táctil mínima >= 48x48 px en todas las escalas (RNF14.3)", async () => {
    await render(
      <BotonTactilAccesible
        testID="boton-tactil"
        etiqueta="Vale"
        tamanoBoton="normal"
        onPress={() => undefined}
      />,
    );

    const boton = screen.getByTestId("boton-tactil");
    const estiloPlano = StyleSheet.flatten(boton.props.style);

    expect(estiloPlano.minHeight).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA_PX);
    expect(estiloPlano.minWidth).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA_PX);
  });

  it("destaca claramente el foco visual al navegar con teclado o pulsador (RF14.2 / BDD)", async () => {
    const { rerender } = await render(
      <BotonTactilAccesible
        testID="boton-foco"
        etiqueta="Siguiente paso"
        tema="altoContraste"
        onPress={() => undefined}
      />,
    );

    await fireEvent(screen.getByTestId("boton-foco"), "focus");
    const estiloConFocoEvento = StyleSheet.flatten(screen.getByTestId("boton-foco").props.style);
    expect(estiloConFocoEvento.borderWidth).toBe(GROSOR_BORDE_FOCO_PX);
    expect(estiloConFocoEvento.borderColor).toBe(PALETAS_COLOR.altoContraste.foco);

    await fireEvent(screen.getByTestId("boton-foco"), "blur");
    const estiloSinFoco = StyleSheet.flatten(screen.getByTestId("boton-foco").props.style);
    expect(estiloSinFoco.borderWidth).toBe(3);

    await rerender(
      <BotonTactilAccesible
        testID="boton-foco"
        etiqueta="Siguiente paso"
        tema="altoContraste"
        focoForzado={true}
        onPress={() => undefined}
      />,
    );
    const estiloFocoBarrido = StyleSheet.flatten(screen.getByTestId("boton-foco").props.style);
    expect(estiloFocoBarrido.borderWidth).toBe(GROSOR_BORDE_FOCO_PX);
  });

  it("bloquea la acción y anuncia estado deshabilitado cuando deshabilitado=true", async () => {
    const alPulsar = jest.fn();
    await render(
      <BotonTactilAccesible
        testID="boton-deshabilitado"
        etiqueta="Terminar"
        variante="exito"
        deshabilitado={true}
        onPress={alPulsar}
      />,
    );

    const boton = screen.getByTestId("boton-deshabilitado");
    expect(boton.props.accessibilityState).toEqual({
      disabled: true,
      selected: false,
    });

    await fireEvent.press(boton);
    expect(alPulsar).not.toHaveBeenCalled();
  });
});
