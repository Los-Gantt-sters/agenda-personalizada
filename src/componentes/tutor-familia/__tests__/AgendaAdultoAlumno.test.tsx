/**
 * Pruebas unitarias para las Pantallas 39 (Agenda Tutor) y 40 (Agenda Familia)
 * sin botones duplicados de Progreso ni Nueva tarea (SCRUM-234 / SCRUM-255 · T-TF.1).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AgendaAdultoAlumno, resolverDestinoTareaAdulto } from "../AgendaAdultoAlumno";
import { TAREA_HOGAR_PREPARAR_MOCHILA } from "../datosAgendaAdulto";

describe("AgendaAdultoAlumno - Pantallas 39 y 40 (SCRUM-255)", () => {
  it("renderiza la Pantalla 39 (Tutor) con Ver semana, auto-pendiente y SIN botones duplicados de Progreso ni Nueva tarea", async () => {
    const alAbrirTarea = jest.fn();
    const alVerSemana = jest.fn();

    await render(
      <AgendaAdultoAlumno rol="tutor" alAbrirTarea={alAbrirTarea} alVerSemana={alVerSemana} />,
    );

    expect(screen.getByTestId("pantalla-39-agenda-tutor")).toBeTruthy();
    expect(screen.getByText("Agenda de Lucas")).toBeTruthy();
    expect(screen.getByText("Tutor · María Carmen")).toBeTruthy();
    expect(screen.getByText("Personalizar tarea solo para Lucas")).toBeTruthy();
    expect(screen.getByText("Auto-pendiente (tiempo agotado)")).toBeTruthy();

    // NO debe haber botones duplicados de Progreso e historial ni Nueva tarea en la cabecera
    expect(screen.queryByText(/Progreso e historial/i)).toBeNull();
    expect(screen.queryByText(/Nueva tarea/i)).toBeNull();
    expect(screen.queryByText("Ayuda")).toBeNull();
    expect(screen.queryByText("Accesibilidad")).toBeNull();

    await fireEvent.press(screen.getByTestId("boton-ver-semana"));
    expect(alVerSemana).toHaveBeenCalledTimes(1);

    // En Tutor (39), pulsar Abrir tarea navega a la Pantalla 41
    await fireEvent.press(screen.getByTestId("boton-abrir-tarea-ahora"));
    expect(alAbrirTarea).toHaveBeenCalledWith(
      "41",
      expect.objectContaining({ titulo: "Lavarse las manos" }),
    );
  });

  it("renderiza la Pantalla 40 (Familia) y distingue entre tarea escolar (42 solo lectura) y tarea de hogar (42b editable)", async () => {
    const alAbrirTarea = jest.fn();
    const alCerrarSesion = jest.fn();

    const { rerender } = await render(
      <AgendaAdultoAlumno
        rol="familia"
        alAbrirTarea={alAbrirTarea}
        alCerrarSesion={alCerrarSesion}
      />,
    );

    expect(screen.getByTestId("pantalla-40-agenda-familia")).toBeTruthy();
    expect(screen.getByText("Familia · Ramón")).toBeTruthy();
    expect(screen.getByText("En clase · Solo lectura (gestiona tutor)")).toBeTruthy();

    // Sin botones duplicados de Progreso ni Nueva tarea
    expect(screen.queryByText(/Progreso e historial/i)).toBeNull();
    expect(screen.queryByText(/Nueva tarea/i)).toBeNull();

    // En Familia (40) con tarea escolar, Abrir tarea navega a la Pantalla 42 (espejo solo lectura)
    await fireEvent.press(screen.getByTestId("boton-abrir-tarea-ahora"));
    expect(alAbrirTarea).toHaveBeenCalledWith(
      "42",
      expect.objectContaining({ titulo: "Lavarse las manos" }),
    );

    await fireEvent.press(screen.getByTestId("boton-salir-agenda-adulto"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);

    // Si la tarea de AHORA es de ámbito hogar, la familia ve que es editable y navega a 42b
    await rerender(
      <AgendaAdultoAlumno
        rol="familia"
        ahora={TAREA_HOGAR_PREPARAR_MOCHILA}
        alAbrirTarea={alAbrirTarea}
      />,
    );
    expect(screen.getByText("En casa (15:00–08:00) · Editable por familia")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-abrir-tarea-ahora"));
    expect(alAbrirTarea).toHaveBeenLastCalledWith(
      "42b",
      expect.objectContaining({ titulo: "Preparar la mochila" }),
    );

    expect(resolverDestinoTareaAdulto("tutor", "escolar")).toBe("41");
    expect(resolverDestinoTareaAdulto("familia", "escolar")).toBe("42");
    expect(resolverDestinoTareaAdulto("familia", "hogar")).toBe("42b");
  });
});
