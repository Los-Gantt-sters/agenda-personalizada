// Verificación de disparo puntual con cambios de reloj (HU-16, T-16.3 · SCRUM-84)
//
// El aviso de «faltan 5 minutos» (SCRUM-82) tiene que salir a su hora aunque el reloj del
// dispositivo cambie mientras la agenda está abierta. Se prueba:
//   CR-01 Puntualidad: sale exactamente a la hora (ni antes ni un minuto tarde)
//   CR-02 Reloj adelantado (ajuste automático, tableta que estuvo dormida)
//   CR-03 Reloj atrasado: ni avisa antes de tiempo ni repite un aviso ya dado
//   CR-04 Cambio de hora oficial (horario de verano / invierno, Europe/Madrid)
//   CR-05 Temporizadores retrasados (pestaña en segundo plano) y vuelta a la app
//   CR-06 Cambio de día: solo se avisa de las tareas de su fecha
//
// Con temporizadores falsos de Jest, `jest.setSystemTime` mueve el reloj SIN ejecutar
// temporizadores: es justo lo que pasa cuando el sistema cambia la hora por debajo de la app.
//
// La zona horaria (Europe/Madrid) se fija para todas las pruebas en jest.global-setup.js.

import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import type { EntradaAgenda } from "../../agenda/tipos";
import { momentoAviso, momentoInicio } from "../logica";
import { useAvisoAnticipado } from "../useAvisoAnticipado";
import { AVISO_POR_DEFECTO } from "../tipos";

const MIN = 60_000;
const DIA = "2026-11-05"; // día lectivo normal (jueves)

/** Entrada de agenda pendiente para la fecha y hora dadas. */
const entrada = (id: string, hora: string, fecha = DIA): EntradaAgenda => ({
  id,
  estudiante_id: "al1",
  tarea_id: `t-${id}`,
  fecha,
  hora_inicio: hora,
  duracion_prevista_min: 30,
  orden: 0,
  estado: "pendiente",
  tarea: { id: `t-${id}`, titulo: `Tarea ${id}` },
});

/** Fecha local (hora del colegio) a partir de "AAAA-MM-DD" y "HH:MM[:SS]". */
const local = (fecha: string, hora: string) => {
  const [a, m, d] = fecha.split("-").map(Number);
  const [h, mi, s = 0] = hora.split(":").map(Number);
  return new Date(a, m - 1, d, h, mi, s);
};
const a = (hora: string) => local(DIA, hora);

/** Avanza los temporizadores dentro de act (para que React actualice el estado). */
const avanzar = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

/** Cambia la hora del sistema sin ejecutar temporizadores (como un ajuste del reloj). */
const cambiarReloj = (fecha: Date) => jest.setSystemTime(fecha);

/** Monta el hook con una agenda y devuelve el resultado y el espía de avisos. */
async function montar(agenda: EntradaAgenda[]) {
  const onAviso = jest.fn();
  const hook = await renderHook(() => useAvisoAnticipado(agenda, AVISO_POR_DEFECTO, onAviso));
  return { ...hook, onAviso };
}

/** Hora de emisión del último aviso, en la hora local. */
const ultimaEmision = (onAviso: jest.Mock) =>
  new Date(onAviso.mock.calls[onAviso.mock.calls.length - 1][0].emitido_en);

describe("SCRUM-84 · Disparo puntual del aviso con cambios de reloj (HU-16)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("CR-01 · Puntualidad", () => {
    it("sale exactamente a las 10:40:00 aunque la app se abra a una hora con segundos sueltos", async () => {
      // 10:00:37: la revisión de cada minuto no cae en minutos exactos
      cambiarReloj(a("10:00:37"));
      const { onAviso } = await montar([entrada("4", "10:45")]);

      await avanzar(a("10:39:59").getTime() - a("10:00:37").getTime());
      expect(onAviso).not.toHaveBeenCalled();

      await avanzar(1_000);
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(ultimaEmision(onAviso)).toEqual(a("10:40:00"));
    });

    it("con una agenda larga, cada aviso sale a su hora y una sola vez", async () => {
      cambiarReloj(a("08:00"));
      const horas = ["09:00", "09:30", "10:15", "11:00", "12:30", "13:45"];
      const { onAviso } = await montar(horas.map((h, i) => entrada(String(i), h)));

      await avanzar(6 * 60 * MIN); // hasta las 14:00
      const emisiones = onAviso.mock.calls.map(([ev]) => new Date(ev.emitido_en).getTime());
      expect(emisiones).toEqual(horas.map((h) => a(h).getTime() - 5 * MIN));
    });
  });

  describe("CR-02 · Reloj adelantado", () => {
    it("si el reloj salta dentro de los 5 minutos previos, avisa en menos de un minuto", async () => {
      cambiarReloj(a("10:00"));
      const { result, onAviso } = await montar([entrada("4", "10:45")]);

      cambiarReloj(a("10:42")); // ajuste automático de hora: +42 min de golpe
      await avanzar(MIN);

      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(result.current.aviso?.entrada_id).toBe("4");
      expect(ultimaEmision(onAviso).getTime()).toBeLessThan(a("10:43").getTime() + 1);
    });

    it("si el reloj salta más allá del inicio, no avisa de una tarea que ya ha empezado", async () => {
      cambiarReloj(a("10:00"));
      const { onAviso } = await montar([entrada("4", "10:45"), entrada("5", "11:30")]);

      cambiarReloj(a("10:50")); // la tableta estuvo dormida y despierta tarde
      await avanzar(MIN);
      expect(onAviso).not.toHaveBeenCalled();

      // La siguiente tarea sí se avisa a su hora (11:25)
      await avanzar(a("11:25").getTime() - a("10:51").getTime());
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(onAviso.mock.calls[0][0].entrada_id).toBe("5");
      expect(ultimaEmision(onAviso)).toEqual(a("11:25"));
    });
  });

  describe("CR-03 · Reloj atrasado", () => {
    it("si el reloj se atrasa antes del aviso, no avisa antes de tiempo", async () => {
      cambiarReloj(a("10:38"));
      const { onAviso } = await montar([entrada("4", "10:45")]);

      cambiarReloj(a("10:20")); // corrección del reloj: -18 min
      await avanzar(a("10:39:59").getTime() - a("10:20").getTime());
      expect(onAviso).not.toHaveBeenCalled();

      await avanzar(1_000);
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(ultimaEmision(onAviso)).toEqual(a("10:40"));
    });

    it("si el reloj se atrasa después del aviso, no se repite el mismo aviso", async () => {
      cambiarReloj(a("10:41"));
      const { onAviso } = await montar([entrada("4", "10:45")]);
      await avanzar(0);
      expect(onAviso).toHaveBeenCalledTimes(1);

      cambiarReloj(a("10:30")); // vuelve atrás y vuelve a pasar por las 10:40
      await avanzar(15 * MIN);
      expect(onAviso).toHaveBeenCalledTimes(1);
    });
  });

  describe("CR-04 · Cambio de hora oficial (Europe/Madrid)", () => {
    it("la zona horaria de la prueba es la del colegio", () => {
      // 1 de julio: verano (UTC+2). 1 de diciembre: invierno (UTC+1).
      expect(new Date(2026, 6, 1, 12).getTimezoneOffset()).toBe(-120);
      expect(new Date(2026, 11, 1, 12).getTimezoneOffset()).toBe(-60);
    });

    it.each([
      ["horario de verano (29/03/2026, 02:00 → 03:00)", "2026-03-29"],
      ["horario de invierno (25/10/2026, 03:00 → 02:00)", "2026-10-25"],
    ])("el día del cambio a %s, avisa a las 08:55 de la hora nueva", async (_nombre, fecha) => {
      // La app se queda abierta toda la noche y pasa por el cambio de hora
      cambiarReloj(local(fecha, "00:30"));
      const { onAviso } = await montar([entrada("m", "09:00", fecha)]);

      await avanzar(local(fecha, "08:54:59").getTime() - local(fecha, "00:30").getTime());
      expect(onAviso).not.toHaveBeenCalled();

      await avanzar(1_000);
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(ultimaEmision(onAviso)).toEqual(local(fecha, "08:55"));
      expect(ultimaEmision(onAviso).getHours()).toBe(8);
      expect(ultimaEmision(onAviso).getMinutes()).toBe(55);
    });

    it("la antelación son 5 minutos reales aunque el cambio de hora caiga en medio", () => {
      // 03:02 del 29/03 existe (hora de verano); 5 minutos antes son las 01:57 de invierno
      const tarea = entrada("n", "03:02", "2026-03-29");
      const diferencia = momentoInicio(tarea).getTime() - momentoAviso(tarea, 5).getTime();
      expect(diferencia).toBe(5 * MIN);
      expect(momentoAviso(tarea, 5).getHours()).toBe(1);
      expect(momentoAviso(tarea, 5).getMinutes()).toBe(57);
    });
  });

  describe("CR-05 · Temporizadores retrasados y vuelta a la app", () => {
    it("al volver a la app dentro de los 5 minutos previos, avisa al momento", async () => {
      let alCambiarEstado: ((estado: AppStateStatus) => void) | undefined;
      jest.spyOn(AppState, "addEventListener").mockImplementation((_tipo, manejador) => {
        alCambiarEstado = manejador as (estado: AppStateStatus) => void;
        return { remove: jest.fn() } as never;
      });

      cambiarReloj(a("10:00"));
      const { onAviso } = await montar([entrada("4", "10:45")]);

      // Pestaña en segundo plano: el navegador congela los temporizadores y el reloj sigue
      cambiarReloj(a("10:43"));
      expect(onAviso).not.toHaveBeenCalled();

      await act(async () => {
        alCambiarEstado?.("active");
        jest.advanceTimersByTime(0);
      });
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(ultimaEmision(onAviso)).toEqual(a("10:43"));
    });

    it("aunque el temporizador llegue tarde, como mucho tarda un minuto en avisar", async () => {
      cambiarReloj(a("10:30"));
      const { onAviso } = await montar([entrada("4", "10:45")]);

      // Cada revisión llega 45 s tarde: el reloj corre más que los temporizadores
      for (let i = 0; i < 15 && onAviso.mock.calls.length === 0; i++) {
        cambiarReloj(new Date(Date.now() + 45_000));
        await avanzar(MIN);
      }
      expect(onAviso).toHaveBeenCalledTimes(1);
      const retraso = ultimaEmision(onAviso).getTime() - a("10:40").getTime();
      expect(retraso).toBeGreaterThanOrEqual(0);
      expect(retraso).toBeLessThanOrEqual(MIN + 45_000);
    });
  });

  describe("CR-06 · Cambio de día", () => {
    it("una tarea de mañana a las 09:00 no se avisa hoy a las 08:55", async () => {
      cambiarReloj(a("08:00"));
      const { onAviso } = await montar([entrada("m", "09:00", "2026-11-06")]);

      await avanzar(2 * 60 * MIN); // hasta las 10:00 de hoy
      expect(onAviso).not.toHaveBeenCalled();
    });

    it("con la app abierta toda la noche, avisa de la tarea de mañana a su hora", async () => {
      cambiarReloj(a("23:50"));
      const { onAviso } = await montar([entrada("m", "09:00", "2026-11-06")]);

      await avanzar(local("2026-11-06", "08:55").getTime() - a("23:50").getTime());
      expect(onAviso).toHaveBeenCalledTimes(1);
      expect(ultimaEmision(onAviso)).toEqual(local("2026-11-06", "08:55"));
    });
  });
});
