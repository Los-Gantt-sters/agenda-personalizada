import {
  confirmarFin,
  deshacerEmpezar,
  deshacerFin,
  dividirEnBloques,
  empezarTarea,
  franjaHoraria,
  necesitaEmpezar,
  ordenarSecuencia,
} from "../logica";
import type { EntradaAgenda } from "../tipos";
import { calcularMedidas } from "../AgendaTresBloques";

// El reloj visual y el refuerzo usan sonidos; en las pruebas no suenan.
jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

const e = (
  id: string,
  hora: string,
  estado: EntradaAgenda["estado"] = "pendiente",
  orden = 0,
): EntradaAgenda => ({
  id,
  estudiante_id: "al1",
  tarea_id: `t-${id}`,
  fecha: "2026-11-05",
  hora_inicio: hora,
  duracion_prevista_min: 30,
  orden,
  estado,
  tarea: { id: `t-${id}`, titulo: `Tarea ${id}`, emoji: "⭐" },
});

describe("SCRUM-69 · RF4.1 secuencia cronológica", () => {
  it("ordena por hora y, a la misma hora, por orden; quita las canceladas", () => {
    const s = ordenarSecuencia([
      e("c", "11:00"),
      e("a", "09:00:00", "pendiente", 2),
      e("b", "09:00", "pendiente", 1),
      e("x", "08:00", "cancelada"),
    ]);
    expect(s.map((x) => x.id)).toEqual(["b", "a", "c"]);
  });

  it("muestra la franja horaria legible", () => {
    expect(franjaHoraria(e("a", "09:45:00"))).toBe("9:45 a 10:15");
  });
});

describe("SCRUM-69 · RF4.2 tres bloques", () => {
  it("reparte en Hecho, Ahora y Después", () => {
    const b = dividirEnBloques([
      e("1", "09:00", "hecha"),
      e("2", "10:00"),
      e("3", "11:00"),
      e("4", "12:00"),
    ]);
    expect(b.hecho.map((x) => x.id)).toEqual(["1"]);
    expect(b.ahora?.id).toBe("2");
    expect(b.despues.map((x) => x.id)).toEqual(["3", "4"]);
  });

  it("respeta el máximo de tarjetas a cada lado (sin scroll)", () => {
    const b = dividirEnBloques(
      [
        e("1", "08:00", "hecha"),
        e("2", "09:00", "hecha"),
        e("3", "10:00", "hecha"),
        e("4", "11:00"),
        e("5", "12:00"),
        e("6", "13:00"),
      ],
      { maxHecho: 2, maxDespues: 1 },
    );
    expect(b.hecho.map((x) => x.id)).toEqual(["2", "3"]);
    expect(b.despues.map((x) => x.id)).toEqual(["5"]);
  });

  it("una tarea en curso manda sobre las pendientes anteriores", () => {
    expect(dividirEnBloques([e("1", "09:00"), e("2", "10:00", "en_curso")]).ahora?.id).toBe("2");
  });

  it("salta las bloqueadas para «Ahora» pero las enseña en «Después»", () => {
    const b = dividirEnBloques([
      e("1", "09:00", "bloqueada"),
      e("2", "10:00"),
      e("3", "11:00", "bloqueada"),
    ]);
    expect(b.ahora?.id).toBe("2");
    expect(b.despues.map((x) => x.id)).toEqual(["3"]);
  });

  it("día terminado cuando no queda nada pendiente", () => {
    const b = dividirEnBloques([e("1", "09:00", "hecha"), e("2", "10:00", "hecha")]);
    expect(b.ahora).toBeNull();
    expect(b.diaTerminado).toBe(true);
  });
});

describe("SCRUM-69 · RF4.2/RNF4.2 «Ahora» al 60 %", () => {
  it.each([
    [1024, 768],
    [768, 1024],
    [390, 844],
    [844, 390],
  ])("«Ahora» ocupa el 60 %% y todo cabe en %ix%i", (w, h) => {
    const m = calcularMedidas(w, h);
    const eje = m.horizontal ? "width" : "height";
    const suma = m.lado[eje] * 2 + m.ahora[eje];
    expect(m.ahora[eje] / suma).toBeCloseTo(0.6);
    expect(suma + 16 * 4).toBeLessThanOrEqual((m.horizontal ? w : h) + 0.01);
    expect(m.maxLado).toBeGreaterThanOrEqual(1);
  });
});

describe("SCRUM-70 · RF4.3 avance al confirmar", () => {
  it("BDD: con 3 tareas, al terminar la primera pasa a Hecho y la segunda a Ahora", () => {
    const dia = [e("1", "09:00"), e("2", "10:00"), e("3", "11:00")];
    const b = dividirEnBloques(confirmarFin(dia, "1"));
    expect(b.hecho.map((x) => x.id)).toEqual(["1"]);
    expect(b.ahora?.id).toBe("2");
    expect(b.despues.map((x) => x.id)).toEqual(["3"]);
  });

  it("ignora la confirmación de una tarea que no es la de Ahora (doble toque)", () => {
    const dia = [e("1", "09:00", "hecha"), e("2", "10:00"), e("3", "11:00")];
    expect(confirmarFin(dia, "1")).toEqual(dia);
    expect(confirmarFin(dia, "3")).toEqual(dia);
  });
});

describe("SCRUM-74 · RF6.1 y RF6.4 empezar y terminar (T-08.1)", () => {
  const INICIO = "2026-11-05T08:30:00.000Z";
  const FIN = "2026-11-05T08:52:00.000Z";

  it("Empezar pone en curso la tarea de Ahora y guarda la hora de inicio (RI6.1)", () => {
    const r = empezarTarea([e("1", "09:00", "hecha"), e("2", "10:00")], "2", INICIO);
    expect(r.find((x) => x.id === "2")).toMatchObject({ estado: "en_curso", inicio_real: INICIO });
  });

  it("Empezar no hace nada si no es la tarea de Ahora o si ya estaba en curso", () => {
    const entradas = [e("1", "09:00"), e("2", "10:00")];
    expect(empezarTarea(entradas, "2", INICIO)).toEqual(entradas);
    const enCurso = [{ ...e("1", "09:00", "en_curso"), inicio_real: INICIO }];
    expect(empezarTarea(enCurso, "1", FIN)[0].inicio_real).toBe(INICIO);
  });

  it("Terminar marca como hecha y guarda la hora de fin (RI6.1)", () => {
    const r = confirmarFin([{ ...e("1", "09:00", "en_curso"), inicio_real: INICIO }], "1", FIN);
    expect(r[0]).toMatchObject({ estado: "hecha", inicio_real: INICIO, fin_real: FIN });
  });

  it("pide Empezar mientras no se ha empezado, salvo que el tutor lo quite (RF6.8)", () => {
    // Por defecto (la base de datos no trae el dato) todas piden Empezar.
    expect(necesitaEmpezar(e("1", "09:00"))).toBe(true);
    expect(necesitaEmpezar({ ...e("1", "09:00"), requiere_inicio_fin: null })).toBe(true);
    expect(necesitaEmpezar({ ...e("1", "09:00"), requiere_inicio_fin: true })).toBe(true);
    expect(necesitaEmpezar({ ...e("1", "09:00"), requiere_inicio_fin: false })).toBe(false);
    expect(necesitaEmpezar({ ...e("1", "09:00", "en_curso"), requiere_inicio_fin: true })).toBe(
      false,
    );
  });
});

describe("Mejora de la profesora · «Atrás» deshace Empezar y Terminar", () => {
  const INICIO = "2026-11-05T08:30:00.000Z";
  const FIN = "2026-11-05T08:52:00.000Z";

  it("deshacer Empezar devuelve la tarea a pendiente y olvida la hora de inicio", () => {
    const r = deshacerEmpezar([{ ...e("1", "09:00", "en_curso"), inicio_real: INICIO }], "1");
    expect(r[0]).toMatchObject({ estado: "pendiente", inicio_real: null });
    expect(dividirEnBloques(r).ahora?.id).toBe("1");
  });

  it("deshacer Empezar no hace nada si la tarea no está en curso", () => {
    const entradas = [e("1", "09:00"), e("2", "10:00", "hecha")];
    expect(deshacerEmpezar(entradas, "1")).toEqual(entradas);
    expect(deshacerEmpezar(entradas, "2")).toEqual(entradas);
  });

  it("deshacer Terminar vuelve a en curso si se había empezado y la tarea vuelve a Ahora", () => {
    const hecha = { ...e("1", "09:00", "hecha"), inicio_real: INICIO, fin_real: FIN };
    const r = deshacerFin([hecha, e("2", "10:00")], "1");
    expect(r[0]).toMatchObject({ estado: "en_curso", inicio_real: INICIO, fin_real: null });
    expect(dividirEnBloques(r).ahora?.id).toBe("1");
  });

  it("deshacer Terminar vuelve a pendiente si no se había empezado", () => {
    const r = deshacerFin([{ ...e("1", "09:00", "hecha"), fin_real: FIN }, e("2", "10:00")], "1");
    expect(r[0]).toMatchObject({ estado: "pendiente", fin_real: null });
    expect(dividirEnBloques(r).ahora?.id).toBe("1");
  });

  it("deshacer Terminar no hace nada si no está hecha o si ya hay otra en curso", () => {
    const entradas = [e("1", "09:00", "hecha"), { ...e("2", "10:00", "en_curso") }];
    expect(deshacerFin(entradas, "1")).toEqual(entradas);
    expect(deshacerFin(entradas, "2")).toEqual(entradas);
  });
});

describe("SCRUM-68 · tareas sin hora fija (secuencia_dia)", () => {
  it("van al final del día y se muestran como «Sin hora»", () => {
    const sinHora = { ...e("x", ""), hora_inicio: "" };
    const s = ordenarSecuencia([sinHora, e("a", "12:00")]);
    expect(s.map((x) => x.id)).toEqual(["a", "x"]);
    expect(franjaHoraria(sinHora)).toBe("Sin hora fija");
  });
});
