import React from "react";
import { Text, View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ProveedorNecesidades, useNecesidades } from "../ProveedorNecesidades";
import { PreferenciasProvider } from "../../preferencias/PreferenciasProvider";
import { TemaProvider } from "../../temas";
import { AYUDAS_POR_DEFECTO } from "../../preferencias/ayudas";
import type { AyudaElegida } from "../tipos";

const [BANO] = AYUDAS_POR_DEFECTO;
const CASA: AyudaElegida = {
  id: "arasaac:6964",
  texto: "Ir a casa",
  imagenUrl: "https://x/6964.png",
  origen: "arasaac",
};
const PROPIA: AyudaElegida = {
  id: "propio:p1",
  texto: "Patio del cole",
  imagenUrl: "https://y/p1.png",
  origen: "biblioteca",
};

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

  it("al pedir una ayuda básica avisa con la ayuda completa y con su clave, y enseña la 14b", async () => {
    const onSolicitarNecesidad = jest.fn();
    const onSolicitarAyuda = jest.fn();
    const user = userEvent.setup();

    await render(
      <ProveedorNecesidades
        onSolicitarNecesidad={onSolicitarNecesidad}
        onSolicitarAyuda={onSolicitarAyuda}
      >
        <ComponenteHijo />
      </ProveedorNecesidades>,
    );

    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    await user.press(screen.getByTestId(`opcion-ayuda-${BANO.id}`));

    expect(onSolicitarAyuda).toHaveBeenCalledWith(BANO);
    expect(onSolicitarNecesidad).toHaveBeenCalledWith("bano");
    expect(screen.getByTestId("ultima-necesidad", oculto)).toHaveTextContent("bano");
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();

    await user.press(screen.getByTestId("btn-cerrar-necesidades"));
    expect(screen.queryByTestId("modal-necesidades-abierto", oculto)).toBeNull();
    // Al volver, la pantalla de debajo sigue ahí y se puede leer otra vez.
    expect(screen.getByText("Pantalla Principal")).toBeTruthy();
  });

  it("una ayuda que no es básica solo llega a onSolicitarAyuda; Urgencia llega a los dos", async () => {
    const onSolicitarNecesidad = jest.fn();
    const onSolicitarAyuda = jest.fn();
    const user = userEvent.setup();

    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ ayudas: [CASA] }}>
          <ProveedorNecesidades
            onSolicitarNecesidad={onSolicitarNecesidad}
            onSolicitarAyuda={onSolicitarAyuda}
          >
            <ComponenteHijo />
          </ProveedorNecesidades>
        </PreferenciasProvider>
      </TemaProvider>,
    );

    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    await user.press(screen.getByTestId(`opcion-ayuda-${CASA.id}`));
    expect(onSolicitarAyuda).toHaveBeenCalledWith(CASA);
    expect(onSolicitarNecesidad).not.toHaveBeenCalled();

    await user.press(screen.getByTestId("btn-cerrar-necesidades"));
    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    await user.press(screen.getByTestId("opcion-necesidad-urgencia"));
    expect(onSolicitarAyuda).toHaveBeenLastCalledWith("urgencia");
    expect(onSolicitarNecesidad).toHaveBeenCalledWith("urgencia");
  });

  it("en «Ayuda» salen las ayudas elegidas en Preferencias (también las de Mi biblioteca)", async () => {
    const user = userEvent.setup();
    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ ayudas: [PROPIA, CASA] }}>
          <ProveedorNecesidades>
            <ComponenteHijo />
          </ProveedorNecesidades>
        </PreferenciasProvider>
      </TemaProvider>,
    );
    await user.press(screen.getByRole("button", { name: /necesito ayuda/i }));
    expect(screen.getByTestId(`opcion-ayuda-${PROPIA.id}`)).toBeTruthy();
    expect(screen.getByTestId(`opcion-ayuda-${CASA.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`opcion-ayuda-${BANO.id}`)).toBeNull();
    expect(screen.getByTestId("opcion-necesidad-urgencia")).toBeTruthy();
  });
});
