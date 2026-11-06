import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import type { ClienteArasaac } from "./clienteArasaac";
import { ErrorArasaac, PictogramaArasaac } from "./tipos";
import { useBuscadorPictogramas } from "./useBuscadorPictogramas";

const CASA: PictogramaArasaac = {
  id: 6964,
  palabraClave: "casa",
  palabrasClave: ["casa"],
  urlImagen: "https://static.arasaac.org/pictograms/6964/6964_500.png",
  descripcion: "Pictograma de casa",
  categorias: [],
};

function clienteSimulado(buscar: ClienteArasaac["buscar"]): ClienteArasaac {
  return { buscar, obtener: jest.fn() as never, limpiarCache: jest.fn() };
}

function Sonda({ termino, cliente }: { termino: string; cliente: ClienteArasaac }) {
  const { estado, resultados, error } = useBuscadorPictogramas(termino, { retardoMs: 0, cliente });
  return <Text>{`${estado}|${resultados.map((r) => r.id).join(",")}|${error?.codigo ?? ""}`}</Text>;
}

describe("useBuscadorPictogramas", () => {
  it("con menos de dos letras está inactivo y no busca", async () => {
    const buscar = jest.fn(async (_t: string, _op?: unknown) => [CASA]);
    await render(<Sonda termino="c" cliente={clienteSimulado(buscar)} />);
    expect(screen.getByText("inactivo||")).toBeTruthy();
    expect(buscar).not.toHaveBeenCalled();
  });

  it("busca y devuelve los resultados", async () => {
    const buscar = jest.fn(async (_t: string, _op?: unknown) => [CASA]);
    await render(<Sonda termino="casa" cliente={clienteSimulado(buscar)} />);
    await waitFor(() => expect(screen.getByText("listo|6964|")).toBeTruthy());
    expect(buscar).toHaveBeenCalledWith(
      "casa",
      expect.objectContaining({ senal: expect.anything() }),
    );
  });

  it("sin coincidencias queda en listo con lista vacía", async () => {
    const buscar = jest.fn(async (_t: string, _op?: unknown) => [] as PictogramaArasaac[]);
    await render(<Sonda termino="xqzwvk" cliente={clienteSimulado(buscar)} />);
    await waitFor(() => expect(screen.getByText("listo||")).toBeTruthy());
  });

  it("si falla la búsqueda pasa a error con su código", async () => {
    const buscar = jest.fn(async (_t: string, _op?: unknown): Promise<PictogramaArasaac[]> => {
      throw new ErrorArasaac("sin_conexion");
    });
    await render(<Sonda termino="casa" cliente={clienteSimulado(buscar)} />);
    await waitFor(() => expect(screen.getByText("error||sin_conexion")).toBeTruthy());
  });

  it("al cambiar el texto cancela la búsqueda anterior y usa la nueva", async () => {
    const senales: AbortSignal[] = [];
    const buscar = jest.fn(async (_t: string, op?: { senal?: AbortSignal }) => {
      if (op?.senal) senales.push(op.senal);
      return [CASA];
    });
    const cliente = clienteSimulado(buscar as ClienteArasaac["buscar"]);
    const { rerender } = await render(<Sonda termino="casa" cliente={cliente} />);
    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(1));
    await rerender(<Sonda termino="casas" cliente={cliente} />);
    await waitFor(() => expect(buscar).toHaveBeenCalledTimes(2));
    expect(senales[0].aborted).toBe(true);
    expect(senales[1].aborted).toBe(false);
  });
});
