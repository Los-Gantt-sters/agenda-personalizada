import { describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import {
  MotorBarridoProvider,
  useMotorBarrido,
} from "../componentes/barrido-pulsadores/MotorBarridoProvider";
import { TemaProvider, useTema } from "../temas";
import { PreferenciasProvider, usePreferencias } from "./PreferenciasProvider";
import { PREFERENCIAS_POR_DEFECTO } from "./opciones";

type Valor = ReturnType<typeof usePreferencias>;

function montar(iniciales?: Parameters<typeof PreferenciasProvider>[0]["preferenciasIniciales"]) {
  const ref: {
    prefs: Valor | null;
    tema: ReturnType<typeof useTema> | null;
    motor: ReturnType<typeof useMotorBarrido> | null;
  } = {
    prefs: null,
    tema: null,
    motor: null,
  };
  function Sonda() {
    ref.prefs = usePreferencias();
    ref.tema = useTema();
    ref.motor = useMotorBarrido();
    return <Text>{ref.prefs.preferencias.fuente}</Text>;
  }
  const ui = (
    <TemaProvider>
      <MotorBarridoProvider configuracionInicial={{ modo: "desactivado", intervaloMs: 1600 }}>
        <PreferenciasProvider preferenciasIniciales={iniciales}>
          <Sonda />
        </PreferenciasProvider>
      </MotorBarridoProvider>
    </TemaProvider>
  );
  return { ref, ui };
}

describe("PreferenciasProvider", () => {
  it("empieza con los valores por defecto de la variante A", async () => {
    const { ref, ui } = montar();
    await render(ui);
    expect(ref.prefs?.preferencias).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it("acepta preferencias iniciales y sanea las que no existen", async () => {
    const { ref, ui } = montar({
      fuente: "andika",
      forma: "inventada" as never,
      vistaAgenda: "semanal",
      avisoPrevio: "no",
    });
    await render(ui);
    expect(ref.prefs?.preferencias.fuente).toBe("andika");
    expect(ref.prefs?.preferencias.forma).toBe("round");
    expect(ref.prefs?.preferencias.vistaAgenda).toBe("semanal");
    expect(ref.prefs?.preferencias.avisoPrevio).toBe("no");
  });

  it("cambiar actualiza las preferencias, las medidas derivadas y sincroniza MotorBarridoProvider", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () =>
      ref.prefs?.cambiar({
        tamanoBoton: "XL",
        forma: "pill",
        modoBarrido: "automatico",
        intervaloBarridoMs: 2400,
      }),
    );
    expect(ref.prefs?.preferencias).toMatchObject({
      tamanoBoton: "XL",
      forma: "pill",
      modoBarrido: "automatico",
      intervaloBarridoMs: 2400,
    });
    expect(ref.prefs?.estilos.boton.altoMinimo).toBe(84.48);
    expect(ref.prefs?.estilos.boton.radio).toBe(999);
    expect(ref.motor?.configuracion.modo).toBe("automatico");
    expect(ref.motor?.configuracion.intervaloMs).toBe(2400);
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
    expect(ref.prefs?.preferencias.fuente).toBe("lexend");
  });

  it("restablecer vuelve a los valores por defecto, tema y barrido incluidos", async () => {
    const { ref, ui } = montar();
    await render(ui);
    await act(async () =>
      ref.prefs?.cambiar({
        tema: "oscuro",
        fuente: "andika",
        tamanoLetra: "extra",
        forma: "square",
        vistaAgenda: "semanal",
        avisoPrevio: "no",
        modoBarrido: "manual",
      }),
    );
    await act(async () => ref.prefs?.restablecer());
    expect(ref.prefs?.preferencias).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(ref.tema?.nombre).toBe("claro");
    expect(ref.motor?.configuracion.modo).toBe("desactivado");
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
