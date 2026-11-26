// SCRUM-250 · T-06.5 (MOD HU-06): la agenda del día (06) tal como queda en los bocetos definitivos.
// Lo implementan otras tareas, y aquí se comprueba que la 06 lo junta todo:
// - «Ver semana» (→ 06b): MOD HU-17, SCRUM-125 (#110).
// - «Mostrar pasos» (→ 07f) junto a «Empezar»: HU-10, SCRUM-95 (#106).
// - Tareas auto-pendientes en ámbar (→ 10b): SCRUM-264 y SCRUM-266.
import { fireEvent, render, screen, within } from "@testing-library/react-native";

import PantallaAgenda from "../agenda";
import {
  AgendaDelDia,
  ESTUDIANTE_DEMO,
  agendaDemoPendiente,
  crearRepositorioMemoria,
  hoyISO,
} from "../../src/componentes/agenda";

jest.setTimeout(20_000);

jest.mock("../../src/servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));

let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

describe("SCRUM-250: agenda del día (06) definitiva", () => {
  afterEach(() => {
    mockParams = {};
  });

  it("un único botón «Ver semana» arriba a la derecha lleva a la 06b, sin pestañas", async () => {
    mockParams = { vista: "semanal" };
    await render(<PantallaAgenda />);
    await screen.findByTestId("dias-semana");
    await fireEvent.press(screen.getByRole("button", { name: "Ver hoy" }));
    await screen.findByTestId("bloque-ahora");

    expect(screen.getAllByRole("button", { name: "Ver semana" })).toHaveLength(1);
    expect(screen.queryByRole("tab")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Ver semana" }));
    expect(await screen.findByTestId("pantalla-06b-semana")).toBeTruthy();
  });

  it("en «Ahora», «Mostrar pasos» junto a «Empezar» abre todos los pasos (07f)", async () => {
    await render(<PantallaAgenda />);
    const ahora = await screen.findByTestId("bloque-ahora");
    expect(within(ahora).getByRole("button", { name: "Empezar" })).toBeTruthy();

    await fireEvent.press(within(ahora).getByTestId("btn-mostrar-pasos"));

    expect(await screen.findByTestId("pantalla-07f-todos-pasos")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Empezar tarea" })).toBeTruthy();
  });

  it("una tarea auto-pendiente sale en ámbar en «Hecho» y abre la 10b", async () => {
    const { repo } = crearRepositorioMemoria(agendaDemoPendiente(hoyISO(), "tiempo_agotado"));
    await render(<AgendaDelDia repo={repo} estudianteId={ESTUDIANTE_DEMO} />);
    const tarjeta = await screen.findByTestId("mini-e2");

    expect(within(screen.getByTestId("bloque-hecho")).getByTestId("mini-e2")).toBeTruthy();
    expect(within(tarjeta).getByText(/Pendiente \(tiempo agotado\)$/)).toBeTruthy();

    await fireEvent.press(tarjeta);
    expect(await screen.findByTestId("pantalla-tarea-pendiente")).toBeTruthy();
  });
});
