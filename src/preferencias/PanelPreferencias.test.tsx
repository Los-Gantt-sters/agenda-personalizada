import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";

import {
  MotorBarridoProvider,
  useMotorBarrido,
} from "../componentes/barrido-pulsadores/MotorBarridoProvider";
import { TemaProvider } from "../temas";
import { PanelPreferencias } from "./PanelPreferencias";
import { PreferenciasProvider, usePreferencias } from "./PreferenciasProvider";
import type { PreferenciasApariencia } from "./opciones";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

function SondaContexto() {
  const { preferencias } = usePreferencias();
  const { configuracion } = useMotorBarrido();
  return (
    <Text testID="sonda-contexto-json">
      {JSON.stringify({ preferencias, motor: configuracion })}
    </Text>
  );
}

function leerEstadoSonda(): {
  preferencias: PreferenciasApariencia;
  motor: { modo: string; intervaloMs: number };
} {
  const nodo = screen.getByTestId("sonda-contexto-json");
  return JSON.parse(String(nodo.props.children));
}

const montar = () =>
  render(
    <TemaProvider>
      <MotorBarridoProvider configuracionInicial={{ modo: "desactivado", intervaloMs: 1600 }}>
        <PreferenciasProvider>
          <SondaContexto />
          <PanelPreferencias />
        </PreferenciasProvider>
      </MotorBarridoProvider>
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
  it("1. muestra el menú 16 con los apartados agrupados de los bocetos nuevos (sin scroll)", async () => {
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
      screen.getByRole("button", { name: "Agenda (día / semana): Solo día · Hasta 3" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reloj en la tarea: Con reloj · Aviso 5m" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ayuda (máximo 3): 3 ayudas (máx. 3)" }),
    ).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain("RCTScrollView");
  });

  it("2. cada apartado se abre en su propia pantalla con sus grupos de opciones y botón Guardar cambios", async () => {
    const user = userEvent.setup();
    await montar();
    const pantallas: [string, string][] = [
      ["Qué se ve en tareas", "Qué se ve en las tareas"],
      ["Fondo y colores", "Fondo y colores"],
      ["Texto y tipografía", "Texto y tipografía"],
      ["Botones (tamaño y forma)", "Botones (tamaño y forma)"],
      ["Agenda (día / semana)", "Agenda (vistas y tareas visibles)"],
      ["Reloj en la tarea", "Reloj en la tarea"],
      ["Ayuda (máximo 3)", "Ayuda: qué puede pedir (máximo 3)"],
      ["Barrido por pulsadores", "Barrido por pulsadores (movilidad reducida)"],
    ];
    for (const [menuTitulo, pantallaTitulo] of pantallas) {
      await abrir(user, menuTitulo);
      expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent(pantallaTitulo);
      expect(screen.getByTestId("btn-barra-adelante")).toHaveTextContent("Guardar cambios");
      await pulsarAtrasSinGuardar(user);
    }
  });

  it("3. al abrir están elegidos los valores por defecto en cada subpantalla", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Fondo y colores");
    expect(screen.getByTestId("opcion-tema-claro").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByTestId("opcion-contraste-estandar").props.accessibilityState).toMatchObject({
      checked: true,
    });
    await pulsarAtrasSinGuardar(user);

    await abrir(user, "Texto y tipografía");
    expect(screen.getByTestId("opcion-caja-normal").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });

  it("4. «Atrás» vuelve al menú 16 SIN guardar los cambios y «Guardar cambios» los confirma con marca visual (RNF14.4)", async () => {
    const user = userEvent.setup();
    await montar();

    // Abrimos "Fondo y colores" (18), elegimos "Pastel", pero pulsamos "Atrás" (no debe guardar)
    await abrir(user, "Fondo y colores");
    await user.press(screen.getByTestId("opcion-tema-pastel"));
    expect(
      within(screen.getByLabelText("Tema de color principal")).getAllByTestId("icono-check", {
        includeHiddenElements: true,
      }),
    ).toHaveLength(1);
    await pulsarAtrasSinGuardar(user);
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Claro · Sin contraste" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.tema).toBe("claro");

    // Volvemos a abrir "Fondo y colores", elegimos "Pastel" y pulsamos "Guardar cambios"
    await abrir(user, "Fondo y colores");
    await user.press(screen.getByTestId("opcion-tema-pastel"));
    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Pastel · Sin contraste" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.tema).toBe("pastel");
  });

  it("5. Pantalla 17 (Qué se ve en las tareas): cambia formato visual y locución en vista previa y los persiste en PreferenciasProvider", async () => {
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

    await user.press(screen.getByTestId("opcion-locucion17-manual"));
    await pulsarGuardarCambios(user);

    expect(screen.getByRole("button", { name: "Qué se ve en tareas: Texto fácil" })).toBeTruthy();
    expect(leerEstadoSonda().preferencias.formatoTarea).toBe("textoFacil");
    expect(leerEstadoSonda().preferencias.canal).toBe("soloTexto");
    expect(leerEstadoSonda().preferencias.locucion).toBe("manual");
  });

  it("6. Pantalla 19 (Texto y tipografía) y 16b: aplica MAYÚSCULAS en vista previa y las etiquetas se ven tal cual", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Texto y tipografía");
    await user.press(screen.getByTestId("opcion-caja-mayusculas"));

    const tituloPrevia = StyleSheet.flatten(screen.getByTestId("preview-titulo-texto").props.style);
    expect(tituloPrevia.textTransform).toBe("uppercase");
    const etiquetaMinus = StyleSheet.flatten(screen.getByText("Minúsculas (Aa)").props.style);
    expect(etiquetaMinus.textTransform).toBe("none");

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Texto y tipografía: Lexend · Normal · MAYÚS." }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.caja).toBe("mayusculas");
  });

  it("7. Pantalla 22 (Botones tamaño y forma): actualiza la vista previa al momento (RF3.15) y guarda al confirmar", async () => {
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

  it("8. Pantalla 24 (Agenda): unifica vistaAgenda (Hoy/Semana) y contador «−» / «+» de 1 a 5 y «Todas»", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Agenda (día / semana)");

    expect(screen.getByTestId("valor-tareas-visibles")).toHaveTextContent("3 tareas");
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(3);

    // Bajamos con − hasta 1 tarea
    await user.press(screen.getByRole("button", { name: "Menos tareas" }));
    await user.press(screen.getByRole("button", { name: "Menos tareas" }));
    expect(screen.getByTestId("valor-tareas-visibles")).toHaveTextContent("1 tarea");
    expect(screen.getAllByTestId(/^muestra-Después-/)).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Menos tareas" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });

    // Subimos con + pasando por 2, 3, 4, 5 y Todas
    for (let i = 0; i < 5; i++) {
      await user.press(screen.getByRole("button", { name: "Más tareas" }));
    }
    expect(screen.getByTestId("valor-tareas-visibles")).toHaveTextContent("Todas");
    expect(screen.getAllByTestId(/^muestra-Después-/).length).toBeGreaterThan(5);
    expect(
      screen.getByRole("button", { name: "Más tareas" }).props.accessibilityState,
    ).toMatchObject({ disabled: true });

    // Cambiamos pantalla inicial a Semana completa (06b)
    await user.press(screen.getByTestId("vista-agenda-semanal"));
    await pulsarGuardarCambios(user);

    expect(
      screen.getByRole("button", { name: "Agenda (día / semana): Día y semana · Todas" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.vistaAgenda).toBe("semanal");
    expect(leerEstadoSonda().preferencias.tareasVisibles).toBe("todas");
  });

  it("9. Pantalla 25 (Reloj en la tarea): se elige con/sin reloj y con/sin aviso previo 5m y persiste", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Reloj en la tarea");

    expect(screen.getByTestId("muestra-reloj")).toBeTruthy();
    expect(screen.getByTestId("muestra-aviso-5m")).toBeTruthy();

    await user.press(screen.getByTestId("opcion-reloj25-no"));
    await user.press(screen.getByTestId("opcion-aviso25-no"));
    expect(screen.queryByTestId("muestra-reloj")).toBeNull();
    expect(screen.queryByTestId("muestra-aviso-5m")).toBeNull();

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Reloj en la tarea: Sin reloj · Sin aviso" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.reloj).toBe("no");
    expect(leerEstadoSonda().preferencias.avisoPrevio).toBe("no");
  });

  it("10. Pantalla 26 (Ayuda máx. 3): permite elegir varias hasta 3 y nunca ninguna (al menos 1 obligatoria)", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Ayuda (máximo 3)");

    expect(screen.getByTestId("contador-ayudas-26")).toHaveTextContent(
      "3 de 3 seleccionados (máx. 3)",
    );

    // Con 3 ya elegidas, tocar una 4ª ("Tengo hambre") no supera el límite de 3
    await user.press(screen.getByTestId("necesidad-desayuno"));
    expect(screen.getByTestId("necesidad-desayuno").props.accessibilityState).toMatchObject({
      checked: false,
    });

    // Quitamos "Beber agua" y "Descansar (propio)" -> queda solo "Ir al baño" (1 de 3)
    await user.press(screen.getByTestId("necesidad-agua"));
    await user.press(screen.getByTestId("necesidad-descanso"));
    expect(screen.queryByTestId("muestra-necesidad-agua")).toBeNull();
    expect(screen.getByTestId("muestra-necesidad-bano")).toBeTruthy();
    expect(screen.getByTestId("contador-ayudas-26")).toHaveTextContent(
      "1 de 3 seleccionados (máx. 3)",
    );

    // La última que queda ("Ir al baño") no se puede quitar: Ayuda nunca puede quedarse vacía
    await user.press(screen.getByTestId("necesidad-bano"));
    expect(screen.getByTestId("necesidad-bano").props.accessibilityState).toMatchObject({
      checked: true,
    });

    // Añadimos "Beber agua" y guardamos
    await user.press(screen.getByTestId("necesidad-agua"));
    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Ayuda (máximo 3): 2 ayudas (máx. 3)" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.ayudas).toEqual(["bano", "agua"]);
    expect(leerEstadoSonda().preferencias.necesidades).toEqual(["bano", "agua"]);
  });

  it("11. Barrido por pulsadores: actualiza PreferenciasProvider y sincroniza MotorBarridoProvider de verdad", async () => {
    const user = userEvent.setup();
    await montar();
    await abrir(user, "Barrido por pulsadores");

    await user.press(screen.getByTestId("opcion-barrido-automatico"));
    await user.press(screen.getByTestId("btn-barrido-vel-inc"));
    expect(screen.getByTestId("valor-barrido-vel")).toHaveTextContent("2,4 segundos");

    await pulsarGuardarCambios(user);
    expect(
      screen.getByRole("button", { name: "Barrido por pulsadores: Automático (1 pulsador)" }),
    ).toBeTruthy();
    expect(leerEstadoSonda().preferencias.modoBarrido).toBe("automatico");
    expect(leerEstadoSonda().preferencias.intervaloBarridoMs).toBe(2400);
    expect(leerEstadoSonda().motor.modo).toBe("automatico");
    expect(leerEstadoSonda().motor.intervaloMs).toBe(2400);
  });

  it("12. «Volver a lo de siempre» restablece todas las preferencias (incluidas las nuevas y el tema)", async () => {
    const user = userEvent.setup();
    await montar();

    await abrir(user, "Fondo y colores");
    await user.press(screen.getByTestId("opcion-tema-oscuro"));
    await pulsarGuardarCambios(user);

    await abrir(user, "Botones (tamaño y forma)");
    await user.press(screen.getByTestId("opcion-forma-pill"));
    await pulsarGuardarCambios(user);

    await abrir(user, "Reloj en la tarea");
    await user.press(screen.getByTestId("opcion-reloj25-no"));
    await user.press(screen.getByTestId("opcion-aviso25-no"));
    await pulsarGuardarCambios(user);

    await user.press(screen.getByRole("button", { name: "Volver a lo de siempre" }));
    expect(
      screen.getByRole("button", { name: "Fondo y colores: Claro · Sin contraste" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Botones (tamaño y forma): Grande · Redondeados" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reloj en la tarea: Con reloj · Aviso 5m" }),
    ).toBeTruthy();
  });
});
