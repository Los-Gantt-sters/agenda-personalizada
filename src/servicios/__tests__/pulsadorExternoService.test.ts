import {
  ControladorPulsadorExterno,
  resolverAccionPulsador,
} from "../pulsadorExternoService";

describe("SCRUM-121: T-05.2 Servicio pulsadorExternoService (switch/USB/Bluetooth)", () => {
  it("mapea Espacio, Intro y Switch1 a seleccionar en modo automático (1 pulsador) e ignora campos INPUT", () => {
    expect(resolverAccionPulsador({ key: " " }, "automatico").accion).toBe("seleccionar");
    expect(resolverAccionPulsador({ key: "Enter" }, "automatico").accion).toBe("seleccionar");
    expect(resolverAccionPulsador({ key: "Switch1" }, "automatico").accion).toBe("seleccionar");

    const enInput = resolverAccionPulsador(
      { key: " ", targetTagName: "INPUT" },
      "automatico",
    );
    expect(enInput.accion).toBe("ignorar");
    expect(enInput.motivoIgnorado).toBe("campo_texto");
  });

  it("mapea Pulsador 1 (Espacio / Tab / Switch1) a avanzar y Pulsador 2 (Intro / Switch2) a seleccionar en modo manual", () => {
    expect(resolverAccionPulsador({ key: " " }, "manual").accion).toBe("avanzar");
    expect(resolverAccionPulsador({ key: "Tab" }, "manual").accion).toBe("avanzar");
    expect(resolverAccionPulsador({ key: "Tab", shiftKey: true }, "manual").accion).toBe(
      "retroceder",
    );
    expect(resolverAccionPulsador({ key: "Enter" }, "manual").accion).toBe("seleccionar");
    expect(resolverAccionPulsador({ key: "Switch2" }, "manual").accion).toBe("seleccionar");
  });

  it("filtra pulsaciones repetidas dentro de la ventana anti-rebote (debounce) para evitar dobles toques", () => {
    const controlador = new ControladorPulsadorExterno({ antiReboteMs: 250 });
    const alSeleccionar = jest.fn();

    const primero = controlador.procesarEvento(
      { key: " ", timestamp: 1000 },
      "automatico",
      { alSeleccionar },
    );
    expect(primero.ejecutado).toBe(true);
    expect(alSeleccionar).toHaveBeenCalledTimes(1);

    // Rebote mecánico 80 ms después (< 250 ms)
    const rebote = controlador.procesarEvento(
      { key: " ", timestamp: 1080 },
      "automatico",
      { alSeleccionar },
    );
    expect(rebote.ejecutado).toBe(false);
    expect(rebote.motivoIgnorado).toBe("rebote");
    expect(alSeleccionar).toHaveBeenCalledTimes(1);

    // Nueva pulsación válida 300 ms después (>= 250 ms)
    const segundo = controlador.procesarEvento(
      { key: " ", timestamp: 1350 },
      "automatico",
      { alSeleccionar },
    );
    expect(segundo.ejecutado).toBe(true);
    expect(alSeleccionar).toHaveBeenCalledTimes(2);
    expect(controlador.obtenerEstadisticas()).toEqual({
      disparosEjecutados: 2,
      rechazadosPorRebote: 1,
    });
  });
});
