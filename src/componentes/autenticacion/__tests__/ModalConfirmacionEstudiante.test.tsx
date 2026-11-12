import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ModalConfirmacionEstudiante } from "../ModalConfirmacionEstudiante";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";

describe("ModalConfirmacionEstudiante (SCRUM-50 · Credencial visual de 3 dibujos)", () => {
  const estudiante = ESTUDIANTES_MOCK[0];

  it("renderiza la identidad del alumno, la instrucción en Lectura Fácil y los 9 dibujos táctiles", async () => {
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={jest.fn()}
        alCancelar={jest.fn()}
      />,
    );

    expect(screen.getByText(`¿Eres ${estudiante.nombre}?`)).toBeTruthy();
    expect(screen.getByText("🔑 Toca tus 3 dibujos en orden")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-manzana")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-perro")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-estrella")).toBeTruthy();
    expect(screen.getByText("⬅ No soy yo")).toBeTruthy();
    expect(screen.queryByTestId("btn-confirmar-estudiante")).toBeNull();
  });

  it("al tocar 3 dibujos en orden invoca alConfirmar con el estudiante y el array de 3 dibujos", async () => {
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

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    expect(handleConfirmar).not.toHaveBeenCalled();

    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    expect(handleConfirmar).not.toHaveBeenCalled();

    await user.press(screen.getByTestId("dibujo-credencial-estrella"));
    expect(handleConfirmar).toHaveBeenCalledWith(estudiante, ["manzana", "perro", "estrella"]);
  });

  it("permite borrar el último dibujo tocado antes de completar los 3", async () => {
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

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-gato"));
    await user.press(screen.getByTestId("btn-borrar-dibujo"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));

    expect(handleConfirmar).toHaveBeenCalledWith(estudiante, ["manzana", "perro", "estrella"]);
  });

  it("llama a alCancelar al pulsar «No soy yo»", async () => {
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
