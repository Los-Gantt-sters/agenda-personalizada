import { act, render, screen, userEvent, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { AREA_TACTIL_MINIMA, BotonAccionTarea } from "../BotonAccionTarea";
import { RefuerzoPositivo } from "../RefuerzoPositivo";
import { ProveedorNecesidades } from "../../../necesidades";
import { msDesde } from "../useTranscurrido";
import { reproducirSonido } from "../../../servicios/sonidos";

// La primera prueba compila el reloj (SVG) y la agenda: sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
// El refuerzo es una pantalla con barra de abajo (Atrás / Adelante): necesita el router.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

describe("Ejecución de tarea (SCRUM-74: T-08.1 Botones EMPEZAR / TERMINAR)", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("los botones son texto grande con «Mantén pulsado» debajo, sin pictograma", async () => {
    await render(<BotonAccionTarea accion="terminar" onConfirmar={() => {}} />);
    const texto = screen.getByText("Terminar");
    // Mayúsculas o minúsculas las elige el centro en las preferencias («Tipografía escolar»).
    expect(StyleSheet.flatten(texto.props.style).textTransform).toBeUndefined();
    expect(StyleSheet.flatten(texto.props.style).fontSize).toBeGreaterThanOrEqual(36);
    expect(screen.getByText("Mantén pulsado")).toBeTruthy();
    expect(screen.queryByRole("image")).toBeNull();
  });

  it("el área táctil es de al menos 48 × 48 px (RNF6.3)", async () => {
    await render(<BotonAccionTarea accion="empezar" onConfirmar={() => {}} />);
    const estilo = StyleSheet.flatten(
      screen.getByRole("button", { name: "Empezar" }).props.style,
    ) as { minHeight: number; minWidth: number };
    expect(estilo.minHeight).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA);
    expect(estilo.minWidth).toBeGreaterThanOrEqual(AREA_TACTIL_MINIMA);
  });

  it("confirma solo tras mantenerlo pulsado 1,5 s (RNF6.1)", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="terminar" onConfirmar={onConfirmar} />);
    const boton = screen.getByRole("button", { name: "Terminar" });

    await user.longPress(boton, { duration: 800 });
    await act(() => jest.advanceTimersByTime(2000));
    expect(onConfirmar).not.toHaveBeenCalled();

    await user.longPress(boton, { duration: 1600 });
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("el refuerzo enseña el nombre, la tarea y suena si el perfil lo pide (RF6.4)", async () => {
    await render(
      <RefuerzoPositivo
        tarea="Lavarse las manos"
        nombre="Marcos"
        preferencias={{ animacion: "estrellas", sonido: true }}
        onSeguir={() => {}}
      />,
    );
    expect(screen.getByText("¡Muy bien, Marcos!")).toBeTruthy();
    expect(screen.getByText("Has terminado: Lavarse las manos")).toBeTruthy();
    expect(reproducirSonido).toHaveBeenCalledWith("refuerzo", expect.any(Number));
  });

  it("sin sonido en el perfil, no suena; sin tarea, no se enseña", async () => {
    const { rerender } = await render(
      <RefuerzoPositivo
        tarea="Recreo"
        preferencias={{ animacion: "ninguna", sonido: false }}
        onSeguir={() => {}}
      />,
    );
    expect(screen.getByText("¡Muy bien!")).toBeTruthy();
    expect(reproducirSonido).not.toHaveBeenCalled();

    await rerender(
      <RefuerzoPositivo
        tarea={null}
        preferencias={{ animacion: "check", sonido: true }}
        onSeguir={() => {}}
      />,
    );
    expect(screen.queryByText("¡Muy bien!")).toBeNull();
  });

  it("pregunta «¿Cómo te has sentido?»; la respuesta se entrega al pulsar Seguir", async () => {
    const user = userEvent.setup();
    const onSeguir = jest.fn();
    const onEmocion = jest.fn();
    await render(
      <RefuerzoPositivo
        tarea="Recreo"
        preferencias={{ animacion: "ninguna", sonido: false }}
        onSeguir={onSeguir}
        onEmocion={onEmocion}
      />,
    );
    expect(screen.getByText("¿Cómo te has sentido?")).toBeTruthy();
    const contento = screen.getByRole("radio", { name: "Contento" });
    await user.press(contento);
    expect(screen.getByRole("radio", { name: "Contento" }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(onEmocion).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Seguir" }));
    expect(onEmocion).toHaveBeenCalledWith("contento");
    expect(onSeguir).toHaveBeenCalledTimes(1);
  });

  it("contestar no es obligatorio: Seguir (o Adelante en la barra) funciona sin elegir", async () => {
    const user = userEvent.setup();
    const onSeguir = jest.fn();
    const onEmocion = jest.fn();
    await render(
      <RefuerzoPositivo
        tarea="Recreo"
        preferencias={{ animacion: "ninguna", sonido: false }}
        onSeguir={onSeguir}
        onEmocion={onEmocion}
      />,
    );
    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(onSeguir).toHaveBeenCalledTimes(1);
    expect(onEmocion).not.toHaveBeenCalled();
  });

  it("«Ayuda» dentro de la felicitación abre una sola ventana, la de encima", async () => {
    const user = userEvent.setup();
    await render(
      <ProveedorNecesidades inicialmenteVisible={false}>
        <RefuerzoPositivo
          tarea="Recreo"
          preferencias={{ animacion: "ninguna", sonido: false }}
          onSeguir={() => {}}
        />
      </ProveedorNecesidades>,
    );
    await user.press(screen.getByTestId("btn-necesidades"));
    expect(screen.getAllByTestId("btn-cerrar-modal-necesidades")).toHaveLength(1);
    // Está dentro de la felicitación (encima), no en la raíz (debajo, sin verse).
    expect(
      within(screen.getByTestId("refuerzo-positivo")).getByTestId("btn-cerrar-modal-necesidades"),
    ).toBeTruthy();
    await user.press(screen.getByTestId("btn-cerrar-modal-necesidades"));
    expect(screen.queryByTestId("btn-cerrar-modal-necesidades")).toBeNull();
  });

  it("sin sonido en el perfil, elegir emoción y Seguir tampoco suenan (RF6.4)", async () => {
    const user = userEvent.setup();
    await render(
      <RefuerzoPositivo
        tarea="Recreo"
        preferencias={{ animacion: "ninguna", sonido: false }}
        onSeguir={() => {}}
      />,
    );
    await user.press(screen.getByRole("radio", { name: "Triste" }));
    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(reproducirSonido).not.toHaveBeenCalled();
  });

  it("cuenta el tiempo desde la hora de inicio guardada", () => {
    const inicio = "2026-11-05T09:00:00.000Z";
    expect(msDesde(inicio, Date.parse("2026-11-05T09:15:00.000Z"))).toBe(15 * 60_000);
    expect(msDesde(null)).toBe(0);
    expect(msDesde("no es fecha")).toBe(0);
  });
});
