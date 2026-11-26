/**
 * Pruebas unitarias del servicio de notificaciones Push SOS prioritarias
 * con alarma acústica persistente (`alertasSosService` · SCRUM-126 / SCRUM-128 · T-19.2).
 */

import {
  contarAlertasSosSinLeer,
  detenerAlarmaAcusticaSos,
  emitirAlertaSosPush,
  estaAlarmaAcusticaSosActiva,
  marcarAlertaSosAtendida,
  reiniciarAlertasSosDemo,
  suscribirAlertasSosPush,
} from "../alertasSosService";
import * as servicioSonidos from "../sonidos";

jest.spyOn(servicioSonidos, "reproducirSonido").mockImplementation(() => {});

describe("SCRUM-128 · alertasSosService (Push prioritaria y alarma acústica persistente)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    reiniciarAlertasSosDemo();
  });

  afterEach(() => {
    detenerAlarmaAcusticaSos();
    jest.useRealTimers();
  });

  it("notifica en tiempo real a los suscriptores al emitir una alerta SOS y activa la alarma acústica persistente", () => {
    const recibidos: number[] = [];
    const desuscribir = suscribirAlertasSosPush((lista) => {
      recibidos.push(contarAlertasSosSinLeer(lista));
    });

    // Estado inicial de 47.html: 1 push sin leer (sos-0 de Alejandro)
    expect(recibidos).toEqual([1]);
    expect(estaAlarmaAcusticaSosActiva()).toBe(false);

    // El alumno pulsa Urgencia: se emite push prioritaria con alarma acústica cada 2000 ms
    const nueva = emitirAlertaSosPush(
      {
        id: "sos-urg-1",
        alumnoId: "ale",
        nombreAlumno: "Alejandro",
        claveNecesidad: "urgencia",
        tareaActiva: "Lavarse las manos",
        salaActual: "Clase Triángulo",
      },
      2000,
    );

    expect(nueva.esUrgencia).toBe(true);
    expect(recibidos).toEqual([1, 2]);
    expect(estaAlarmaAcusticaSosActiva()).toBe(true);
    expect(servicioSonidos.reproducirSonido).toHaveBeenCalledTimes(1);
    expect(servicioSonidos.reproducirSonido).toHaveBeenLastCalledWith("aviso", 1.0);

    // La alarma es persistente: vuelve a sonar al avanzar el temporizador mientras haya alertas sin leer
    jest.advanceTimersByTime(4000);
    expect(servicioSonidos.reproducirSonido).toHaveBeenCalledTimes(3);

    // Marcar la primera alerta como atendida: aún queda 1 sin leer, la alarma sigue activa
    marcarAlertaSosAtendida("sos-urg-1");
    expect(contarAlertasSosSinLeer()).toBe(1);
    expect(estaAlarmaAcusticaSosActiva()).toBe(true);

    // Marcar la última alerta sin leer como atendida: 0 sin leer -> la alarma se detiene sola
    marcarAlertaSosAtendida("sos-0");
    expect(contarAlertasSosSinLeer()).toBe(0);
    expect(estaAlarmaAcusticaSosActiva()).toBe(false);

    desuscribir();
  });
});
