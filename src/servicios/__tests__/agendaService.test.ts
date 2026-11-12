import {
  desmarcarTareaEnCurso,
  desmarcarTareaHecha,
  marcarTareaEnCurso,
  marcarTareaHecha,
  obtenerSecuenciaDia,
  suscribirseAgenda,
} from "../agendaService";
import { supabase } from "../../lib/supabaseClient";

// Consulta encadenable de Supabase: cada método devuelve la misma consulta y al final se resuelve.
function consultaFalsa(resultado: { data?: unknown; error: unknown }) {
  const q: Record<string, jest.Mock> & { then?: unknown } = {} as never;
  for (const m of ["select", "eq", "neq", "order", "update", "upsert", "in", "delete"])
    q[m] = jest.fn(() => q);
  q.then = (ok: (r: unknown) => unknown, ko: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(ok, ko);
  return q;
}

jest.mock("../../lib/supabaseClient", () => ({
  supabase: { from: jest.fn(), rpc: jest.fn(), channel: jest.fn(), removeChannel: jest.fn() },
}));

const sb = supabase as unknown as {
  from: jest.Mock;
  rpc: jest.Mock;
  channel: jest.Mock;
  removeChannel: jest.Mock;
};

describe("agendaService (SCRUM-70: T-06.2 Supabase y Realtime)", () => {
  afterEach(() => jest.clearAllMocks());

  it("pide la secuencia del día a secuencia_dia (SCRUM-71) y normaliza la hora (RF4.1)", async () => {
    sb.rpc.mockResolvedValue({
      data: [
        { id: "a1", hora_inicio: "09:30:00", tarea: { id: "t1", titulo: "Desayuno", pasos: null } },
        { id: "a2", hora_inicio: null, tarea: { id: "t2", titulo: "Recreo" } },
      ],
      error: null,
    });

    const r = await obtenerSecuenciaDia("al1", "2026-11-05");

    expect(sb.rpc).toHaveBeenCalledWith("secuencia_dia", {
      p_estudiante: "al1",
      p_fecha: "2026-11-05",
    });
    expect(r[0].hora_inicio).toBe("09:30");
    expect(r[0].tarea.titulo).toBe("Desayuno");
    expect(r[0].tarea.pasos).toEqual([]);
    expect(r[1].hora_inicio).toBe(""); // sin hora fija
  });

  it("lanza el error de Supabase si la consulta falla", async () => {
    sb.rpc.mockResolvedValue({ data: null, error: new Error("sin red") });
    await expect(obtenerSecuenciaDia("al1", "2026-11-05")).rejects.toThrow("sin red");
  });

  it("marca como hecha solo si seguía pendiente o en curso y guarda la hora de fin (RF4.3, RI6.1)", async () => {
    const asig = consultaFalsa({ data: [{ id: "e1" }], error: null });
    const ejec = consultaFalsa({ error: null });
    sb.from.mockImplementation((t: string) => (t === "asignaciones" ? asig : ejec));

    await marcarTareaHecha("e1", "2026-11-05T09:40:00.000Z");

    expect(asig.update).toHaveBeenCalledWith({ estado: "hecho" });
    expect(asig.eq).toHaveBeenCalledWith("id", "e1");
    expect(asig.in).toHaveBeenCalledWith("estado", ["pendiente", "en_curso"]);
    expect(sb.from).toHaveBeenCalledWith("ejecuciones");
    expect(ejec.update).toHaveBeenCalledWith({ fin: "2026-11-05T09:40:00.000Z" });
    expect(ejec.eq).toHaveBeenCalledWith("asignacion_id", "e1");
  });

  it("no guarda la hora de fin si la asignación ya no estaba pendiente ni en curso", async () => {
    const asig = consultaFalsa({ data: [], error: null });
    sb.from.mockReturnValue(asig);

    await marcarTareaHecha("e1");

    expect(sb.from).not.toHaveBeenCalledWith("ejecuciones");
  });

  it("SCRUM-74: al empezar pone la tarea en curso, solo si seguía pendiente, y guarda la hora de inicio en ejecuciones (RF6.1, RI6.1)", async () => {
    const asig = consultaFalsa({ data: [{ estudiante_id: "al1" }], error: null });
    const ejec = consultaFalsa({ error: null });
    sb.from.mockImplementation((t: string) => (t === "asignaciones" ? asig : ejec));

    await marcarTareaEnCurso("e1", "2026-11-05T09:30:00.000Z");

    expect(asig.update).toHaveBeenCalledWith({ estado: "en_curso" });
    expect(asig.eq).toHaveBeenCalledWith("id", "e1");
    expect(asig.eq).toHaveBeenCalledWith("estado", "pendiente");
    expect(ejec.upsert).toHaveBeenCalledWith(
      { asignacion_id: "e1", estudiante_id: "al1", inicio: "2026-11-05T09:30:00.000Z" },
      { onConflict: "asignacion_id" },
    );
  });

  it("al empezar no crea ejecución si la tarea ya no estaba pendiente", async () => {
    const asig = consultaFalsa({ data: [], error: null });
    sb.from.mockReturnValue(asig);

    await marcarTareaEnCurso("e1", "2026-11-05T09:30:00.000Z");

    expect(sb.from).not.toHaveBeenCalledWith("ejecuciones");
  });

  it("profesora: deshacer Empezar devuelve la asignación a pendiente y borra su ejecución", async () => {
    const asig = consultaFalsa({ data: [{ id: "e1" }], error: null });
    const ejec = consultaFalsa({ error: null });
    sb.from.mockImplementation((t: string) => (t === "asignaciones" ? asig : ejec));

    await desmarcarTareaEnCurso("e1");

    expect(asig.update).toHaveBeenCalledWith({ estado: "pendiente" });
    expect(asig.eq).toHaveBeenCalledWith("id", "e1");
    expect(asig.eq).toHaveBeenCalledWith("estado", "en_curso");
    expect(ejec.delete).toHaveBeenCalled();
    expect(ejec.eq).toHaveBeenCalledWith("asignacion_id", "e1");
  });

  it("profesora: deshacer Empezar no toca ejecuciones si la tarea ya no estaba en curso", async () => {
    sb.from.mockReturnValue(consultaFalsa({ data: [], error: null }));
    await desmarcarTareaEnCurso("e1");
    expect(sb.from).not.toHaveBeenCalledWith("ejecuciones");
  });

  it("profesora: deshacer Terminar devuelve la asignación al estado pedido y borra la hora de fin", async () => {
    const asig = consultaFalsa({ data: [{ id: "e1" }], error: null });
    const ejec = consultaFalsa({ error: null });
    sb.from.mockImplementation((t: string) => (t === "asignaciones" ? asig : ejec));

    await desmarcarTareaHecha("e1", "en_curso");

    expect(asig.update).toHaveBeenCalledWith({ estado: "en_curso" });
    expect(asig.eq).toHaveBeenCalledWith("estado", "hecho");
    expect(ejec.update).toHaveBeenCalledWith({ fin: null });
    expect(ejec.eq).toHaveBeenCalledWith("asignacion_id", "e1");
  });

  it("se suscribe a Realtime y avisa con los cambios del tutor (RF4.7)", () => {
    const manejadores: { filtro: Record<string, string>; f: (p: unknown) => void }[] = [];
    let alSuscribir: (estado: string) => void = () => {};
    interface CanalFalso {
      on: jest.Mock;
      subscribe: jest.Mock;
    }
    const canal: CanalFalso = {
      on: jest.fn((_tipo: string, filtro: Record<string, string>, f: (p: unknown) => void) => {
        manejadores.push({ filtro, f });
        return canal;
      }),
      subscribe: jest.fn((f: (estado: string) => void) => {
        alSuscribir = f;
        return canal;
      }),
    };
    sb.channel.mockReturnValue(canal);
    const alCambiar = jest.fn();

    const baja = suscribirseAgenda(
      "al1",
      "2026-11-05",
      alCambiar,
      () => new Set(["e1", "tarea:t1"]),
    );

    const insert = manejadores.find((m) => m.filtro.event === "INSERT")!;
    expect(insert.filtro).toMatchObject({
      table: "asignaciones",
      filter: "estudiante_id=eq.al1",
    });
    insert.f({});
    expect(alCambiar).toHaveBeenCalledTimes(1);

    // Un DELETE de una fila que no está en pantalla no recarga; uno de la agenda, sí.
    const borrado = manejadores.find((m) => m.filtro.event === "DELETE")!;
    borrado.f({ old: { id: "otra" } });
    borrado.f({ old: { id: "e1" } });
    expect(alCambiar).toHaveBeenCalledTimes(2);

    // Al conectar se recarga por si hubo cambios sin conexión.
    // Un cambio en los pasos de una tarea que está en la agenda también recarga.
    const pasos = manejadores.find((m) => m.filtro.table === "pasos_tarea")!;
    pasos.f({ new: { tarea_id: "otra" } });
    pasos.f({ new: { tarea_id: "t1" } });
    expect(alCambiar).toHaveBeenCalledTimes(3);

    alSuscribir("SUBSCRIBED");
    expect(alCambiar).toHaveBeenCalledTimes(4);

    baja();
    expect(sb.removeChannel).toHaveBeenCalledWith(canal);
  });
});
