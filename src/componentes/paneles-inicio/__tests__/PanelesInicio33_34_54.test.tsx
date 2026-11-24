/**
 * Pruebas unitarias de los paneles de inicio:
 * - Pantalla 33 (`PanelInicioTutor33` · 5 tarjetas del Tutor SIN tarjeta Menú y con borde rojo en Alertas SOS)
 * - Pantalla 34 (`PanelInicioFamilia34` · 5 tarjetas de la Familia SIN antigua ficha 38)
 * - Pantalla 54 (`ParteCocina54` · Parte diario de Cocina)
 * siguiendo exactamente los bocetos `33.html`, `34.html` y `54.html`
 * (SCRUM-228 / SCRUM-244 · T-02.5).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PanelInicioFamilia34 } from "../PanelInicioFamilia34";
import { PanelInicioTutor33 } from "../PanelInicioTutor33";
import { ParteCocina54 } from "../ParteCocina54";

describe("SCRUM-244 · Paneles de inicio Tutor (33), Familia (34) y Cocina (54)", () => {
  describe("Pantalla 33 — PanelInicioTutor33", () => {
    it("renderiza las 5 tarjetas del Tutor exactas a 33.html, con insignia Push sin leer y SIN tarjeta Menú", async () => {
      const alNavegar = jest.fn();
      const alCerrarSesion = jest.fn();

      await render(
        <PanelInicioTutor33
          nombreTutor="Carmen Ruiz"
          alertasSosSinLeer={1}
          alNavegar={alNavegar}
          alCerrarSesion={alCerrarSesion}
        />,
      );

      expect(screen.getByTestId("pantalla-33-panel-tutor")).toBeTruthy();
      expect(screen.getByText("Panel de control · Tutor")).toBeTruthy();
      expect(screen.getByText("Carmen Ruiz")).toBeTruthy();
      expect(screen.getByText("CR")).toBeTruthy();
      expect(
        screen.getByText("Hola, Carmen · Gestión del aula, biblioteca de tareas y alertas SOS"),
      ).toBeTruthy();

      // Las 5 tarjetas del boceto 33.html
      expect(screen.getByText("Mis alumnos")).toBeTruthy();
      expect(screen.getByText("Biblioteca de tareas")).toBeTruthy();
      expect(screen.getByText("Mi biblioteca de pictogramas")).toBeTruthy();
      expect(screen.getByText("Alertas SOS (Push)")).toBeTruthy();
      expect(screen.getByText("Push · 1 sin leer")).toBeTruthy();
      expect(screen.getByText("Plan B del día")).toBeTruthy();

      // Restricción clave de 33.html / SCRUM-244: SIN tarjeta Menú (se gestiona en Admin 48 -> 46)
      expect(screen.queryByText(/Menú del comedor/i)).toBeNull();
      expect(screen.queryByText(/^Menú$/i)).toBeNull();

      // Navegación desde cada una de las 5 tarjetas
      await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-mis-alumnos"));
      expect(alNavegar).toHaveBeenLastCalledWith("35");

      await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-biblioteca-tareas"));
      expect(alNavegar).toHaveBeenLastCalledWith("31");

      await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-biblioteca-pictogramas"));
      expect(alNavegar).toHaveBeenLastCalledWith("51");

      await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-alertas-sos"));
      expect(alNavegar).toHaveBeenLastCalledWith("47");

      await fireEvent.press(screen.getByTestId("tarjeta-tutor-33-plan-b"));
      expect(alNavegar).toHaveBeenLastCalledWith("47c");

      await fireEvent.press(screen.getByTestId("boton-salir-panel-adulto"));
      expect(alCerrarSesion).toHaveBeenCalledTimes(1);
    });
  });

  describe("Pantalla 34 — PanelInicioFamilia34", () => {
    it("renderiza las 5 tarjetas de la Familia exactas a 34.html SIN la antigua tarjeta «Ficha de Alejandro» (38)", async () => {
      const alNavegar = jest.fn();
      const alCerrarSesion = jest.fn();

      await render(
        <PanelInicioFamilia34
          nombreFamilia="Familia García"
          nombreAlumnoVinculado="Alejandro"
          alNavegar={alNavegar}
          alCerrarSesion={alCerrarSesion}
        />,
      );

      expect(screen.getByTestId("pantalla-34-panel-familia")).toBeTruthy();
      expect(screen.getByText("Panel de control · Familia")).toBeTruthy();
      expect(screen.getByText("Familia García")).toBeTruthy();
      expect(screen.getByText("FG")).toBeTruthy();
      expect(screen.getByText("Hola, Familia García · Alumno vinculado: Alejandro")).toBeTruthy();

      // Las 5 tarjetas del boceto 34.html
      expect(screen.getByText("Agenda de Alejandro")).toBeTruthy();
      expect(screen.getByText("Progreso e historial")).toBeTruthy();
      expect(screen.getByText("Biblioteca de tareas")).toBeTruthy();
      expect(screen.getByText("Mi biblioteca de pictogramas")).toBeTruthy();
      expect(screen.getByText("Preferencias")).toBeTruthy();

      // Restricción clave de 34.html / SCRUM-244: SIN «Ficha de Alejandro» (antigua pantalla 38 eliminada)
      expect(screen.queryByText(/Ficha de Alejandro/i)).toBeNull();

      // Navegación desde cada una de las 5 tarjetas
      await fireEvent.press(screen.getByTestId("tarjeta-familia-34-agenda"));
      expect(alNavegar).toHaveBeenLastCalledWith("40");

      await fireEvent.press(screen.getByTestId("tarjeta-familia-34-progreso"));
      expect(alNavegar).toHaveBeenLastCalledWith("43");

      await fireEvent.press(screen.getByTestId("tarjeta-familia-34-biblioteca-tareas"));
      expect(alNavegar).toHaveBeenLastCalledWith("31");

      await fireEvent.press(screen.getByTestId("tarjeta-familia-34-biblioteca-pictogramas"));
      expect(alNavegar).toHaveBeenLastCalledWith("51");

      await fireEvent.press(screen.getByTestId("tarjeta-familia-34-preferencias"));
      expect(alNavegar).toHaveBeenLastCalledWith("16");

      await fireEvent.press(screen.getByTestId("boton-salir-panel-adulto"));
      expect(alCerrarSesion).toHaveBeenCalledTimes(1);
    });
  });

  describe("Pantalla 54 — ParteCocina54", () => {
    it("muestra el parte diario de Cocina con recuento de menús y confirmación", async () => {
      const alCerrarSesion = jest.fn();

      await render(<ParteCocina54 alCerrarSesion={alCerrarSesion} />);

      expect(screen.getByTestId("pantalla-54-parte-cocina")).toBeTruthy();
      expect(screen.getByText("Cocina · Parte del día")).toBeTruthy();
      expect(screen.getByText("MENÚ NORMAL")).toBeTruthy();
      expect(screen.getByText("28")).toBeTruthy();
      expect(screen.getByText("TOTAL COMENSALES")).toBeTruthy();
      expect(screen.getByText("34")).toBeTruthy();

      await fireEvent.press(screen.getByTestId("boton-salir-54"));
      expect(alCerrarSesion).toHaveBeenCalledTimes(1);
    });
  });
});
