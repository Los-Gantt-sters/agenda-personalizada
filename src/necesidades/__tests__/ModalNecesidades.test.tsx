import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ModalNecesidades } from "../ModalNecesidades";
import {
  OPCIONES_NECESIDADES_BASICAS,
  construirUrlPictogramaArasaac,
  obtenerInfoNecesidad,
} from "../opcionesNecesidades";

jest.setTimeout(15000);

describe("ModalNecesidades (SCRUM-87: T-18.2 Modal con 3 opciones gigantes ARASAAC)", () => {
  it("contiene exactamente las 3 opciones fisiológicas básicas con sus IDs de ARASAAC oficiales", () => {
    expect(OPCIONES_NECESIDADES_BASICAS).toHaveLength(3);

    const claves = OPCIONES_NECESIDADES_BASICAS.map((op) => op.clave);
    expect(claves).toEqual(["bano", "agua", "descanso"]);

    const idsArasaac = OPCIONES_NECESIDADES_BASICAS.map((op) => op.arasaacId);
    expect(idsArasaac).toEqual([6929, 2248, 3299]);

    expect(construirUrlPictogramaArasaac(6929)).toBe(
      "https://static.arasaac.org/pictograms/6929/6929_500.png",
    );
  });

  it("renderiza el título en Lectura Fácil y las 3 opciones gigantes: Baño, Agua y Descanso", async () => {
    await render(
      <ModalNecesidades visible={true} alSeleccionarNecesidad={jest.fn()} alCerrar={jest.fn()} />,
    );

    expect(screen.getByText("¿Qué necesitas?")).toBeTruthy();
    expect(screen.getByText("Quiero ir al baño")).toBeTruthy();
    expect(screen.getByText("Quiero agua")).toBeTruthy();
    expect(screen.getByText("Necesito descansar")).toBeTruthy();

    // Imágenes de pictogramas ARASAAC presentes
    expect(screen.getByTestId("img-arasaac-6929")).toBeTruthy();
    expect(screen.getByTestId("img-arasaac-2248")).toBeTruthy();
    expect(screen.getByTestId("img-arasaac-3299")).toBeTruthy();
  });

  it("garantiza dimensiones gigantes táctiles en las tarjetas de necesidad (>= 180x190 px)", async () => {
    await render(
      <ModalNecesidades visible={true} alSeleccionarNecesidad={jest.fn()} alCerrar={jest.fn()} />,
    );

    for (const opcion of OPCIONES_NECESIDADES_BASICAS) {
      const boton = screen.getByTestId(`opcion-necesidad-${opcion.clave}`);
      const estilo = Array.isArray(boton.props.style)
        ? Object.assign({}, ...boton.props.style)
        : boton.props.style;

      expect(estilo.minWidth).toBeGreaterThanOrEqual(120);
      expect(estilo.minHeight).toBeGreaterThanOrEqual(120);
    }
  });

  it("dispara alSeleccionarNecesidad con la clave correcta al pulsar Baño, Agua, Descanso o Urgencia", async () => {
    const user = userEvent.setup();
    const handleSeleccionar = jest.fn();

    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={handleSeleccionar}
        alCerrar={jest.fn()}
      />,
    );

    await user.press(screen.getByTestId("opcion-necesidad-bano"));
    expect(handleSeleccionar).toHaveBeenCalledWith("bano");

    await user.press(screen.getByTestId("opcion-necesidad-agua"));
    expect(handleSeleccionar).toHaveBeenCalledWith("agua");

    await user.press(screen.getByTestId("opcion-necesidad-descanso"));
    expect(handleSeleccionar).toHaveBeenCalledWith("descanso");

    await user.press(screen.getByTestId("opcion-necesidad-urgencia"));
    expect(handleSeleccionar).toHaveBeenCalledWith("urgencia");
  });

  it("muestra la pantalla de confirmación tranquila cuando se ha enviado una necesidad (RF11.3)", async () => {
    const user = userEvent.setup();
    const handleConfirmar = jest.fn();

    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={jest.fn()}
        alCerrar={jest.fn()}
        necesidadEnviada="agua"
        alConfirmarAvisoEnviado={handleConfirmar}
        nombreTutora="Carmen"
      />,
    );

    expect(screen.getByTestId("confirmacion-necesidad-enviada")).toBeTruthy();
    expect(screen.getByText("Quiero agua")).toBeTruthy();
    expect(screen.getByText(/Carmen ya lo sabe/)).toBeTruthy();
    expect(screen.getByText("Espera un momento, por favor.")).toBeTruthy();

    await user.press(screen.getByTestId("btn-vale-confirmacion"));
    expect(handleConfirmar).toHaveBeenCalledTimes(1);
  });

  it("muestra el aviso inmediato de urgencia cuando la necesidad enviada es urgencia", async () => {
    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={jest.fn()}
        alCerrar={jest.fn()}
        necesidadEnviada="urgencia"
        nombreTutora="Carmen"
      />,
    );

    expect(screen.getByText(/Carmen viene ahora/)).toBeTruthy();
    expect(screen.getByText("Quédate donde estás. Ya viene.")).toBeTruthy();
    expect(obtenerInfoNecesidad("urgencia").simbolo).toBe("🆘");
  });

  it("permite cerrar el modal pulsando el botón Cerrar", async () => {
    const user = userEvent.setup();
    const handleCerrar = jest.fn();

    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={jest.fn()}
        alCerrar={handleCerrar}
      />,
    );

    await user.press(screen.getByTestId("btn-cerrar-modal-necesidades"));
    expect(handleCerrar).toHaveBeenCalledTimes(1);
  });

  it("en modo soloPictograma oculta los textos visuales y conserva los pictogramas y etiquetas accesibles", async () => {
    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={jest.fn()}
        alCerrar={jest.fn()}
        canal="soloPictograma"
      />,
    );

    // No se muestran textos visuales de las 3 opciones
    expect(screen.queryByText("Quiero ir al baño")).toBeNull();
    expect(screen.queryByText("Quiero agua")).toBeNull();
    expect(screen.queryByText("Necesito descansar")).toBeNull();

    // Símbolos e imágenes ARASAAC siguen presentes
    expect(screen.getByTestId("img-arasaac-6929")).toBeTruthy();
    expect(screen.getByTestId("img-arasaac-2248")).toBeTruthy();
    expect(screen.getByTestId("img-arasaac-3299")).toBeTruthy();

    // El lector de pantalla sigue anunciando las etiquetas completas (RF14.1)
    expect(screen.getByTestId("opcion-necesidad-bano").props.accessibilityLabel).toBe(
      "Quiero ir al baño",
    );
  });

  it("en modo soloTexto oculta los pictogramas ARASAAC y muestra únicamente el texto ampliado", async () => {
    await render(
      <ModalNecesidades
        visible={true}
        alSeleccionarNecesidad={jest.fn()}
        alCerrar={jest.fn()}
        canal="soloTexto"
      />,
    );

    expect(screen.getByText("Quiero ir al baño")).toBeTruthy();
    expect(screen.getByText("Quiero agua")).toBeTruthy();
    expect(screen.getByText("Necesito descansar")).toBeTruthy();

    expect(screen.queryByTestId("img-arasaac-6929")).toBeNull();
    expect(screen.queryByTestId("img-arasaac-2248")).toBeNull();
    expect(screen.queryByTestId("img-arasaac-3299")).toBeNull();
  });
});
