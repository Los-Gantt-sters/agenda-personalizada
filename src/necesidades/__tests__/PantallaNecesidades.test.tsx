import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";

import { AYUDAS_POR_DEFECTO } from "../../preferencias/ayudas";
import { PantallaNecesidades } from "../PantallaNecesidades";
import type { AyudaElegida } from "../tipos";

jest.setTimeout(15000);

// MOD HU-18 (SCRUM-268): la 14 enseña las 1-3 ayudas que eligió el adulto en la 26 y «Urgencia»
// siempre; la 14b solo «Solicitud enviada» (bocetos 14.png y 14b.png de definitiva_v2).
const [BANO, AGUA, DESCANSO] = AYUDAS_POR_DEFECTO;
const PROPIA: AyudaElegida = {
  id: "propio:p1",
  texto: "Patio del cole",
  imagenUrl: "https://y/p1.png",
  origen: "biblioteca",
};
const CASA: AyudaElegida = {
  id: "arasaac:6964",
  texto: "Ir a casa",
  imagenUrl: "https://x/6964.png",
  origen: "arasaac",
};

function montar(props: Partial<React.ComponentProps<typeof PantallaNecesidades>> = {}) {
  return render(
    <PantallaNecesidades
      visible
      ayudas={[BANO, AGUA, DESCANSO]}
      alSolicitar={jest.fn()}
      alCerrar={jest.fn()}
      {...props}
    />,
  );
}

describe("Pantalla 14 «¿Qué necesitas?» (MOD HU-18)", () => {
  it("pinta las ayudas guardadas en su orden y Urgencia siempre", async () => {
    await montar({ ayudas: [PROPIA, CASA] });
    expect(screen.getByTestId("titulo-necesidades")).toHaveTextContent("¿Qué necesitas?");
    const tarjetas = screen.getAllByTestId(/^opcion-ayuda-/);
    expect(tarjetas.map((t) => t.props.testID)).toEqual([
      "opcion-ayuda-propio:p1",
      "opcion-ayuda-arasaac:6964",
    ]);
    expect(screen.getByText("Patio del cole")).toBeTruthy();
    expect(screen.getByText("Ir a casa")).toBeTruthy();
    expect(screen.getByTestId("opcion-necesidad-urgencia")).toHaveTextContent(/Urgencia/);
  });

  it("baño, agua y descanso llevan los textos del boceto 14", async () => {
    await montar();
    expect(screen.getByText("Quiero ir al baño")).toBeTruthy();
    expect(screen.getByText("Quiero agua")).toBeTruthy();
    expect(screen.getByText("Necesito descansar")).toBeTruthy();
  });

  it("cada ayuda lleva su imagen guardada y las tarjetas son gigantes", async () => {
    await montar({ ayudas: [PROPIA] });
    expect(screen.getByTestId("img-ayuda-propio:p1").props.source).toEqual({
      uri: "https://y/p1.png",
    });
    const boton = screen.getByTestId("opcion-ayuda-propio:p1");
    const estilo = Array.isArray(boton.props.style)
      ? Object.assign({}, ...boton.props.style)
      : boton.props.style;
    expect(estilo.minWidth).toBeGreaterThanOrEqual(120);
    expect(estilo.minHeight).toBeGreaterThanOrEqual(120);
  });

  it("con canal soloTexto no hay imágenes y con soloPictograma no hay textos (pero sí etiqueta accesible)", async () => {
    const vista = await montar({ ayudas: [PROPIA], canal: "soloTexto" });
    expect(screen.queryByTestId("img-ayuda-propio:p1")).toBeNull();
    expect(screen.getByText("Patio del cole")).toBeTruthy();
    await vista.unmount();

    await montar({ ayudas: [PROPIA], canal: "soloPictograma" });
    expect(screen.queryByText("Patio del cole")).toBeNull();
    expect(screen.getByTestId("opcion-ayuda-propio:p1").props.accessibilityLabel).toBe(
      "Patio del cole",
    );
  });

  it("pulsar una ayuda la envía completa; Urgencia envía 'urgencia'", async () => {
    const user = userEvent.setup();
    const alSolicitar = jest.fn();
    await montar({ ayudas: [PROPIA, BANO], alSolicitar });
    await user.press(screen.getByTestId("opcion-ayuda-propio:p1"));
    await user.press(screen.getByTestId("opcion-necesidad-urgencia"));
    expect(alSolicitar).toHaveBeenNthCalledWith(1, PROPIA);
    expect(alSolicitar).toHaveBeenNthCalledWith(2, "urgencia");
  });

  it("«Atrás» vuelve sin avisar a nadie", async () => {
    const user = userEvent.setup();
    const alCerrar = jest.fn();
    const alSolicitar = jest.fn();
    await montar({ alCerrar, alSolicitar });
    await user.press(screen.getByTestId("btn-cerrar-necesidades"));
    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(alSolicitar).not.toHaveBeenCalled();
  });

  it("es una pantalla completa, sin ventana ni scroll y sin otro botón de Ayuda dentro", async () => {
    await montar();
    expect(screen.queryByTestId("btn-necesidades")).toBeNull();
    const arbol = JSON.stringify(screen.toJSON());
    expect(arbol).not.toContain("RCTScrollView");
    expect(arbol).not.toContain("RCTModalHostView");
  });

  it("sin abrir no pinta nada", async () => {
    await montar({ visible: false });
    expect(screen.queryByTestId("pantalla-necesidades")).toBeNull();
  });
});

describe("Pantalla 14b «Aviso enviado» (MOD HU-18)", () => {
  it("solo enseña el tick y «Solicitud enviada», sin el nombre de la ayuda ni del tutor", async () => {
    await montar({ ayudas: [PROPIA], solicitudEnviada: PROPIA, nombreTutora: "Carmen" });
    expect(screen.getByTestId("titulo-necesidades")).toHaveTextContent("Aviso enviado");
    expect(screen.getByTestId("tick-solicitud-enviada")).toBeTruthy();
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();
    expect(screen.queryByText("Patio del cole")).toBeNull();
    expect(screen.queryByText(/Carmen/)).toBeNull();
    expect(screen.queryByTestId(/^opcion-/)).toBeNull();
  });

  it("también tras una Urgencia", async () => {
    await montar({ solicitudEnviada: "urgencia" });
    expect(screen.getByText("Solicitud enviada")).toBeTruthy();
    expect(screen.queryByTestId("opcion-necesidad-urgencia")).toBeNull();
  });

  it("«Atrás» cierra y «Adelante» está desactivado", async () => {
    const user = userEvent.setup();
    const alCerrar = jest.fn();
    await montar({ solicitudEnviada: BANO, alCerrar });
    expect(screen.getByTestId("btn-vale-confirmacion").props.accessibilityState).toMatchObject({
      disabled: true,
    });
    await user.press(screen.getByTestId("btn-cerrar-necesidades"));
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });
});
