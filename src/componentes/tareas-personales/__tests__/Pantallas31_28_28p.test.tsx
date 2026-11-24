/**
 * Pruebas unitarias de las Pantallas 31 (Biblioteca de tareas),
 * 28 (Editor de datos generales) y 28p (Buscador general de pictogramas)
 * siguiendo los bocetos definitivos de `definitiva_v2/pantallas/`
 * (SCRUM-89 / SCRUM-90 · T-07.1).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BibliotecaTareas31 } from "../BibliotecaTareas31";
import { BuscadorPictogramas28p } from "../BuscadorPictogramas28p";
import { EditorTarea28, acotarNumeroPasos28 } from "../EditorTarea28";

describe("SCRUM-90 · Pantallas 31, 28 y 28p (Biblioteca y Editor F11)", () => {
  describe("Pantalla 31 — BibliotecaTareas31", () => {
    it("muestra las tareas del Tutor aisladas de Familia, filtra «Creadas por mí» y navega a Crear, Editar y Asignar", async () => {
      const alCrear = jest.fn();
      const alEditar = jest.fn();
      const alAsignar = jest.fn();

      await render(
        <BibliotecaTareas31
          rol="tutor"
          alCrearNuevaTarea={alCrear}
          alEditarTarea={alEditar}
          alAsignar={alAsignar}
        />,
      );

      expect(screen.getByTestId("pantalla-31-biblioteca-tareas")).toBeTruthy();
      expect(screen.getByText("Carmen Ruiz")).toBeTruthy();
      expect(screen.getByText("Lavarse las manos")).toBeTruthy();
      expect(screen.getByText("Comedor: Recuento comensales")).toBeTruthy();

      // Aislamiento: Tutor NO ve tareas exclusivas de Familia
      expect(screen.queryByText("Preparar la mochila")).toBeNull();
      expect(screen.queryByText("Cuento antes de dormir")).toBeNull();

      // Filtrar solo «Creadas por mí»
      await fireEvent.press(screen.getByTestId("filtro-31-mine"));
      expect(screen.getByText("Lavarse las manos")).toBeTruthy();
      expect(screen.queryByText("Comedor: Recuento comensales")).toBeNull();

      // Volver a «Todas las tareas» y buscar por texto
      await fireEvent.press(screen.getByTestId("filtro-31-all"));
      await fireEvent.changeText(screen.getByTestId("input-buscar-tarea-31"), "reprografía");
      expect(screen.getByText("Encargo de reprografía")).toBeTruthy();
      expect(screen.queryByText("Asamblea matinal")).toBeNull();

      // Acciones Crear nueva tarea, Editar y botón inferior Asignar
      await fireEvent.press(screen.getByTestId("btn-31-crear-nueva-tarea"));
      expect(alCrear).toHaveBeenCalledTimes(1);

      await fireEvent.press(screen.getByTestId("btn-31-editar-t4"));
      expect(alEditar).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t4", titulo: "Encargo de reprografía" }),
      );

      await fireEvent.press(screen.getByLabelText("Asignar"));
      expect(alAsignar).toHaveBeenCalledWith(
        expect.objectContaining({ id: "t4", titulo: "Encargo de reprografía" }),
      );
    });

    it("muestra la misma interfaz para Familia con sus propias tareas aisladas", async () => {
      await render(<BibliotecaTareas31 rol="familia" />);

      expect(screen.getByText("Familia García")).toBeTruthy();
      expect(screen.getByText("Preparar la mochila")).toBeTruthy();
      expect(screen.getByText("Recoger la habitación")).toBeTruthy();
      // Familia NO ve tareas escolares del Tutor
      expect(screen.queryByText("Encargo de reprografía")).toBeNull();
    });
  });

  describe("Pantalla 28 — EditorTarea28", () => {
    it("renderiza Datos generales SIN pestañas superiores y SIN bloque Tipo de tarea/Plan B, permitiendo ajustar pasos entre 1 y 5", async () => {
      const alAbrirBuscador = jest.fn();
      const alContinuarPasos = jest.fn();

      await render(
        <EditorTarea28
          rol="tutor"
          pasosCountInicial={3}
          alAbrirBuscadorPictograma={alAbrirBuscador}
          alContinuarPasos={alContinuarPasos}
        />,
      );

      expect(screen.getByTestId("pantalla-28-editor-tarea")).toBeTruthy();
      expect(screen.getByText("Perfil activo: Tutor")).toBeTruthy();
      expect(screen.getByText("3 pasos")).toBeTruthy();

      // Restricciones negativas del boceto 28.html: SIN pestañas superiores ni Plan B
      expect(screen.queryByText(/1\. Datos generales e icono/i)).toBeNull();
      expect(screen.queryByText(/2\. Pasos y multimedia/i)).toBeNull();
      expect(screen.queryByText(/Tipo de tarea/i)).toBeNull();
      expect(screen.queryByText(/Plan B/i)).toBeNull();

      // Ajustar número de pasos con + y −
      await fireEvent.press(screen.getByTestId("btn-28-incrementar-pasos"));
      expect(screen.getByText("4 pasos")).toBeTruthy();
      expect(screen.getByTestId("paso-preview-28-4")).toBeTruthy();

      await fireEvent.press(screen.getByTestId("btn-28-decrementar-pasos"));
      await fireEvent.press(screen.getByTestId("btn-28-decrementar-pasos"));
      await fireEvent.press(screen.getByTestId("btn-28-decrementar-pasos"));
      expect(screen.getByText("1 paso")).toBeTruthy();

      // Editar título y abrir buscador 28p
      await fireEvent.changeText(
        screen.getByTestId("input-titulo-tarea-28"),
        "Lavarse las manos despacio",
      );
      await fireEvent.press(screen.getByTestId("btn-28-abrir-buscador-picto"));
      expect(alAbrirBuscador).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: "Lavarse las manos despacio",
          pasosCount: 1,
        }),
      );

      // Continuar mediante el botón inferior «Pasos»
      await fireEvent.press(screen.getByLabelText("Pasos"));
      expect(alContinuarPasos).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: "Lavarse las manos despacio",
          pasosCount: 1,
        }),
      );

      expect(acotarNumeroPasos28(0)).toBe(1);
      expect(acotarNumeroPasos28(9)).toBe(5);
    });

    it("muestra el banner de edición individual cuando se edita para un alumno concreto desde 41/42b", async () => {
      await render(<EditorTarea28 rol="tutor" alumnoEditado="Alejandro Pérez" />);

      expect(screen.getByText("Solo alumno: Alejandro Pérez")).toBeTruthy();
      expect(screen.getByText(/Editando tarea únicamente para Alejandro Pérez/i)).toBeTruthy();
    });
  });

  describe("Pantalla 28p — BuscadorPictogramas28p", () => {
    it("busca simultáneamente en ARASAAC y Mi biblioteca SIN Paso 3, SIN panel derecho y SIN botón Adjuntar propio", async () => {
      const alSeleccionar = jest.fn();

      await render(<BuscadorPictogramas28p rol="tutor" alSeleccionarPictograma={alSeleccionar} />);

      expect(screen.getByTestId("pantalla-28p-buscador-pictogramas")).toBeTruthy();
      expect(screen.getByText("Todos (8)")).toBeTruthy();
      expect(screen.getByText("ARASAAC (5)")).toBeTruthy();
      expect(screen.getByText("Mi biblioteca (3)")).toBeTruthy();

      // Restricciones negativas del boceto 28p.html
      expect(screen.queryByText(/Paso 3/i)).toBeNull();
      expect(screen.queryByText(/Pictograma seleccionado/i)).toBeNull();
      expect(screen.queryByText(/Adjuntar propio/i)).toBeNull();

      // Filtrar solo «Mi biblioteca (3)»
      await fireEvent.press(screen.getByTestId("filtro-28p-mio"));
      expect(screen.getByText("Dispensador del aula")).toBeTruthy();
      expect(screen.queryByText("Agua / Aclarar")).toBeNull();

      // Seleccionar un pictograma propio y confirmar con «Seleccionar»
      await fireEvent.press(screen.getByTestId("tarjeta-picto-28p-p-mio-toallitas"));
      await fireEvent.press(screen.getByLabelText("Seleccionar"));
      expect(alSeleccionar).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "p-mio-toallitas",
          titulo: "Toallitas húmedas",
          fuente: "mio",
        }),
      );
    });
  });
});
