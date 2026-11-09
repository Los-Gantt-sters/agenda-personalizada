import { render, screen, userEvent, waitFor, within } from "@testing-library/react-native";

import ConsolaVinculos from "../admin/vinculos";
import {
  asignarSupervisor,
  listarAlumnosConVinculos,
  listarSupervisores,
  type AlumnoConVinculos,
} from "../../src/servicios/vinculosService";

jest.mock("../../src/servicios/vinculosService", () => ({
  listarAlumnosConVinculos: jest.fn(),
  listarSupervisores: jest.fn(),
  asignarSupervisor: jest.fn(),
}));

const mockAlumnos = listarAlumnosConVinculos as jest.Mock;
const mockSupervisores = listarSupervisores as jest.Mock;
const mockAsignar = asignarSupervisor as jest.Mock;

const SERGIO: AlumnoConVinculos = {
  id: "a1",
  nombre: "Sergio",
  apellidos: "Gil",
  aula: "PTVAL 2",
  requiereTutorPresencial: true,
  tutorAula: { id: "t1", nombre: "Carmen Heredia" },
  familia: { id: "f1", nombre: "Familia Gil" },
};
const NORA: AlumnoConVinculos = {
  id: "a2",
  nombre: "Nora",
  aula: "PTVAL 2",
  requiereTutorPresencial: false,
  tutorAula: { id: "t1", nombre: "Carmen Heredia" },
  familia: null,
};
const TUTORES = [
  { id: "t1", nombre: "Carmen Heredia" },
  { id: "t2", nombre: "Luis Prieto" },
];
const FAMILIAS = [
  { id: "f1", nombre: "Familia Gil" },
  { id: "f2", nombre: "Familia Ruiz" },
];

function prepararDatos() {
  mockAlumnos.mockResolvedValue({ success: true, data: [SERGIO, NORA] });
  mockSupervisores.mockImplementation(async (tipo: string) => ({
    success: true,
    data: tipo === "aula" ? TUTORES : FAMILIAS,
  }));
}

describe("Consola de vínculos - SCRUM-61 (T-03.3)", () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    prepararDatos();
  });

  it("muestra cada estudiante con su aula, su tutor de aula y su familia", async () => {
    await render(<ConsolaVinculos />);

    const sergio = within(await screen.findByTestId("fila-a1"));
    expect(sergio.getByText("Sergio Gil")).toBeTruthy();
    expect(sergio.getByText("PTVAL 2")).toBeTruthy();
    expect(sergio.getByText("Carmen Heredia")).toBeTruthy();
    expect(sergio.getByText("Familia Gil")).toBeTruthy();

    expect(within(screen.getByTestId("fila-a2")).getByText("Sin familia")).toBeTruthy();
  });

  it("muestra el distintivo de presencia obligatoria solo a quien lo necesita (RF2.5)", async () => {
    await render(<ConsolaVinculos />);

    expect(
      within(await screen.findByTestId("fila-a1")).getByText("⚠️ Requiere tutor presencial"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("fila-a2")).queryByText("⚠️ Requiere tutor presencial"),
    ).toBeNull();
  });

  it("cambia el tutor de aula de un estudiante", async () => {
    mockAsignar.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    await render(<ConsolaVinculos />);

    await user.press(
      await screen.findByRole("button", { name: "Cambiar tutor de aula de Sergio Gil" }),
    );
    expect(screen.getByText("Tutor de aula de Sergio Gil")).toBeTruthy();
    await user.press(screen.getByRole("radio", { name: "Luis Prieto" }));

    expect(mockAsignar).toHaveBeenCalledWith("a1", "aula", "t2");
    const fila = within(await screen.findByTestId("fila-a1"));
    await waitFor(() => expect(fila.getByText("Luis Prieto")).toBeTruthy());
    expect(fila.getByText("✓ Guardado")).toBeTruthy();
  });

  it("puede dejar a un estudiante sin familia", async () => {
    mockAsignar.mockResolvedValue({ success: true, data: null });
    const user = userEvent.setup();
    await render(<ConsolaVinculos />);

    await user.press(await screen.findByRole("button", { name: "Cambiar familia de Sergio Gil" }));
    await user.press(screen.getByRole("radio", { name: "Sin familia" }));

    expect(mockAsignar).toHaveBeenCalledWith("a1", "familiar", null);
    await waitFor(() =>
      expect(within(screen.getByTestId("fila-a1")).getByText("Sin familia")).toBeTruthy(),
    );
  });

  it("el tutor de aula no ofrece la opción de dejarlo vacío", async () => {
    const user = userEvent.setup();
    await render(<ConsolaVinculos />);

    await user.press(await screen.findByRole("button", { name: "Cambiar tutor de aula de Nora" }));

    expect(screen.queryByRole("radio", { name: "Sin familia" })).toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("si no se puede guardar, avisa y no cambia la fila", async () => {
    mockAsignar.mockResolvedValue({ success: false, error: "No se ha podido guardar el cambio." });
    const user = userEvent.setup();
    await render(<ConsolaVinculos />);

    await user.press(await screen.findByRole("button", { name: "Cambiar familia de Nora" }));
    await user.press(screen.getByRole("radio", { name: "Familia Ruiz" }));

    expect(await screen.findByText("⚠️ No se ha podido guardar el cambio.")).toBeTruthy();
    expect(within(screen.getByTestId("fila-a2")).getByText("Sin familia")).toBeTruthy();
  });

  it("si falla la carga, avisa y permite reintentar", async () => {
    mockAlumnos.mockResolvedValueOnce({ success: false, error: "sin red" });
    const user = userEvent.setup();
    await render(<ConsolaVinculos />);

    expect(
      await screen.findByText("⚠️ No se han podido cargar los estudiantes. Inténtalo otra vez."),
    ).toBeTruthy();
    await user.press(screen.getByRole("button", { name: "Reintentar la carga" }));

    expect(await screen.findByTestId("fila-a1")).toBeTruthy();
  });
});
