import { act, fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { BLOQUEO_AL_APARECER_MS, BotonAccionTarea } from "../BotonAccionTarea";

// Mejora de la profesora (noviembre de 2026): «Empezar» y «Terminar» van con un toque y «Atrás»
// deshace si el alumno se equivoca. Sustituye a los antitoques de T-08.2 (mantener 1,5 s o «¿Seguro?»).
jest.setTimeout(20_000);

// Un toque (o activarlo con el lector de pantalla, que en un botón normal es lo mismo).
const activar = (nombre: string) => fireEvent.press(screen.getByRole("button", { name: nombre }));

describe("Un toque y Atrás para deshacer (mejora de la profesora; antes T-08.2)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("un toque normal basta: no hay que mantenerlo pulsado ni contestar «¿Seguro?»", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="empezar" onConfirmar={onConfirmar} />);
    await act(() => jest.advanceTimersByTime(1000));

    await user.press(screen.getByRole("button", { name: "Empezar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("¿Seguro?")).toBeNull();
    expect(screen.queryByText("Mantén pulsado")).toBeNull();
  });

  it("recién aparecido no hace caso (el mismo toque no vale para Empezar y Terminar)", async () => {
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="terminar" onConfirmar={onConfirmar} />);

    await activar("Terminar");
    expect(onConfirmar).not.toHaveBeenCalled();

    await act(() => jest.advanceTimersByTime(BLOQUEO_AL_APARECER_MS + 50));
    await activar("Terminar");
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("solo confirma una vez aunque se toque dos veces seguidas", async () => {
    const onConfirmar = jest.fn();
    await render(<BotonAccionTarea accion="terminar" onConfirmar={onConfirmar} />);
    await act(() => jest.advanceTimersByTime(1000));

    await activar("Terminar");
    await activar("Terminar");
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it("dice al lector de pantalla que «Atrás» lo deshace", async () => {
    await render(<BotonAccionTarea accion="empezar" onConfirmar={() => {}} />);
    expect(screen.getByRole("button", { name: "Empezar" }).props.accessibilityHint).toMatch(
      /Atrás/,
    );
  });
});
