import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { BotonNecesidades, getEstiloPosicion } from "../BotonNecesidades";

describe("BotonNecesidades (SCRUM-86: T-18.1 Botón flotante accesible fijado)", () => {
  it("renderiza el botón con el pictograma de ayuda y el texto", async () => {
    const handlePress = jest.fn();
    await render(<BotonNecesidades onPress={handlePress} />);

    expect(screen.getByLabelText("Dibujo de ayuda", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("Ayuda")).toBeTruthy();

    const boton = screen.getByRole("button");
    expect(boton.props.accessibilityLabel).toBe("Necesito ayuda o pedir necesidades básicas");
  });

  it("garantiza dimensiones mínimas táctiles accesibles (>= 48x48 px, estándar 84px)", async () => {
    await render(<BotonNecesidades onPress={jest.fn()} tamanio={84} />);

    const boton = screen.getByRole("button");
    const estilosAplanados = Array.isArray(boton.props.style)
      ? Object.assign({}, ...boton.props.style)
      : boton.props.style;

    expect(estilosAplanados.width).toBeGreaterThanOrEqual(48);
    expect(estilosAplanados.height).toBeGreaterThanOrEqual(48);
    expect(estilosAplanados.position).toBe("absolute");
  });

  it("se posiciona por defecto en la esquina inferior izquierda (RNF11.3)", async () => {
    await render(<BotonNecesidades onPress={jest.fn()} posicion="inferior-izquierda" />);

    const boton = screen.getByRole("button");
    const estilosAplanados = Array.isArray(boton.props.style)
      ? Object.assign({}, ...boton.props.style)
      : boton.props.style;

    expect(estilosAplanados.bottom).toBe(16);
    expect(estilosAplanados.left).toBe(16);
  });

  it("calcula correctamente otras posiciones relativas fijas si se configuran", () => {
    expect(getEstiloPosicion("inferior-izquierda")).toEqual({
      bottom: 16,
      left: 16,
    });
    expect(getEstiloPosicion("inferior-derecha")).toEqual({
      bottom: 16,
      right: 16,
    });
    expect(getEstiloPosicion("superior-izquierda")).toEqual({
      top: 16,
      left: 16,
    });
    expect(getEstiloPosicion("superior-derecha")).toEqual({
      top: 16,
      right: 16,
    });
  });

  it("llama al callback onPress al ser pulsado", async () => {
    const user = userEvent.setup();
    const handlePress = jest.fn();
    await render(<BotonNecesidades onPress={handlePress} />);

    await user.press(screen.getByRole("button"));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it("aplica colores de alto contraste cuando la variante es alto-contraste", async () => {
    await render(<BotonNecesidades onPress={jest.fn()} variante="alto-contraste" />);

    const boton = screen.getByRole("button");
    const estilosAplanados = Array.isArray(boton.props.style)
      ? Object.assign({}, ...boton.props.style)
      : boton.props.style;

    expect(estilosAplanados.backgroundColor).toBe("#FF5A5A");
  });

  it("adapta su contenido según el canal visual (soloPictograma vs soloTexto)", async () => {
    const { rerender } = await render(
      <BotonNecesidades onPress={jest.fn()} canal="soloPictograma" />,
    );

    expect(screen.getByLabelText("Dibujo de ayuda", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("Ayuda")).toBeNull();

    await rerender(<BotonNecesidades onPress={jest.fn()} canal="soloTexto" />);
    expect(screen.queryByLabelText("Dibujo de ayuda", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByText("Ayuda")).toBeTruthy();
  });
});
