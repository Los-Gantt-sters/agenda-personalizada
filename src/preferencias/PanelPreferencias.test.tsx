import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import React from "react";
import { StyleSheet } from "react-native";

import { TemaProvider } from "../temas";
import { PanelPreferencias } from "./PanelPreferencias";
import { PreferenciasProvider } from "./PreferenciasProvider";

// El panel es una pantalla con barra de abajo (Atrás / Adelante): necesita el router.
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

const APARTADOS = [
  "Qué se ve (Dibujos y palabras)",
  "Fondo y colores",
  "Tipo de letra",
  "Mayúsculas o minúsculas",
  "Tamaño de letra",
  "Tamaño de los botones",
  "Forma de los botones",
  "Tareas que se ven",
];

const grupo = (nombre: string) => within(screen.getByLabelText(nombre));
const elegida = (nombreGrupo: string) =>
  grupo(nombreGrupo)
    .getAllByRole("radio")
    .filter((o) => o.props.accessibilityState?.checked)
    .map((o) => o.props.accessibilityLabel);

/** Abre un apartado desde el menú. */
const abrir = async (user: ReturnType<typeof userEvent.setup>, titulo: string) => {
  await user.press(screen.getByRole("button", { name: new RegExp(`^${escapar(titulo)}:`) }));
};
const escapar = (t: string) => t.replace(/[()]/g, "\\$&");
const volverAlMenu = (user: ReturnType<typeof userEvent.setup>) =>
  user.press(screen.getByTestId("btn-barra-atras"));

describe("PanelPreferencias (T-04.3 y mejoras de la profesora)", () => {
  it("primero pregunta qué quieres cambiar, con los 8 apartados y su valor actual (sin scroll)", async () => {
    await montar();
    expect(screen.getByRole("header", { name: "¿Qué quieres cambiar?" })).toBeTruthy();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Preferencias");
    for (const a of APARTADOS) {
      expect(screen.getByRole("button", { name: new RegExp(`^${escapar(a)}:`) })).toBeTruthy();
    }
    expect(screen.getByRole("button", { name: "Fondo y colores: Claro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tipo de letra: Lexend" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tareas que se ven: Hasta 3" })).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain("RCTScrollView");
  });

  it("cada apartado se abre en su pantalla con sus opciones", async () => {
    const user = userEvent.setup();
    await montar();
    const cuantas: [string, number][] = [
      ["Qué se ve (Dibujos y palabras)", 3],
      ["Fondo y colores", 5],
      ["Tipo de letra", 3],
      ["Mayúsculas o minúsculas", 2],
      ["Tamaño de letra", 3],
      ["Tamaño de los botones", 3],
      ["Forma de los botones", 3],
      ["Tareas que se ven", 3],
    ];
    for (const [titulo, n] of cuantas) {
      await abrir(user, titulo);
      expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent(titulo);
      expect(grupo(titulo).getAllByRole("radio")).toHaveLength(n);
      await volverAlMenu(user);
    }
  });

  it("al abrir están elegidos los valores por defecto", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Fondo y colores");
    expect(elegida("Fondo y colores")).toEqual(["Claro"]);
    await volverAlMenu(user);
    await abrir(user, "Mayúsculas o minúsculas");
    expect(elegida("Mayúsculas o minúsculas")).toEqual(["Minúsculas"]);
  });

  it("elegir una opción la marca (solo una) y el menú enseña lo elegido", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Fondo y colores");
    await user.press(grupo("Fondo y colores").getByRole("radio", { name: "Pastel" }));
    expect(elegida("Fondo y colores")).toEqual(["Pastel"]);
    // La elección no depende solo del color: lleva una marca (RNF14.4)
    expect(
      within(screen.getByLabelText("Fondo y colores")).getAllByTestId("icono-check", {
        includeHiddenElements: true,
      }),
    ).toHaveLength(1);

    await volverAlMenu(user);
    expect(screen.getByRole("button", { name: "Fondo y colores: Pastel" })).toBeTruthy();
  });

  it("«Adelante» pasa al apartado siguiente y en el último está apagado", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Forma de los botones");
    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Tareas que se ven");
    expect(screen.getByTestId("btn-barra-adelante").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("al elegir solo pictograma oculta el texto y al elegir solo texto oculta el pictograma", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Qué se ve (Dibujos y palabras)");
    const canal = "Qué se ve (Dibujos y palabras)";

    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();

    await user.press(grupo(canal).getByRole("radio", { name: "Solo pictograma" }));
    expect(screen.getByTestId("preview-pictograma")).toBeTruthy();
    expect(screen.queryByTestId("preview-titulo-texto")).toBeNull();

    await user.press(grupo(canal).getByRole("radio", { name: "Solo texto" }));
    expect(screen.queryByTestId("preview-pictograma")).toBeNull();
    expect(screen.getByTestId("preview-titulo-texto")).toBeTruthy();
  });

  it("la vista previa cambia de tamaño y de forma al momento (RF3.15)", async () => {
    const user = userEvent.setup();
    await montar();
    const alto = () => {
      const boton = screen.getByRole("button", { name: "Empezar" });
      const estilo = Object.assign({}, ...[boton.props.style].flat(3).filter(Boolean));
      return { minHeight: estilo.minHeight, borderRadius: estilo.borderRadius };
    };
    await abrir(user, "Tamaño de los botones");
    expect(alto()).toEqual({ minHeight: 73.6, borderRadius: 16 });

    await user.press(grupo("Tamaño de los botones").getByRole("radio", { name: "Mediano" }));
    await user.press(screen.getByTestId("btn-barra-adelante")); // → Forma de los botones
    await user.press(grupo("Forma de los botones").getByRole("radio", { name: "Cuadrados" }));
    expect(alto()).toEqual({ minHeight: 64, borderRadius: 4 });
  });

  it("con «MAYÚSCULAS» el texto de la app sale en mayúsculas; las etiquetas se ven tal cual", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Mayúsculas o minúsculas");
    await user.press(grupo("Mayúsculas o minúsculas").getByRole("radio", { name: "MAYÚSCULAS" }));

    const titulo = StyleSheet.flatten(screen.getByTestId("preview-titulo-texto").props.style);
    expect(titulo.textTransform).toBe("uppercase");
    const etiqueta = StyleSheet.flatten(screen.getByText("Minúsculas").props.style);
    expect(etiqueta.textTransform).toBe("none");
  });

  it("«Tareas que se ven» enseña 1, 3 o muchas tarjetas en la muestra", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Tareas que se ven");
    const tareas = "Tareas que se ven";
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(3);
    await user.press(grupo(tareas).getByRole("radio", { name: "Solo 1" }));
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(1);
    await user.press(grupo(tareas).getByRole("radio", { name: "Todas" }));
    expect(screen.getAllByTestId(/^muestra-Después-/).length).toBeGreaterThan(3);
  });

  it("«Volver a lo de siempre» restablece todo", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Fondo y colores");
    await user.press(grupo("Fondo y colores").getByRole("radio", { name: "Oscuro" }));
    await volverAlMenu(user);
    await abrir(user, "Forma de los botones");
    await user.press(grupo("Forma de los botones").getByRole("radio", { name: "Circulares" }));
    await volverAlMenu(user);

    await user.press(screen.getByRole("button", { name: "Volver a lo de siempre" }));
    expect(screen.getByRole("button", { name: "Fondo y colores: Claro" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Forma de los botones: Redondeados" })).toBeTruthy();
  });
});
