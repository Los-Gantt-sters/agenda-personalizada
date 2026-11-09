/**
 * Pruebas unitarias para el Servicio de Marcas de Tiempo Reales (SCRUM-76 / T-08.3)
 * Alineado al 100% con profeV2-1.pdf (Sección 5: Base de Datos) y Figura 3.
 * Requisitos: OE13 (telemetría de seguimiento), RF6.1 («Empezar»), RF6.4 («Terminar»), RI6.1
 */

import { supabase } from "../../lib/supabaseClient";
import {
  calcularMetricasRendimiento,
  limpiarCacheMemoria,
  listarEjecucionesPorEstudiante,
  obtenerEjecucion,
  registrarFinTarea,
  registrarInicioTarea,
  registrarPasoConfirmado,
} from "../marcasTiempoService";

// Mock de Supabase
jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe("marcasTiempoService - SCRUM-76 (Registro de Marcas de Tiempo Reales)", () => {
  beforeEach(() => {
    limpiarCacheMemoria();
    jest.clearAllMocks();

    // Mock por defecto de Supabase devolviendo datos válidos
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: jest.fn().mockResolvedValue({
        data: { id: "ejec-123" },
        error: null,
      }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
  });

  describe("registrarInicioTarea (RF6.1, RI6.1)", () => {
    it("rechaza el inicio si falta asignacionId o estudianteId", async () => {
      const res1 = await registrarInicioTarea({
        asignacionId: "",
        estudianteId: "est-1",
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toContain("asignación es obligatorio");

      const res2 = await registrarInicioTarea({
        asignacionId: "asig-1",
        estudianteId: "   ",
      });
      expect(res2.success).toBe(false);
      expect(res2.error).toContain("estudiante es obligatorio");
    });

    it("rechaza fechas con formato ISO inválido", async () => {
      const res = await registrarInicioTarea({
        asignacionId: "asig-1",
        estudianteId: "est-1",
        inicio: "fecha-totalmente-invalida",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("FORMATO_FECHA_INVALIDO");
    });

    it("registra el inicio real con timestamp ISO actual si no se proporciona", async () => {
      const res = await registrarInicioTarea({
        asignacionId: "asig-1",
        estudianteId: "est-lucas",
        duracionEstimadaMinutos: 30,
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.asignacionId).toBe("asig-1");
      expect(res.data?.estudianteId).toBe("est-lucas");
      expect(res.data?.inicio).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(res.data?.pasosConfirmados).toEqual([]);
      expect(res.data?.fin).toBeUndefined();
    });

    it("actualiza el estado de la asignación a 'en_curso'", async () => {
      await registrarInicioTarea({
        asignacionId: "asig-1",
        estudianteId: "est-lucas",
      });

      expect(supabase.from).toHaveBeenCalledWith("asignaciones");
      expect(supabase.from).toHaveBeenCalledWith("ejecuciones");
    });
  });

  describe("registrarFinTarea (RF6.4, RI6.1, Secc. 5.2.1)", () => {
    it("falla si la tarea no se ha iniciado previamente", async () => {
      const res = await registrarFinTarea({
        asignacionId: "asig-no-iniciada",
        estadoFinal: "completada",
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("EJECUCION_NO_ENCONTRADA");
    });

    it("rechaza un estado final desconocido", async () => {
      const res = await registrarFinTarea({
        asignacionId: "asig-1",
        estadoFinal: "inventado" as any,
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain("ESTADO_INVALIDO");
    });

    it("rechaza si la fecha de fin es cronológicamente anterior a la de inicio", async () => {
      await registrarInicioTarea({
        asignacionId: "asig-1",
        estudianteId: "est-1",
        inicio: "2026-11-09T10:00:00.000Z",
      });

      const res = await registrarFinTarea({
        asignacionId: "asig-1",
        fin: "2026-11-09T09:50:00.000Z", // 10 minutos antes
        estadoFinal: "completada",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("FECHA_CRONOLOGIA_INVALIDA");
    });

    it("calcula correctamente duración real en segundos y desviación respecto a estimación", async () => {
      // Tarea con 30 minutos estimados (1800 segundos)
      await registrarInicioTarea({
        asignacionId: "asig-reprografia",
        estudianteId: "est-lucas",
        inicio: "2026-11-09T10:00:00.000Z",
        duracionEstimadaMinutos: 30,
      });

      // Se completa tras 25 minutos (1500 segundos -> desviación -300s)
      const res = await registrarFinTarea({
        asignacionId: "asig-reprografia",
        fin: "2026-11-09T10:25:00.000Z",
        estadoFinal: "completada",
        valoracionEmocional: "contento",
        observaciones: "Encuadernación realizada con total autonomía.",
      });

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.duracionRealSegundos).toBe(1500); // 25 min = 1500 seg
      expect(res.data?.desviacionSegundos).toBe(-300); // Acabó 5 min (300 seg) antes
      expect(res.data?.estadoFinal).toBe("completada");
      expect(res.data?.valoracionEmocional).toBe("contento");
      expect(res.data?.observaciones).toBe("Encuadernación realizada con total autonomía.");
    });
  });

  describe("registrarPasoConfirmado (Figura 3: Paso)", () => {
    it("registra secuencialmente los pasos confirmados con su timestamp", async () => {
      await registrarInicioTarea({
        asignacionId: "asig-pasos",
        estudianteId: "est-1",
        inicio: "2026-11-09T10:00:00.000Z",
      });

      await registrarPasoConfirmado({
        asignacionId: "asig-pasos",
        paso: 1,
        texto: "Coger folios",
        confirmadoEn: "2026-11-09T10:05:00.000Z",
      });

      const res = await registrarPasoConfirmado({
        asignacionId: "asig-pasos",
        paso: 2,
        texto: "Poner espiral",
        confirmadoEn: "2026-11-09T10:12:00.000Z",
      });

      expect(res.success).toBe(true);
      expect(res.data?.pasosConfirmados).toHaveLength(2);
      expect(res.data?.pasosConfirmados[0].paso).toBe(1);
      expect(res.data?.pasosConfirmados[1].paso).toBe(2);
      expect(res.data?.pasosConfirmados[1].texto).toBe("Poner espiral");
    });
  });

  describe("obtenerEjecucion y listarEjecucionesPorEstudiante", () => {
    it("obtiene los datos de la ejecución por asignacionId", async () => {
      await registrarInicioTarea({
        asignacionId: "asig-consulta",
        estudianteId: "est-1",
      });

      const res = await obtenerEjecucion("asig-consulta");
      expect(res.success).toBe(true);
      expect(res.data?.asignacionId).toBe("asig-consulta");
    });

    it("lista todas las ejecuciones de un estudiante", async () => {
      await registrarInicioTarea({
        asignacionId: "asig-lucas-1",
        estudianteId: "est-lucas",
      });
      await registrarInicioTarea({
        asignacionId: "asig-lucas-2",
        estudianteId: "est-lucas",
      });

      const res = await listarEjecucionesPorEstudiante("est-lucas");
      expect(res.success).toBe(true);
      expect(res.data?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("calcularMetricasRendimiento (OE13)", () => {
    it("calcula tasa de éxito, duraciones medias y desglose emocional", async () => {
      const estudianteId = "est-metricas";

      // Tarea 1: completada en 600s con carita 'contento' (estimada 10 min = 600s, desv: 0)
      await registrarInicioTarea({
        asignacionId: "m-1",
        estudianteId,
        inicio: "2026-11-09T09:00:00.000Z",
        duracionEstimadaMinutos: 10,
      });
      await registrarFinTarea({
        asignacionId: "m-1",
        fin: "2026-11-09T09:10:00.000Z",
        estadoFinal: "completada",
        valoracionEmocional: "contento",
      });

      // Tarea 2: completada en 1200s con carita 'bien' (estimada 15 min = 900s, desv: +300)
      await registrarInicioTarea({
        asignacionId: "m-2",
        estudianteId,
        inicio: "2026-11-09T10:00:00.000Z",
        duracionEstimadaMinutos: 15,
      });
      await registrarFinTarea({
        asignacionId: "m-2",
        fin: "2026-11-09T10:20:00.000Z",
        estadoFinal: "completada",
        valoracionEmocional: "bien",
      });

      // Tarea 3: bloqueada en 300s con carita 'triste'
      await registrarInicioTarea({
        asignacionId: "m-3",
        estudianteId,
        inicio: "2026-11-09T11:00:00.000Z",
      });
      await registrarFinTarea({
        asignacionId: "m-3",
        fin: "2026-11-09T11:05:00.000Z",
        estadoFinal: "bloqueada",
        valoracionEmocional: "triste",
      });

      const metricasRes = await calcularMetricasRendimiento(estudianteId);
      expect(metricasRes.success).toBe(true);
      const metricas = metricasRes.data!;

      expect(metricas.totalEjecuciones).toBe(3);
      expect(metricas.completadas).toBe(2);
      expect(metricas.bloqueadas).toBe(1);
      expect(metricas.tasaExitoPorcentaje).toBe(67); // 2/3 = 66.6% -> 67%
      expect(metricas.duracionMediaSegundos).toBe(700); // (600 + 1200 + 300) / 3 = 700s
      expect(metricas.desgloseEmocional.positivo).toBe(2); // contento + bien
      expect(metricas.desgloseEmocional.negativo).toBe(1); // triste
    });
  });

  describe("Tolerancia y resiliencia offline", () => {
    it("mantiene el funcionamiento en memoria si Supabase devuelve error de red", async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ data: null, error: { message: "Network Error" } }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: "Network Error" } }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: null, error: { message: "Network Error" } }),
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: null, error: { message: "Network Error" } }),
          }),
        }),
      });

      const resInicio = await registrarInicioTarea({
        asignacionId: "asig-offline",
        estudianteId: "est-1",
        duracionEstimadaMinutos: 20,
      });
      expect(resInicio.success).toBe(true);

      const resFin = await registrarFinTarea({
        asignacionId: "asig-offline",
        estadoFinal: "completada",
        valoracionEmocional: "contento",
      });
      expect(resFin.success).toBe(true);
      expect(resFin.data?.estadoFinal).toBe("completada");
    });
  });
});
