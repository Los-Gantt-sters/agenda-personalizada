import { describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { TEMAS } from "./paletas";
import { TemaProvider, useTema } from "./TemaProvider";

type Valor = ReturnType<typeof useTema>;

function capturar() {
  const ref: { actual: Valor | null } = { actual: null };
  function Sonda() {
    ref.actual = useTema();
    return <Text>{ref.actual.nombre}</Text>;
  }
  return { ref, Sonda };
}

describe("TemaProvider", () => {
  it("empieza con el tema claro por defecto", async () => {
    const { ref, Sonda } = capturar();
    await render(
      <TemaProvider>
        <Sonda />
      </TemaProvider>,
    );
    expect(ref.actual?.nombre).toBe("claro");
    expect(ref.actual?.colores).toEqual(TEMAS.claro.paleta);
  });

  it("acepta un tema inicial", async () => {
    const { ref, Sonda } = capturar();
    await render(
      <TemaProvider temaInicial="pastel">
        <Sonda />
      </TemaProvider>,
    );
    expect(ref.actual?.tema.etiqueta).toBe("Pastel");
  });

  it("cambia de tema y los colores se actualizan", async () => {
    const { ref, Sonda } = capturar();
    await render(
      <TemaProvider>
        <Sonda />
      </TemaProvider>,
    );
    await act(async () => ref.actual?.cambiarTema("altoContrasteOscuro"));
    expect(screen.getByText("altoContrasteOscuro")).toBeTruthy();
    expect(ref.actual?.colores.fondo).toBe("#000000");
    expect(ref.actual?.tema.esAltoContraste).toBe(true);
  });

  it("ignora un nombre de tema que no existe", async () => {
    const { ref, Sonda } = capturar();
    await render(
      <TemaProvider temaInicial="oscuro">
        <Sonda />
      </TemaProvider>,
    );
    await act(async () => ref.actual?.cambiarTema("inventado" as never));
    expect(ref.actual?.nombre).toBe("oscuro");
  });

  it("useTema falla con un mensaje claro fuera del proveedor", async () => {
    const { Sonda } = capturar();
    const silenciar = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Sonda />)).rejects.toThrow("useTema debe usarse dentro de <TemaProvider>");
    silenciar.mockRestore();
  });
});
