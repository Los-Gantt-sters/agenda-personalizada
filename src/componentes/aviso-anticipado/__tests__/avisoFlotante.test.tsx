import { act, render, screen, userEvent } from "@testing-library/react-native";
import { Vibration } from "react-native";
import type { EntradaAgenda } from "../../agenda/tipos";
import { AgendaDelDia } from "../../agenda/AgendaDelDia";
import { crearRepositorioMemoria } from "../../agenda/repositorioMemoria";
import { agendaDemoAviso } from "../../agenda/datosDemo";
import { hoyISO } from "../../agenda/useAgendaDia";
import { AvisoFlotante, VIBRACION_MS } from "../AvisoFlotante";
import { crearEventoAviso, momentoAviso } from "../logica";
import { AVISO_POR_DEFECTO } from "../tipos";
import { reproducirSonido } from "../../../servicios/sonidos";

// La agenda compila el reloj (SVG): sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const reprografia: EntradaAgenda = {
  id: "e4",
  estudiante_id: "al1",
  tarea_id: "t4",
  fecha: "2026-11-05",
  hora_inicio: "10:45",
  duracion_prevista_min: 45,
  orden: 4,
  estado: "pendiente",
  tarea: { id: "t4", titulo: "Reprografía", emoji: "🖨️", pictograma_url: null },
};
const evento = (tipo: "visual" | "sonoro" = "sonoro") =>
  crearEventoAviso(reprografia, { antelacionMin: 5, tipo }, new Date(2026, 10, 5, 10, 40));

describe("AvisoFlotante (SCRUM-83: T-16.2 Ventana emergente con pictograma y vibración)", () => {
  let vibrar: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    vibrar = jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    vibrar.mockRestore();
  });

  it("BDD: emerge una tarjeta con el pictograma de la fotocopiadora", async () => {
    await render(<AvisoFlotante aviso={evento()} onCerrar={() => {}} />);
    expect(screen.getByText("🖨️")).toBeTruthy();
    expect(screen.getByLabelText("Dibujo de Reprografía")).toBeTruthy();
    expect(screen.getByTestId("aviso-anticipado").props.accessibilityLabel).toBe(
      "Dentro de 5 minutos: Reprografía. Toca para cerrar.",
    );
  });

  it("vibra un poco y suena suave al aparecer", async () => {
    await render(<AvisoFlotante aviso={evento()} onCerrar={() => {}} />);
    expect(vibrar).toHaveBeenCalledWith(VIBRACION_MS);
    expect(reproducirSonido).toHaveBeenCalledWith("aviso", 0.4);
  });

  it("RNF4.3: en modo solo visual no suena ni vibra", async () => {
    await render(
      <AvisoFlotante
        aviso={evento("visual")}
        preferencias={{ ...AVISO_POR_DEFECTO, vibracion: false }}
        onCerrar={() => {}}
      />,
    );
    expect(screen.getByTestId("aviso-anticipado")).toBeTruthy();
    expect(vibrar).not.toHaveBeenCalled();
    expect(reproducirSonido).not.toHaveBeenCalled();
  });

  it("se cierra sola a los 15 segundos", async () => {
    const onCerrar = jest.fn();
    await render(<AvisoFlotante aviso={evento()} onCerrar={onCerrar} />);
    await act(async () => jest.advanceTimersByTime(14_999));
    expect(onCerrar).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(1));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("BDD: al tocar el aviso se cierra y la tarea en curso no cambia", async () => {
    // A media mañana, para que las horas movidas no pasen de medianoche.
    jest.setSystemTime(new Date(2026, 10, 5, 10, 0, 20));
    const hoy = agendaDemoAviso(hoyISO());
    const { repo } = crearRepositorioMemoria(hoy);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AgendaDelDia repo={repo} estudianteId={hoy[0].estudiante_id} />);
    await act(async () => jest.advanceTimersByTime(0));
    expect(screen.getByTestId("bloque-ahora").props.accessibilityLabel).toBe(
      "Ahora: Lavarse las manos",
    );
    expect(screen.queryByTestId("aviso-anticipado")).toBeNull();

    // Llega la hora del aviso de «Reprografía».
    const espera = momentoAviso(hoy[3], 5).getTime() - Date.now();
    await act(async () => jest.advanceTimersByTime(espera));
    expect(screen.getByTestId("aviso-anticipado").props.accessibilityLabel).toContain(
      "Reprografía",
    );

    await user.press(screen.getByTestId("aviso-anticipado"));
    expect(screen.queryByTestId("aviso-anticipado")).toBeNull();
    expect(screen.getByTestId("bloque-ahora").props.accessibilityLabel).toBe(
      "Ahora: Lavarse las manos",
    );
    const servidor = await repo.obtenerSecuenciaDia(hoy[0].estudiante_id, hoy[0].fecha);
    expect(servidor.map((e) => e.estado)).toEqual(hoy.map((e) => e.estado));
  });
});
