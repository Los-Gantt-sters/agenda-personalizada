import { consolidarProgreso, progresoDemo } from "../datosDemo";
import {
  detalleSinHacer,
  emocionMasFrecuente,
  estadoVisible,
  etiquetaAmbito,
  etiquetaEmocion,
  etiquetaNecesidad,
  frasesResumen,
  paginar,
  porcentajeHechas,
  tareasSinHacer,
} from "../resumen";
import type { AvisoProgreso, TareaProgreso } from "../tipos";

function tarea(id: string, cambios: Partial<TareaProgreso> = {}): TareaProgreso {
  return {
    id,
    fecha: "2026-11-23",
    hora: "09:00",
    titulo: `Tarea ${id}`,
    ambito: "centro",
    estado: "hecha",
    pendiente_motivo: null,
    plan_b: false,
    emocion: null,
    inicio_real: null,
    fin_real: null,
    ...cambios,
  };
}

const aviso = (necesidad: string, cambios: Partial<AvisoProgreso> = {}): AvisoProgreso => ({
  id: necesidad,
  necesidad,
  urgencia: false,
  atendido: true,
  creado_en: "2026-11-24T09:30:00.000Z",
  ...cambios,
});

const TAREAS = [
  tarea("1", { emocion: "contento" }),
  tarea("2", { emocion: "contento", plan_b: true, titulo: "Huerto" }),
  tarea("3", { emocion: "triste" }),
  tarea("4", { estado: "pendiente", pendiente_motivo: "tiempo_agotado" }),
  tarea("5", { estado: "en_curso", fecha: "2026-11-24" }),
  tarea("6", { estado: "bloqueada", fecha: "2026-11-24" }),
  tarea("7", { estado: "pendiente", fecha: "2026-11-24", ambito: "hogar" }),
];

describe("resumen de la pantalla 43 (HU-25)", () => {
  const progreso = consolidarProgreso(TAREAS, [], "2026-11-23", "2026-11-29");

  it("consolida igual que progreso_alumno en Supabase", () => {
    expect(progreso.resumen).toEqual({
      total: 7,
      hechas: 3,
      pendientes: 2,
      en_curso: 1,
      bloqueadas: 1,
      sin_terminar: 1,
      planes_b: 1,
    });
    expect(progreso.emociones).toEqual([
      { emocion: "contento", total: 2 },
      { emocion: "triste", total: 1 },
    ]);
    expect(progreso.dias).toEqual([
      { fecha: "2026-11-23", total: 4, hechas: 3 },
      { fecha: "2026-11-24", total: 3, hechas: 0 },
    ]);
  });

  it("indicadores: pendientes, su detalle y la emoción más frecuente", () => {
    expect(tareasSinHacer(progreso)).toBe(4);
    expect(detalleSinHacer(progreso)).toBe("1 sin terminar · 1 en curso · 1 bloqueada");
    expect(emocionMasFrecuente(progreso)).toEqual({
      clave: "contento",
      etiqueta: "Contento",
      porcentaje: 67,
    });
    expect(emocionMasFrecuente({ ...progreso, emociones: [] })).toBeNull();
    expect(porcentajeHechas(0, 0)).toBe(0);
  });

  it("estado de cada fila con texto, tono e icono (nunca solo color)", () => {
    expect(estadoVisible(TAREAS[0])).toEqual({ texto: "Hecha", tono: "exito", icono: "check" });
    expect(estadoVisible(TAREAS[3])).toEqual({
      texto: "Sin terminar",
      tono: "aviso",
      icono: "alerta",
    });
    expect(estadoVisible(TAREAS[4]).texto).toBe("En curso");
    expect(estadoVisible(TAREAS[5])).toMatchObject({ texto: "Bloqueada", icono: "candado" });
    expect(estadoVisible(TAREAS[6])).toMatchObject({ texto: "Pendiente", tono: "neutro" });
  });

  it("etiquetas de emociones (las de la app y las de la base), necesidades y ámbitos", () => {
    expect(etiquetaEmocion("tranquilo")).toBe("Tranquilo");
    expect(etiquetaEmocion("regular")).toBe("Regular");
    expect(etiquetaEmocion("muy_bien")).toBe("Muy bien");
    expect(etiquetaNecesidad("bano")).toBe("Baño");
    expect(etiquetaAmbito("hogar")).toBe("Casa");
    expect(etiquetaAmbito("centro")).toBe("Clase");
  });

  it("frases del resumen: Plan B, peticiones de ayuda y urgencias sin atender", () => {
    const conAvisos = consolidarProgreso(
      TAREAS,
      [aviso("bano"), aviso("urgencia", { urgencia: true, atendido: false })],
      "2026-11-23",
      "2026-11-29",
    );
    expect(frasesResumen(conAvisos)).toEqual([
      "Plan B activado 1 vez: Huerto (Lun 23).",
      "Ha pedido ayuda 2 veces: Baño (Mar 24), Urgencia (Mar 24).",
      "Hay 1 urgencia sin marcar como atendida.",
    ]);
    expect(frasesResumen(consolidarProgreso([tarea("1")], [], "2026-11-23", "2026-11-23"))).toEqual(
      ["Sin Plan B ni peticiones de ayuda en este periodo."],
    );
  });

  it("si hay muchos Plan B o avisos, nombra unos pocos y dice cuántos más", () => {
    const muchos = consolidarProgreso(
      ["a", "b", "c", "d", "e"].map((id) => tarea(id, { plan_b: true, titulo: id.toUpperCase() })),
      [],
      "2026-11-23",
      "2026-11-23",
    );
    expect(frasesResumen(muchos)[0]).toBe(
      "Plan B activado 5 veces: A (Lun 23), B (Lun 23), C (Lun 23) y 2 más.",
    );
  });

  it("paginar reparte en páginas y no se sale de la última", () => {
    const lista = [1, 2, 3, 4, 5, 6, 7];
    expect(paginar(lista, 3, 0)).toEqual({ elementos: [1, 2, 3], pagina: 0, paginas: 3 });
    expect(paginar(lista, 3, 2)).toEqual({ elementos: [7], pagina: 2, paginas: 3 });
    expect(paginar(lista, 3, 9).pagina).toBe(2);
    expect(paginar([], 3, 0)).toEqual({ elementos: [], pagina: 0, paginas: 1 });
    expect(paginar(lista, 0, 0).elementos).toEqual([1]);
  });

  it("la demo no inventa historial de días futuros y siempre da lo mismo", () => {
    const ahora = new Date(2026, 10, 25, 12, 0);
    const demo = progresoDemo("2026-11-23", "2026-11-29", ahora);
    expect(demo.alumno?.nombre).toBe("Alejandro");
    expect(demo.dias.map((d) => d.fecha)).toEqual(["2026-11-23", "2026-11-24", "2026-11-25"]);
    expect(demo.tareas.some((t) => t.fecha === "2026-11-25" && t.estado === "en_curso")).toBe(true);
    expect(progresoDemo("2026-11-23", "2026-11-29", ahora)).toEqual(demo);
  });
});
