import { act, fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";
import { reproducirSonido } from "../../src/servicios/sonidos";
import {
  AgendaDelDia,
  ESTUDIANTE_DEMO,
  agendaDemo,
  crearRepositorioMemoria,
  hoyISO,
} from "../../src/componentes/agenda";
import { PREFERENCIAS_EJECUCION_POR_DEFECTO } from "../../src/componentes/ejecucion-tarea";

// La primera prueba compila el reloj (SVG) y la agenda: sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

// El reloj visual y el refuerzo usan sonidos; en las pruebas no suenan.
jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

// T-06.4 oculta la barra de estado; la de verdad deja colgadas las pruebas con temporizadores falsos.
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  // Sin ?estudiante= la pantalla abre la demo con datos de ejemplo.
  useLocalSearchParams: () => ({}),
}));

const etiqueta = (id: string) => screen.getByTestId(id).props.accessibilityLabel;
// T-08.2: un botón recién aparecido no hace caso durante 0,8 s (antitoques).
const pasaElBloqueo = () => act(() => new Promise<void>((r) => setTimeout(r, 850)));
const activar = (boton: ReturnType<typeof screen.getByRole>) =>
  fireEvent(boton, "accessibilityAction", { nativeEvent: { actionName: "activate" } });

describe("Pantalla agenda del día (SCRUM-69 y SCRUM-70)", () => {
  it("muestra los tres bloques con la tarea de ahora en el centro (T-06.1)", async () => {
    await render(<PantallaAgenda />);

    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea");
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    // En la demo, «Lavarse las manos» pide pulsar «Empezar» primero (HU-08, RF6.8).
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("al pulsar una tarjeta abre su detalle y se cierra con Cerrar (RF4.4)", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);

    await user.press(await screen.findByTestId("mini-e3"));
    expect(screen.getByText("Tomamos el desayuno en clase.")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByText("Tomamos el desayuno en clase.")).toBeNull();
  });

  it("al confirmar el fin, la tarea pasa a Hecho y la siguiente a Ahora (RF4.3, T-06.2)", async () => {
    await render(<PantallaAgenda />);
    // Con lector de pantalla basta con activar el botón (sin mantenerlo pulsado).
    await pasaElBloqueo();
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await screen.findByRole("button", { name: "Terminar" });
    await pasaElBloqueo();
    await activar(screen.getByRole("button", { name: "Terminar" }));

    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea, Lavarse las manos");
  });
});

describe("Pantalla agenda del día (SCRUM-74: T-08.1 Botones EMPEZAR / TERMINAR)", () => {
  afterEach(() => jest.useRealTimers());

  it("BDD: al mantener Empezar 1,5 s la tarea pasa a EN CURSO, se guarda la hora y arranca el reloj", async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 5, 9, 32) });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAgenda />);

    await user.longPress(await screen.findByRole("button", { name: "Empezar" }), {
      duration: 1600,
    });

    await waitFor(() =>
      expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos, en curso"),
    );
    expect(screen.getByText("Empezaste a las 9:32")).toBeTruthy();
    expect(screen.getByLabelText(/^Reloj visual:/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
  });

  it("un toque corto en Empezar no hace nada (RNF6.1)", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAgenda />);

    await user.longPress(await screen.findByRole("button", { name: "Empezar" }), {
      duration: 300,
    });
    await act(() => jest.advanceTimersByTime(2000));

    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    expect(screen.queryByRole("button", { name: "Terminar" })).toBeNull();
  });

  it("BDD: al pulsar Terminar sale el refuerzo positivo con sonido y Seguir vuelve a la agenda", async () => {
    await render(<PantallaAgenda />);
    await pasaElBloqueo();
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await screen.findByRole("button", { name: "Terminar" });
    await pasaElBloqueo();
    await activar(screen.getByRole("button", { name: "Terminar" }));

    expect(await screen.findByText("¡Muy bien!")).toBeTruthy();
    expect(screen.getByText("Has terminado: Lavarse las manos")).toBeTruthy();
    expect(reproducirSonido).toHaveBeenCalledWith("refuerzo", expect.any(Number));

    await userEvent.setup().press(screen.getByRole("button", { name: "Seguir" }));
    await waitFor(() => expect(screen.queryByText("¡Muy bien!")).toBeNull());
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno");
  });

  it("si el tutor no pide registrar el inicio (RF6.8), sale directamente Terminar", async () => {
    await render(<PantallaAgenda />);
    await pasaElBloqueo();
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    await screen.findByRole("button", { name: "Terminar" });
    await pasaElBloqueo();
    await activar(screen.getByRole("button", { name: "Terminar" }));
    await userEvent.setup().press(await screen.findByRole("button", { name: "Seguir" }));

    // «Desayuno» no lo pide.
    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
  });

  it("no hay ningún campo de texto para el estudiante (RNF6.4)", async () => {
    await render(<PantallaAgenda />);
    await activar(await screen.findByRole("button", { name: "Empezar" }));
    expect(JSON.stringify(screen.toJSON())).not.toContain('"type":"TextInput"');
  });
});

describe("Pantalla agenda del día (SCRUM-75: T-08.2 Antitoques accidentales)", () => {
  it("con el modo simple del perfil, Empezar pregunta «¿Seguro?» antes de ponerla en curso", async () => {
    const user = userEvent.setup();
    const { repo } = crearRepositorioMemoria(agendaDemo(hoyISO()));
    await render(
      <AgendaDelDia
        repo={repo}
        estudianteId={ESTUDIANTE_DEMO}
        preferencias={{
          ...PREFERENCIAS_EJECUCION_POR_DEFECTO,
          confirmacion: { ...PREFERENCIAS_EJECUCION_POR_DEFECTO.confirmacion, modo: "simple" },
        }}
      />,
    );
    await screen.findByRole("button", { name: "Empezar" });
    await pasaElBloqueo();

    await user.press(screen.getByRole("button", { name: "Empezar" }));
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    await user.press(screen.getByRole("button", { name: "Sí, empezar" }));
    await waitFor(() =>
      expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos, en curso"),
    );
  });
});

describe("Pantalla agenda del día (mejoras de la profesora: permisos y tareas que se ven)", () => {
  const repoDemo = () => crearRepositorioMemoria(agendaDemo(hoyISO())).repo;

  it("lleva cabecera «Mi agenda» y barra de abajo; el alumno no puede ir Atrás", async () => {
    await render(<PantallaAgenda />);
    await screen.findByTestId("bloque-ahora");
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Mi agenda");
    expect(screen.getByTestId("btn-barra-atras").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("la familia ve la misma agenda pero sin Empezar ni Terminar (solo mirar)", async () => {
    await render(<AgendaDelDia repo={repoDemo()} estudianteId={ESTUDIANTE_DEMO} soloMirar />);
    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    expect(screen.getByTestId("aviso-solo-mirar")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Terminar" })).toBeNull();
  });

  it("con «Solo 1», en Después se ve solo la tarea siguiente", async () => {
    await render(
      <AgendaDelDia repo={repoDemo()} estudianteId={ESTUDIANTE_DEMO} tareasVisibles={1} />,
    );
    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-despues")).toBe("Después: Desayuno");
  });

  it("con «Todas», Después enseña más de 3 tareas o dice «y N más»", async () => {
    await render(
      <AgendaDelDia repo={repoDemo()} estudianteId={ESTUDIANTE_DEMO} tareasVisibles={99} />,
    );
    await screen.findByTestId("bloque-ahora");
    const despues = etiqueta("bloque-despues") as string;
    const vistas = despues
      .replace(/ y \d+ más$/, "")
      .replace("Después: ", "")
      .split(", ");
    const ocultas = Number(/ y (\d+) más$/.exec(despues)?.[1] ?? 0);
    expect(vistas.length + ocultas).toBeGreaterThan(3);
  });
});
