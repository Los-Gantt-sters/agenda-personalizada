import React, { useState } from "react";
import { render, screen, userEvent } from "@testing-library/react-native";

import { CredencialDibujos } from "../CredencialDibujos";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";

const estudiante = ESTUDIANTES_MOCK[0];

/** La secuencia la guarda la pantalla; aquí basta con un estado local. */
function ConEstado({
  alEntrar,
  mensajeError,
}: {
  alEntrar: (s: string[]) => void;
  mensajeError?: string;
}) {
  const [secuencia, setSecuencia] = useState<string[]>([]);
  return (
    <CredencialDibujos
      estudiante={estudiante}
      secuencia={secuencia}
      alCambiarSecuencia={setSecuencia}
      alEntrar={() => alEntrar(secuencia)}
      mensajeError={mensajeError}
    />
  );
}

describe("CredencialDibujos (SCRUM-50 · contraseña de 3 dibujos a pantalla completa)", () => {
  it("muestra la instrucción en Lectura Fácil, los 9 dibujos y el botón «Entrar»", async () => {
    await render(<ConEstado alEntrar={jest.fn()} />);

    expect(screen.getByText("Toca tus 3 dibujos en orden")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-manzana")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-perro")).toBeTruthy();
    expect(screen.getByTestId("dibujo-credencial-estrella")).toBeTruthy();
    expect(screen.getByTestId("btn-entrar-credencial")).toBeTruthy();
  });

  it("al tocar el tercer dibujo no entra sola: hay que pulsar «Entrar»", async () => {
    const user = userEvent.setup();
    const alEntrar = jest.fn();
    await render(<ConEstado alEntrar={alEntrar} />);

    expect(screen.getByTestId("btn-entrar-credencial")).toBeDisabled();
    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));
    expect(alEntrar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("3 de 3 dibujos seleccionados")).toBeTruthy();

    await user.press(screen.getByTestId("btn-entrar-credencial"));
    expect(alEntrar).toHaveBeenCalledWith(["manzana", "perro", "estrella"]);
  });

  it("con los 3 dibujos puestos no deja tocar un cuarto", async () => {
    const user = userEvent.setup();
    const alEntrar = jest.fn();
    await render(<ConEstado alEntrar={alEntrar} />);

    for (const d of ["manzana", "perro", "estrella", "gato"]) {
      await user.press(screen.getByTestId(`dibujo-credencial-${d}`));
    }
    await user.press(screen.getByTestId("btn-entrar-credencial"));
    expect(alEntrar).toHaveBeenCalledWith(["manzana", "perro", "estrella"]);
  });

  it("permite borrar el último dibujo tocado", async () => {
    const user = userEvent.setup();
    const alEntrar = jest.fn();
    await render(<ConEstado alEntrar={alEntrar} />);

    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    await user.press(screen.getByTestId("dibujo-credencial-gato"));
    await user.press(screen.getByTestId("btn-borrar-dibujo"));
    await user.press(screen.getByTestId("dibujo-credencial-perro"));
    await user.press(screen.getByTestId("dibujo-credencial-estrella"));
    await user.press(screen.getByTestId("btn-entrar-credencial"));

    expect(alEntrar).toHaveBeenCalledWith(["manzana", "perro", "estrella"]);
  });
});
