/**
 * Pruebas unitarias de las Pantallas 28b (Asignar clase y alumnos marcados por defecto),
 * 28c (Horario único adaptado por rol Tutor 08-15h vs Familia 15-08h) y
 * 28ok (Confirmación de edición con retorno dinámico)
 * siguiendo los bocetos definitivos de `definitiva_v2/pantallas/`
 * (SCRUM-89 / SCRUM-91 · T-07.2).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  esHoraPermitidaParaRol28c,
  resolverDestinoConfirmacion28ok,
  validarProgramacionHorario28c,
} from "../../../servicios/tareasPersonalesService";
import { AsignarClaseAlumnos28b } from "../AsignarClaseAlumnos28b";
import { ConfirmacionTarea28ok } from "../ConfirmacionTarea28ok";
import { ProgramarHorario28c } from "../ProgramarHorario28c";

describe("SCRUM-91 · Pantallas 28b, 28c y 28ok", () => {
  describe("Pantalla 28b — AsignarClaseAlumnos28b", () => {
    it("marca a todos los alumnos por defecto, vuelve a marcarlos al cambiar de clase y navega con «Horario»", async () => {
      const alContinuarHorario = jest.fn();

      await render(<AsignarClaseAlumnos28b alContinuarHorario={alContinuarHorario} />);

      expect(screen.getByTestId("pantalla-28b-asignar-alumnos")).toBeTruthy();
      expect(screen.getByText("1 clase · 6 alumnos (Todos)")).toBeTruthy();

      // Restricción negativa del boceto 28b.html: SIN botón «Cambiar clases / alumnos»
      expect(screen.queryByText(/Cambiar clases \/ alumnos/i)).toBeNull();

      // Desmarcar a un alumno (Fernando) actualiza el contador a 5 alumnos
      await fireEvent.press(screen.getByTestId("tarjeta-alumno-28b-fer"));
      expect(screen.getByText("1 clase · 5 alumnos")).toBeTruthy();

      // Al seleccionar otra clase (Clase Círculo) se vuelven a marcar TODOS los alumnos por defecto
      await fireEvent.press(screen.getByTestId("tarjeta-clase-28b-cir"));
      expect(screen.getByText("1 clase · 6 alumnos (Todos)")).toBeTruthy();

      // Botón «Todas las clases» marca las 6 clases y todos los alumnos
      await fireEvent.press(screen.getByTestId("btn-28b-todas-clases"));
      expect(screen.getByText("6 clases · 6 alumnos (Todos)")).toBeTruthy();

      // Continuar a 28c con el botón inferior «Horario»
      await fireEvent.press(screen.getByLabelText("Horario"));
      expect(alContinuarHorario).toHaveBeenCalledWith(
        expect.objectContaining({
          todasLasClases: true,
          alumnosSeleccionadosIds: ["ale", "mir", "mar", "ser", "ele", "fer"],
        }),
      );
    });
  });

  describe("Pantalla 28c — ProgramarHorario28c", () => {
    it("restringe el horario del Tutor a 08:00–15:00 y permite elegir días, hora y duración", async () => {
      const alGuardar = jest.fn();

      await render(<ProgramarHorario28c rol="tutor" alGuardarHorario={alGuardar} />);

      expect(screen.getByTestId("pantalla-28c-horario")).toBeTruthy();
      expect(screen.getByText("Franja Tutor: 08:00 a 15:00")).toBeTruthy();
      expect(screen.getByText("Permitido: 08:00 – 15:00")).toBeTruthy();
      expect(screen.getByTestId("btn-hora-28c-08:00")).toBeTruthy();
      expect(screen.getByTestId("btn-hora-28c-14:00")).toBeTruthy();
      // Horas de tarde/noche NO aparecen en perfil Tutor
      expect(screen.queryByTestId("btn-hora-28c-17:30")).toBeNull();

      // Seleccionar Sábado, hora 09:30 y duración 30 min
      await fireEvent.press(screen.getByTestId("btn-dia-28c-Sábado"));
      await fireEvent.press(screen.getByTestId("btn-hora-28c-09:30"));
      await fireEvent.press(screen.getByTestId("btn-duracion-28c-30"));

      await fireEvent.press(screen.getByLabelText("Guardar"));
      expect(alGuardar).toHaveBeenCalledWith({
        rol: "tutor",
        diasSeleccionados: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        horaInicio: "09:30",
        duracionMinutos: 30,
      });
    });

    it("utiliza exactamente la misma interfaz para Familia adaptando las horas a 15:00–08:00", async () => {
      const alGuardar = jest.fn();

      await render(<ProgramarHorario28c rol="familia" alGuardarHorario={alGuardar} />);

      expect(screen.getByText("Franja Familia: 15:00 a 08:00")).toBeTruthy();
      expect(screen.getByText("Permitido: 15:00 – 08:00")).toBeTruthy();
      expect(screen.getByTestId("btn-hora-28c-16:00")).toBeTruthy();
      expect(screen.getByTestId("btn-hora-28c-17:30")).toBeTruthy();
      expect(screen.getByTestId("btn-hora-28c-07:30")).toBeTruthy();
      // Horas lectivas de mañana NO aparecen en perfil Familia
      expect(screen.queryByTestId("btn-hora-28c-11:00")).toBeNull();

      await fireEvent.press(screen.getByTestId("btn-hora-28c-19:00"));
      await fireEvent.press(screen.getByLabelText("Guardar"));
      expect(alGuardar).toHaveBeenCalledWith(
        expect.objectContaining({
          rol: "familia",
          horaInicio: "19:00",
        }),
      );
    });

    it("valida correctamente las franjas horarias por rol en el servicio", () => {
      expect(esHoraPermitidaParaRol28c("tutor", "08:00")).toBe(true);
      expect(esHoraPermitidaParaRol28c("tutor", "14:30")).toBe(true);
      expect(esHoraPermitidaParaRol28c("tutor", "15:00")).toBe(false);
      expect(esHoraPermitidaParaRol28c("tutor", "18:00")).toBe(false);

      expect(esHoraPermitidaParaRol28c("familia", "15:00")).toBe(true);
      expect(esHoraPermitidaParaRol28c("familia", "20:30")).toBe(true);
      expect(esHoraPermitidaParaRol28c("familia", "07:30")).toBe(true);
      expect(esHoraPermitidaParaRol28c("familia", "11:00")).toBe(false);

      expect(
        validarProgramacionHorario28c({
          rol: "tutor",
          diasSemana: ["Lunes"],
          horaInicio: "17:00",
          duracionMinutos: 30,
          alumnosIds: ["ale"],
        }).valido,
      ).toBe(false);
    });
  });

  describe("Pantalla 28ok — ConfirmacionTarea28ok", () => {
    it("confirma guardado en Biblioteca (retorno a 31) o edición exclusiva para un alumno (retorno a 39/40)", async () => {
      const alAceptar = jest.fn();

      const { rerender } = await render(
        <ConfirmacionTarea28ok rol="tutor" alAceptar={alAceptar} />,
      );

      expect(screen.getByTestId("pantalla-28ok-confirmacion")).toBeTruthy();
      expect(screen.getByText("¡Tarea editada correctamente!")).toBeTruthy();
      expect(
        screen.getByText("La tarea se ha guardado correctamente en tu Biblioteca de tareas."),
      ).toBeTruthy();

      await fireEvent.press(screen.getByLabelText("Aceptar"));
      expect(alAceptar).toHaveBeenLastCalledWith("31");

      // Edición individual para Alejandro Pérez desde Tutor (41 -> 28 -> 28ok -> 39)
      await rerender(
        <ConfirmacionTarea28ok rol="tutor" alumnoEditado="Alejandro Pérez" alAceptar={alAceptar} />,
      );
      expect(
        screen.getByText(
          "Los cambios de la tarea se han guardado únicamente para el alumno Alejandro Pérez.",
        ),
      ).toBeTruthy();
      await fireEvent.press(screen.getByLabelText("Aceptar"));
      expect(alAceptar).toHaveBeenLastCalledWith("39");

      // Edición individual para Alejandro Pérez desde Familia (42b -> 28 -> 28ok -> 40)
      expect(resolverDestinoConfirmacion28ok("familia", "Alejandro Pérez")).toBe("40");
    });
  });
});
