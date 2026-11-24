/**
 * Pruebas unitarias para la Pantalla 36 — Buscador de alumnos por nombre y acceso a ficha (SCRUM-233 / SCRUM-253).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BuscadorAlumnosAula, normalizarBusquedaNombre } from "../BuscadorAlumnosAula";

describe("BuscadorAlumnosAula - Pantalla 36 (SCRUM-253)", () => {
  it("muestra los alumnos del aula seleccionada y el campo de búsqueda por nombre", async () => {
    const alElegirAlumno = jest.fn();
    await render(<BuscadorAlumnosAula aulaId="cua" alElegirAlumno={alElegirAlumno} />);

    expect(screen.getByText("Alumnos · Clase Cuadrado")).toBeTruthy();
    expect(screen.getByText("3 alumnos en el aula · toca para abrir su ficha")).toBeTruthy();
    expect(screen.getByTestId("buscador-alumnos-36")).toBeTruthy();

    expect(screen.getByText("Lucas")).toBeTruthy();
    expect(screen.getByText("Sofía")).toBeTruthy();
    expect(screen.getByText("Hugo")).toBeTruthy();

    expect(screen.queryByText("Ayuda")).toBeNull();
    expect(screen.queryByText("Accesibilidad")).toBeNull();
  });

  it("filtra alumnos por nombre ignorando mayúsculas y tildes y permite limpiar la búsqueda", async () => {
    const alElegirAlumno = jest.fn();
    await render(<BuscadorAlumnosAula aulaId="cua" alElegirAlumno={alElegirAlumno} />);

    const input = screen.getByTestId("buscador-alumnos-36");

    // Buscar "sofia" sin tilde encuentra a "Sofía"
    await fireEvent.changeText(input, "sofia");
    expect(screen.getByText("Sofía")).toBeTruthy();
    expect(screen.queryByText("Lucas")).toBeNull();
    expect(screen.getByText("1 alumnos en el aula · toca para abrir su ficha")).toBeTruthy();

    // Búsqueda sin coincidencias
    await fireEvent.changeText(input, "inexistente");
    expect(screen.getByTestId("sin-resultados-36")).toBeTruthy();
    expect(screen.getByText("No hay alumnos que coincidan con la búsqueda")).toBeTruthy();

    // Limpiar búsqueda con el botón
    await fireEvent.press(screen.getByTestId("limpiar-busqueda-36"));
    expect(screen.getByText("Lucas")).toBeTruthy();
    expect(screen.getByText("Sofía")).toBeTruthy();
  });

  it("navega a la ficha del alumno al tocar su tarjeta y ejecuta atrás/salir", async () => {
    const alElegirAlumno = jest.fn();
    const alAtras = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <BuscadorAlumnosAula
        aulaId="cua"
        alElegirAlumno={alElegirAlumno}
        alAtras={alAtras}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    await fireEvent.press(screen.getByTestId("tarjeta-alumno-luc"));
    expect(alElegirAlumno).toHaveBeenCalledWith("luc");

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId("boton-salir-36"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);

    expect(normalizarBusquedaNombre("  Sofía Martín ")).toBe("sofia martin");
  });
});
