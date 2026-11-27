import { consolidarProgreso, progresoDemo } from "../datosDemo";
import {
  contarEstados,
  detallePendientes,
  emocionMasFrecuente,
  estadoVisible,
  etiquetaAmbito,
  etiquetaEmocion,
  etiquetaNecesidad,
  paginar,
  porcentajeHechas,
  tarjetasResumen,
} from "../resumen";
import type { AvisoProgreso, TareaProgreso } from "../tipos";

// Martes 24: la tarea 7 (martes 24, sin motivo) aún no se ha pasado de hora.
const HOY = "2026-11-24";

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
  tarea("6", { estado: "pendiente", fecha: "2026-11-24", pendiente_motivo: "tiempo_agotado" }),
  tarea("7", { estado: "pendiente", fecha: "2026-11-24", ambito: "hogar" }),
];

describe("resumen de la pantalla 43 (HU-25)", () => {
  const progreso = consolidarProgreso(TAREAS, [], "2026-11-23", "2026-11-29");

  it("consolida igual que progreso_alumno en Supabase", () => {
    expect(progreso.resumen).toEqual({
      total: 7,
      hechas: 3,
      pendientes: 3,
      en_curso: 1,
      sin_terminar: 2,
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
    expect(contarEstados(progreso, HOY)).toEqual({ pendientes: 2, enCurso: 1, porHacer: 1 });
    expect(detallePendientes(progreso, HOY)).toBe("Además, 1 en curso · 1 por hacer");
    // Al día siguiente, la que quedó sin hacer el martes ya es pendiente
    expect(contarEstados(progreso, "2026-11-25")).toEqual({
      pendientes: 3,
      enCurso: 1,
      porHacer: 0,
    });
    expect(detallePendientes(progreso, "2026-11-25")).toBe("Además, 1 en curso");
    expect(
      detallePendientes(consolidarProgreso([tarea("1")], [], "2026-11-23", "2026-11-23"), HOY),
    ).toBe("Nada en curso ni por hacer");
    expect(emocionMasFrecuente(progreso)).toEqual({
      clave: "contento",
      etiqueta: "Contento",
      porcentaje: 67,
    });
    expect(emocionMasFrecuente({ ...progreso, emociones: [] })).toBeNull();
    expect(porcentajeHechas(0, 0)).toBe(0);
  });

  it("cuatro estados con texto, tono e icono (nunca solo color): Hecha, En curso, Pendiente y Por hacer", () => {
    expect(estadoVisible(TAREAS[0], HOY)).toEqual({
      texto: "Hecha",
      tono: "exito",
      icono: "check",
    });
    expect(estadoVisible(TAREAS[4], HOY)).toEqual({
      texto: "En curso",
      tono: "primario",
      icono: "reloj",
    });
    // Se le pasó la hora (la base le pone el motivo «tiempo_agotado»): Pendiente, en amarillo
    expect(estadoVisible(TAREAS[3], HOY)).toEqual({
      texto: "Pendiente",
      tono: "pendiente",
      icono: "alerta",
    });
    expect(estadoVisible(TAREAS[5], HOY).texto).toBe("Pendiente");
    expect(
      estadoVisible(tarea("8", { estado: "pendiente", pendiente_motivo: "profesor" }), HOY).texto,
    ).toBe("Pendiente");
    // Aún no ha llegado su hora: Por hacer, en gris
    expect(estadoVisible(TAREAS[6], HOY)).toEqual({
      texto: "Por hacer",
      tono: "neutro",
      icono: "reloj",
    });
    // Si su día ya pasó (por ejemplo, una sin hora, que no caduca), es Pendiente
    expect(estadoVisible(TAREAS[6], "2026-11-25").texto).toBe("Pendiente");
  });

  it("etiquetas de emociones (las de la app y las de la base), necesidades y ámbitos", () => {
    expect(etiquetaEmocion("tranquilo")).toBe("Tranquilo");
    expect(etiquetaEmocion("regular")).toBe("Regular");
    expect(etiquetaEmocion("muy_bien")).toBe("Muy bien");
    expect(etiquetaNecesidad("bano")).toBe("Baño");
    expect(etiquetaAmbito("hogar")).toBe("Casa");
    expect(etiquetaAmbito("centro")).toBe("Clase");
  });

  it("tarjetas del resumen: días completos, Plan B, ayuda, pendientes y urgencias", () => {
    const urgencia = aviso("urgencia", { urgencia: true, atendido: false });
    const conAvisos = consolidarProgreso(
      TAREAS,
      [aviso("bano"), urgencia],
      "2026-11-23",
      "2026-11-29",
    );
    // La hora de la urgencia se cuenta en la hora local
    const d = new Date(urgencia.creado_en);
    const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    expect(
      tarjetasResumen(
        {
          ...conAvisos,
          dieta_comedor: "normal",
          valoracion: { texto: "Trabaja con mucha autonomía", fecha: "2026-11-24" },
        },
        HOY,
      ),
    ).toEqual([
      { id: "comedor", tono: "primario", titulo: "Comedor:", texto: "menú normal." },
      {
        id: "plan-b",
        tono: "neutro",
        titulo: "Plan B activado 1 vez:",
        texto: "Huerto (lunes 23).",
      },
      {
        id: "valoracion",
        tono: "exito",
        titulo: "Valoración docente:",
        texto: "«Trabaja con mucha autonomía» (martes 24).",
      },
      {
        id: "ayuda",
        tono: "neutro",
        titulo: "Ha pedido ayuda 2 veces:",
        texto: "baño (1) y urgencia (1).",
      },
      {
        id: "urgencias",
        tono: "peligro",
        titulo: "Urgencia sin atender:",
        texto: `martes 24 a las ${hora}.`,
      },
    ]);
  });

  it("como en el boceto 43: Comedor, Plan B y Valoración docente siempre, aunque no haya datos", () => {
    expect(
      tarjetasResumen(consolidarProgreso([tarea("1")], [], "2026-11-23", "2026-11-23"), HOY),
    ).toEqual([
      { id: "comedor", tono: "primario", titulo: "Comedor:", texto: "no se sabe el menú." },
      { id: "plan-b", tono: "neutro", titulo: "Plan B activado:", texto: "ninguna vez." },
      {
        id: "valoracion",
        tono: "exito",
        titulo: "Valoración docente:",
        texto: "no hay ninguna en este periodo.",
      },
    ]);
  });

  it("en un día, la valoración no repite la fecha; el menú sale con su nombre", () => {
    const dia = {
      ...consolidarProgreso([tarea("1")], [], "2026-11-23", "2026-11-23"),
      dieta_comedor: "turmix",
      valoracion: { texto: "Muy atento", fecha: "2026-11-23" },
    };
    const [comedor, , valoracion] = tarjetasResumen(dia, HOY);
    expect(comedor.texto).toBe("menú triturado líquido (túrmix).");
    expect(valoracion.texto).toBe("«Muy atento».");
  });

  it("si hay muchos Plan B o avisos, nombra unos pocos y dice cuántos más", () => {
    // En un solo día basta con la hora
    const muchos = consolidarProgreso(
      ["a", "b", "c", "d", "e"].map((id) => tarea(id, { plan_b: true, titulo: id.toUpperCase() })),
      ["bano", "bano", "agua", "descanso", "ayuda"].map((n, i) => aviso(n, { id: `v${i}` })),
      "2026-11-23",
      "2026-11-23",
    );
    const [, planB, , ayuda] = tarjetasResumen(muchos, HOY);
    expect(planB.titulo).toBe("Plan B activado 5 veces:");
    expect(planB.texto).toBe("A (09:00), B (09:00) y 3 más.");
    expect(ayuda.texto).toBe("baño (2), agua (1), descanso (1) y 1 más.");
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
