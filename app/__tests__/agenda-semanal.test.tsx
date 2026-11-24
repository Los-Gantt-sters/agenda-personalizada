import { fireEvent, render, screen } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";
import { PreferenciasProvider } from "../../src/preferencias";
import { TemaProvider } from "../../src/temas";

// La primera prueba compila el reloj (SVG) y la agenda: sin caché de Jest (CI) tarda más de 5 s.
jest.setTimeout(20_000);

jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const etiqueta = (id: string) => screen.getByTestId(id).props.accessibilityLabel;

describe("Agenda semanal desde la ruta /agenda (MOD HU-17: SCRUM-124 y SCRUM-125)", () => {
  afterEach(() => {
    mockParams = {};
  });

  it("criterio de aceptación: con vista=semanal entra a la 06b y «Adelante» abre la 06 de hoy", async () => {
    mockParams = { vista: "semanal" };
    await render(<PantallaAgenda />);

    expect(await screen.findByTestId("pantalla-06b-semana")).toBeTruthy();
    expect(await screen.findByTestId("dias-semana")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(await screen.findByTestId("bloque-ahora")).toBeTruthy();
    expect(etiqueta("bloque-ahora")).toBe("Ahora: Lavarse las manos");
  });

  it("«Ver hoy» abre la 06 y en la 06 un único botón «Ver semana» vuelve a la 06b", async () => {
    mockParams = { vista: "semanal" };
    await render(<PantallaAgenda />);
    await screen.findByTestId("dias-semana");

    await fireEvent.press(screen.getByRole("button", { name: "Ver hoy" }));
    await screen.findByTestId("bloque-ahora");
    // Sin pestañas Hoy | Semana: un solo botón.
    expect(screen.queryByRole("tab")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Ver semana" }));
    expect(await screen.findByTestId("pantalla-06b-semana")).toBeTruthy();
  });

  it("al tocar otro día se ve su agenda, pero solo para mirar (se empiezan las de hoy)", async () => {
    mockParams = { vista: "semanal" };
    await render(<PantallaAgenda />);
    await screen.findByTestId("dias-semana");
    const otro = screen
      .getAllByRole("button")
      .find((b) => /^tarjeta-dia-/.test(b.props.testID) && !/hoy/.test(b.props.accessibilityLabel));

    await fireEvent.press(otro!);

    await screen.findByTestId("bloque-hecho");
    // Ni «Empezar» ni «Terminar»: es otro día.
    expect(screen.queryByRole("button", { name: "Empezar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Terminar" })).toBeNull();
    // Y se puede volver a la semana.
    expect(screen.getByRole("button", { name: "Ver semana" })).toBeTruthy();
  });

  it("con la preferencia «Semana completa» también entra por la semana", async () => {
    await render(
      <TemaProvider>
        <PreferenciasProvider preferenciasIniciales={{ vistaAgenda: "semanal" }}>
          <PantallaAgenda />
        </PreferenciasProvider>
      </TemaProvider>,
    );
    expect(await screen.findByTestId("pantalla-06b-semana")).toBeTruthy();
  });

  it("con «Ir directo a Hoy» (o sin indicar) entra a la 06 y no hay «Ver semana»", async () => {
    await render(<PantallaAgenda />);
    await screen.findByTestId("bloque-ahora");
    expect(screen.queryByTestId("pantalla-06b-semana")).toBeNull();
    expect(screen.queryByRole("button", { name: "Ver semana" })).toBeNull();
  });
});
