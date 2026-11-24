/**
 * Pruebas de integración del flujo completo `FlujoTareasPersonales`
 * (31 <-> 28 <-> 28p -> 28ok y 31 -> 28b -> 28c) y edición individual por alumno
 * (SCRUM-89 / SCRUM-92 · T-07.3).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FlujoTareasPersonales } from "../FlujoTareasPersonales";

describe("SCRUM-92 · FlujoTareasPersonales (Flujo integrado HU-07)", () => {
  it("completa el flujo 31 -> 28 -> 28p -> 28 -> 28ok -> 31 guardando una nueva tarea en la Biblioteca", async () => {
    await render(<FlujoTareasPersonales rol="tutor" />);

    // 1. Pantalla 31 (Biblioteca de tareas)
    expect(screen.getByTestId("pantalla-31-biblioteca-tareas")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("btn-31-crear-nueva-tarea"));

    // 2. Pantalla 28 (Editor Datos generales)
    expect(screen.getByTestId("pantalla-28-editor-tarea")).toBeTruthy();
    await fireEvent.changeText(
      screen.getByTestId("input-titulo-tarea-28"),
      "Higiene con toallitas",
    );
    await fireEvent.press(screen.getByTestId("btn-28-abrir-buscador-picto"));

    // 3. Pantalla 28p (Buscador unificado ARASAAC + Mi biblioteca)
    expect(screen.getByTestId("pantalla-28p-buscador-pictogramas")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("tarjeta-picto-28p-p-mio-toallitas"));
    await fireEvent.press(screen.getByLabelText("Seleccionar"));

    // 4. Regreso a Pantalla 28 con el pictograma aplicado y avance con «Pasos»
    expect(screen.getByTestId("pantalla-28-editor-tarea")).toBeTruthy();
    expect(screen.getByText("Pictograma actual: Toallitas húmedas")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Pasos"));

    // 5. Pantalla 28ok (Confirmación) -> «Aceptar» vuelve a 31
    expect(screen.getByTestId("pantalla-28ok-confirmacion")).toBeTruthy();
    expect(screen.getByText("Higiene con toallitas")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Aceptar"));

    // 6. De vuelta en 31 con la nueva tarea creada en la biblioteca del Tutor
    expect(screen.getByTestId("pantalla-31-biblioteca-tareas")).toBeTruthy();
    expect(screen.getByText("Higiene con toallitas")).toBeTruthy();
  });

  it("completa el flujo de asignación 31 -> 28b (alumnos marcados por defecto) -> 28c (horario por rol) -> 31", async () => {
    const alHorarioGuardado = jest.fn();

    await render(<FlujoTareasPersonales rol="familia" alHorarioGuardado={alHorarioGuardado} />);

    // En 31 (Familia), pulsar «Asignar» navega a 28b
    expect(screen.getByTestId("pantalla-31-biblioteca-tareas")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Asignar"));

    // En 28b, todos los alumnos están marcados por defecto; pulsar «Horario» navega a 28c
    expect(screen.getByTestId("pantalla-28b-asignar-alumnos")).toBeTruthy();
    expect(screen.getByText("1 clase · 6 alumnos (Todos)")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Horario"));

    // En 28c (Familia), muestra la franja 15:00 a 08:00 y al pulsar «Guardar» vuelve a 31
    expect(screen.getByTestId("pantalla-28c-horario")).toBeTruthy();
    expect(screen.getByText("Franja Familia: 15:00 a 08:00")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Guardar"));

    expect(alHorarioGuardado).toHaveBeenCalledWith(
      expect.objectContaining({
        rol: "familia",
        horaInicio: "17:30",
      }),
    );
    expect(screen.getByTestId("pantalla-31-biblioteca-tareas")).toBeTruthy();
  });

  it("ejecuta la edición exclusiva para un alumno concreto (28 -> 28ok -> retorno a 39) sin modificar la biblioteca general", async () => {
    const alVolverAgendaAlumno = jest.fn();

    await render(
      <FlujoTareasPersonales
        rol="tutor"
        pantallaInicial="28"
        alumnoEditadoInicial="Alejandro Pérez"
        tareaInicialId="t1"
        alVolverAgendaAlumno={alVolverAgendaAlumno}
      />,
    );

    expect(screen.getByTestId("pantalla-28-editor-tarea")).toBeTruthy();
    expect(screen.getByText("Solo alumno: Alejandro Pérez")).toBeTruthy();

    await fireEvent.changeText(
      screen.getByTestId("input-titulo-tarea-28"),
      "Lavarse las manos (Alejandro)",
    );
    await fireEvent.press(screen.getByLabelText("Pasos"));

    expect(screen.getByTestId("pantalla-28ok-confirmacion")).toBeTruthy();
    expect(
      screen.getByText(
        "Los cambios de la tarea se han guardado únicamente para el alumno Alejandro Pérez.",
      ),
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Aceptar"));
    expect(alVolverAgendaAlumno).toHaveBeenCalledWith(
      "39",
      expect.objectContaining({
        alumno: "Alejandro Pérez",
        tarea: expect.objectContaining({
          titulo: "Lavarse las manos (Alejandro)",
        }),
      }),
    );
  });
});
