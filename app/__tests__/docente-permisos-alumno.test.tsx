// HU-23 · SCRUM-141: desde el panel del tutor, /docente/permisos-alumno deja elegir el alumno
// antes de abrir su 26d; con ?alumnoId= se abre directamente.
import { fireEvent, render, screen } from "@testing-library/react-native";
import PantallaRuta from "../docente/permisos-alumno";
import { obtenerAlumnos } from "../../src/servicios/alumnosService";
import {
  crearPermisosAlumnoPorDefecto,
  obtenerPermisosAlumno26d,
} from "../../src/servicios/permisosAlumnoService";

const mockParams: { alumnoId?: string; nombre?: string } = {};
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
    canGoBack: () => true,
  }),
}));
jest.mock("../../src/sesion", () => ({
  useSesion: () => ({
    sesion: { user: { fullName: "Carmen Ruiz", role: "tutor_docente" } },
    cerrarSesion: jest.fn(),
  }),
}));
jest.mock("../../src/servicios/alumnosService", () => ({ obtenerAlumnos: jest.fn() }));
jest.mock("../../src/servicios/permisosAlumnoService", () => {
  const real = jest.requireActual("../../src/servicios/permisosAlumnoService");
  return { ...real, obtenerPermisosAlumno26d: jest.fn() };
});

const mockAlumnos = obtenerAlumnos as jest.Mock;
const mockPermisos = obtenerPermisosAlumno26d as jest.Mock;

const ELENA = { id: "00000000-0000-0000-0000-000000000003", nombre: "Elena", apellidos: "Morales" };
const LUCAS = { id: "00000000-0000-0000-0000-000000000002", nombre: "Lucas", apellidos: "García" };

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.alumnoId;
  delete mockParams.nombre;
  mockPermisos.mockImplementation(async (id: string, nombre?: string) => ({
    ...crearPermisosAlumnoPorDefecto(id, nombre),
    formatosPermitidos: ["pictograma"],
  }));
});

describe("/docente/permisos-alumno", () => {
  it("sin alumno en la ruta, el tutor lo elige y «Atrás» vuelve a la lista", async () => {
    mockAlumnos.mockResolvedValue({ success: true, data: [ELENA, LUCAS] });
    await render(<PantallaRuta />);

    await screen.findByTestId("pantalla-elegir-alumno-26d");
    await fireEvent.press(screen.getByLabelText("Lucas García: cambiar sus permisos"));

    expect(await screen.findByText("Permisos del alumno · Lucas")).toBeTruthy();
    expect(mockPermisos).toHaveBeenCalledWith(LUCAS.id, "Lucas", { forzarRemoto: true });

    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(await screen.findByTestId("pantalla-elegir-alumno-26d")).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("con un solo alumno abre directamente su 26d", async () => {
    mockAlumnos.mockResolvedValue({ success: true, data: [ELENA] });
    await render(<PantallaRuta />);
    expect(await screen.findByText("Permisos del alumno · Elena")).toBeTruthy();
  });

  it("con ?alumnoId= no pide elegir y «Atrás» vuelve a la pantalla anterior", async () => {
    mockParams.alumnoId = ELENA.id;
    mockParams.nombre = "Elena";
    await render(<PantallaRuta />);
    expect(await screen.findByText("Permisos del alumno · Elena")).toBeTruthy();
    expect(mockAlumnos).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("si no se pueden cargar los alumnos, lo dice", async () => {
    mockAlumnos.mockResolvedValue({ success: false, error: "sin red" });
    await render(<PantallaRuta />);
    expect(
      await screen.findByText("No se han podido cargar tus alumnos. Inténtalo otra vez."),
    ).toBeTruthy();
  });
});
