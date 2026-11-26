/**
 * Pruebas unitarias del modelo y servicio de permisos simplificados por alumno (26d / 07e)
 * (HU-23 / SCRUM-141 / SCRUM-142 · T-23.1).
 */

jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from "../../lib/supabaseClient";
import {
  CATALOGO_FORMATOS_MULTIMEDIA,
  FORMATOS_RESTRINGIDOS_DEMO_07E,
  ORDEN_FORMATOS_MULTIMEDIA,
  PASOS_LAVARSE_MANOS_07E,
  alternarFormatoMultimediaAlumno,
  crearPermisosAlumnoPorDefecto,
  crearPermisosRestringidosDemo07e,
  filtrarCatalogoFormatosPorPermiso,
  guardarPermisosAlumno26d,
  normalizarFormatosPermitidos,
  obtenerPermisosAlumno26d,
  puedeAccederAgendaSemanal06b,
  reiniciarPermisosAlumnoMemoria,
  validarDestinoEntradaLogin,
  validarFormatosPermitidos,
} from "../permisosAlumnoService";
import type { FormatoMultimediaAlumno } from "../../tipos/permisosAlumno";

const mockFrom = supabase.from as jest.Mock;

describe("permisosAlumnoService (HU-23 · SCRUM-142 · 26d / 07e)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reiniciarPermisosAlumnoMemoria();
  });

  it("normaliza y ordena los 5 formatos multimedia eliminando duplicados", () => {
    const resultado = normalizarFormatosPermitidos(["audio", "pictograma", "audio", "foto"]);
    expect(resultado).toEqual(["pictograma", "foto", "audio"]);
  });

  it("valida que exista al menos un formato multimedia habilitado bajo cada paso", () => {
    expect(validarFormatosPermitidos(["pictograma", "audio"])).toEqual(["pictograma", "audio"]);
    expect(() => validarFormatosPermitidos([])).toThrow(/al menos un formato multimedia/i);
  });

  it("valida el destino de entrada tras login (06b Semana vs 06 Solo Hoy)", () => {
    expect(validarDestinoEntradaLogin("06b")).toBe("06b");
    expect(validarDestinoEntradaLogin("06")).toBe("06");
    expect(() => validarDestinoEntradaLogin("99" as unknown as "06b")).toThrow(
      /destino de entrada tras login/i,
    );
  });

  it("crea los permisos por defecto de 26d y el perfil restringido de demostración de 07e", () => {
    const porDefecto = crearPermisosAlumnoPorDefecto("ale");
    expect(porDefecto.nombreAlumno).toBe("Alejandro");
    expect(porDefecto.formatosPermitidos).toEqual(ORDEN_FORMATOS_MULTIMEDIA);
    expect(porDefecto.entradaTrasLogin).toBe("06b");
    expect(porDefecto.mostrarBotonPreferencias16).toBe(true);
    expect(puedeAccederAgendaSemanal06b(porDefecto)).toBe(true);

    const restringido = crearPermisosRestringidosDemo07e();
    expect(restringido.formatosPermitidos).toEqual(FORMATOS_RESTRINGIDOS_DEMO_07E);
    expect(PASOS_LAVARSE_MANOS_07E).toHaveLength(5);
  });

  it("alterna formatos multimedia e impide desactivar el último formato restante", () => {
    // Desactivar 'texto' cuando hay 2 formatos activos
    const paso1 = alternarFormatoMultimediaAlumno(["pictograma", "texto"], "texto");
    expect(paso1.formatos).toEqual(["pictograma"]);
    expect(paso1.bloqueadoPorMinimo).toBe(false);

    // Intentar desactivar 'pictograma' cuando es el único activo -> se bloquea
    const paso2 = alternarFormatoMultimediaAlumno(paso1.formatos, "pictograma");
    expect(paso2.formatos).toEqual(["pictograma"]);
    expect(paso2.bloqueadoPorMinimo).toBe(true);

    // Activar 'audio' de nuevo
    const paso3 = alternarFormatoMultimediaAlumno(paso2.formatos, "audio");
    expect(paso3.formatos).toEqual(["pictograma", "audio"]);
    expect(paso3.bloqueadoPorMinimo).toBe(false);
  });

  it("filtra dinámicamente el catálogo de 5 botones multimedia para la pantalla 07e", () => {
    const botones07e = filtrarCatalogoFormatosPorPermiso(["audio", "pictograma"]);
    expect(botones07e.map((b) => b.clave)).toEqual(["pictograma", "audio"]);
    expect(botones07e.map((b) => b.etiqueta)).toEqual(["Pictograma", "Audio"]);
    expect(CATALOGO_FORMATOS_MULTIMEDIA).toHaveLength(5);
  });

  it("obtiene permisos desde Supabase (preferencias_alumnos) cuando existen y los almacena en caché", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              alumno_id: "luc",
              formatos_multimedia_permitidos: ["pictograma", "video"],
              vista_agenda: "diaria",
              nivel_permisos_preferencias: "ninguno",
              actualizado_en: "2026-11-26T09:00:00.000Z",
            },
            error: null,
          }),
        }),
      }),
    });

    const permisos = await obtenerPermisosAlumno26d("luc");
    expect(permisos.alumnoId).toBe("luc");
    expect(permisos.nombreAlumno).toBe("Lucas");
    expect(permisos.formatosPermitidos).toEqual(["pictograma", "video"]);
    expect(permisos.entradaTrasLogin).toBe("06");
    expect(permisos.mostrarBotonPreferencias16).toBe(false);
    expect(puedeAccederAgendaSemanal06b(permisos)).toBe(false);

    // Segunda lectura usa caché en memoria sin volver a consultar Supabase
    mockFrom.mockClear();
    const desdeCache = await obtenerPermisosAlumno26d("luc");
    expect(desdeCache.formatosPermitidos).toEqual(["pictograma", "video"]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("usa valores por defecto seguros cuando Supabase devuelve error o excepción", async () => {
    mockFrom.mockImplementation(() => {
      throw new Error("Sin conexión");
    });

    const permisos = await obtenerPermisosAlumno26d("mar");
    expect(permisos.alumnoId).toBe("mar");
    expect(permisos.nombreAlumno).toBe("Martina");
    expect(permisos.formatosPermitidos).toEqual(ORDEN_FORMATOS_MULTIMEDIA);
    expect(permisos.entradaTrasLogin).toBe("06b");
    expect(permisos.mostrarBotonPreferencias16).toBe(true);
  });

  it("guarda y actualiza permisos del alumno validando campos obligatorios", async () => {
    const upsertMock = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    await expect(guardarPermisosAlumno26d({ alumnoId: "   " })).rejects.toThrow(
      /identificador del alumno es obligatorio/i,
    );

    const guardados = await guardarPermisosAlumno26d({
      alumnoId: "ale",
      nombreAlumno: "Alejandro",
      formatosPermitidos: ["pictograma", "audio"] as FormatoMultimediaAlumno[],
      entradaTrasLogin: "06",
      mostrarBotonPreferencias16: false,
    });

    expect(guardados.formatosPermitidos).toEqual(["pictograma", "audio"]);
    expect(guardados.entradaTrasLogin).toBe("06");
    expect(guardados.mostrarBotonPreferencias16).toBe(false);
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });
});
