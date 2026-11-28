import { describe, expect, it } from "@jest/globals";

import type { PictogramaArasaac } from "../arasaac/tipos";
import type { AyudaElegida } from "../necesidades/tipos";
import { CATALOGO_INICIAL_PICTOGRAMAS_51 } from "../servicios/bibliotecaPictogramasService";
import {
  AYUDAS_POR_DEFECTO,
  ayudaDesdeArasaac,
  ayudaDesdeBiblioteca,
  claveBasicaDeAyuda,
  necesidadesDesdeAyudas,
  normalizarAyudas,
} from "./ayudas";

const ayuda = (n: number): AyudaElegida => ({
  id: `arasaac:${n}`,
  texto: `t${n}`,
  imagenUrl: `u${n}`,
  origen: "arasaac",
});

describe("ayudas (MOD HU-18)", () => {
  it("convierte los códigos antiguos del catálogo de la 26", () => {
    expect(normalizarAyudas(["bano", "casa"], ["bano"]).map((a) => a.id)).toEqual([
      "arasaac:6929",
      "arasaac:6964",
    ]);
    // Las 8 sugerencias son de ARASAAC: «Mi biblioteca» solo son los pictogramas propios reales.
    expect(normalizarAyudas(["descanso", "libro"], ["bano"])).toMatchObject([
      { id: "arasaac:2369", origen: "arasaac", texto: "Descansar" },
      { id: "arasaac:2450", origen: "arasaac", texto: "Rincón lectura" },
    ]);
  });

  it("acepta objetos válidos, quita repetidos y deja como mucho 3", () => {
    const lista = [ayuda(1), ayuda(1), ayuda(2), ayuda(3), ayuda(4)];
    expect(normalizarAyudas(lista, ["bano"]).map((a) => a.id)).toEqual([
      "arasaac:1",
      "arasaac:2",
      "arasaac:3",
    ]);
  });

  it("descarta objetos incompletos o con imagenUrl vacía", () => {
    const rotas = [{ id: "arasaac:1", texto: "x", imagenUrl: "", origen: "arasaac" }, { id: "x" }];
    expect(normalizarAyudas(rotas, ["agua"]).map((a) => a.id)).toEqual(["arasaac:2248"]);
  });

  it("vacía o inválida → las del respaldo; sin respaldo útil → las de por defecto", () => {
    expect(normalizarAyudas(undefined, ["agua"]).map((a) => a.id)).toEqual(["arasaac:2248"]);
    expect(normalizarAyudas([], []).map((a) => a.id)).toEqual(AYUDAS_POR_DEFECTO.map((a) => a.id));
  });

  it("las de por defecto son baño, agua y descanso", () => {
    expect(AYUDAS_POR_DEFECTO.map((a) => a.id)).toEqual([
      "arasaac:6929",
      "arasaac:2248",
      "arasaac:2369",
    ]);
  });

  it("convierte resultados de ARASAAC y de Mi biblioteca", () => {
    const p = {
      id: 7,
      palabraClave: "patio",
      palabrasClave: [],
      urlImagen: "https://x/7.png",
    } as unknown as PictogramaArasaac;
    expect(ayudaDesdeArasaac(p)).toEqual({
      id: "arasaac:7",
      texto: "patio",
      imagenUrl: "https://x/7.png",
      origen: "arasaac",
    });
    const propio = CATALOGO_INICIAL_PICTOGRAMAS_51[0];
    expect(ayudaDesdeBiblioteca(propio)).toEqual({
      id: `propio:${propio.id}`,
      texto: propio.palabraClave,
      imagenUrl: propio.imagenUrl,
      origen: "biblioteca",
    });
  });

  it("guarda la ruta de Storage de los propios para poder volver a firmar su imagen", () => {
    const propio = { ...CATALOGO_INICIAL_PICTOGRAMAS_51[0], rutaStorage: "u1/123-patio.png" };
    expect(ayudaDesdeBiblioteca(propio).rutaStorage).toBe("u1/123-patio.png");
    const guardada = { ...ayudaDesdeBiblioteca(propio), id: "propio:z" };
    expect(normalizarAyudas([guardada], ["bano"])[0].rutaStorage).toBe("u1/123-patio.png");
    // Una ruta vacía o que no es texto no se conserva.
    expect(normalizarAyudas([{ ...guardada, rutaStorage: 5 }], ["bano"])[0]).not.toHaveProperty(
      "rutaStorage",
    );
  });

  it("sabe qué ayudas son baño, agua o descanso", () => {
    const [bano, agua, descanso] = AYUDAS_POR_DEFECTO;
    expect([bano, agua, descanso].map(claveBasicaDeAyuda)).toEqual(["bano", "agua", "descanso"]);
    expect(claveBasicaDeAyuda(ayuda(7))).toBeNull();
  });

  it("las necesidades salen de las ayudas básicas; si no hay ninguna, se conservan", () => {
    const [bano, , descanso] = AYUDAS_POR_DEFECTO;
    expect(necesidadesDesdeAyudas([descanso, bano], ["agua"])).toEqual(["descanso", "bano"]);
    expect(necesidadesDesdeAyudas(normalizarAyudas(["casa"], ["bano"]), ["agua"])).toEqual([
      "agua",
    ]);
  });
});
