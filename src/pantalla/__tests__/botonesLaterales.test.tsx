import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Pantalla } from "..";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
}));

// «Ayuda» y «Accesibilidad» solo se pintan si existen sus proveedores: aquí los damos por hechos.
jest.mock("../../necesidades/ProveedorNecesidades", () => ({
  useNecesidadesOpcional: () => ({ abrirModalNecesidades: jest.fn(), varianteBoton: "A" }),
}));
jest.mock("../../necesidades/BotonNecesidades", () => {
  const { Text: T } = jest.requireActual("react-native");
  return { BotonNecesidades: () => <T testID="btn-necesidades">Ayuda</T> };
});
jest.mock("../../preferencias/PreferenciasProvider", () => ({
  usePreferenciasOpcional: () => ({
    preferencias: { canal: "ambos", caja: "normal" },
    estilos: { fuenteNormal: "System", fuenteNegrita: "System" },
  }),
}));
jest.mock("../../preferencias/PantallaVistaAccesible", () => ({
  PantallaVistaAccesible: () => null,
}));

describe("Pantalla - botones «Ayuda» y «Preferencias» de los lados (sin SesionProvider)", () => {
  it("por defecto salen los dos", async () => {
    await render(
      <Pantalla titulo="Mi agenda">
        <Text>contenido</Text>
      </Pantalla>,
    );
    expect(screen.getByTestId("btn-necesidades")).toBeTruthy();
    expect(screen.getByTestId("btn-barra-preferencias")).toBeTruthy();
  });

  it("con sinAyuda y sinAccesibilidad (administración) no sale ninguno", async () => {
    await render(
      <Pantalla titulo="Panel" sinAyuda sinAccesibilidad>
        <Text>contenido</Text>
      </Pantalla>,
    );
    expect(screen.queryByTestId("btn-necesidades")).toBeNull();
    expect(screen.queryByTestId("btn-barra-preferencias")).toBeNull();
    expect(screen.getByText("contenido")).toBeTruthy();
  });

  it("con solo sinAccesibilidad se quita Preferencias y se queda Ayuda", async () => {
    await render(
      <Pantalla titulo="Otra" sinAccesibilidad>
        <Text>contenido</Text>
      </Pantalla>,
    );
    expect(screen.getByTestId("btn-necesidades")).toBeTruthy();
    expect(screen.queryByTestId("btn-barra-preferencias")).toBeNull();
  });
});
