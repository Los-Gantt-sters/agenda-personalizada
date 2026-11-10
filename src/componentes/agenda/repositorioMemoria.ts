// Repositorio de la agenda en memoria (T-06.2, HU-06): se usa en la demo, sin Supabase, y en las
// pruebas. `tutor` simula lo que haría el tutor desde su terminal (crear, modificar, bloquear, borrar).
import type { EntradaAgenda, RepositorioAgenda } from "./tipos";

export function crearRepositorioMemoria(inicial: EntradaAgenda[]) {
  let entradas = inicial.map((e) => ({ ...e }));
  const oyentes = new Set<() => void>();
  const avisar = () => setTimeout(() => oyentes.forEach((f) => f()), 0);

  const repo: RepositorioAgenda = {
    async obtenerSecuenciaDia(estudianteId, fecha) {
      return entradas
        .filter((e) => e.estudiante_id === estudianteId && e.fecha === fecha)
        .map((e) => ({ ...e }));
    },
    async marcarHecha(idEntrada) {
      entradas = entradas.map((e) =>
        e.id === idEntrada && (e.estado === "pendiente" || e.estado === "en_curso")
          ? { ...e, estado: "hecha" }
          : e,
      );
      avisar();
    },
    suscribir(_estudianteId, _fecha, alCambiar) {
      oyentes.add(alCambiar);
      return () => {
        oyentes.delete(alCambiar);
      };
    },
  };

  const tutor = {
    crear(entrada: EntradaAgenda) {
      entradas = [...entradas, entrada];
      avisar();
    },
    modificar(id: string, cambios: Partial<EntradaAgenda>) {
      entradas = entradas.map((e) => (e.id === id ? { ...e, ...cambios } : e));
      avisar();
    },
    bloquear(id: string) {
      tutor.modificar(id, { estado: "bloqueada" });
    },
    borrar(id: string) {
      entradas = entradas.filter((e) => e.id !== id);
      avisar();
    },
  };

  return { repo, tutor };
}
