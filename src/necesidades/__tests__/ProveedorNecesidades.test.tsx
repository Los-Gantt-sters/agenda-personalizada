import React from "react";
import { Text, View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ProveedorNecesidades, useNecesidades } from "../ProveedorNecesidades";

const ComponenteHijo = () => {
  const { modalAbierto, ultimaNecesidadSolicitada } = useNecesidades();
  return (
    <View>
      <Text>Pantalla Principal</Text>
      {modalAbierto && <Text testID="modal-necesidades-abierto">Modal Abierto</Text>}
      {ultimaNecesidadSolicitada && (
        <Text testID="ultima-necesidad">{ultimaNecesidadSolicitada}</Text>
      )}
    </View>
  );
};

describe("ProveedorNecesidades", () => {
  it("renderiza el contenido hijo y el botón flotante fijado", async () => {
    await render(
      <ProveedorNecesidades>
        <ComponenteHijo />
      </ProveedorNecesidades>,
    );

    expect(screen.getByText("Pantalla Principal")).toBeTruthy();
    expect(screen.getByRole("button", { name: /necesito ayuda/i })).toBeTruthy();
  });

  it("permite ocultar el botón fijado si se desactiva explícitamente", async () => {
    await render(
      <ProveedorNecesidades inicialmenteVisible={false}>
        <ComponenteHijo />
      </ProveedorNecesidades>,
    );

    expect(screen.getByText("Pantalla Principal")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /necesito ayuda/i })).toBeNull();
  });

  it("notifica al pulsar el botón de necesidades flotante y abre el modal con las 3 opciones", async () => {
    const handlePulsar = jest.fn();
    const user = userEvent.setup();

    await render(
      <ProveedorNecesidades onPulsarNecesidades={handlePulsar}>
        <ComponenteHijo />
      </ProveedorNecesidades>,
    );

    const boton = screen.getByRole("button", { name: /necesito ayuda/i });
    await user.press(boton);

    expect(handlePulsar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("modal-necesidades-abierto")).toBeTruthy();
    expect(screen.getByText("¿Qué necesitas?")).toBeTruthy();
    expect(screen.getByText("Quiero ir al baño")).toBeTruthy();
    expect(screen.getByText("Quiero agua")).toBeTruthy();
    expect(screen.getByText("Necesito descansar")).toBeTruthy();
  });

  it("permite seleccionar una necesidad básica, ver la confirmación y cerrar el modal", async () => {
    const handleSolicitar = jest.fn();
    const user = userEvent.setup();

    await render(
      <ProveedorNecesidades onSolicitarNecesidad={handleSolicitar} nombreTutora="Carmen">
        <ComponenteHijo />
      </ProveedorNecesidades>,
    );

    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    await user.press(screen.getByTestId("opcion-necesidad-bano"));

    expect(handleSolicitar).toHaveBeenCalledWith("bano");
    expect(screen.getByTestId("ultima-necesidad")).toHaveTextContent("bano");
    expect(screen.getByText(/Carmen ya lo sabe/)).toBeTruthy();

    await user.press(screen.getByTestId("btn-vale-confirmacion"));
    expect(screen.queryByTestId("modal-necesidades-abierto")).toBeNull();
  });
});
