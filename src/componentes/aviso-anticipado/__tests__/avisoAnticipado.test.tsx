import { act, renderHook } from "@testing-library/react-native";
import type { EntradaAgenda } from "../../agenda/tipos";
import { claveAviso, crearEventoAviso, momentoAviso, siguienteTarea, tocaAvisar } from "../logica";
import { useAvisoAnticipado } from "../useAvisoAnticipado";
import { AVISO_POR_DEFECTO } from "../tipos";

const F = "2026-11-05";
const e = (
  id: string,
  hora: string,
  estado: EntradaAgenda["estado"] = "pendiente",
): EntradaAgenda => ({
  id,
  estudiante_id: "al1",
  tarea_id: `t-${id}`,
  fecha: F,
  hora_inicio: hora,
  duracion_prevista_min: 30,
  orden: 0,
  estado,
  tarea: { id: `t-${id}`, titulo: `Tarea ${id}` },
});
const a = (hora: string, s = 0) => {
  const [h, m] = hora.split(":").map(Number);
  return new Date(2026, 10, 5, h, m, s);
};

describe("Lógica del aviso (SCRUM-82: T-16.1 Servicio temporizador 5 min antes)", () => {
  it("la hora de aviso es la de inicio menos 5 minutos", () => {
    expect(momentoAviso(e("1", "10:45"), 5)).toEqual(a("10:40"));
  });

  it("la siguiente tarea es la primera pendiente que aún no ha empezado", () => {
    const agenda = [
      e("1", "09:00", "hecha"),
      e("2", "09:30", "en_curso"),
      e("3", "10:15", "bloqueada"),
      e("5", "11:30"),
      e("4", "10:45"),
    ];
    expect(siguienteTarea(agenda, a("10:00"))?.id).toBe("4");
    expect(siguienteTarea(agenda, a("10:50"))?.id).toBe("5");
    expect(siguienteTarea(agenda, a("12:00"))).toBeNull();
  });

  it("toca avisar desde 5 minutos antes hasta que empieza", () => {
    const t = e("1", "10:45");
    expect(tocaAvisar(t, a("10:39", 59), 5)).toBe(false);
    expect(tocaAvisar(t, a("10:40"), 5)).toBe(true);
    expect(tocaAvisar(t, a("10:44", 59), 5)).toBe(true);
    expect(tocaAvisar(t, a("10:45"), 5)).toBe(false);
  });

  it("RI4.2: el evento lleva estudiante, tarea, antelación, tipo y hora de emisión", () => {
    const ev = crearEventoAviso(e("4", "10:45"), { antelacionMin: 5, tipo: "visual" }, a("10:40"));
    expect(ev).toMatchObject({
      estudiante_id: "al1",
      tarea_id: "t-4",
      entrada_id: "4",
      antelacion_min: 5,
      tipo: "visual",
      emitido_en: a("10:40").toISOString(),
    });
  });

  it("si el tutor cambia la hora, la clave cambia y se vuelve a avisar", () => {
    expect(claveAviso(e("1", "10:45"))).not.toBe(claveAviso(e("1", "11:00")));
  });
});

describe("useAvisoAnticipado (SCRUM-82: T-16.1 Servicio temporizador 5 min antes)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("BDD: cuando faltan 5 minutos para Reprografía, se dispara el aviso", async () => {
    jest.setSystemTime(a("10:30"));
    const onAviso = jest.fn();
    const agenda = [e("2", "09:30", "en_curso"), e("4", "10:45")];
    const { result } = await renderHook(() =>
      useAvisoAnticipado(agenda, AVISO_POR_DEFECTO, onAviso),
    );
    expect(result.current.aviso).toBeNull();

    await act(async () => jest.advanceTimersByTime(9 * 60_000 + 59_000)); // 10:39:59
    expect(result.current.aviso).toBeNull();

    await act(async () => jest.advanceTimersByTime(1_000)); // 10:40
    expect(result.current.aviso?.entrada_id).toBe("4");
    expect(onAviso).toHaveBeenCalledTimes(1);
  });

  it("cada tarea se avisa una sola vez y cerrar no cambia la agenda", async () => {
    jest.setSystemTime(a("10:41"));
    const agenda = [e("2", "09:30", "en_curso"), e("4", "10:45"), e("5", "11:30")];
    const copia = JSON.stringify(agenda);
    const onAviso = jest.fn();
    const { result } = await renderHook(() =>
      useAvisoAnticipado(agenda, AVISO_POR_DEFECTO, onAviso),
    );
    // Abrir la app con menos de 5 minutos: se avisa al momento.
    await act(async () => jest.advanceTimersByTime(0));
    expect(result.current.aviso?.entrada_id).toBe("4");

    await act(async () => result.current.cerrar());
    expect(result.current.aviso).toBeNull();
    expect(JSON.stringify(agenda)).toBe(copia);

    await act(async () => jest.advanceTimersByTime(3 * 60_000)); // 10:44
    expect(onAviso).toHaveBeenCalledTimes(1);

    await act(async () => jest.advanceTimersByTime(41 * 60_000)); // 11:25, la siguiente
    expect(result.current.aviso?.entrada_id).toBe("5");
    expect(onAviso).toHaveBeenCalledTimes(2);
  });

  it("no avisa de una tarea bloqueada por el tutor", async () => {
    jest.setSystemTime(a("10:30"));
    const onAviso = jest.fn();
    const { rerender } = await renderHook(
      ({ agenda }: { agenda: EntradaAgenda[] }) =>
        useAvisoAnticipado(agenda, AVISO_POR_DEFECTO, onAviso),
      { initialProps: { agenda: [e("4", "10:45")] } },
    );
    await rerender({ agenda: [e("4", "10:45", "bloqueada")] });
    await act(async () => jest.advanceTimersByTime(15 * 60_000));
    expect(onAviso).not.toHaveBeenCalled();
  });

  it("con el aviso desactivado en el perfil no se avisa", async () => {
    jest.setSystemTime(a("10:41"));
    const onAviso = jest.fn();
    await renderHook(() =>
      useAvisoAnticipado([e("4", "10:45")], { ...AVISO_POR_DEFECTO, activado: false }, onAviso),
    );
    await act(async () => jest.advanceTimersByTime(60_000));
    expect(onAviso).not.toHaveBeenCalled();
  });
});
