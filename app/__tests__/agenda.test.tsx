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
import { TAM_RELOJ_TAREA } from "../../src/componentes/agenda/PantallaTarea";
import { PreferenciasProvider } from "../../src/preferencias";
import { TemaProvider } from "../../src/temas";

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
// Un botón recién aparecido no hace caso durante 0,8 s (el mismo toque no vale para dos cosas).
const pasaElBloqueo = () => act(() => new Promise<void>((r) => setTimeout(r, 850)));
const tocar = (boton: ReturnType<typeof screen.getByRole>) => fireEvent.press(boton);

/** Empieza «Lavarse las manos» (la demo la pide empezar) y espera a la pantalla de la tarea. */
async function empezarLavarse() {
  await pasaElBloqueo();
  tocar(await screen.findByRole("button", { name: "Empezar" }));
  await screen.findByTestId("pantalla-tarea-en-curso");
}

/** Pulsa «Terminar» en la pantalla de la tarea y espera a la felicitación. */
async function terminarTarea() {
  await pasaElBloqueo();
  tocar(screen.getByRole("button", { name: "Terminar" }));
  await screen.findByText("¡Muy bien!");
}

describe("Pantalla agenda del día (SCRUM-69 y SCRUM-70)", () => {
  it("muestra los tres bloques con la tarea de ahora en el centro (T-06.1)", async () => {
    await render(<PantallaAgenda />);

    await screen.findByTestId("bloque-ahora");
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea");
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
    // En la demo, «Lavarse las manos» pide pulsar «Empezar» primero (HU-08, RF6.8).
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("al pulsar una tarjeta abre su pantalla (sin ventana) y «Atrás» vuelve a la agenda (RF4.4)", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);

    await user.press(await screen.findByTestId("mini-e3"));
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Desayuno");
    expect(screen.getByText("Tomamos el desayuno en clase.")).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain("RCTModalHostView");
    // El detalle no tiene «Terminar»: solo se termina la tarea de «Ahora».
    expect(screen.queryByRole("button", { name: "Terminar" })).toBeNull();

    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(await screen.findByTestId("bloque-ahora")).toBeTruthy();
    expect(screen.queryByText("Tomamos el desayuno en clase.")).toBeNull();
  });

  it("al terminar, la tarea pasa a Hecho y la siguiente a Ahora (RF4.3, T-06.2)", async () => {
    await render(<PantallaAgenda />);
    await empezarLavarse();
    await terminarTarea();
    await userEvent.setup().press(screen.getByTestId("btn-barra-adelante"));

    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(etiqueta("bloque-hecho")).toBe("Hecho: Asamblea, Lavarse las manos");
  });
});

describe("Pantalla agenda del día (SCRUM-74 y mejoras de la profesora: un toque y Atrás)", () => {
  afterEach(() => jest.useRealTimers());

  it("BDD: con un toque en Empezar solo se ve la tarea, con la hora, los pasos y un reloj pequeño", async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 5, 9, 32) });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAgenda />);
    const empezar = await screen.findByRole("button", { name: "Empezar" });
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(empezar);

    expect(await screen.findByTestId("pantalla-tarea-en-curso")).toBeTruthy();
    // Arriba el nombre de la tarea; sin «Hecho» ni «Después».
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Lavarse las manos");
    expect(screen.queryByTestId("bloque-hecho")).toBeNull();
    expect(screen.queryByTestId("bloque-despues")).toBeNull();
    expect(screen.getByText("Empezaste a las 9:32")).toBeTruthy();
    expect(screen.getByText("Antes del desayuno nos lavamos las manos.")).toBeTruthy();
    expect(screen.getByText("Paso 1 de 4: Abre el grifo.")).toBeTruthy();
    expect(screen.getByLabelText(/^Reloj visual:/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
  });

  it("«Atrás» en la tarea empezada la deshace: vuelve a la agenda sin empezar", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);
    await empezarLavarse();

    await user.press(screen.getByTestId("btn-barra-atras"));

    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos"));
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
  });

  it("BDD: al pulsar Terminar sale el refuerzo con sonido y Seguir vuelve a la agenda", async () => {
    await render(<PantallaAgenda />);
    await empezarLavarse();
    await terminarTarea();

    expect(screen.getByText("Has terminado: Lavarse las manos")).toBeTruthy();
    expect(reproducirSonido).toHaveBeenCalledWith("refuerzo", expect.any(Number));

    await userEvent.setup().press(screen.getByRole("button", { name: "Seguir" }));
    await waitFor(() => expect(screen.queryByText("¡Muy bien!")).toBeNull());
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno");
  });

  it("«Atrás» en la felicitación deshace Terminar: la tarea vuelve a estar en curso", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);
    await empezarLavarse();
    await terminarTarea();

    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByTestId("pantalla-tarea-en-curso")).toBeTruthy();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Lavarse las manos");
    expect(screen.queryByText("¡Muy bien!")).toBeNull();
  });

  it("si el tutor no pide registrar el inicio (RF6.8), sale directamente Terminar; Atrás lo deshace", async () => {
    const user = userEvent.setup();
    await render(<PantallaAgenda />);
    await empezarLavarse();
    await terminarTarea();
    await user.press(screen.getByRole("button", { name: "Seguir" }));

    // «Desayuno» no lo pide: Terminar en la agenda, sin pasar por la pantalla de la tarea.
    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
    await pasaElBloqueo();
    tocar(screen.getByRole("button", { name: "Terminar" }));
    await screen.findByText("Has terminado: Desayuno");

    await user.press(screen.getByTestId("btn-barra-atras"));
    await waitFor(() => expect(etiqueta("bloque-ahora")).toBe("Ahora: Desayuno"));
    expect(screen.getByRole("button", { name: "Terminar" })).toBeTruthy();
  });

  it("no hay ningún campo de texto para el estudiante (RNF6.4)", async () => {
    await render(<PantallaAgenda />);
    await empezarLavarse();
    expect(JSON.stringify(screen.toJSON())).not.toContain('"type":"TextInput"');
  });
});

describe("Pantalla de la tarea (mejoras de la profesora: formato y reloj)", () => {
  const repoEnCurso = () =>
    crearRepositorioMemoria(
      agendaDemo(hoyISO()).map((e) =>
        e.id === "e2"
          ? { ...e, estado: "en_curso" as const, inicio_real: new Date().toISOString() }
          : e,
      ),
    ).repo;

  it("una tarea en curso se ve sola al abrir la agenda (también tras recargar)", async () => {
    await render(<AgendaDelDia repo={repoEnCurso()} estudianteId={ESTUDIANTE_DEMO} />);
    expect(await screen.findByTestId("pantalla-tarea-en-curso")).toBeTruthy();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Lavarse las manos");
  });

  it("un adulto que abre la agenda con una tarea empezada ve la agenda; su Atrás no la deshace", async () => {
    const repo = repoEnCurso();
    const desmarcar = jest.spyOn(repo, "desmarcarEnCurso");
    const volverAlPanel = jest.fn();
    await render(
      <AgendaDelDia
        repo={repo}
        estudianteId={ESTUDIANTE_DEMO}
        abrirTareaEnCurso={false}
        marco={{ titulo: "Agenda del alumno", alAtras: volverAlPanel }}
      />,
    );
    await screen.findByTestId("bloque-ahora");
    expect(screen.queryByTestId("pantalla-tarea-en-curso")).toBeNull();
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos, en curso");

    fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(volverAlPanel).toHaveBeenCalledTimes(1);
    expect(desmarcar).not.toHaveBeenCalled();
  });

  it("si el adulto pulsa él «Empezar», también pasa a la pantalla de la tarea", async () => {
    await render(
      <AgendaDelDia
        repo={crearRepositorioMemoria(agendaDemo(hoyISO())).repo}
        estudianteId={ESTUDIANTE_DEMO}
        abrirTareaEnCurso={false}
      />,
    );
    await empezarLavarse();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Lavarse las manos");
  });

  it("con la preferencia «Sin reloj» la tarea en curso no enseña reloj", async () => {
    await render(
      <AgendaDelDia repo={repoEnCurso()} estudianteId={ESTUDIANTE_DEMO} verReloj={false} />,
    );
    await screen.findByTestId("pantalla-tarea-en-curso");
    expect(screen.queryByTestId("reloj-tarea")).toBeNull();
    expect(screen.queryByLabelText(/^Reloj visual:/)).toBeNull();
  });

  it("el reloj es pequeño: mucho más que el dibujo de la tarea", async () => {
    await render(<AgendaDelDia repo={repoEnCurso()} estudianteId={ESTUDIANTE_DEMO} />);
    await screen.findByTestId("reloj-tarea");
    expect(TAM_RELOJ_TAREA).toBeLessThanOrEqual(120);
  });

  it("el formato sale de las preferencias y se puede cambiar dentro de la tarea", async () => {
    const user = userEvent.setup();
    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ canal: "soloPictograma" }}>
          <AgendaDelDia repo={repoEnCurso()} estudianteId={ESTUDIANTE_DEMO} />
        </PreferenciasProvider>
      </TemaProvider>,
    );
    await screen.findByTestId("pantalla-tarea-en-curso");
    expect(screen.getByTestId("formato-soloPictograma").props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.queryByTestId("tarea-titulo-grande")).toBeNull();

    await user.press(screen.getByTestId("formato-soloTexto"));
    expect(screen.getByTestId("tarea-titulo-grande")).toHaveTextContent("Lavarse las manos");
    expect(screen.queryByLabelText("Dibujo de Lavarse las manos")).toBeNull();
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
