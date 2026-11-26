/**
 * Pruebas unitarias de la Pantalla 47 (Alertas SOS · Push en tiempo real)
 * y del botón de auxilio de un solo toque con respuesta visual de emergencia (14b)
 * siguiendo exactamente los bocetos `47.html`, `14.html` y `14b.html`
 * (SCRUM-126 / SCRUM-127 · T-19.1).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BotonAuxilioUnToque } from "../BotonAuxilioUnToque";
import { PantallaAlertasSos47 } from "../PantallaAlertasSos47";

describe("SCRUM-127 · Pantalla 47 (Alertas SOS) y Botón de auxilio de un toque", () => {
  it("renderiza la Pantalla 47 exacta a 47.html con alertas sin leer (borde rojo) y atendidas, permitiendo marcar atendida y lanzar acciones rápidas", async () => {
    const alMarcarAtendida = jest.fn();
    const alActivarPlanB = jest.fn();
    const alAbrirAgenda = jest.fn();

    await render(
      <PantallaAlertasSos47
        alMarcarAtendida={alMarcarAtendida}
        alActivarPlanBAlumno={alActivarPlanB}
        alAbrirAgendaAlumno={alAbrirAgenda}
      />,
    );

    expect(screen.getByTestId("pantalla-47-alertas-sos")).toBeTruthy();
    expect(screen.getByText("Alertas SOS · Push en tiempo real")).toBeTruthy();
    expect(screen.getByText("1 push sin leer")).toBeTruthy();
    expect(screen.getByText("Alejandro · Push hace 1 minuto")).toBeTruthy();
    expect(screen.getByText("Sin leer")).toBeTruthy();
    expect(screen.getByText("Ha pulsado: Quiero agua desde «Lavarse las manos».")).toBeTruthy();
    expect(screen.getByText("Marcos · hace 25 minutos")).toBeTruthy();
    expect(screen.getByText("Atendida")).toBeTruthy();

    // Acciones rápidas de la alerta sin leer (Activar Plan B de Alejandro y Cambiar agenda)
    await fireEvent.press(screen.getByTestId("btn-47-activar-plan-b-sos-0"));
    expect(alActivarPlanB).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sos-0", nombreAlumno: "Alejandro" }),
    );

    await fireEvent.press(screen.getByTestId("btn-47-cambiar-agenda-sos-0"));
    expect(alAbrirAgenda).toHaveBeenCalledWith(
      expect.objectContaining({ id: "sos-0", nombreAlumno: "Alejandro" }),
    );

    // Al pulsar «Marcar atendida», el contador pasa a «0 push sin leer» y desaparecen las acciones rápidas de urgencia
    await fireEvent.press(screen.getByTestId("btn-47-marcar-atendida-sos-0"));
    expect(alMarcarAtendida).toHaveBeenCalledWith(
      "sos-0",
      expect.arrayContaining([expect.objectContaining({ id: "sos-0", atendida: true })]),
    );
    expect(screen.getByText("0 push sin leer")).toBeTruthy();
    expect(screen.queryByTestId("acciones-rapidas-47-sos-0")).toBeNull();
  });

  it("emite una alerta de Urgencia con un solo toque y muestra la confirmación visual limpia «Solicitud enviada» (14b.html)", async () => {
    const alEmitirUrgencia = jest.fn();

    await render(
      <BotonAuxilioUnToque
        alumnoId="ale"
        nombreAlumno="Alejandro"
        tareaActiva="Lavarse las manos"
        salaActual="Clase Triángulo"
        alEmitirUrgencia={alEmitirUrgencia}
      />,
    );

    const btn = screen.getByTestId("btn-auxilio-un-toque-urgencia");
    expect(screen.getByText("Urgencia")).toBeTruthy();

    await fireEvent.press(btn);
    expect(alEmitirUrgencia).toHaveBeenCalledWith(
      expect.objectContaining({
        alumnoId: "ale",
        nombreAlumno: "Alejandro",
        claveNecesidad: "urgencia",
        textoNecesidad: "Urgencia",
        tareaActiva: "Lavarse las manos",
        salaActual: "Clase Triángulo",
        esUrgencia: true,
        atendida: false,
      }),
    );

    // Respuesta visual inmediata de 14b.html: círculo verde grande y «Solicitud enviada»
    expect(screen.getByTestId("respuesta-visual-emergencia-14b")).toBeTruthy();
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();
  });
});
