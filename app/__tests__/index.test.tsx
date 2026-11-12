import { render, screen, userEvent } from "@testing-library/react-native";

import Index from "../index";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

describe("Primera pantalla de la app", () => {
  it("empieza directamente eligiendo la clase, sin pantalla de bienvenida", async () => {
    await render(<Index />);
    expect(screen.getByText("¿Cuál es tu clase?")).toBeTruthy();
    expect(screen.getByTestId("tarjeta-clase-tri")).toBeTruthy();
  });

  it("los adultos entran desde la misma pantalla", async () => {
    const user = userEvent.setup();
    await render(<Index />);
    await user.press(screen.getByTestId("btn-acceso-supervisores"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("en la primera pantalla «Atrás» está desactivado", async () => {
    await render(<Index />);
    expect(screen.getByTestId("btn-barra-atras")).toBeDisabled();
  });
});
