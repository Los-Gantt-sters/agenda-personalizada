/**
 * Pruebas unitarias para la Pantalla 35 — Selector de 9 clases sin paginación (SCRUM-233 / SCRUM-252).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SelectorAulasTutor } from "../SelectorAulasTutor";
import {
  AULAS_TUTOR,
  obtenerAlumnoTutor,
  obtenerAlumnosDeAula,
  obtenerAulaTutor,
} from "../datosAulasTutor";

describe("SelectorAulasTutor - Pantalla 35 (SCRUM-252)", () => {
  it("renderiza las 9 clases simultáneamente en la misma pantalla sin paginación", async () => {
    const alElegirAula = jest.fn();
    await render(<SelectorAulasTutor alElegirAula={alElegirAula} nombreTutor="María Carmen" />);

    expect(screen.getByText("Mis alumnos · Elegir clase")).toBeTruthy();
    expect(screen.getByText("Elige una clase")).toBeTruthy();
    expect(screen.getByText("Tutor · María Carmen")).toBeTruthy();

    // Verifica que las 9 aulas están visibles a la vez sin botón de página siguiente
    expect(AULAS_TUTOR).toHaveLength(9);
    for (const aula of AULAS_TUTOR) {
      expect(screen.getByTestId(`tarjeta-aula-${aula.id}`)).toBeTruthy();
      expect(screen.getByText(aula.nombre)).toBeTruthy();
      expect(screen.getByTestId(`forma-${aula.id}`, { includeHiddenElements: true })).toBeTruthy();
    }

    // No deben existir botones de alumno (Ayuda ni Accesibilidad) en vistas de adulto
    expect(screen.queryByText("Ayuda")).toBeNull();
    expect(screen.queryByText("Accesibilidad")).toBeNull();
  });

  it("invoca alElegirAula con el identificador de la clase pulsada y permite cerrar sesión", async () => {
    const alElegirAula = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <SelectorAulasTutor alElegirAula={alElegirAula} alCerrarSesion={alCerrarSesion} />,
    );

    await fireEvent.press(screen.getByTestId("tarjeta-aula-cua"));
    expect(alElegirAula).toHaveBeenCalledWith("cua");

    await fireEvent.press(screen.getByTestId("tarjeta-aula-oct"));
    expect(alElegirAula).toHaveBeenCalledWith("oct");

    await fireEvent.press(screen.getByTestId("boton-salir-35"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);
  });

  it("proporciona utilidades de consulta de aulas y alumnos y fallback en FormaClase", async () => {
    expect(obtenerAulaTutor("cua").nombre).toBe("Clase Cuadrado");
    expect(obtenerAulaTutor("inexistente").id).toBe("tri");

    const alumnosTri = obtenerAlumnosDeAula("tri");
    expect(alumnosTri.length).toBe(4);

    expect(obtenerAlumnoTutor("luc").nombre).toBe("Lucas");
    expect(obtenerAlumnoTutor("no-existe").id).toBe("ale");

    await render(
      <SelectorAulasTutor
        alElegirAula={jest.fn()}
        aulas={[
          {
            id: "desconocida",
            nombre: "Clase Extra",
            simbolo: "💠",
            color: "#000",
            totalAlumnos: 2,
          },
        ]}
      />,
    );
    expect(screen.getByText("Clase Extra")).toBeTruthy();
  });
});
