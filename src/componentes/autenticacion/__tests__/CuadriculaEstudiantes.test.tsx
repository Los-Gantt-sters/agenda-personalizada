import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { CuadriculaEstudiantes } from "../CuadriculaEstudiantes";
import { ESTUDIANTES_MOCK } from "../../../tipos/estudiante";

describe("CuadriculaEstudiantes", () => {
  const estudiantesTriangulo = ESTUDIANTES_MOCK.filter((e) => e.claseId === "tri");

  it("renderiza todos los estudiantes recibidos en la cuadrícula táctil", async () => {
    const handleSeleccionar = jest.fn();
    await render(
      <CuadriculaEstudiantes
        estudiantes={estudiantesTriangulo}
        alSeleccionarEstudiante={handleSeleccionar}
      />,
    );

    estudiantesTriangulo.forEach((est) => {
      expect(screen.getByText(est.nombre)).toBeTruthy();
    });
  });

  it("permite seleccionar un estudiante tocando su tarjeta", async () => {
    const user = userEvent.setup();
    const handleSeleccionar = jest.fn();
    await render(
      <CuadriculaEstudiantes
        estudiantes={estudiantesTriangulo}
        alSeleccionarEstudiante={handleSeleccionar}
      />,
    );

    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
    expect(handleSeleccionar).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ale", nombre: "Alejandro" }),
    );
  });
  it("con más de 9 alumnos enseña 9 y «Más alumnos» lleva a los siguientes (pantalla 02b)", async () => {
    const user = userEvent.setup();
    const muchos = Array.from({ length: 12 }, (_, i) => ({
      ...ESTUDIANTES_MOCK[0],
      id: `alumno-${i + 1}`,
      nombre: `Alumno ${i + 1}`,
    }));
    await render(
      <CuadriculaEstudiantes estudiantes={muchos} alSeleccionarEstudiante={jest.fn()} />,
    );

    expect(screen.getByText("Alumno 9")).toBeTruthy();
    expect(screen.queryByText("Alumno 10")).toBeNull();

    await user.press(screen.getByLabelText("Más alumnos: ver la página 2"));
    expect(screen.getByText("Alumno 10")).toBeTruthy();
    expect(screen.queryByText("Alumno 1")).toBeNull();
  });
});
