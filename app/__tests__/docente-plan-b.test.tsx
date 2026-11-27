// HU-22 · SCRUM-139: desde el panel del tutor, /docente/plan-b deja elegir entre el Plan B del día
// de la clase (47c) y el de un alumno (47b).
import { fireEvent, render, screen } from "@testing-library/react-native";
import PantallaRuta from "../docente/plan-b";
import { obtenerAlumnos } from "../../src/servicios/alumnosService";

const mockParams: { alumno?: string; alcance?: string } = {};
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));
jest.mock("../../src/sesion", () => ({
  useSesion: () => ({
    sesion: { user: { fullName: "Carmen Ruiz", role: "tutor_docente" } },
    cerrarSesion: jest.fn(),
  }),
}));
jest.mock("../../src/servicios/alumnosService", () => ({ obtenerAlumnos: jest.fn() }));
jest.mock("../../src/servicios/planBService", () => ({
  repositorioPlanBSupabase: {
    cargar: jest.fn().mockResolvedValue({ filas: [], biblioteca: [] }),
    vincular: jest.fn(),
    activar: jest.fn(),
  },
}));

const mockAlumnos = obtenerAlumnos as jest.Mock;
const LUCAS = { id: "00000000-0000-0000-0000-000000000002", nombre: "Lucas", apellidos: "García" };

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.alumno;
  delete mockParams.alcance;
  mockAlumnos.mockResolvedValue({ success: true, data: [LUCAS] });
});

describe("/docente/plan-b", () => {
  it("sin parámetros deja elegir entre el del día y el de un alumno", async () => {
    await render(<PantallaRuta />);

    await fireEvent.press(await screen.findByTestId("elegir-plan-b-dia"));
    expect(mockPush).toHaveBeenCalledWith("/docente/plan-b?alcance=dia");
    await fireEvent.press(screen.getByTestId("elegir-plan-b-alumno"));
    expect(mockPush).toHaveBeenCalledWith("/docente/plan-b?alumno=elegir");
  });

  it("con ?alcance=dia abre la 47c de la clase", async () => {
    mockParams.alcance = "dia";
    await render(<PantallaRuta />);
    expect(await screen.findByText("Plan B general de la clase")).toBeTruthy();
  });

  it("con ?alumno=elegir pide el alumno y abre su 47b", async () => {
    mockParams.alumno = "elegir";
    await render(<PantallaRuta />);

    await fireEvent.press(await screen.findByLabelText("Lucas García: cambiar su Plan B"));
    expect(await screen.findByText("Plan B de Lucas")).toBeTruthy();
  });
});
