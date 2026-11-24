import { fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";

import ConfigurarAulas from "../admin/aulas";
import {
  crearAula,
  guardarConfiguracionAulas,
  obtenerAulas,
} from "../../src/servicios/aulasService";

// La pantalla tiene la barra de abajo (Atrás / Adelante): necesita el router.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("../../src/servicios/aulasService", () => ({
  obtenerAulas: jest.fn(),
  crearAula: jest.fn(),
  guardarConfiguracionAulas: jest.fn(),
}));

// El buscador de ARASAAC llamaría a internet: aquí no devuelve nada
jest.mock("../../src/arasaac", () => ({
  ...jest.requireActual("../../src/arasaac"),
  useBuscadorPictogramas: () => ({ estado: "inactivo", resultados: [], error: null }),
}));

const mockObtener = obtenerAulas as jest.Mock;
const mockCrear = crearAula as jest.Mock;
const mockGuardar = guardarConfiguracionAulas as jest.Mock;

const AULAS = [
  { id: "a1", nombre: "Clase Triángulo", iconoForma: "triangulo", iconoUrl: null, nivel: "PTVAL" },
  { id: "a2", nombre: "Clase Círculo", iconoForma: "cir", iconoUrl: null, nivel: "PTVAL" },
];

describe("ConfigurarAulas - SCRUM-259 (pantalla 48b)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockObtener.mockResolvedValue({ success: true, data: AULAS });
    mockGuardar.mockResolvedValue({ success: true, data: [] });
  });

  it("enseña el nombre de cada aula", async () => {
    await render(<ConfigurarAulas />);
    expect(await screen.findByDisplayValue("Clase Triángulo")).toBeTruthy();
    expect(screen.getByDisplayValue("Clase Círculo")).toBeTruthy();
  });

  it("avisa y deja reintentar si no cargan las aulas", async () => {
    mockObtener.mockResolvedValueOnce({ success: false, error: "sin red" });
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);

    expect(await screen.findByText(/No se han podido cargar las aulas/)).toBeTruthy();
    await user.press(screen.getByLabelText("Reintentar la carga"));
    expect(await screen.findByDisplayValue("Clase Triángulo")).toBeTruthy();
  });

  it("«Guardar configuración» guarda los nombres editados en el orden de la lista", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await fireEvent.changeText(screen.getByTestId("nombre-aula-0"), "Clase Luna");
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalledTimes(1));
    const enviadas = mockGuardar.mock.calls[0][0];
    expect(enviadas.map((a: { id: string }) => a.id)).toEqual(["a1", "a2"]);
    expect(enviadas[0].nombre).toBe("Clase Luna");
    expect(await screen.findByText("Configuración guardada")).toBeTruthy();
  });

  it("«Cambiar icono» abre la elección y una forma queda aplicada al aula", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("cambiar-icono-0"));
    await user.press(screen.getByTestId("forma-aula-est"));
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockGuardar.mock.calls[0][0][0]).toMatchObject({
      id: "a1",
      iconoForma: "est",
      iconoUrl: null,
    });
  });

  it("una imagen propia queda guardada como dirección del icono", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("cambiar-icono-1"));
    await fireEvent.changeText(screen.getByTestId("direccion-imagen-aula"), "https://x/luna.png");
    await user.press(screen.getByTestId("usar-imagen-aula"));
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockGuardar.mock.calls[0][0][1].iconoUrl).toBe("https://x/luna.png");
  });

  it("no acepta como imagen algo que no sea una dirección https", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("cambiar-icono-0"));
    await fireEvent.changeText(screen.getByTestId("direccion-imagen-aula"), "luna.png");

    expect(screen.getByTestId("usar-imagen-aula").props.accessibilityState.disabled).toBe(true);
  });

  it("«Atrás» en la elección de icono vuelve a la lista sin cambiar nada", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("cambiar-icono-0"));
    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(await screen.findByDisplayValue("Clase Triángulo")).toBeTruthy();
    expect(mockGuardar).not.toHaveBeenCalled();
  });

  it("«Añadir nueva aula» crea la nueva al guardar y la deja al final", async () => {
    mockCrear.mockResolvedValue({ success: true, data: { id: "a3" } });
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("anadir-aula"));
    await fireEvent.changeText(screen.getByTestId("nombre-aula-2"), "Clase Sol");
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockCrear).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Clase Sol" }));
    expect(mockGuardar.mock.calls[0][0].map((a: { id: string }) => a.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  it("muestra el error si no se puede guardar", async () => {
    mockGuardar.mockResolvedValue({ success: false, error: "Solo administradores" });
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    expect(await screen.findByText("Solo administradores")).toBeTruthy();
    expect(screen.queryByText("Configuración guardada")).toBeNull();
  });
});
