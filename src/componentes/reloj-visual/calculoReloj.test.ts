import { describe, expect, it } from "@jest/globals";

import { fraccionRestante, marcasReloj, seAcabaDeAgotar, trazadoSector } from "./calculoReloj";

const MINUTO = 60 * 1000;

describe("fraccionRestante", () => {
  // Criterio de aceptación de HU-09 (SCRUM-77)
  it("una tarea de 30 minutos con 15 transcurridos deja el disco al 50 %", () => {
    expect(fraccionRestante(30 * MINUTO, 15 * MINUTO)).toBe(0.5);
  });

  it("al empezar el disco está lleno", () => {
    expect(fraccionRestante(10 * MINUTO, 0)).toBe(1);
  });

  it("al acabar el tiempo el disco está vacío", () => {
    expect(fraccionRestante(10 * MINUTO, 10 * MINUTO)).toBe(0);
  });

  it("nunca baja de 0 aunque se pase el tiempo", () => {
    expect(fraccionRestante(10 * MINUTO, 25 * MINUTO)).toBe(0);
  });

  it("nunca pasa de 1 con un tiempo transcurrido negativo", () => {
    expect(fraccionRestante(10 * MINUTO, -MINUTO)).toBe(1);
  });

  it("una duración de 0 se trata como tiempo agotado", () => {
    expect(fraccionRestante(0, 0)).toBe(0);
  });
});

describe("trazadoSector", () => {
  it("no dibuja nada si no queda tiempo", () => {
    expect(trazadoSector(0, 88)).toBeNull();
  });

  it("con el disco lleno dibuja el círculo completo con dos medios arcos", () => {
    expect(trazadoSector(1, 88)).toBe("M 100 12 A 88 88 0 1 0 100 188 A 88 88 0 1 0 100 12 Z");
  });

  it("con la mitad acaba en las 6 y usa el arco pequeño", () => {
    expect(trazadoSector(0.5, 88)).toBe("M 100 100 L 100 12 A 88 88 0 0 0 100 188 Z");
  });

  it("con un cuarto acaba en las 9 (sentido antihorario)", () => {
    expect(trazadoSector(0.25, 88)).toBe("M 100 100 L 100 12 A 88 88 0 0 0 12 100 Z");
  });

  it("con más de media vuelta usa el arco grande, como en el prototipo", () => {
    // El prototipo (pantalla 10) dibuja 0,6 de vuelta: "A88 88 0 1 0 151.73 171.19"
    expect(trazadoSector(0.6, 88)).toBe("M 100 100 L 100 12 A 88 88 0 1 0 151.73 171.19 Z");
  });
});

describe("marcasReloj", () => {
  it("genera 12 marcas, la primera en las 12", () => {
    const marcas = marcasReloj(92, 84);
    expect(marcas).toHaveLength(12);
    expect(marcas[0]).toEqual({ x1: 100, y1: 8, x2: 100, y2: 16 });
  });
});

describe("seAcabaDeAgotar", () => {
  it("avisa cuando el tiempo pasa de quedar algo a cero", () => {
    expect(seAcabaDeAgotar(0.01, 0)).toBe(true);
  });

  it("no avisa mientras sigue quedando tiempo", () => {
    expect(seAcabaDeAgotar(0.5, 0.4)).toBe(false);
  });

  it("no vuelve a avisar si ya estaba agotado (p. ej. al abrir una tarea terminada)", () => {
    expect(seAcabaDeAgotar(0, 0)).toBe(false);
  });
});
