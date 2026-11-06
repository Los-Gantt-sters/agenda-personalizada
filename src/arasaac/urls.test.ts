import { describe, expect, it } from "@jest/globals";

import { urlImagenPictograma } from "./urls";

describe("urlImagenPictograma", () => {
  it("construye la dirección oficial de la imagen a 500 px por defecto", () => {
    expect(urlImagenPictograma(6964)).toBe(
      "https://static.arasaac.org/pictograms/6964/6964_500.png",
    );
  });

  it("admite los tamaños que publica ARASAAC", () => {
    expect(urlImagenPictograma(6964, 300)).toBe(
      "https://static.arasaac.org/pictograms/6964/6964_300.png",
    );
    expect(urlImagenPictograma(6964, 2500)).toBe(
      "https://static.arasaac.org/pictograms/6964/6964_2500.png",
    );
  });

  it("rechaza identificadores y tamaños no válidos", () => {
    expect(() => urlImagenPictograma(0)).toThrow(RangeError);
    expect(() => urlImagenPictograma(-5)).toThrow(RangeError);
    expect(() => urlImagenPictograma(1.5)).toThrow(RangeError);
    expect(() => urlImagenPictograma(NaN)).toThrow(RangeError);
    expect(() => urlImagenPictograma(6964, 123)).toThrow(RangeError);
  });
});
