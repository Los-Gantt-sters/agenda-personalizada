/**
 * Pruebas unitarias de la Pantalla 26d simplificada (sin nivel de dependencia ni Categoría)
 * y la Pantalla 07e con filtrado dinámico de formatos multimedia y botón Preferencias (16)
 * (HU-23 / SCRUM-141 / SCRUM-143 · T-23.2).
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { leer } from "../../../servicios/voz";
import { reiniciarPermisosAlumnoMemoria } from "../../../servicios/permisosAlumnoService";
import { PantallaPermisosAlumno26d } from "../PantallaPermisosAlumno26d";
import { PantallaEjecucionRestringida07e } from "../PantallaEjecucionRestringida07e";

jest.mock("../../../lib/supabaseClient", () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock("../../../servicios/voz", () => ({
  leer: jest.fn(),
  detener: jest.fn(),
}));

describe("Pantallas 26d y 07e (HU-23 · SCRUM-143 · Permisos simplificados y ejecución restringida)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reiniciarPermisosAlumnoMemoria();
  });

  it("renderiza la Pantalla 26d simplificada SIN selector de dependencia ni etiquetas de Categoría", async () => {
    await render(<PantallaPermisosAlumno26d nombreAlumno="Alejandro" />);

    expect(screen.getByText("Permisos del alumno · Alejandro")).toBeTruthy();
    expect(screen.getByText("Formatos multimedia habilitados debajo de cada paso")).toBeTruthy();
    expect(screen.getByText("Acceso a Preferencias y pantallas")).toBeTruthy();

    // Verifica explícitamente que NO existe selector de nivel de dependencia ni etiqueta Categoría
    expect(screen.queryByText(/Nivel de dependencia/i)).toBeNull();
    expect(screen.queryByText(/Categoría/i)).toBeNull();

    // Verifica que es pantalla de adulto (sin botones Ayuda ni Accesibilidad de alumno abajo)
    expect(screen.queryByLabelText("Pedir ayuda")).toBeNull();
  });

  it("permite activar/desactivar formatos multimedia en 26d e impide desmarcar el último formato activo", async () => {
    const alCambiar = jest.fn();
    await render(
      <PantallaPermisosAlumno26d
        formatosIniciales={["pictograma", "audio"]}
        alCambiarPermisos={alCambiar}
      />,
    );

    // Desactivar Audio -> queda solo Pictograma
    await fireEvent.press(screen.getByTestId("opcion-formato-26d-audio"));
    expect(alCambiar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formatosPermitidos: ["pictograma"],
      }),
    );

    // Intentar desactivar Pictograma (último formato activo) -> muestra aviso y lo mantiene activo
    await fireEvent.press(screen.getByTestId("opcion-formato-26d-pictograma"));
    expect(screen.getByTestId("aviso-minimo-formato-26d")).toBeTruthy();
    expect(screen.getByTestId("check-formato-26d-pictograma")).toBeTruthy();

    // Volver a activar Texto -> limpia el aviso
    await fireEvent.press(screen.getByTestId("opcion-formato-26d-texto"));
    expect(screen.queryByTestId("aviso-minimo-formato-26d")).toBeNull();
    expect(alCambiar).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formatosPermitidos: ["pictograma", "texto"],
      }),
    );
  });

  it("conmuta en 26d la entrada tras login (06b Semana vs 06 Solo Hoy), el botón Preferencias (16) y guarda los permisos", async () => {
    const alGuardar = jest.fn();
    const alVistaPrevia = jest.fn();
    await render(
      <PantallaPermisosAlumno26d
        alumnoId="ale"
        nombreAlumno="Alejandro"
        alGuardar={alGuardar}
        alAbrirVistaPrevia07e={alVistaPrevia}
      />,
    );

    // Por defecto está seleccionada Semana (06b) y Mostrar botón Preferencias (16)
    expect(screen.getByTestId("check-entrada-06b")).toBeTruthy();
    expect(screen.queryByTestId("check-entrada-06")).toBeNull();
    expect(screen.getByTestId("check-mostrar-preferencias-16")).toBeTruthy();

    // Cambiar entrada tras login a Solo Hoy (06)
    await fireEvent.press(screen.getByTestId("opcion-entrada-login-06"));
    expect(screen.getByTestId("check-entrada-06")).toBeTruthy();
    expect(screen.queryByTestId("check-entrada-06b")).toBeNull();

    // Desmarcar Mostrar botón Preferencias (16)
    await fireEvent.press(screen.getByTestId("opcion-mostrar-preferencias-16"));
    expect(screen.queryByTestId("check-mostrar-preferencias-16")).toBeNull();

    // Abrir vista previa 07e
    await fireEvent.press(screen.getByTestId("boton-vista-previa-07e"));
    expect(alVistaPrevia).toHaveBeenCalledWith(
      expect.objectContaining({
        entradaTrasLogin: "06",
        mostrarBotonPreferencias16: false,
      }),
    );

    // Pulsar Guardar en la barra inferior
    await fireEvent.press(screen.getByText("Guardar"));
    expect(alGuardar).toHaveBeenCalledWith(
      expect.objectContaining({
        alumnoId: "ale",
        entradaTrasLogin: "06",
        mostrarBotonPreferencias16: false,
      }),
    );
    expect(screen.getByTestId("mensaje-permisos-guardados-26d")).toBeTruthy();
  });

  it("filtra dinámicamente en 07e los formatos multimedia mostrando solo Pictograma y Audio según el boceto 07e.html", async () => {
    await render(<PantallaEjecucionRestringida07e />);

    expect(screen.getByText("Lavarse las manos")).toBeTruthy();
    expect(screen.getByText("Paso 1 de 5")).toBeTruthy();
    expect(screen.getByText("Abre el grifo")).toBeTruthy();

    // Solo están presentes los botones Pictograma y Audio
    expect(screen.getByTestId("boton-formato-07e-pictograma")).toBeTruthy();
    expect(screen.getByTestId("boton-formato-07e-audio")).toBeTruthy();

    // Texto, Foto y Vídeo están ocultos por permisos de 26d
    expect(screen.queryByTestId("boton-formato-07e-texto")).toBeNull();
    expect(screen.queryByTestId("boton-formato-07e-foto")).toBeNull();
    expect(screen.queryByTestId("boton-formato-07e-video")).toBeNull();

    // Al pulsar Audio reproduce locución del paso
    await fireEvent.press(screen.getByTestId("boton-formato-07e-audio"));
    expect(leer).toHaveBeenCalledWith("Paso 1. Abre el grifo.");
    expect(screen.getByTestId("mensaje-audio-07e")).toBeTruthy();
  });

  it("oculta el botón Preferencias en 07e cuando mostrarBotonPreferencias16 es false y permite recorrer los 5 pasos hasta Terminar tarea", async () => {
    const alTerminar = jest.fn();
    await render(
      <PantallaEjecucionRestringida07e
        formatosPermitidos={["pictograma", "texto", "foto", "video"]}
        mostrarBotonPreferencias16={false}
        alTerminarTarea={alTerminar}
      />,
    );

    // El botón Preferencias (16) está oculto según permisos de 26d
    expect(screen.queryByTestId("boton-preferencias-alumno-07e")).toBeNull();
    expect(screen.getByTestId("preferencias-oculto-por-permiso-07e")).toBeTruthy();

    // Probar cambio de formatos habilitados (Texto, Foto, Vídeo)
    await fireEvent.press(screen.getByTestId("boton-formato-07e-texto"));
    expect(screen.getByTestId("vista-formato-texto-07e")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-formato-07e-foto"));
    expect(screen.getByTestId("vista-formato-foto-07e")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-formato-07e-video"));
    expect(screen.getByTestId("vista-formato-video-07e")).toBeTruthy();

    // Avanzar del Paso 1 al Paso 5
    await fireEvent.press(screen.getByTestId("boton-siguiente-07e"));
    expect(screen.getByText("Paso 2 de 5")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-siguiente-07e"));
    expect(screen.getByText("Paso 3 de 5")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-siguiente-07e"));
    expect(screen.getByText("Paso 4 de 5")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("boton-siguiente-07e"));
    expect(screen.getByText("Paso 5 de 5")).toBeTruthy();

    // En el Paso 5 el botón principal es Terminar tarea
    await fireEvent.press(screen.getByTestId("boton-terminar-tarea-07e"));
    expect(alTerminar).toHaveBeenCalledTimes(1);
  });
});
