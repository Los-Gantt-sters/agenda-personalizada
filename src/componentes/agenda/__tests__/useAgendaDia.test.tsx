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
});
