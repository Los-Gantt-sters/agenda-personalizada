import React from "react";
import { Text, View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ProveedorNecesidades, useNecesidades } from "../ProveedorNecesidades";
import { PreferenciasProvider } from "../../preferencias/PreferenciasProvider";
import { TemaProvider } from "../../temas";

// Con «¿Qué necesitas?» encima, lo de debajo queda oculto al lector de pantalla: las marcas de
// prueba de la pantalla de debajo se leen incluyendo lo oculto.
const oculto = { includeHiddenElements: true } as const;

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
    expect(screen.getByTestId("modal-necesidades-abierto", oculto)).toBeTruthy();
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
    expect(screen.getByTestId("ultima-necesidad", oculto)).toHaveTextContent("bano");
    expect(screen.getByText(/Carmen ya lo sabe/)).toBeTruthy();

    await user.press(screen.getByTestId("btn-vale-confirmacion"));
    expect(screen.queryByTestId("modal-necesidades-abierto", oculto)).toBeNull();
    // Al volver, la pantalla de debajo sigue ahí y se puede leer otra vez.
    expect(screen.getByText("Pantalla Principal")).toBeTruthy();
  });

  it("profesora: en «Ayuda» salen solo las necesidades elegidas en Preferencias", async () => {
    const user = userEvent.setup();
    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ necesidades: ["bano", "descanso"] }}>
          <ProveedorNecesidades>
            <ComponenteHijo />
          </ProveedorNecesidades>
        </PreferenciasProvider>
      </TemaProvider>,
    );
    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    expect(screen.getByTestId("opcion-necesidad-bano")).toBeTruthy();
    expect(screen.getByTestId("opcion-necesidad-descanso")).toBeTruthy();
    expect(screen.queryByTestId("opcion-necesidad-agua")).toBeNull();
    expect(screen.getByTestId("opcion-necesidad-urgencia")).toBeTruthy();
  });
});
