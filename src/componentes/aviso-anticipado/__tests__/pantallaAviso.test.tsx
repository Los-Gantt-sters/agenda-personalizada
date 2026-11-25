import { act, render, screen, userEvent } from "@testing-library/react-native";
import { Vibration } from "react-native";
import { AgendaDelDia } from "../../agenda/AgendaDelDia";
import { agendaDemoAviso } from "../../agenda/datosDemo";
import { crearRepositorioMemoria } from "../../agenda/repositorioMemoria";
import type { EntradaAgenda } from "../../agenda/tipos";
import { hoyISO } from "../../agenda/useAgendaDia";
import { BLOQUEO_AL_APARECER_MS } from "../../ejecucion-tarea/BotonAccionTarea";
import { VIBRACION_MS } from "../AvisoFlotante";
import { crearEventoAviso, momentoAviso, momentoInicio, siguienteTarea } from "../logica";
import { PantallaAviso } from "../PantallaAviso";
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
const evento = () =>
  crearEventoAviso(
    reprografia,
    { antelacionMin: 5, tipo: "sonoro" },
    new Date(2026, 10, 5, 10, 40),
  );

describe("Pantalla 08b «Pronto cambia la actividad» (SCRUM-264: T-08.6)", () => {
  let vibrar: jest.SpyInstance;
  beforeEach(() => {
    jest.useFakeTimers();
    // A media mañana, para que las horas movidas no pasen de medianoche.
    jest.setSystemTime(new Date(2026, 10, 5, 10, 0, 20));
    vibrar = jest.spyOn(Vibration, "vibrate").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    vibrar.mockRestore();
  });

  /** Agenda con «Lavarse las manos» en curso, abierta como la ve el alumno (paso a paso, 07). */
  async function abrirConTareaEnCurso() {
    const hoy = agendaDemoAviso(hoyISO()).map((e) =>
      e.id === "e2"
        ? { ...e, estado: "en_curso" as const, inicio_real: new Date().toISOString() }
        : e,
    );
    const { repo, tutor } = crearRepositorioMemoria(hoy);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<AgendaDelDia repo={repo} estudianteId={hoy[0].estudiante_id} />);
    await act(async () => jest.advanceTimersByTime(0));
    return { hoy, repo, tutor, user };
  }

  const hastaElAviso = async (hoy: EntradaAgenda[]) => {
    const espera = momentoAviso(hoy[3], 5).getTime() - Date.now();
    await act(async () => jest.advanceTimersByTime(espera));
  };

  it("enseña el título, cuánto falta, el dibujo, el nombre y «Vale»", async () => {
    await render(<PantallaAviso aviso={evento()} onCerrar={() => {}} />);
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Pronto cambia la actividad");
    expect(screen.getByText("En 5 minutos toca:")).toBeTruthy();
    expect(screen.getByText("Reprografía")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vale" })).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).not.toContain("RCTModalHostView");
  });

  it("vibra y suena suave una sola vez al aparecer", async () => {
    await render(<PantallaAviso aviso={evento()} onCerrar={() => {}} />);
    expect(vibrar).toHaveBeenCalledTimes(1);
    expect(vibrar).toHaveBeenCalledWith(VIBRACION_MS);
    expect(reproducirSonido).toHaveBeenCalledTimes(1);
  });

  it("no se cierra sola y no hace caso del toque que llega al aparecer", async () => {
    const onCerrar = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<PantallaAviso aviso={evento()} onCerrar={onCerrar} bloqueoAlAparecerMs={5000} />);

    await user.press(screen.getByTestId("aviso-vale"));
    expect(onCerrar).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(60_000));
    expect(screen.getByTestId("aviso-vale")).toBeTruthy();
    expect(onCerrar).not.toHaveBeenCalled();

    await user.press(screen.getByTestId("aviso-vale"));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("«Vale» devuelve al alumno a la tarea, en el mismo paso", async () => {
    const { hoy, repo, user } = await abrirConTareaEnCurso();
    await user.press(screen.getByRole("button", { name: "Siguiente: paso 2" }));
    await user.press(screen.getByRole("button", { name: "Siguiente: paso 3" }));

    await hastaElAviso(hoy);
    expect(screen.getByTestId("pantalla-aviso")).toBeTruthy();
    expect(screen.queryByTestId("pantalla-07-pasos")).toBeNull();

    await act(async () => jest.advanceTimersByTime(BLOQUEO_AL_APARECER_MS));
    await user.press(screen.getByTestId("aviso-vale"));

    expect(screen.queryByTestId("pantalla-aviso")).toBeNull();
    expect(screen.getByTestId("pantalla-07-pasos")).toBeTruthy();
    expect(screen.getByLabelText("Paso 3 de 4: Frota las manos")).toBeTruthy();
    const servidor = await repo.obtenerSecuenciaDia(hoy[0].estudiante_id, hoy[0].fecha);
    expect(servidor.find((e) => e.id === "e2")?.estado).toBe("en_curso");
  });

  it("«Atrás» también vuelve a la tarea, sin deshacer «Empezar»", async () => {
    const { hoy, repo, user } = await abrirConTareaEnCurso();
    await hastaElAviso(hoy);
    await act(async () => jest.advanceTimersByTime(BLOQUEO_AL_APARECER_MS));

    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(screen.getByTestId("pantalla-07-pasos")).toBeTruthy();
    const servidor = await repo.obtenerSecuenciaDia(hoy[0].estudiante_id, hoy[0].fecha);
    expect(servidor.find((e) => e.id === "e2")?.estado).toBe("en_curso");
  });

  it("no interrumpe «¿Has terminado?»: sale al volver a la tarea", async () => {
    const { hoy, user } = await abrirConTareaEnCurso();
    await act(async () => jest.advanceTimersByTime(BLOQUEO_AL_APARECER_MS));
    // HU-10: «Terminar tarea» está en el último paso de la 07.
    for (const n of [2, 3, 4])
      await user.press(screen.getByRole("button", { name: `Siguiente: paso ${n}` }));
    await user.press(screen.getByRole("button", { name: "Terminar tarea" }));
    expect(screen.getByTestId("pantalla-confirmar-fin")).toBeTruthy();

    await hastaElAviso(hoy);
    expect(screen.getByTestId("pantalla-confirmar-fin")).toBeTruthy();
    expect(screen.queryByTestId("pantalla-aviso")).toBeNull();

    await user.press(screen.getByTestId("confirmar-fin-no"));
    expect(screen.getByTestId("pantalla-aviso")).toBeTruthy();
  });

  it("se quita sola si llega la hora de la tarea, porque ya no sería cierta", async () => {
    const { hoy } = await abrirConTareaEnCurso();
    await hastaElAviso(hoy);
    expect(screen.getByTestId("pantalla-aviso")).toBeTruthy();

    const hastaInicio = momentoInicio(hoy[3]).getTime() - Date.now();
    await act(async () => jest.advanceTimersByTime(hastaInicio));

    expect(screen.queryByTestId("pantalla-aviso")).toBeNull();
    expect(screen.getByTestId("pantalla-07-pasos")).toBeTruthy();
  });

  it("se quita si el tutor bloquea la tarea que venía", async () => {
    const { hoy, tutor } = await abrirConTareaEnCurso();
    await hastaElAviso(hoy);
    expect(screen.getByTestId("pantalla-aviso")).toBeTruthy();

    await act(async () => {
      tutor.bloquear("e4");
      jest.advanceTimersByTime(200);
    });

    expect(screen.queryByTestId("pantalla-aviso")).toBeNull();
  });

  it("a un adulto no le corta la pantalla: le sale la franja", async () => {
    const hoy = agendaDemoAviso(hoyISO());
    const { repo } = crearRepositorioMemoria(hoy);
    await render(
      <AgendaDelDia repo={repo} estudianteId={hoy[0].estudiante_id} abrirTareaEnCurso={false} />,
    );
    await act(async () => jest.advanceTimersByTime(0));
    await hastaElAviso(hoy);

    expect(screen.queryByTestId("pantalla-aviso")).toBeNull();
    expect(screen.getByTestId("aviso-anticipado")).toBeTruthy();
  });

  it("no avisa de una tarea que hay que retomar", () => {
    const quedada = { ...reprografia, pendiente_motivo: "tiempo_agotado" as const };
    expect(siguienteTarea([quedada], new Date(2026, 10, 5, 10, 0))).toBeNull();
  });
});
