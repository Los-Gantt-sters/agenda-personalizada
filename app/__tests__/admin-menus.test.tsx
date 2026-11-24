import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "@testing-library/react-native";

import MenusYAlergias from "../admin/menus";
import { guardarMenuAlumno, listarMenusAlumnos } from "../../src/servicios/menusService";

// La pantalla tiene la barra de abajo (Atrás / Adelante): necesita el router.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("../../src/servicios/menusService", () => ({
  listarMenusAlumnos: jest.fn(),
  guardarMenuAlumno: jest.fn(),
}));

const mockListar = listarMenusAlumnos as jest.Mock;
const mockGuardar = guardarMenuAlumno as jest.Mock;

const MIRIAM = {
  id: "a1",
  nombre: "Miriam",
  apellidos: "Núñez",
  aula: "Clase Triángulo",
  dietaComedor: "sin_gluten",
  alergias: ["frutos_secos"],
  observacionesCocina: "Pan sin gluten precintado",
};
const SERGIO = {
  id: "a2",
  nombre: "Sergio",
  aula: "Clase Triángulo",
  dietaComedor: "normal",
  alergias: [],
  observacionesCocina: "",
};

describe("MenusYAlergias - SCRUM-260 (pantallas 46 y 46b)", () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    mockListar.mockResolvedValue({ success: true, data: [MIRIAM, SERGIO] });
    mockGuardar.mockImplementation(async (_id: string, cambios: object) => ({
      success: true,
      data: cambios,
    }));
  });

  it("46: enseña el menú y las alergias de cada alumno", async () => {
    await render(<MenusYAlergias />);

    const miriam = within(await screen.findByTestId("fila-a1"));
    expect(miriam.getByText("Miriam Núñez")).toBeTruthy();
    expect(miriam.getByText("Sin gluten")).toBeTruthy();
    expect(miriam.getByText("Frutos secos")).toBeTruthy();

    const sergio = within(screen.getByTestId("fila-a2"));
    expect(sergio.getByText("Normal")).toBeTruthy();
    expect(sergio.getByText("Sin alergias")).toBeTruthy();
  });

  it("avisa y deja reintentar si no cargan los alumnos", async () => {
    mockListar.mockResolvedValueOnce({ success: false, error: "sin red" });
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    expect(await screen.findByText(/No se han podido cargar los alumnos/)).toBeTruthy();
    await user.press(screen.getByLabelText("Reintentar la carga"));
    expect(await screen.findByTestId("fila-a1")).toBeTruthy();
  });

  it("46b: «Editar» abre el menú del alumno con lo que ya tiene marcado", async () => {
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a1"));

    expect(screen.getByText("Menú de Miriam Núñez")).toBeTruthy();
    expect(screen.getByTestId("tipo-menu-sin_gluten").props.accessibilityState.checked).toBe(true);
    expect(screen.getByTestId("alergia-frutos_secos").props.accessibilityState.checked).toBe(true);
    expect(screen.getByDisplayValue("Pan sin gluten precintado")).toBeTruthy();
  });

  it("guarda el tipo de menú, las alergias (fijas y escritas) y las observaciones", async () => {
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a2"));
    await user.press(screen.getByTestId("tipo-menu-turmix"));
    await user.press(screen.getByTestId("alergia-huevo"));
    await fireEvent.changeText(screen.getByTestId("nueva-alergia"), "kiwi");
    await user.press(screen.getByTestId("anadir-alergia"));
    await fireEvent.changeText(screen.getByTestId("observaciones-cocina"), "Sin trazas");
    await user.press(screen.getByLabelText("Guardar el menú y las alergias"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalledTimes(1));
    expect(mockGuardar).toHaveBeenCalledWith("a2", {
      dietaComedor: "turmix",
      alergias: ["huevo", "kiwi"],
      observacionesCocina: "Sin trazas",
    });
    // Vuelve a la lista con la fila actualizada y «Guardado»
    const fila = within(await screen.findByTestId("fila-a2"));
    expect(fila.getByText("Triturado líquido (túrmix)")).toBeTruthy();
    expect(fila.getByText("Huevo, kiwi")).toBeTruthy();
    expect(fila.getByText("Guardado")).toBeTruthy();
  });

  it("cuenta una alergia escrita aunque no se pulse «Añadir alergia»", async () => {
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a2"));
    await fireEvent.changeText(screen.getByTestId("nueva-alergia"), "kiwi");
    await user.press(screen.getByLabelText("Guardar el menú y las alergias"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockGuardar.mock.calls[0][1].alergias).toEqual(["kiwi"]);
  });

  it("una alergia escrita se puede quitar", async () => {
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a2"));
    await fireEvent.changeText(screen.getByTestId("nueva-alergia"), "kiwi");
    await user.press(screen.getByTestId("anadir-alergia"));
    await user.press(screen.getByTestId("alergia-libre-kiwi"));
    await user.press(screen.getByLabelText("Guardar el menú y las alergias"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockGuardar.mock.calls[0][1].alergias).toEqual([]);
  });

  it("«Atrás» vuelve a la lista sin guardar nada", async () => {
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a1"));
    await user.press(screen.getByTestId("tipo-menu-especial"));
    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByTestId("fila-a1")).toBeTruthy();
    expect(mockGuardar).not.toHaveBeenCalled();
  });

  it("si no se puede guardar, avisa y se queda editando", async () => {
    mockGuardar.mockResolvedValue({ success: false, error: "Solo administradores" });
    const user = userEvent.setup();
    await render(<MenusYAlergias />);

    await user.press(await screen.findByTestId("editar-a1"));
    await user.press(screen.getByLabelText("Guardar el menú y las alergias"));

    expect(await screen.findByText("Solo administradores")).toBeTruthy();
    expect(screen.getByText("Menú de Miriam Núñez")).toBeTruthy();
  });
});
