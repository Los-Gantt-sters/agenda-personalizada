/**
 * Pruebas unitarias de la fusión de las pantallas 51 y 51b en una única Pantalla 51
 * («Mi biblioteca · Mis pictogramas propios») con aislamiento estricto entre Tutor y Familia
 * y subida directa al pulsar el recuadro punteado «+» sin botón «Subir archivo propio»
 * (SCRUM-241 / SCRUM-275 · T-51.1 / SCRUM-279 · T-51.2).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  CATALOGO_INICIAL_PICTOGRAMAS_51,
  MENSAJE_EXITO_SUBIDA_51,
  MENSAJE_INICIAL_SUBIDA_51,
  convertirPictogramasPropiosABuscador28p,
  editarPictogramaPropio51,
  eliminarPictogramaPropio51,
  filtrarPictogramasPorRol51,
  obtenerPictogramasPropiosPorRol51,
  reiniciarBibliotecaPictogramas51,
  subirPictogramaPropioAlPulsarMas,
} from "../../../servicios/bibliotecaPictogramasService";
import { PantallaBibliotecaPictogramas51 } from "../PantallaBibliotecaPictogramas51";

describe("PantallaBibliotecaPictogramas51 (SCRUM-241 · SCRUM-275 y SCRUM-279)", () => {
  beforeEach(() => {
    reiniciarBibliotecaPictogramas51();
  });

  it("aísla estrictamente en el servicio los pictogramas propios de Tutor respecto de los de Familia", () => {
    const deTutor = obtenerPictogramasPropiosPorRol51("tutor");
    const deFamilia = obtenerPictogramasPropiosPorRol51("familia");

    expect(deTutor).toHaveLength(3);
    expect(deTutor.every((p) => p.owner === "tutor")).toBe(true);
    expect(deTutor.map((p) => p.palabraClave)).toEqual([
      "Grifo del aula (propio)",
      "Toallitas Plan B",
      "Rincón de la asamblea",
    ]);

    expect(deFamilia).toHaveLength(3);
    expect(deFamilia.every((p) => p.owner === "familia")).toBe(true);
    expect(deFamilia.map((p) => p.palabraClave)).toEqual([
      "Mochila azul de Alejandro",
      "Desayuno de casa",
      "Dormitorio de Alejandro",
    ]);

    // Búsqueda por texto y conversión para buscador 28p respetando el rol
    expect(
      filtrarPictogramasPorRol51(CATALOGO_INICIAL_PICTOGRAMAS_51, "tutor", "toallitas"),
    ).toHaveLength(1);
    const para28pFamilia = convertirPictogramasPropiosABuscador28p("familia");
    expect(para28pFamilia).toHaveLength(3);
    expect(para28pFamilia[0].etiquetaFuente).toBe("Mi biblioteca");
  });

  it("impide que un rol edite o elimine pictogramas propios que pertenecen al otro rol", () => {
    expect(() =>
      editarPictogramaPropio51({
        id: "pic-familia-1",
        owner: "tutor",
        palabraClave: "Intento cruzado",
      }),
    ).toThrow(/otro rol/i);

    expect(() => eliminarPictogramaPropio51("pic-tutor-1", "familia")).toThrow(/otro rol/i);

    const editado = editarPictogramaPropio51({
      id: "pic-tutor-1",
      owner: "tutor",
      palabraClave: "Grifo principal del aula",
    });
    expect(editado.palabraClave).toBe("Grifo principal del aula");

    const restantesTutor = eliminarPictogramaPropio51("pic-tutor-2", "tutor");
    expect(restantesTutor).toHaveLength(2);
    expect(obtenerPictogramasPropiosPorRol51("familia")).toHaveLength(3);
  });

  it("muestra únicamente los 3 pictogramas propios del Tutor cuando rol='tutor' y vuelve al panel 33", async () => {
    const alAtras = jest.fn();
    await render(<PantallaBibliotecaPictogramas51 rol="tutor" alAtras={alAtras} />);

    expect(screen.getByText("Mi biblioteca · Mis pictogramas propios")).toBeTruthy();
    expect(screen.getByText("Carmen Ruiz")).toBeTruthy();

    // Visibles los 3 pictogramas de Tutor
    expect(screen.getByText("Grifo del aula (propio)")).toBeTruthy();
    expect(screen.getByText("Toallitas Plan B")).toBeTruthy();
    expect(screen.getByText("Rincón de la asamblea")).toBeTruthy();

    // Ocultos los 3 pictogramas de Familia
    expect(screen.queryByText("Mochila azul de Alejandro")).toBeNull();
    expect(screen.queryByText("Desayuno de casa")).toBeNull();
    expect(screen.queryByText("Dormitorio de Alejandro")).toBeNull();

    // Botón Atrás navega al panel 33 del Tutor
    await fireEvent.press(screen.getByText("Atrás"));
    expect(alAtras).toHaveBeenCalledWith("33");
  });

  it("muestra únicamente los 3 pictogramas propios de la Familia cuando rol='familia' y vuelve al panel 34", async () => {
    const alAtras = jest.fn();
    await render(<PantallaBibliotecaPictogramas51 rol="familia" alAtras={alAtras} />);

    expect(screen.getByText("Familia García")).toBeTruthy();

    // Visibles los 3 pictogramas de Familia
    expect(screen.getByText("Mochila azul de Alejandro")).toBeTruthy();
    expect(screen.getByText("Desayuno de casa")).toBeTruthy();
    expect(screen.getByText("Dormitorio de Alejandro")).toBeTruthy();

    // Ocultos los 3 pictogramas de Tutor
    expect(screen.queryByText("Grifo del aula (propio)")).toBeNull();
    expect(screen.queryByText("Toallitas Plan B")).toBeNull();
    expect(screen.queryByText("Rincón de la asamblea")).toBeNull();

    // Botón Atrás navega al panel 34 de Familia
    await fireEvent.press(screen.getByText("Atrás"));
    expect(alAtras).toHaveBeenCalledWith("34");
  });

  it("permite editar y quitar pictogramas propios dentro de la biblioteca del rol activo", async () => {
    const alCambiar = jest.fn();
    await render(<PantallaBibliotecaPictogramas51 rol="tutor" alCambiarBiblioteca={alCambiar} />);

    // Iniciar edición de 'pic-tutor-1'
    await fireEvent.press(screen.getByTestId("boton-editar-picto-51-pic-tutor-1"));
    await fireEvent.changeText(
      screen.getByTestId("input-palabra-clave-51"),
      "Grifo adaptado Clase Triángulo",
    );
    await fireEvent.press(screen.getByTestId("boton-editar-picto-51-pic-tutor-1"));

    expect(screen.getByText("Grifo adaptado Clase Triángulo")).toBeTruthy();

    // Quitar 'pic-tutor-2'
    await fireEvent.press(screen.getByTestId("boton-quitar-picto-51-pic-tutor-2"));
    expect(screen.queryByText("Toallitas Plan B")).toBeNull();
    expect(alCambiar).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ palabraClave: "Grifo adaptado Clase Triángulo" }),
      ]),
    );
  });

  it("elimina cualquier botón separado «Subir archivo propio» y activa la subida directamente al pulsar el recuadro punteado «+» (SCRUM-279)", async () => {
    const alSubir = jest.fn();
    const alCambiar = jest.fn();
    await render(
      <PantallaBibliotecaPictogramas51
        rol="tutor"
        alSubirPictograma={alSubir}
        alCambiarBiblioteca={alCambiar}
      />,
    );

    // Verifica que NO existe ningún botón independiente «Subir archivo propio»
    expect(screen.queryByText(/Subir archivo propio/i)).toBeNull();
    expect(screen.getByText(MENSAJE_INICIAL_SUBIDA_51)).toBeTruthy();

    // Rellenar palabra clave y texto alternativo y pulsar el recuadro punteado '+'
    await fireEvent.changeText(
      screen.getByTestId("input-palabra-clave-51"),
      "Pizarra visual del aula",
    );
    await fireEvent.changeText(
      screen.getByTestId("input-texto-alternativo-51"),
      "Fotografía real de la pizarra magnética de Clase Triángulo",
    );
    await fireEvent.press(screen.getByTestId("recuadro-subir-mas-51"));

    // Se muestra el estado de éxito en verde y el nuevo pictograma aparece en la tabla del Tutor
    expect(screen.getByText(MENSAJE_EXITO_SUBIDA_51)).toBeTruthy();
    expect(screen.getByText("Pizarra visual del aula")).toBeTruthy();
    expect(
      screen.getByText("Fotografía real de la pizarra magnética de Clase Triángulo"),
    ).toBeTruthy();

    expect(alSubir).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "tutor",
        palabraClave: "Pizarra visual del aula",
      }),
    );
    expect(alCambiar).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          owner: "tutor",
          palabraClave: "Pizarra visual del aula",
        }),
      ]),
    );

    // El nuevo pictograma subido por Tutor NO aparece en la biblioteca de Familia
    const deFamilia = obtenerPictogramasPropiosPorRol51("familia");
    expect(deFamilia.some((p) => p.palabraClave === "Pizarra visual del aula")).toBe(false);

    // Subida directa por defecto para Familia desde el servicio
    const nuevoFamilia = await subirPictogramaPropioAlPulsarMas({ owner: "familia" });
    expect(nuevoFamilia.owner).toBe("familia");
    expect(nuevoFamilia.palabraClave).toContain("casa");
    expect(obtenerPictogramasPropiosPorRol51("familia")).toHaveLength(4);
  });
});
