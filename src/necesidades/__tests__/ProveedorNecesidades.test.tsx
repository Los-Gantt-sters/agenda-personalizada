import React from "react";
import { Text, View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ProveedorNecesidades, useNecesidades } from "../ProveedorNecesidades";

const ComponenteHijo = () => {
  const { modalAbierto } = useNecesidades();
  return (
    <View>
      <Text>Pantalla Principal</Text>
      {modalAbierto && <Text testID="modal-necesidades-abierto">Modal Abierto</Text>}
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

  it("notifica al pulsar el botón de necesidades flotante", async () => {
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
  });
});
