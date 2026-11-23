/**
 * Pruebas unitarias para la Pantalla 37 (Ficha del alumno limpia sin RGPD) y flujo 35 -> 36 -> 37
 * (SCRUM-233 / SCRUM-254).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FichaAlumnoTutor } from "../FichaAlumnoTutor";
import { NavegacionTutor } from "../NavegacionTutor";

describe("FichaAlumnoTutor - Pantalla 37 y flujo completo 35 -> 36 -> 37 (SCRUM-254)", () => {
  it("renderiza la ficha limpia del alumno SIN etiquetas RGPD y con los 5 enlaces (39, 43, 16, 26d, 47b)", async () => {
    const alNavegarDestino = jest.fn();
    await render(<FichaAlumnoTutor alumnoId="luc" alNavegarDestino={alNavegarDestino} />);

    expect(screen.getByText("Ficha del alumno · Lucas")).toBeTruthy();
    expect(screen.getByText("Lucas")).toBeTruthy();
    expect(screen.getByText("Clase Cuadrado · Ficha individual de trabajo")).toBeTruthy();

    // Verifica ausencia total de etiquetas RGPD en la ficha del alumno
    expect(screen.queryByText(/RGPD/i)).toBeNull();
    expect(screen.queryByText(/Datos escolares/i)).toBeNull();
    expect(screen.queryByText(/Foto de rostro/i)).toBeNull();

    // Verifica las 5 tarjetas de acción y sus destinos (39, 43, 16, 26d y 47b)
    await fireEvent.press(screen.getByTestId("enlace-ficha-39"));
    expect(alNavegarDestino).toHaveBeenCalledWith("39", "luc");

    await fireEvent.press(screen.getByTestId("enlace-ficha-43"));
    expect(alNavegarDestino).toHaveBeenCalledWith("43", "luc");

    await fireEvent.press(screen.getByTestId("enlace-ficha-16"));
    expect(alNavegarDestino).toHaveBeenCalledWith("16", "luc");

    await fireEvent.press(screen.getByTestId("enlace-ficha-26d"));
    expect(alNavegarDestino).toHaveBeenCalledWith("26d", "luc");

    await fireEvent.press(screen.getByTestId("enlace-ficha-47b"));
    expect(alNavegarDestino).toHaveBeenCalledWith("47b", "luc");
  });

  it("permite recorrer el flujo completo Pantalla 35 -> Pantalla 36 -> Pantalla 37 y volver atrás", async () => {
    const alAbrirDestinoFicha = jest.fn();
    const alCerrarSesion = jest.fn();

    await render(
      <NavegacionTutor alAbrirDestinoFicha={alAbrirDestinoFicha} alCerrarSesion={alCerrarSesion} />,
    );

    // Empieza en Pantalla 35 (9 clases sin paginación)
    expect(screen.getByTestId("pantalla-35-aulas")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("tarjeta-aula-cua"));

    // Pasa a Pantalla 36 (Alumnos · Clase Cuadrado)
    expect(screen.getByTestId("pantalla-36-alumnos")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("tarjeta-alumno-luc"));

    // Pasa a Pantalla 37 (Ficha del alumno · Lucas)
    expect(screen.getByTestId("pantalla-37-ficha")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("enlace-ficha-39"));
    expect(alAbrirDestinoFicha).toHaveBeenCalledWith("39", "luc");

    // Botón salir en Pantalla 37
    await fireEvent.press(screen.getByTestId("boton-salir-37"));
    expect(alCerrarSesion).toHaveBeenCalledTimes(1);

    // Volver atrás 37 -> 36 -> 35 y avanzar con Adelante 35 -> 36 -> 37
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByTestId("pantalla-36-alumnos")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByTestId("pantalla-35-aulas")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByTestId("pantalla-36-alumnos")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByTestId("pantalla-37-ficha")).toBeTruthy();
  });
});
