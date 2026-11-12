import { act, renderHook, waitFor } from "@testing-library/react-native";
import { crearRepositorioMemoria } from "../repositorioMemoria";
import { useAgendaDia } from "../useAgendaDia";
import type { EntradaAgenda } from "../tipos";

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

describe("useAgendaDia (SCRUM-70: T-06.2 Lógica reactiva de avance automático al confirmar)", () => {
  it("BDD: al finalizar la primera de 3, pasa a Hecho y la segunda queda en Ahora, también en el servidor", async () => {
    const { repo } = crearRepositorioMemoria([e("1", "09:00"), e("2", "10:00"), e("3", "11:00")]);
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(() => result.current.confirmarFin("1"));
    expect(result.current.bloques.hecho.map((x: EntradaAgenda) => x.id)).toEqual(["1"]);
    expect(result.current.bloques.ahora?.id).toBe("2");

    const servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor.find((x) => x.id === "1")?.estado).toBe("hecha");
  });

  it("BDD: el tutor añade una tarea y aparece sin recargar (Realtime)", async () => {
    const { repo, tutor } = crearRepositorioMemoria([e("1", "09:00"), e("3", "11:00")]);
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(async () => tutor.crear(e("2", "10:00")));
    await waitFor(() =>
      expect(result.current.bloques.despues.map((x: EntradaAgenda) => x.id)).toEqual(["2", "3"]),
    );
  });

  it("el tutor bloquea la tarea de Ahora y la agenda pasa a la siguiente", async () => {
    const { repo, tutor } = crearRepositorioMemoria([e("1", "09:00"), e("2", "10:00")]);
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(async () => tutor.bloquear("1"));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("2"));
  });

  it("si no se puede guardar, vuelve a lo que diga el servidor y avisa", async () => {
    const { repo } = crearRepositorioMemoria([e("1", "09:00"), e("2", "10:00")]);
    repo.marcarHecha = async () => {
      throw new Error("sin red");
    };
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(() => result.current.confirmarFin("1"));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));
    expect(result.current.errorGuardado).toBe("sin red");
  });

  it("SCRUM-74: Empezar pone la tarea en curso al momento y guarda inicio y fin en el servidor (RI6.1)", async () => {
    const { repo } = crearRepositorioMemoria([
      { ...e("1", "09:00"), requiere_inicio_fin: true },
      e("2", "10:00"),
    ]);
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(() => result.current.empezar("1"));
    expect(result.current.bloques.ahora).toMatchObject({ id: "1", estado: "en_curso" });
    let servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor[0].estado).toBe("en_curso");
    expect(servidor[0].inicio_real).toEqual(expect.any(String));

    await act(() => result.current.confirmarFin("1"));
    servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor[0]).toMatchObject({ estado: "hecha", inicio_real: expect.any(String) });
    expect(Date.parse(servidor[0].fin_real!)).toBeGreaterThanOrEqual(
      Date.parse(servidor[0].inicio_real!),
    );
    expect(result.current.bloques.ahora?.id).toBe("2");
  });

  it("SCRUM-74: si no se puede guardar el inicio, la tarea vuelve a pendiente y avisa", async () => {
    const { repo } = crearRepositorioMemoria([{ ...e("1", "09:00"), requiere_inicio_fin: true }]);
    repo.marcarEnCurso = async () => {
      throw new Error("sin red");
    };
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(() => result.current.empezar("1"));
    await waitFor(() => expect(result.current.bloques.ahora?.estado).toBe("pendiente"));
    expect(result.current.errorGuardado).toBe("sin red");
  });
  it("profesora: Atrás deshace Empezar y Terminar, también en el servidor", async () => {
    const { repo } = crearRepositorioMemoria([
      { ...e("1", "09:00"), requiere_inicio_fin: true },
      e("2", "10:00"),
    ]);
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    await act(() => result.current.empezar("1"));
    await act(() => result.current.deshacerEmpezar("1"));
    expect(result.current.bloques.ahora).toMatchObject({ id: "1", estado: "pendiente" });
    let servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor[0]).toMatchObject({ estado: "pendiente", inicio_real: null });

    await act(() => result.current.empezar("1"));
    await act(() => result.current.confirmarFin("1"));
    expect(result.current.bloques.ahora?.id).toBe("2");
    await act(() => result.current.deshacerFin("1"));
    expect(result.current.bloques.ahora).toMatchObject({ id: "1", estado: "en_curso" });
    servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor[0]).toMatchObject({ estado: "en_curso", fin_real: null });
  });

  it("profesora: si se pulsa Atrás antes de que se guarde Terminar, el servidor acaba sin terminar", async () => {
    const { repo } = crearRepositorioMemoria([e("1", "09:00"), e("2", "10:00")]);
    // El servidor tarda en guardar «Terminar»; «Atrás» llega mientras tanto.
    let soltar: () => void = () => {};
    const marcarHecha = repo.marcarHecha;
    repo.marcarHecha = (id, fin) =>
      new Promise<void>((ok) => {
        soltar = () => marcarHecha(id, fin).then(ok);
      });
    const { result } = await renderHook(() => useAgendaDia(repo, "al1", F));
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));

    let fin: Promise<boolean> = Promise.resolve(false);
    let atras: Promise<boolean> = Promise.resolve(false);
    await act(async () => {
      fin = result.current.confirmarFin("1");
    });
    expect(result.current.bloques.ahora?.id).toBe("2");
    await act(async () => {
      atras = result.current.deshacerFin("1");
    });
    expect(result.current.bloques.ahora?.id).toBe("1");

    // Una recarga mientras tanto no devuelve la tarea a «Hecho».
    await act(() => result.current.recargar());
    expect(result.current.bloques.ahora?.id).toBe("1");

    await act(async () => {
      soltar();
      await fin;
      await atras;
    });
    const servidor = await repo.obtenerSecuenciaDia("al1", F);
    expect(servidor[0]).toMatchObject({ estado: "pendiente", fin_real: null });
    await waitFor(() => expect(result.current.bloques.ahora?.id).toBe("1"));
  });
});
