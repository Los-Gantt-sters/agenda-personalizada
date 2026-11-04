import { describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { TemaProvider, useTema } from "../temas";
import { PreferenciasProvider, usePreferencias } from "./PreferenciasProvider";

type Valor = ReturnType<typeof usePreferencias>;

function montar(iniciales?: Parameters<typeof PreferenciasProvider>[0]["preferenciasIniciales"]) {
  const ref: { prefs: Valor | null; tema: ReturnType<typeof useTema> | null } = {
    prefs: null,
    tema: null,
  };
  function Sonda() {
    ref.prefs = usePreferencias();
    ref.tema = useTema();
    return <Text>{ref.prefs.preferencias.fuente}</Text>;
  }
  const ui = (
    <TemaProvider>
      <PreferenciasProvider preferenciasIniciales={iniciales}>
        <Sonda />
      </PreferenciasProvider>
    </TemaProvider>
  );
  return { ref, ui };
}

describe("PreferenciasProvider", () => {
  it("empieza con los valores por defecto de la variante A", async () => {
    const { ref, ui } = montar();
    await render(ui);
    expect(ref.prefs?.preferencias).toEqual({
      tema: "claro",
      fuente: "atkinson",
      tamanoLetra: "normal",
      tamanoBoton: "L",
      forma: "round",
    });
  });

  it("acepta preferencias iniciales y sanea las que no existen", async () => {
    const { ref, ui } = montar({ fuente: "andika", forma: "inventada" as never });
    await render(ui);
    expect(ref.prefs?.preferencias.fuente).toBe("andika");
    expect(ref.prefs?.preferencias.forma).toBe("round");
  });

  it("cambiar actualiza las preferencias y las medidas derivadas", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () => ref.prefs?.cambiar({ tamanoBoton: "XL", forma: "pill" }));
    expect(ref.prefs?.preferencias).toMatchObject({ tamanoBoton: "XL", forma: "pill" });
    expect(ref.prefs?.estilos.boton.altoMinimo).toBe(84.48);
    expect(ref.prefs?.estilos.boton.radio).toBe(999);
  });

  it("cambiar el tema lo aplica en el TemaProvider (RF3.1)", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () => ref.prefs?.cambiar({ tema: "altoContrasteOscuro" }));
    expect(ref.tema?.nombre).toBe("altoContrasteOscuro");
    expect(ref.prefs?.preferencias.tema).toBe("altoContrasteOscuro");
  });

  it("un valor que no existe no cambia nada", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () => ref.prefs?.cambiar({ fuente: "comic" as never }));
    expect(ref.prefs?.preferencias.fuente).toBe("atkinson");
  });

  it("restablecer vuelve a los valores por defecto, tema incluido", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () =>
      ref.prefs?.cambiar({
        tema: "oscuro",
        fuente: "lexend",
        tamanoLetra: "extra",
        forma: "square",
      }),
    );
    await act(async () => ref.prefs?.restablecer());
    expect(ref.prefs?.preferencias).toEqual({
      tema: "claro",
      fuente: "atkinson",
      tamanoLetra: "normal",
      tamanoBoton: "L",
      forma: "round",
    });
    expect(ref.tema?.nombre).toBe("claro");
  });

  it("usePreferencias falla con un mensaje claro fuera del proveedor", async () => {
    function Sonda() {
      usePreferencias();
      return null;
    }
    const silenciar = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(render(<Sonda />)).rejects.toThrow(
      "usePreferencias debe usarse dentro de <PreferenciasProvider>",
    );
    silenciar.mockRestore();
  });
});
