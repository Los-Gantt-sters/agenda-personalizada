// Repositorio de pasos en memoria (SCRUM-95 · T-10.2, HU-10): para la demo del editor 28s sin
// Supabase y para las pruebas. Los archivos «subidos» se ven con una URL local del navegador.
import type { PasoTarea, RecursoPaso } from "../agenda/tipos";
import type { RepositorioPasos } from "../../servicios/pasosService";
import { rutaMultimedia } from "../../servicios/pasosService";

export function crearRepositorioPasosMemoria(inicial: Record<string, PasoTarea[]> = {}) {
  const tareas = new Map<string, PasoTarea[]>(
    Object.entries(inicial).map(([id, pasos]) => [id, pasos.map((p) => ({ ...p }))]),
  );
  let siguienteId = 1;
  // Rutas que el editor ha mandado borrar (para comprobarlo en las pruebas).
  const borradas: string[] = [];

  const repo: RepositorioPasos = {
    async obtenerPasos(tareaId) {
      return (tareas.get(tareaId) ?? []).map((p) => ({ ...p }));
    },
    async guardarPasos(tareaId, pasos) {
      if (pasos.some((p) => !(p.titulo ?? p.texto).trim())) {
        throw new Error("Todos los pasos necesitan un título");
      }
      const guardados = pasos.map((p, i) => ({
        ...p,
        id: p.id ?? `paso-${siguienteId++}`,
        orden: i + 1,
        titulo: (p.titulo ?? p.texto).trim(),
        texto: p.texto.trim() || (p.titulo ?? "").trim(),
      }));
      tareas.set(tareaId, guardados);
      return guardados.map((p) => ({ ...p }));
    },
    async subirMultimedia(tareaId, tipo, archivo): Promise<RecursoPaso> {
      const url =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(archivo.blob)
          : `memoria://${tipo}`;
      return {
        ruta: rutaMultimedia(tareaId, tipo, archivo.tipoMime),
        url,
        tipo_mime: archivo.tipoMime,
        tamano_bytes: archivo.tamanoBytes,
        duracion_segundos: archivo.duracionSegundos,
      };
    },
    async borrarMultimedia(rutas) {
      borradas.push(...rutas);
    },
  };
  return Object.assign(repo, { borradas });
}
