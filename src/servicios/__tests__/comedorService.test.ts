// HU-12 · SCRUM-102 (T-12.1): recuento del comedor (pantalla 11) y parte del día (pantalla 54).
import {
  ERROR_PARTE_COCINA_DIA,
  ERROR_RECUENTO_COMEDOR,
  confirmarRecuentoComedor,
  obtenerParteCocinaDia,
  obtenerRecuentoComedorHoy,
} from "../comedorService";
import { supabase } from "../../lib/supabaseClient";

jest.mock("../../lib/supabaseClient", () => ({ supabase: { rpc: jest.fn() } }));

const mockRpc = supabase.rpc as jest.Mock;

beforeEach(() => mockRpc.mockReset());

describe("obtenerRecuentoComedorHoy (pantalla 11)", () => {
  it("convierte las clases y sus compañeros", async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          aula_id: "a1",
          nombre: "Clase Triángulo",
          icono_forma: "tri",
          icono_url: null,
          alumnos: [{ id: "al1", nombre: "Miriam", icono: "🦋", color: "#7A3FA6" }],
          confirmado: true,
          ausentes: ["al1"],
        },
        {
          aula_id: "a2",
          nombre: "Clase Círculo",
          icono_forma: "cir",
          icono_url: null,
          alumnos: null,
          confirmado: false,
          ausentes: null,
        },
      ],
      error: null,
    });

    const r = await obtenerRecuentoComedorHoy();
    expect(mockRpc).toHaveBeenCalledWith("recuento_comedor_hoy");
    expect(r).toEqual({
      success: true,
      data: [
        {
          aulaId: "a1",
          nombre: "Clase Triángulo",
          iconoForma: "tri",
          iconoUrl: null,
          alumnos: [{ id: "al1", nombre: "Miriam", icono: "🦋", color: "#7A3FA6" }],
          confirmado: true,
          ausentes: ["al1"],
        },
        {
          aulaId: "a2",
          nombre: "Clase Círculo",
          iconoForma: "cir",
          iconoUrl: null,
          alumnos: [],
          confirmado: false,
          ausentes: [],
        },
      ],
    });
  });

  it("si la base de datos falla (o no tiene permiso), da un mensaje claro", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Sin permiso" } });
    await expect(obtenerRecuentoComedorHoy()).resolves.toEqual({
      success: false,
      error: ERROR_RECUENTO_COMEDOR,
    });
  });
});

describe("confirmarRecuentoComedor (pantalla 11, «Siguiente»)", () => {
  it("envía el aula y los ausentes y devuelve la hora guardada", async () => {
    mockRpc.mockResolvedValue({ data: "2026-11-25T09:12:00+01:00", error: null });
    await expect(confirmarRecuentoComedor("a1", ["al1"])).resolves.toEqual({
      success: true,
      data: "2026-11-25T09:12:00+01:00",
    });
    expect(mockRpc).toHaveBeenCalledWith("confirmar_recuento_comedor", {
      p_aula: "a1",
      p_ausentes: ["al1"],
    });
  });

  it("devuelve el error si la base de datos lo rechaza", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Hay ausentes que no son de esta clase" },
    });
    await expect(confirmarRecuentoComedor("a1", ["x"])).resolves.toEqual({
      success: false,
      error: "Hay ausentes que no son de esta clase",
    });
  });

  it("sin conexión no lanza el error", async () => {
    mockRpc.mockRejectedValue(new Error("sin red"));
    await expect(confirmarRecuentoComedor("a1", [])).resolves.toEqual({
      success: false,
      error: "sin red",
    });
  });
});

describe("obtenerParteCocinaDia (pantalla 54)", () => {
  it("convierte el parte del día", async () => {
    mockRpc.mockResolvedValue({
      data: {
        fecha: "2026-11-25",
        total: 34,
        ausentes: 2,
        menus: [
          { tipo: "normal", total: 28 },
          { tipo: "turmix", total: 4 },
        ],
        aulas_total: 3,
        aulas_confirmadas: 3,
        ultima: { aula: "Clase Triángulo", hora: "10:12" },
        avisos: [
          {
            alumno_id: "al1",
            nombre: "Miriam",
            aula: "Clase Triángulo",
            alergias: ["frutos secos"],
          },
        ],
      },
      error: null,
    });

    await expect(obtenerParteCocinaDia()).resolves.toEqual({
      success: true,
      data: {
        fecha: "2026-11-25",
        total: 34,
        ausentes: 2,
        menus: [
          { tipo: "normal", total: 28 },
          { tipo: "turmix", total: 4 },
        ],
        aulasTotal: 3,
        aulasConfirmadas: 3,
        ultima: { aula: "Clase Triángulo", hora: "10:12" },
        avisos: [
          {
            alumnoId: "al1",
            nombre: "Miriam",
            aula: "Clase Triángulo",
            alergias: ["frutos secos"],
            observaciones: "",
          },
        ],
      },
    });
    expect(mockRpc).toHaveBeenCalledWith("parte_cocina_dia");
  });

  it("si aún no hay ninguna clase confirmada, «ultima» es null", async () => {
    mockRpc.mockResolvedValue({
      data: { fecha: "2026-11-25", total: 4, menus: [], aulas_total: 2, aulas_confirmadas: 0 },
      error: null,
    });
    const r = await obtenerParteCocinaDia();
    expect(r.data?.ultima).toBeNull();
    expect(r.data?.aulasConfirmadas).toBe(0);
  });

  it("si la base de datos falla, da un mensaje claro", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "Sin permiso" } });
    await expect(obtenerParteCocinaDia()).resolves.toEqual({
      success: false,
      error: ERROR_PARTE_COCINA_DIA,
    });
  });
});
