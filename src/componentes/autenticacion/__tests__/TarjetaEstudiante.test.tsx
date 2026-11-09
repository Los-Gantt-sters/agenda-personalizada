import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { TarjetaEstudiante } from "../TarjetaEstudiante";
import { Estudiante } from "../../../tipos/estudiante";

const mockEstudiante: Estudiante = {
  id: "ale",
  nombre: "Alejandro",
  nombreCompleto: "Alejandro Castillo Vega",
  claseId: "tri",
  icono: "🦁",
  color: "#B8492F",
};

describe("TarjetaEstudiante", () => {
  it("renderiza el nombre del estudiante en lectura fácil y su icono", async () => {
    const handleSeleccionar = jest.fn();
    await render(
      <TarjetaEstudiante estudiante={mockEstudiante} alSeleccionar={handleSeleccionar} />,
    );

    expect(screen.getByText("Alejandro")).toBeTruthy();
    expect(screen.getByText("🦁")).toBeTruthy();

    const boton = screen.getByRole("button");
    expect(boton.props.accessibilityLabel).toBe("Foto de Alejandro");
  });

  it("cumple con el requisito de accesibilidad de dimensiones mínimas (>= 120x120 px)", async () => {
    await render(
      <TarjetaEstudiante
        estudiante={mockEstudiante}
        alSeleccionar={jest.fn()}
        tamanioMinimo={140}
      />,
    );

    const tarjeta = screen.getByTestId("tarjeta-estudiante-ale");
    const estilosAplanados = Array.isArray(tarjeta.props.style)
      ? Object.assign({}, ...tarjeta.props.style)
      : tarjeta.props.style;

    expect(estilosAplanados.minWidth).toBeGreaterThanOrEqual(120);
    expect(estilosAplanados.minHeight).toBeGreaterThanOrEqual(120);
  });

  it("llama al callback alSeleccionar cuando el estudiante la presiona", async () => {
    const user = userEvent.setup();
    const handleSeleccionar = jest.fn();
    await render(
      <TarjetaEstudiante estudiante={mockEstudiante} alSeleccionar={handleSeleccionar} />,
    );

    await user.press(screen.getByTestId("tarjeta-estudiante-ale"));
    expect(handleSeleccionar).toHaveBeenCalledWith(mockEstudiante);
  });

  it("aplica estilos de selección visual cuando está seleccionado", async () => {
    await render(
      <TarjetaEstudiante
        estudiante={mockEstudiante}
        alSeleccionar={jest.fn()}
        seleccionado={true}
      />,
    );

    const tarjeta = screen.getByTestId("tarjeta-estudiante-ale");
    expect(tarjeta.props.accessibilityState.selected).toBe(true);
  });
});
