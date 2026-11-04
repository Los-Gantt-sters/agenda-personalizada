import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ModalConfirmacionEstudiante } from "../ModalConfirmacionEstudiante";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";

describe("ModalConfirmacionEstudiante", () => {
  const estudiante = ESTUDIANTES_MOCK[0];

  it("renderiza la confirmación visual y el nombre del alumno", async () => {
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={jest.fn()}
        alCancelar={jest.fn()}
      />,
    );

    expect(screen.getByText(`¿Eres ${estudiante.nombre}?`)).toBeTruthy();
    expect(screen.getByText("✓ Sí, soy yo")).toBeTruthy();
    expect(screen.getByText("✗ No")).toBeTruthy();
  });

  it("llama a alConfirmar al pulsar el botón de confirmación", async () => {
    const user = userEvent.setup();
    const handleConfirmar = jest.fn();
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={handleConfirmar}
        alCancelar={jest.fn()}
      />,
    );

    await user.press(screen.getByTestId("btn-confirmar-estudiante"));
    expect(handleConfirmar).toHaveBeenCalledWith(estudiante);
  });

  it("llama a alCancelar al pulsar el botón de rechazo", async () => {
    const user = userEvent.setup();
    const handleCancelar = jest.fn();
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={jest.fn()}
        alCancelar={handleCancelar}
      />,
    );

    await user.press(screen.getByTestId("btn-cancelar-estudiante"));
    expect(handleCancelar).toHaveBeenCalled();
  });
});
