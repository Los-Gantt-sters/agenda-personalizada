/**
 * Pruebas unitarias para la máquina de estados y servicio de Reprografía
 * (HU-14 / SCRUM-108 / SCRUM-109 · T-14.1: Recogida -> Taller -> Reparto -> Completado).
 */

import {
  avanzarFaseReprografia,
  avanzarPasoReprografia,
  completarEncargoReprografia,
  crearEncargoReprografia,
  generarPasosReprografia,
  limpiarEncargosMemoria,
  listarEncargosReprografia,
  obtenerEncargoReprografia,
  obtenerFaseDePaso,
} from "../reprografiaService";

describe("reprografiaService - Máquina de estados Recogida -> Taller -> Reparto (SCRUM-109)", () => {
  beforeEach(() => {
    limpiarEncargosMemoria();
  });

  it("valida los parámetros obligatorios al crear un encargo de reprografía", async () => {
    const sinTitulo = await crearEncargoReprografia({
      tituloDocumento: "   ",
      copias: 20,
      modoColor: "blanco_y_negro",
      modoCaras: "dos_caras",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });
    expect(sinTitulo.success).toBe(false);
    expect(sinTitulo.error).toContain("título o tipo de documento");

    const copiasInvalidas = await crearEncargoReprografia({
      tituloDocumento: "Fichas de matemáticas",
      copias: 0,
      modoColor: "blanco_y_negro",
      modoCaras: "dos_caras",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });
    expect(copiasInvalidas.success).toBe(false);
    expect(copiasInvalidas.error).toContain("entre 1 y 500");

    const sinAula = await crearEncargoReprografia({
      tituloDocumento: "Fichas",
      copias: 10,
      modoColor: "color",
      modoCaras: "una_cara",
      aulaDestino: "",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });
    expect(sinAula.success).toBe(false);

    const sinProfesor = await crearEncargoReprografia({
      tituloDocumento: "Fichas",
      copias: 10,
      modoColor: "color",
      modoCaras: "una_cara",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "  ",
      estudianteId: "luc",
    });
    expect(sinProfesor.success).toBe(false);

    const sinAlumno = await crearEncargoReprografia({
      tituloDocumento: "Fichas",
      copias: 10,
      modoColor: "color",
      modoCaras: "una_cara",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "María Carmen",
      estudianteId: "",
    });
    expect(sinAlumno.success).toBe(false);
  });

  it("crea un encargo y genera automáticamente los 5 pasos de Pantalla 12 en Lectura Fácil", async () => {
    const res = await crearEncargoReprografia({
      tituloDocumento: "Fichas de lectura",
      copias: 20,
      modoColor: "blanco_y_negro",
      modoCaras: "dos_caras",
      acabado: "grapado",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });

    expect(res.success).toBe(true);
    const encargo = res.data!;
    expect(encargo.estado).toBe("pendiente");
    expect(encargo.pasoActual).toBe(1);
    expect(encargo.pasos).toHaveLength(5);
    expect(encargo.pasos[0].fase).toBe("recogida");
    expect(encargo.pasos[0].texto).toContain("Clase Triángulo (20 hojas)");
    expect(encargo.pasos[2].texto).toContain("20 copias, 2 caras y blanco y negro");
    expect(encargo.pasos[4].fase).toBe("reparto");
    expect(encargo.pasos[4].texto).toContain("María Carmen (Clase Triángulo)");

    const pasosColor = generarPasosReprografia({
      copias: 5,
      modoColor: "color",
      modoCaras: "una_cara",
      aulaDestino: "Clase Círculo",
      profesorSolicitante: "Laura",
    });
    expect(pasosColor[2].texto).toContain("5 copias, 1 cara y en color");
  });

  it("aplica estrictamente las transiciones de la máquina de estados (pendiente -> recogida -> taller -> reparto -> completado)", async () => {
    const creado = await crearEncargoReprografia({
      tituloDocumento: "Menú comedor",
      copias: 15,
      modoColor: "blanco_y_negro",
      modoCaras: "una_cara",
      aulaDestino: "Clase Cuadrado",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });
    const id = creado.data!.id;

    // No permite saltar directamente de pendiente a reparto
    const saltoInvalido = await avanzarFaseReprografia(id, "reparto");
    expect(saltoInvalido.success).toBe(false);
    expect(saltoInvalido.error).toContain("TRANSICION_INVALIDA");

    // Transición válida: pendiente -> recogida -> taller -> reparto -> completado
    const aRecogida = await avanzarFaseReprografia(id, "recogida");
    expect(aRecogida.success).toBe(true);
    expect(aRecogida.data?.estado).toBe("recogida");
    expect(aRecogida.data?.pasoActual).toBe(1);

    const aTaller = await avanzarFaseReprografia(id, "taller");
    expect(aTaller.success).toBe(true);
    expect(aTaller.data?.estado).toBe("taller");
    expect(aTaller.data?.pasoActual).toBe(2);

    const aReparto = await avanzarFaseReprografia(id, "reparto");
    expect(aReparto.success).toBe(true);
    expect(aReparto.data?.estado).toBe("reparto");
    expect(aReparto.data?.pasoActual).toBe(5);

    const aCompletado = await avanzarFaseReprografia(id, "completado");
    expect(aCompletado.success).toBe(true);
    expect(aCompletado.data?.estado).toBe("completado");
    expect(aCompletado.data?.completadoEn).toBeDefined();

    // Una vez completado, no permite nuevas transiciones
    const postCompletado = await avanzarFaseReprografia(id, "taller");
    expect(postCompletado.success).toBe(false);
  });

  it("sincroniza pasos (1..5) con las fases y completa el encargo al terminar en el paso 5", async () => {
    const creado = await crearEncargoReprografia({
      tituloDocumento: "Autorizaciones excursión",
      copias: 20,
      modoColor: "blanco_y_negro",
      modoCaras: "dos_caras",
      aulaDestino: "Clase Triángulo",
      profesorSolicitante: "María Carmen",
      estudianteId: "luc",
    });
    const id = creado.data!.id;

    expect(obtenerFaseDePaso(1)).toBe("recogida");
    expect(obtenerFaseDePaso(3)).toBe("taller");
    expect(obtenerFaseDePaso(5)).toBe("reparto");

    // No se puede completar antes de llegar al paso 5 (reparto)
    const completarTemprano = await completarEncargoReprografia(id);
    expect(completarTemprano.success).toBe(false);

    // Avanzar por los pasos 1 -> 3 -> 5
    const p1 = await avanzarPasoReprografia(id, 1);
    expect(p1.data?.estado).toBe("recogida");

    const p3 = await avanzarPasoReprografia(id, 3);
    expect(p3.data?.estado).toBe("taller");
    expect(p3.data?.pasos[0].completado).toBe(true);
    expect(p3.data?.pasos[1].completado).toBe(true);
    expect(p3.data?.pasos[2].completado).toBe(false);

    const p5 = await avanzarPasoReprografia(id, 5);
    expect(p5.data?.estado).toBe("reparto");

    const fin = await completarEncargoReprografia(id);
    expect(fin.success).toBe(true);
    expect(fin.data?.estado).toBe("completado");
    expect(fin.data?.pasos.every((p) => p.completado)).toBe(true);

    // Intentar mover paso tras completar devuelve error
    const pasoPostFin = await avanzarPasoReprografia(id, 2);
    expect(pasoPostFin.success).toBe(false);

    // Consultas y listados
    const consultado = await obtenerEncargoReprografia(id);
    expect(consultado.success).toBe(true);
    expect((await obtenerEncargoReprografia("no-existe")).success).toBe(false);
    expect((await avanzarFaseReprografia("no-existe", "recogida")).success).toBe(false);
    expect((await avanzarPasoReprografia("no-existe", 1)).success).toBe(false);
    expect((await completarEncargoReprografia("no-existe")).success).toBe(false);

    const lista = await listarEncargosReprografia({
      estudianteId: "luc",
      estado: "completado",
    });
    expect(lista.data).toHaveLength(1);
  });
});
