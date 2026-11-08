import { act, fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { BotonAccionTarea, ESPERA_PREGUNTA_MS } from "../BotonAccionTarea";
import { CONFIRMACION_POR_DEFECTO, type PreferenciasConfirmacion } from "../tipos";

// La primera prueba compila el reloj (SVG) y la agenda: sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

const SIMPLE: PreferenciasConfirmacion = { ...CONFIRMACION_POR_DEFECTO, modo: "simple" };
const activar = (nombre: string) =>
  fireEvent(screen.getByRole("button", { name: nombre }), "accessibilityAction", {
    nativeEvent: { actionName: "activate" },
  });

describe("Antitoques accidentales (SCRUM-75: T-08.2 RNF6.1)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("por defecto hay que mantener 1,5 s: un toque corto no confirma", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="empezar" onConfirmar={onConfirmar} />);
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(screen.getByRole("button", { name: "Empezar" }));
    await act(() => jest.advanceTimersByTime(2000));
    expect(onConfirmar).not.toHaveBeenCalled();

    await user.longPress(screen.getByRole("button", { name: "Empezar" }), { duration: 1600 });
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("modo simple: un toque pregunta «¿Seguro?» y Sí confirma", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onConfirmar = jest.fn();
    await render(
      <BotonAccionTarea accion="terminar" confirmacion={SIMPLE} onConfirmar={onConfirmar} />,
    );
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(screen.getByRole("button", { name: "Terminar" }));
    expect(screen.getByText("¿Seguro?")).toBeTruthy();
    expect(onConfirmar).not.toHaveBeenCalled();

    await user.press(screen.getByRole("button", { name: "Sí, terminar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("modo simple: No vuelve atrás sin confirmar", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onConfirmar = jest.fn();
    await render(
      <BotonAccionTarea accion="empezar" confirmacion={SIMPLE} onConfirmar={onConfirmar} />,
    );
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(screen.getByRole("button", { name: "Empezar" }));
    await user.press(screen.getByRole("button", { name: "No" }));
    expect(screen.queryByText("¿Seguro?")).toBeNull();
    expect(screen.getByRole("button", { name: "Empezar" })).toBeTruthy();
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("modo simple: si no contesta, la pregunta se quita sola", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(
      <BotonAccionTarea accion="empezar" confirmacion={SIMPLE} onConfirmar={() => {}} />,
    );
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(screen.getByRole("button", { name: "Empezar" }));
    await act(() => jest.advanceTimersByTime(ESPERA_PREGUNTA_MS + 100));
    expect(screen.queryByText("¿Seguro?")).toBeNull();
  });

  it("recién aparecido no hace caso (el mismo toque no vale para Empezar y Terminar)", async () => {
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="terminar" onConfirmar={onConfirmar} />);

    await activar("Terminar");
    expect(onConfirmar).not.toHaveBeenCalled();

    await act(() => jest.advanceTimersByTime(CONFIRMACION_POR_DEFECTO.bloqueoAlAparecerMs + 50));
    await activar("Terminar");
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("solo confirma una vez aunque se active dos veces seguidas", async () => {
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="terminar" onConfirmar={onConfirmar} />);
    await act(() => jest.advanceTimersByTime(1000));

    await activar("Terminar");
    await activar("Terminar");
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });
});
