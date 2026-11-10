import { describe, expect, it } from "@jest/globals";

import {
  CATALOGO_PICTOGRAMAS,
  CATEGORIAS_ESTUDIANTE,
  buscarEnCatalogo,
  pictogramaDelCatalogo,
  pictogramaPorId,
  pictogramaPorSimbolo,
  tieneDescripcionValida,
} from "./catalogo";

describe("CATALOGO_PICTOGRAMAS (RI16.1 y LIB del prototipo)", () => {
  it("cada entrada tiene identificador, palabra clave, símbolo y dirección de la imagen", () => {
    expect(CATALOGO_PICTOGRAMAS.length).toBeGreaterThanOrEqual(45);
    for (const p of CATALOGO_PICTOGRAMAS) {
      expect(Number.isInteger(p.id) && p.id > 0).toBe(true);
      expect(p.palabraClave.length).toBeGreaterThan(0);
      expect(p.simbolo && p.simbolo.length > 0).toBe(true);
      expect(p.urlImagen).toBe(`https://static.arasaac.org/pictograms/${p.id}/${p.id}_500.png`);
    }
  });

  it("cada entrada tiene descripción alternativa (RF14.7)", () => {
    for (const p of CATALOGO_PICTOGRAMAS) {
      expect(p.descripcion.trim().length).toBeGreaterThan(0);
    }
  });

  it("no repite identificadores ni palabras clave principales", () => {
    const ids = CATALOGO_PICTOGRAMAS.map((p) => p.id);
    const claves = CATALOGO_PICTOGRAMAS.map((p) => p.palabraClave);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("incluye baño, agua y descansar, que usa el botón de necesidades (HU-18)", () => {
    expect(pictogramaDelCatalogo("baño")?.id).toBe(6929);
    expect(pictogramaDelCatalogo("agua")?.id).toBe(2248);
    expect(pictogramaDelCatalogo("descansar")?.id).toBe(3299);
  });

  it("permite resolver por identificador y por símbolo del prototipo HTML", () => {
    expect(pictogramaPorId(6964)?.palabraClave).toBe("casa");
    expect(pictogramaPorId(999999)).toBeUndefined();
    expect(pictogramaPorSimbolo("🎒")?.palabraClave).toBe("mochila");
    expect(pictogramaPorSimbolo("🖨️")?.palabraClave).toBe("fotocopia");
    expect(pictogramaPorSimbolo("❓")).toBeUndefined();
  });
});

describe("CATEGORIAS_ESTUDIANTE (prototipos 19 y 20)", () => {
  it("define las 5 categorías del prototipo con 4 actividades cada una", () => {
    expect(CATEGORIAS_ESTUDIANTE.map((c) => c.nombre)).toEqual([
      "Deporte",
      "Casa",
      "Amigos",
      "Salud",
      "Clase",
    ]);
    for (const categoria of CATEGORIAS_ESTUDIANTE) {
      expect(categoria.pictograma.id).toBeGreaterThan(0);
      expect(categoria.actividades).toHaveLength(4);
      for (const act of categoria.actividades) {
        expect(act.titulo.length).toBeGreaterThan(0);
        expect(act.pictograma.id).toBeGreaterThan(0);
      }
    }
  });
});

describe("búsqueda en el catálogo y validación RF14.7", () => {
  it("pictogramaDelCatalogo ignora mayúsculas y tildes", () => {
    expect(pictogramaDelCatalogo("AUTOBUS")?.id).toBe(2262);
    expect(pictogramaDelCatalogo("inventado")).toBeUndefined();
  });

  it("buscarEnCatalogo encuentra por sinónimos del prototipo y por parte de la palabra", () => {
    expect(buscarEnCatalogo("comenzar").map((p) => p.palabraClave)).toEqual(["empezar"]);
    expect(buscarEnCatalogo("reprografia").map((p) => p.palabraClave)).toEqual(["fotocopia"]);
    expect(buscarEnCatalogo("manos").map((p) => p.palabraClave)).toContain("lavar las manos");
  });

  it("buscarEnCatalogo con texto vacío no devuelve nada", () => {
    expect(buscarEnCatalogo("   ")).toEqual([]);
  });

  it("tieneDescripcionValida comprueba que la descripción alternativa no esté vacía", () => {
    expect(tieneDescripcionValida({ descripcionAlternativa: "Pictograma de mochila" })).toBe(true);
    expect(tieneDescripcionValida({ descripcionAlternativa: "   " })).toBe(false);
  });
});
