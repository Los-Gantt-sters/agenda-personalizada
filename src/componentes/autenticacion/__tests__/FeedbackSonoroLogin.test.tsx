// Pruebas del feedback sonoro en el inicio de sesión del alumno (HU-01, T-01.3 · SCRUM-52)
import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";

import { ModalConfirmacionEstudiante } from "../ModalConfirmacionEstudiante";
import { TarjetaEstudiante } from "../TarjetaEstudiante";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";
import { reproducirSonido } from "../../../servicios/sonidos";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const sonar = reproducirSonido as jest.Mock;

describe("Feedback sonoro al pulsar (SCRUM-52: T-01.3 Feedback sonoro amigable)", () => {
  const estudiante = ESTUDIANTES_MOCK[0];

  beforeEach(() => {
    sonar.mockClear();
  });

  it("suena un toque suave al pulsar la foto de un alumno", async () => {
    const user = userEvent.setup();
    await render(<TarjetaEstudiante estudiante={estudiante} alSeleccionar={jest.fn()} />);

    await user.press(screen.getByTestId(`tarjeta-estudiante-${estudiante.id}`));
    expect(sonar).toHaveBeenCalledWith("toque");
  });

  it("suena «toque» en los dos primeros dibujos y «acierto» al completar el tercero", async () => {
    const user = userEvent.setup();
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={jest.fn()}
        alCancelar={jest.fn()}
      />,
    );

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));

    expect(sonar.mock.calls.map(([nombre]) => nombre)).toEqual(["toque", "toque", "acierto"]);
  });

  it("suena «borrar» (nunca un pitido de error) al borrar un dibujo", async () => {
    const user = userEvent.setup();
    await render(
      <ModalConfirmacionEstudiante
        estudiante={estudiante}
        visible={true}
        alConfirmar={jest.fn()}
        alCancelar={jest.fn()}
      />,
    );

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("btn-borrar-dibujo"));
    expect(sonar).toHaveBeenLastCalledWith("borrar");
  });
});
