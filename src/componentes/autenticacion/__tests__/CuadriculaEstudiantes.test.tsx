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
});
