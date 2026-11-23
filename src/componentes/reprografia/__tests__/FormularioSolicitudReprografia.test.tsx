/**
 * Pruebas unitarias para el formulario docente de solicitud de encargos al Taller de Reprografía
 * (HU-14 / SCRUM-108 / SCRUM-111 · T-14.3).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { limpiarEncargosMemoria } from "../../../servicios/reprografiaService";
import { FormularioSolicitudReprografia } from "../FormularioSolicitudReprografia";

describe("FormularioSolicitudReprografia - Solicitud docente (SCRUM-111)", () => {
  beforeEach(() => {
    limpiarEncargosMemoria();
  });

  it("muestra el formulario docente desglosado y actualiza en tiempo real la previsualización de los 5 pasos", async () => {
    const alCrearEncargo = jest.fn();
    await render(<FormularioSolicitudReprografia alCrearEncargo={alCrearEncargo} />);

    expect(screen.getByTestId("formulario-solicitud-reprografia")).toBeTruthy();
    expect(screen.getByText("Solicitar encargo · Taller de Reprografía")).toBeTruthy();
    expect(screen.getByTestId("previsualizacion-5-pasos")).toBeTruthy();

    // Cambiar parámetros: 35 copias, En color, 1 cara, Plastificado, Clase Círculo, Alejandro
    await fireEvent.changeText(
      screen.getByTestId("input-titulo-documento"),
      "Carteles jornada puertas abiertas",
    );
    await fireEvent.changeText(screen.getByTestId("input-copias"), "35");
    await fireEvent.press(screen.getByTestId("btn-color-color"));
    await fireEvent.press(screen.getByTestId("btn-caras-una"));
    await fireEvent.press(screen.getByTestId("btn-acabado-plastificado"));
    await fireEvent.press(screen.getByTestId("btn-aula-destino-cir"));
    await fireEvent.press(screen.getByTestId("btn-alumno-ptval-ale"));

    // La previsualización del Paso 3 refleja 35 copias, 1 cara y en color
    expect(
      screen.getByText("Pulsa en la pantalla táctil: 35 copias, 1 cara y en color."),
    ).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-enviar-encargo-reprografia"));

    expect(screen.getByTestId("confirmacion-encargo-creado")).toBeTruthy();
    expect(alCrearEncargo).toHaveBeenCalledWith(
      expect.objectContaining({
        tituloDocumento: "Carteles jornada puertas abiertas",
        copias: 35,
        modoColor: "color",
        modoCaras: "una_cara",
        acabado: "plastificado",
        aulaDestino: "Clase Círculo",
        estudianteId: "ale",
      }),
    );
  });

  it("muestra mensaje de validación si el título está vacío o el número de copias es inválido y permite salir", async () => {
    const alCrearEncargo = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <FormularioSolicitudReprografia
        alCrearEncargo={alCrearEncargo}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    await fireEvent.changeText(screen.getByTestId("input-titulo-documento"), "   ");
    await fireEvent.press(screen.getByTestId("btn-enviar-encargo-reprografia"));

    expect(screen.getByTestId("error-formulario-reprografia")).toBeTruthy();
    expect(alCrearEncargo).not.toHaveBeenCalled();

    // Restaurar opciones de blanco y negro, 2 caras y salir
    await fireEvent.press(screen.getByTestId("btn-color-bn"));
    await fireEvent.press(screen.getByTestId("btn-caras-dos"));
    await fireEvent.press(screen.getByTestId("boton-salir-form-reprografia"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });
});
