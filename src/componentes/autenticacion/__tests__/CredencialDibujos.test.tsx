import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { render, screen, userEvent, within } from "@testing-library/react-native";

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

describe("CredencialDibujos · pantalla 04b (MOD HU-01 · SCRUM-248)", () => {
  /** Como la pantalla: tras un fallo guarda el aviso y lo quita al tocar otro dibujo. */
  function TrasUnFallo({ alEntrar = jest.fn() }: { alEntrar?: (s: string[]) => void }) {
    const [secuencia, setSecuencia] = useState<string[]>(["sol", "gato", "casa"]);
    const [error, setError] = useState<string | null>("Esos dibujos no son los tuyos.");
    return (
      <CredencialDibujos
        estudiante={estudiante}
        secuencia={secuencia}
        alCambiarSecuencia={(nueva) => {
          setError(null);
          setSecuencia(nueva);
        }}
        alEntrar={() => alEntrar(secuencia)}
        mensajeError={error}
      />
    );
  }

  const bordeHueco = (indice: number) =>
    StyleSheet.flatten(screen.getByTestId(`hueco-dibujo-${indice}`).props.style).borderColor;

  it("los 9 dibujos van primero (a la izquierda) y después los huecos y los botones", async () => {
    await render(<ConEstado alEntrar={jest.fn()} />);
    const raiz = screen.getByTestId("credencial-dibujos");
    expect(raiz.children[0]).toBe(screen.getByTestId("cuadricula-dibujos-credencial"));
  });

  it("con error deja los 3 dibujos en los huecos, con un borde distinto del de acierto", async () => {
    const user = userEvent.setup();
    await render(<ConEstado alEntrar={jest.fn()} />);
    for (const d of ["sol", "gato", "casa"]) {
      await user.press(screen.getByTestId(`dibujo-credencial-${d}`));
    }
    const bordeNormal = bordeHueco(0);

    await render(<TrasUnFallo />);
    expect(screen.getByLabelText("3 de 3 dibujos seleccionados")).toBeTruthy();
    expect(bordeHueco(0)).not.toBe(bordeNormal);
    expect(bordeHueco(1)).toBe(bordeHueco(0));
    expect(bordeHueco(2)).toBe(bordeHueco(0));
  });

  it("con error oculta «Borrar dibujo» y «Entrar» y enseña «Borrar todo» con su pictograma", async () => {
    await render(<TrasUnFallo />);
    expect(screen.getByTestId("error-credencial-visual")).toBeTruthy();
    expect(screen.queryByText("Toca tus 3 dibujos en orden")).toBeNull();
    expect(screen.queryByTestId("btn-borrar-dibujo")).toBeNull();
    expect(screen.queryByTestId("btn-entrar-credencial")).toBeNull();
    const borrarTodo = screen.getByTestId("btn-borrar-todo");
    expect(within(borrarTodo).getByText("Borrar todo")).toBeTruthy();
    expect(
      within(borrarTodo).getByLabelText("Dibujo de borrar", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("con error los dibujos están apagados: solo se puede pulsar «Borrar todo»", async () => {
    const user = userEvent.setup();
    await render(<TrasUnFallo />);

    expect(screen.getByTestId("dibujo-credencial-manzana")).toBeDisabled();
    await user.press(screen.getByTestId("dibujo-credencial-manzana"));
    expect(screen.getByLabelText("3 de 3 dibujos seleccionados")).toBeTruthy();
    expect(screen.getByTestId("error-credencial-visual")).toBeTruthy();
  });

  it("«Borrar todo» vacía los huecos y vuelve a la pantalla 03 para probar otra vez", async () => {
    const user = userEvent.setup();
    const alEntrar = jest.fn();
    await render(<TrasUnFallo alEntrar={alEntrar} />);

    await user.press(screen.getByTestId("btn-borrar-todo"));
    expect(screen.queryByTestId("error-credencial-visual")).toBeNull();
    expect(screen.getByText("Toca tus 3 dibujos en orden")).toBeTruthy();
    expect(screen.getByLabelText("0 de 3 dibujos seleccionados")).toBeTruthy();

    for (const d of ["manzana", "perro", "estrella"]) {
      await user.press(screen.getByTestId(`dibujo-credencial-${d}`));
    }
    await user.press(screen.getByTestId("btn-entrar-credencial"));
    expect(alEntrar).toHaveBeenCalledWith(["manzana", "perro", "estrella"]);
  });
});
