// Pruebas del feedback sonoro en el inicio de sesión del alumno (HU-01, T-01.3 · SCRUM-52)
import React, { useState } from "react";
import { render, screen, userEvent } from "@testing-library/react-native";

import { CredencialDibujos } from "../CredencialDibujos";
import { TarjetaEstudiante } from "../TarjetaEstudiante";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";
import { reproducirSonido } from "../../../servicios/sonidos";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const sonar = reproducirSonido as jest.Mock;

function ConEstado() {
  const [secuencia, setSecuencia] = useState<string[]>([]);
  return (
    <CredencialDibujos
      estudiante={ESTUDIANTES_MOCK[0]}
      secuencia={secuencia}
      alCambiarSecuencia={setSecuencia}
      alEntrar={jest.fn()}
    />
  );
}

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

  it("suena «toque» en cada dibujo (el «acierto» suena al pulsar «Entrar», en la pantalla)", async () => {
    const user = userEvent.setup();
    await render(<ConEstado />);

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));

    expect(sonar.mock.calls.map(([nombre]) => nombre)).toEqual(["toque", "toque", "toque"]);
  });

  it("suena «borrar» (nunca un pitido de error) al borrar un dibujo", async () => {
    const user = userEvent.setup();
    await render(<ConEstado />);

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("btn-borrar-dibujo"));
    expect(sonar).toHaveBeenLastCalledWith("borrar");
  });
});
