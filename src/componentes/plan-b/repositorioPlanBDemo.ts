// Datos de ejemplo del Plan B (los del prototipo), en memoria: para la demo y las pruebas.
import type { FilaPlanB, RepositorioPlanB, TareaPlanB } from "../../tipos/planB";

const tarea = (id: string, titulo: string): TareaPlanB => ({ id, titulo, pictogramaUrl: null });

const BIBLIOTECA: TareaPlanB[] = [
  tarea("t-manos", "Lavarse las manos"),
  tarea("t-asamblea", "Asamblea matinal"),
  tarea("t-recreo", "Recreo en el patio"),
  tarea("t-toallitas", "Toallitas húmedas en aula"),
  tarea("t-juegos", "Juegos tranquilos en clase"),
  tarea("t-cuento", "Cuento con auriculares"),
];

const fila = (
  id: string,
  hora: string,
  tareaId: string,
  planB: string | null,
  activo = false,
): FilaPlanB => ({
  clave: id,
  asignacionIds: [id],
  tareaId,
  titulo: BIBLIOTECA.find((t) => t.id === tareaId)!.titulo,
  pictogramaUrl: null,
  hora,
  planB: BIBLIOTECA.find((t) => t.id === planB) ?? null,
  activo,
});

export function crearRepositorioPlanBDemo(
  inicial: FilaPlanB[] = [
    fila("a1", "09:00", "t-asamblea", "t-cuento"),
    fila("a2", "09:30", "t-manos", "t-toallitas"),
    fila("a3", "11:30", "t-recreo", "t-juegos", true),
  ],
): RepositorioPlanB {
  let filas = inicial.map((f) => ({ ...f }));
  const cambiar = (ids: string[], cambio: (f: FilaPlanB) => FilaPlanB) => {
    filas = filas.map((f) => (f.asignacionIds.some((id) => ids.includes(id)) ? cambio(f) : f));
  };
  return {
    async cargar() {
      return { filas: filas.map((f) => ({ ...f })), biblioteca: BIBLIOTECA };
    },
    async vincular(ids, tareaPlanBId) {
      const planB = BIBLIOTECA.find((t) => t.id === tareaPlanBId) ?? null;
      cambiar(ids, (f) => ({ ...f, planB }));
    },
    async activar(ids, activo) {
      cambiar(ids, (f) => ({ ...f, activo }));
    },
  };
}
