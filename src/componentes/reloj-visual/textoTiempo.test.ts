import { describe, expect, it } from "@jest/globals";

import { textoTiempoRestante } from "./textoTiempo";

const SEGUNDO = 1000;
const MINUTO = 60 * SEGUNDO;

describe("textoTiempoRestante", () => {
  it("con varios minutos usa el plural", () => {
    expect(textoTiempoRestante(3 * MINUTO)).toBe("Quedan 3 minutos");
  });

  it("con un minuto exacto usa el singular", () => {
    expect(textoTiempoRestante(1 * MINUTO)).toBe("Queda 1 minuto");
  });

  it("redondea hacia arriba: con 2 minutos y 10 segundos dice 3", () => {
    // Si dijera "2", el alumno vería que el tiempo se acaba antes de lo anunciado
    expect(textoTiempoRestante(2 * MINUTO + 10 * SEGUNDO)).toBe("Quedan 3 minutos");
  });

  it("con menos de un minuto dice que queda 1 minuto", () => {
    expect(textoTiempoRestante(20 * SEGUNDO)).toBe("Queda 1 minuto");
  });

  it("al llegar a cero avisa de que se ha acabado", () => {
    expect(textoTiempoRestante(0)).toBe("Se ha acabado el tiempo");
  });

  it("con tiempo negativo también dice que se ha acabado", () => {
    expect(textoTiempoRestante(-5 * SEGUNDO)).toBe("Se ha acabado el tiempo");
  });
});
