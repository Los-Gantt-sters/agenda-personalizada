import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";

import PanelAdministracion from "../admin/index";
import { listarUsuariosPanel, type DatosPanel } from "../../src/servicios/usuariosPanelService";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("../../src/servicios/usuariosPanelService", () => ({
  ...jest.requireActual("../../src/servicios/usuariosPanelService"),
  listarUsuariosPanel: jest.fn(),
}));

const mockListar = listarUsuariosPanel as jest.Mock;

const DATOS: DatosPanel = {
  cursos: ["2026-2027", "2025-2026"],
  aulas: ["Clase Triángulo", "Clase Círculo"],
  usuarios: [
    {
      id: "e1",
      nombre: "Alejandro Pérez",
      rol: "estudiante",
      cursos: ["2026-2027"],
      aulas: ["Clase Triángulo"],
      tutor: "Carmen Ruiz",
      familia: "Familia García",
      menu: "normal",
    },
    {
      id: "e2",
      nombre: "Miriam Núñez",
      rol: "estudiante",
      cursos: ["2025-2026"],
      aulas: ["Clase Círculo"],
      menu: "sin_gluten",
    },
    {
      id: "t1",
      nombre: "Carmen Ruiz",
      rol: "tutor",
      email: "carmen.ruiz@purisima.es",
      cursos: ["2026-2027"],
      aulas: ["Clase Triángulo"],
    },
  ],
};

describe("PanelAdministracion - pantalla 48", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue({ success: true, data: DATOS });
  });

  it("enseña los tres accesos y la lista de usuarios con sus vínculos", async () => {
    await render(<PanelAdministracion />);

    expect(await screen.findByText("Alejandro Pérez")).toBeTruthy();
    expect(screen.getByText("1. Aulas y Clases (01)")).toBeTruthy();
    expect(screen.getByText("2. Menús y Alergias")).toBeTruthy();
    expect(screen.getByText("3. Nuevo Usuario / Perfil")).toBeTruthy();
    expect(screen.getByText("Clase Triángulo · Tutor: Carmen Ruiz · Familia García")).toBeTruthy();
    expect(screen.getByText("Menú Normal")).toBeTruthy();
    expect(screen.getByText("Todos (3)")).toBeTruthy();
  });

  it("«Aulas y Clases» y «Menús y Alergias» abren sus pantallas", async () => {
    const user = userEvent.setup();
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await user.press(screen.getByTestId("acceso-aulas"));
    expect(mockPush).toHaveBeenCalledWith("/admin/aulas");
    await user.press(screen.getByTestId("acceso-menus"));
    expect(mockPush).toHaveBeenCalledWith("/admin/menus");
  });

  it("«Nuevo Usuario / Perfil» está dibujado pero todavía no hace nada", async () => {
    const user = userEvent.setup();
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await user.press(screen.getByTestId("acceso-nuevo-usuario"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("el filtro de curso sale de los cursos que existen", async () => {
    const user = userEvent.setup();
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await user.press(screen.getByRole("button", { name: "Solo el curso 2025-2026" }));
    expect(screen.queryByText("Alejandro Pérez")).toBeNull();
    expect(screen.getByText("Miriam Núñez")).toBeTruthy();
  });

  it("sin cursos creados solo sale «Todos»", async () => {
    mockListar.mockResolvedValue({ success: true, data: { ...DATOS, cursos: [] } });
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    expect(screen.getByRole("button", { name: "Mostrar todos los cursos" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Solo el curso/ })).toBeNull();
  });

  it("filtra por rol y por aula", async () => {
    const user = userEvent.setup();
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await user.press(screen.getByRole("button", { name: "Solo tutores" }));
    expect(screen.queryByText("Alejandro Pérez")).toBeNull();
    expect(screen.getByText("carmen.ruiz@purisima.es")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Mostrar todos los roles" }));
    await user.press(screen.getByRole("button", { name: "Solo el aula Clase Círculo" }));
    expect(screen.getByText("Miriam Núñez")).toBeTruthy();
    expect(screen.queryByText("Alejandro Pérez")).toBeNull();
  });

  it("busca por nombre, correo, aula o dieta", async () => {
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await fireEvent.changeText(screen.getByTestId("buscar-usuario"), "gluten");
    expect(screen.getByText("Miriam Núñez")).toBeTruthy();
    expect(screen.queryByText("Alejandro Pérez")).toBeNull();

    await fireEvent.changeText(screen.getByTestId("buscar-usuario"), "zzz");
    expect(screen.getByText("Ningún usuario coincide con la búsqueda.")).toBeTruthy();
  });

  it("«Editar» de un estudiante abre los vínculos; el de un adulto aún no está disponible", async () => {
    const user = userEvent.setup();
    await render(<PanelAdministracion />);
    await screen.findByText("Alejandro Pérez");

    await user.press(screen.getByTestId("editar-e1"));
    expect(mockPush).toHaveBeenCalledWith("/admin/vinculos");
    mockPush.mockClear();
    await user.press(screen.getByTestId("editar-t1"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("avisa y deja reintentar si no cargan los usuarios", async () => {
    mockListar.mockResolvedValueOnce({ success: false, error: "sin red" });
    const user = userEvent.setup();
    await render(<PanelAdministracion />);

    expect(await screen.findByText(/No se han podido cargar los usuarios/)).toBeTruthy();
    await user.press(screen.getByLabelText("Reintentar la carga"));
    expect(await screen.findByText("Alejandro Pérez")).toBeTruthy();
  });
});
