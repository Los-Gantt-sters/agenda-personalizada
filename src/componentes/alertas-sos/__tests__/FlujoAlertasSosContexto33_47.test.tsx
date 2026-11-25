/**
 * Pruebas unitarias y de integración de SCRUM-129 (`T-19.3`):
 * - Registro automático de última sala y tarea activa al emitir la alerta SOS.
 * - Sincronización en tiempo real entre Panel Tutor (33), Alertas SOS (47) y Agenda (39).
 */

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  detenerAlarmaAcusticaSos,
  emitirAlertaSosConContextoActivo,
  obtenerContextoActivoAlumno,
  registrarContextoActivoAlumno,
  reiniciarAlertasSosDemo,
} from "../../../servicios/alertasSosService";
import * as servicioSonidos from "../../../servicios/sonidos";
import { FlujoAlertasSosTutor } from "../FlujoAlertasSosTutor";

jest.spyOn(servicioSonidos, "reproducirSonido").mockImplementation(() => {});

describe("SCRUM-129 · Registro de sala/tarea activa y flujo Tutor 33 <-> 47 <-> 39", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reiniciarAlertasSosDemo();
  });

  afterEach(() => {
    detenerAlarmaAcusticaSos();
  });

  it("registra la última sala y tarea activa del alumno y las adjunta al emitir la alerta SOS", () => {
    registrarContextoActivoAlumno({
      alumnoId: "ale",
      nombreAlumno: "Alejandro",
      salaActual: "Taller de Reprografía",
      tareaActiva: "Encargo de fotocopias",
    });

    expect(obtenerContextoActivoAlumno("ale")).toEqual(
      expect.objectContaining({
        alumnoId: "ale",
        salaActual: "Taller de Reprografía",
        tareaActiva: "Encargo de fotocopias",
      }),
    );

    const alerta = emitirAlertaSosConContextoActivo("ale", "urgencia", {
      id: "sos-ctx-1",
    });

    expect(alerta).toEqual(
      expect.objectContaining({
        id: "sos-ctx-1",
        alumnoId: "ale",
        nombreAlumno: "Alejandro",
        claveNecesidad: "urgencia",
        textoNecesidad: "Urgencia",
        salaActual: "Taller de Reprografía",
        tareaActiva: "Encargo de fotocopias",
        esUrgencia: true,
        atendida: false,
      }),
    );
  });

  it("actualiza en tiempo real el contador de alertas sin leer entre el Panel Tutor (33) y la Pantalla 47", async () => {
    await render(<FlujoAlertasSosTutor vistaInicial="33" />);

    // En 33 muestra inicialmente «Push · 1 sin leer»
    expect(screen.getByTestId("pantalla-33-panel-tutor")).toBeTruthy();
    expect(screen.getByText("Push · 1 sin leer")).toBeTruthy();

    // Si un alumno emite una nueva alerta con su contexto activo, 33 pasa en vivo a «Push · 2 sin leer»
    await act(async () => {
      registrarContextoActivoAlumno({
        alumnoId: "luc",
        nombreAlumno: "Lucas",
        salaActual: "Comedor",
        tareaActiva: "Recuento comensales",
      });
      emitirAlertaSosConContextoActivo("luc", "agua", {
        id: "sos-luc-1",
        tiempoTexto: "Push ahora mismo",
      });
    });

    expect(screen.getByText("Push · 2 sin leer")).toBeTruthy();

    // Abrir Pantalla 47 pulsando la tarjeta «Alertas SOS (Push)»
    await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-alertas-sos"));
    expect(screen.getByTestId("pantalla-47-alertas-sos")).toBeTruthy();
    expect(screen.getByText("2 push sin leer")).toBeTruthy();
    expect(screen.getByText("Ha pulsado: Quiero agua desde «Recuento comensales».")).toBeTruthy();

    // Marcar ambas alertas como atendidas
    await fireEvent.press(screen.getByTestId("btn-47-marcar-atendida-sos-luc-1"));
    await fireEvent.press(screen.getByTestId("btn-47-marcar-atendida-sos-0"));
    expect(screen.getByText("0 push sin leer")).toBeTruthy();

    // Volver al Panel 33 con «Atrás»: la tarjeta ya no tiene push pendientes
    await fireEvent.press(screen.getByLabelText("Atrás"));
    expect(screen.getByTestId("pantalla-33-panel-tutor")).toBeTruthy();
    expect(screen.getByText("Sin alertas pendientes")).toBeTruthy();
  });

  it("permite abrir la agenda del alumno (Pantalla 39) desde «Cambiar agenda» en la Pantalla 47", async () => {
    await render(<FlujoAlertasSosTutor vistaInicial="47" />);

    expect(screen.getByTestId("pantalla-47-alertas-sos")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-47-cambiar-agenda-sos-0"));

    expect(screen.getByTestId("pantalla-39-agenda-tutor")).toBeTruthy();
    expect(screen.getByText("Agenda de Alejandro")).toBeTruthy();
  });
});
