// HU-15 · SCRUM-115 (T-15.3): generador imprimible de códigos QR de los sitios del centro.
import { render, screen, userEvent } from "@testing-library/react-native";

import CodigosQR from "../admin/codigos-qr";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

async function anadir(user: ReturnType<typeof userEvent.setup>, nombre: string, enlace: string) {
  await user.clear(screen.getByTestId("campo-nombre-sitio"));
  await user.type(screen.getByTestId("campo-nombre-sitio"), nombre);
  await user.clear(screen.getByTestId("campo-enlace-sitio"));
  await user.type(screen.getByTestId("campo-enlace-sitio"), enlace);
  await user.press(screen.getByTestId("btn-anadir-codigo"));
}

describe("Administración · Códigos QR de la visita", () => {
  it("al principio no hay códigos", async () => {
    await render(<CodigosQR />);
    expect(screen.getByText("Todavía no hay códigos. Añade el primero.")).toBeTruthy();
    expect(screen.queryByTestId("btn-imprimir-codigos")).toBeNull();
  });

  it("añade un código con su nombre y su enlace, y limpia el formulario", async () => {
    const user = userEvent.setup();
    await render(<CodigosQR />);

    await anadir(user, "Biblioteca", "https://centro.es/biblioteca");

    const tarjeta = screen.getByTestId("codigo-qr-1");
    expect(tarjeta).toHaveTextContent(/Biblioteca/);
    expect(tarjeta).toHaveTextContent(/https:\/\/centro\.es\/biblioteca/);
    expect(screen.getByTestId("campo-nombre-sitio").props.value).toBe("");
    expect(screen.getByTestId("campo-enlace-sitio").props.value).toBe("");
  });

  it("no deja añadir un código que la visita no dejaría abrir", async () => {
    const user = userEvent.setup();
    await render(<CodigosQR />);

    await anadir(user, "Huerto", "http://centro.es/huerto");
    expect(screen.getByTestId("error-codigo")).toHaveTextContent(
      "Solo se admiten enlaces seguros (https://).",
    );

    await anadir(user, "Huerto", "javascript:alert(1)");
    expect(screen.getByTestId("error-codigo")).toHaveTextContent(
      "Solo se admiten enlaces seguros (https://).",
    );
    expect(screen.queryByTestId("codigo-qr-1")).toBeNull();
  });

  it("pide el nombre del sitio", async () => {
    const user = userEvent.setup();
    await render(<CodigosQR />);

    await user.type(screen.getByTestId("campo-enlace-sitio"), "https://centro.es");
    await user.press(screen.getByTestId("btn-anadir-codigo"));
    expect(screen.getByTestId("error-codigo")).toHaveTextContent("Escribe el nombre del sitio.");
  });

  it("se puede quitar un código", async () => {
    const user = userEvent.setup();
    await render(<CodigosQR />);

    await anadir(user, "Biblioteca", "https://centro.es/biblioteca");
    await anadir(user, "Cocina", "https://centro.es/cocina");
    await user.press(screen.getByLabelText("Quitar el código de Biblioteca"));

    expect(screen.queryByTestId("codigo-qr-1")).toBeNull();
    expect(screen.getByTestId("codigo-qr-2")).toHaveTextContent(/Cocina/);
  });
});
