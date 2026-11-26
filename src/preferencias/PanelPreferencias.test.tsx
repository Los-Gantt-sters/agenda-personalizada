import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import { TemaProvider } from "../temas";
import { PanelPreferencias } from "./PanelPreferencias";
import { PreferenciasProvider } from "./PreferenciasProvider";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

const montar = () =>
  render(
    <TemaProvider>
      <PreferenciasProvider>
        <PanelPreferencias />
      </PreferenciasProvider>
    </TemaProvider>,
  );

const APARTADOS_16 = [
  "Qué se ve en tareas",
  "Fondo y colores",
  "Texto y tipografía",
  "Botones (tamaño y forma)",
  "Agenda (día / semana)",
  "Reloj en la tarea",
  "Ayuda (máximo 3)",
  "Barrido por pulsadores",
];

const escapar = (t: string) => t.replace(/[()]/g, "\\$&");
const abrir = async (user: ReturnType<typeof userEvent.setup>, titulo: string) => {
  await user.press(screen.getByRole("button", { name: new RegExp(`^${escapar(titulo)}:`) }));
};
const pulsarAtrasSinGuardar = (user: ReturnType<typeof userEvent.setup>) =>
  user.press(screen.getByTestId("btn-barra-atras"));
const pulsarGuardarCambios = (user: ReturnType<typeof userEvent.setup>) =>
  user.press(screen.getByTestId("btn-barra-adelante"));

describe("PanelPreferencias (SCRUM-240 · Bocetos 16, 16b, 17, 18, 19, 22, 24, 25 y 26)", () => {
  it("muestra el menú 16 con los apartados agrupados de los bocetos nuevos (sin scroll)", async () => {
    await montar();
    expect(screen.getByRole("header", { name: "¿Qué quieres configurar?" })).toBeTruthy();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Preferencias · Alejandro");
    for (const a of APARTADOS_16) {
      expect(screen.getByRole("button", { name: new RegExp(`^${escapar(a)}:`) })).toBeTruthy();
    }
    expect(
      screen.getByRole("button", { name: "Qué se ve en tareas: Picto con etiqueta" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Claro · Sin contraste" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Botones (tamaño y forma): Grande · Redondeados" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Agenda (día / semana): Día y semana · Hasta 3" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reloj en la tarea: Con reloj · Aviso 5m" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ayuda (máximo 3): 3 ayudas (máx. 3)" }),
    ).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain("RCTScrollView");
  });

  it("«Atrás» vuelve al menú 16 SIN guardar los cambios y «Guardar cambios» los confirma", async () => {
    const user = userEvent.setup();
    await montar();

    // 1. Abrimos "Fondo y colores" (18), elegimos "Pastel", pero pulsamos "Atrás" (no debe guardar)
    await abrir(user, "Fondo y colores");
    expect(screen.getByTestId("btn-barra-adelante")).toHaveTextContent("Guardar cambios");
    await user.press(screen.getByTestId("opcion-tema-pastel"));
    await pulsarAtrasSinGuardar(user);
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Claro · Sin contraste" }),
    ).toBeTruthy();

    // 2. Volvemos a abrir "Fondo y colores", elegimos "Pastel" y pulsamos "Guardar cambios"
    await abrir(user, "Fondo y colores");
    await user.press(screen.getByTestId("opcion-tema-pastel"));
    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Pastel · Sin contraste" }),
    ).toBeTruthy();
  });

  it("Pantalla 17 (Qué se ve en las tareas): cambia formato visual y locución en la vista previa", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Qué se ve en tareas");

    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();

    await user.press(screen.getByTestId("opcion-formato17-soloPictograma"));
    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.queryByTestId("preview-titulo-texto")).toBeNull();

    await user.press(screen.getByTestId("opcion-formato17-textoFacil"));
    expect(screen.queryByTestId("preview-pictograma")).toBeNull();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();

    await pulsarGuardarCambios(user);
    expect(screen.getByRole("button", { name: "Qué se ve en tareas: Texto fácil" })).toBeTruthy();
  });

  it("Pantalla 19 (Texto y tipografía) y 16b: aplica MAYÚSCULAS en vista previa y en menú al guardar", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Texto y tipografía");
    await user.press(screen.getByTestId("opcion-caja-mayusculas"));

    const tituloPrevia = StyleSheet.flatten(screen.getByTestId("preview-titulo-texto").props.style);
    expect(tituloPrevia.textTransform).toBe("uppercase");

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Texto y tipografía: Lexend · Normal · MAYÚS." }),
    ).toBeTruthy();
  });

  it("Pantalla 22 (Botones tamaño y forma): actualiza la vista previa al momento y guarda al confirmar", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Botones (tamaño y forma)");

    const medidasBoton = () => {
      const boton = screen.getByRole("button", { name: "Empezar" });
      const estilo = Object.assign({}, ...[boton.props.style].flat(3).filter(Boolean));
      return { minHeight: estilo.minHeight, borderRadius: estilo.borderRadius };
    };

    expect(medidasBoton()).toEqual({ minHeight: 73.6, borderRadius: 16 });
    await user.press(screen.getByTestId("opcion-tamanoBoton-M"));
    await user.press(screen.getByTestId("opcion-forma-square"));
    expect(medidasBoton()).toEqual({ minHeight: 64, borderRadius: 4 });

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Botones (tamaño y forma): Normal · Cuadrados" }),
    ).toBeTruthy();
  });

  it("Pantalla 24 (Agenda): stepper + y − recorre de 1 a 5 tareas y después «Todas»", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Agenda (día / semana)");

    expect(screen.getByTestId("valor-tareas-visibles-24")).toHaveTextContent("3 tareas");
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(3);

    // Bajamos con − hasta 1 tarea
    await user.press(screen.getByTestId("btn-tareas-visibles-dec"));
    expect(screen.getByTestId("valor-tareas-visibles-24")).toHaveTextContent("2 tareas");
    await user.press(screen.getByTestId("btn-tareas-visibles-dec"));
    expect(screen.getByTestId("valor-tareas-visibles-24")).toHaveTextContent("1 tarea");
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(1);

    // Subimos con + pasando por 2, 3, 4, 5 y Todas
    for (let i = 0; i < 5; i++) {
      await user.press(screen.getByTestId("btn-tareas-visibles-inc"));
    }
    expect(screen.getByTestId("valor-tareas-visibles-24")).toHaveTextContent("Todas");
    expect(screen.getAllByTestId(/^muestra-Después-/).length).toBeGreaterThan(5);

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Agenda (día / semana): Día y semana · Todas" }),
    ).toBeTruthy();
  });

  it("Pantalla 25 (Reloj en la tarea) y Pantalla 26 (Ayuda máx. 3): configuran reloj, aviso 5m y hasta 3 ayudas", async () => {
    const user = userEvent.setup();
    await montar();

    // Pantalla 25
    await abrir(user, "Reloj en la tarea");
    expect(screen.getByTestId("muestra-reloj")).toBeTruthy();
    await user.press(screen.getByTestId("opcion-reloj25-no"));
    expect(screen.queryByTestId("muestra-reloj")).toBeNull();
    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Reloj en la tarea: Sin reloj · Aviso 5m" }),
    ).toBeTruthy();

    // Pantalla 26
    await abrir(user, "Ayuda (máximo 3)");
    expect(screen.getByTestId("contador-ayudas-26")).toHaveTextContent(
      "3 de 3 seleccionados (máx. 3)",
    );
    await user.press(screen.getByTestId("necesidad-agua"));
    expect(screen.getByTestId("contador-ayudas-26")).toHaveTextContent(
      "2 de 3 seleccionados (máx. 3)",
    );
    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Ayuda (máximo 3): 2 ayudas (máx. 3)" }),
    ).toBeTruthy();
  });
});
