import { fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";

import ConfigurarAulas from "../admin/aulas";
import {
  crearAula,
  eliminarAula,
  guardarConfiguracionAulas,
  obtenerAulas,
  obtenerCursosAbiertos,
} from "../../src/servicios/aulasService";

// La pantalla tiene la barra de abajo (Atrás / Adelante): necesita el router.
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock("../../src/servicios/aulasService", () => ({
  obtenerAulas: jest.fn(),
  crearAula: jest.fn(),
  eliminarAula: jest.fn(),
  guardarConfiguracionAulas: jest.fn(),
  obtenerCursosAbiertos: jest.fn(),
}));

// El buscador de ARASAAC llamaría a internet: aquí no devuelve nada
jest.mock("../../src/arasaac", () => ({
  ...jest.requireActual("../../src/arasaac"),
  useBuscadorPictogramas: () => ({ estado: "inactivo", resultados: [], error: null }),
}));

const mockObtener = obtenerAulas as jest.Mock;
const mockCrear = crearAula as jest.Mock;
const mockEliminar = eliminarAula as jest.Mock;
const mockGuardar = guardarConfiguracionAulas as jest.Mock;
const mockCursos = obtenerCursosAbiertos as jest.Mock;

const CURSOS = [
  { id: "c26", anioEscolar: "2026-2027", activo: true },
  { id: "c27", anioEscolar: "2027-2028", activo: false },
];

const AULAS = [
  { id: "a1", nombre: "Clase Triángulo", iconoForma: "triangulo", iconoUrl: null, nivel: "PTVAL" },
  { id: "a2", nombre: "Clase Círculo", iconoForma: "cir", iconoUrl: null, nivel: "PTVAL" },
];

describe("ConfigurarAulas - SCRUM-259 (pantalla 48b)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockObtener.mockResolvedValue({ success: true, data: AULAS });
    mockGuardar.mockResolvedValue({ success: true, data: [] });
    mockCursos.mockResolvedValue({ success: true, data: CURSOS });
    mockEliminar.mockResolvedValue({ success: true, data: null });
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
    await user.press(await screen.findByTestId("curso-c26"));
    await fireEvent.changeText(screen.getByTestId("nombre-aula-2"), "Clase Sol");
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockCrear).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Clase Sol", cursoLectivoId: "c26" }),
    );
    expect(mockGuardar.mock.calls[0][0].map((a: { id: string }) => a.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  });

  describe("curso de la nueva aula (SCRUM-249: no hay aulas sin curso)", () => {
    it("«Añadir nueva aula» pregunta el curso y ofrece los no cerrados, marcando el actual", async () => {
      const user = userEvent.setup();
      await render(<ConfigurarAulas />);
      await screen.findByDisplayValue("Clase Triángulo");

      await user.press(screen.getByTestId("anadir-aula"));

      expect(screen.getByText("¿De qué curso es la nueva aula?")).toBeTruthy();
      expect(await screen.findByLabelText("Curso 2026-2027, el actual")).toBeTruthy();
      expect(screen.getByLabelText("Curso 2027-2028")).toBeTruthy();
      expect(screen.queryByTestId("nombre-aula-2")).toBeNull(); // aún no se ha añadido
    });

    it("la nueva aula queda con el curso elegido", async () => {
      mockCrear.mockResolvedValue({ success: true, data: { id: "a3" } });
      const user = userEvent.setup();
      await render(<ConfigurarAulas />);
      await screen.findByDisplayValue("Clase Triángulo");

      await user.press(screen.getByTestId("anadir-aula"));
      await user.press(await screen.findByTestId("curso-c27"));

      expect(screen.getByTestId("aula-2")).toHaveTextContent(/Curso 2027-2028 · Se verá en 01/);
      // Las aulas de la prueba no tienen curso: no se dice que se vean en la 01
      expect(screen.getByTestId("aula-0")).toHaveTextContent(/Sin curso abierto: no se ve en 01/);
      await user.press(screen.getByLabelText("Guardar configuración de las aulas"));
      await waitFor(() =>
        expect(mockCrear).toHaveBeenCalledWith(expect.objectContaining({ cursoLectivoId: "c27" })),
      );
    });

    it("«Atrás» vuelve a la lista sin añadir ningún aula", async () => {
      const user = userEvent.setup();
      await render(<ConfigurarAulas />);
      await screen.findByDisplayValue("Clase Triángulo");

      await user.press(screen.getByTestId("anadir-aula"));
      await screen.findByTestId("curso-c26");
      await user.press(screen.getByTestId("btn-barra-atras"));

      expect(screen.getByDisplayValue("Clase Triángulo")).toBeTruthy();
      expect(screen.queryByTestId("aula-2")).toBeNull();
    });

    it("si no cargan los cursos, avisa y deja reintentar", async () => {
      mockCursos.mockResolvedValueOnce({ success: false, error: "sin red" });
      const user = userEvent.setup();
      await render(<ConfigurarAulas />);
      await screen.findByDisplayValue("Clase Triángulo");

      await user.press(screen.getByTestId("anadir-aula"));
      expect(await screen.findByText(/No se han podido cargar los cursos/)).toBeTruthy();
      await user.press(screen.getByLabelText("Reintentar la carga de los cursos"));
      expect(await screen.findByTestId("curso-c26")).toBeTruthy();
    });

    it("sin cursos abiertos, explica que hay que crear antes el curso", async () => {
      mockCursos.mockResolvedValue({ success: true, data: [] });
      const user = userEvent.setup();
      await render(<ConfigurarAulas />);
      await screen.findByDisplayValue("Clase Triángulo");

      await user.press(screen.getByTestId("anadir-aula"));
      expect(await screen.findByText(/No hay ningún curso abierto/)).toBeTruthy();
    });
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

  it("«Eliminar» marca el aula y se borra al guardar, sin incluirla en la configuración", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("eliminar-aula-0"));
    expect(screen.getByText("Se eliminará al guardar")).toBeTruthy();
    expect(mockEliminar).not.toHaveBeenCalled();

    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockEliminar).toHaveBeenCalledWith("a1");
    expect(mockGuardar.mock.calls[0][0].map((a: { id: string }) => a.id)).toEqual(["a2"]);
  });

  it("«Deshacer» recupera el aula marcada y no se elimina", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("eliminar-aula-0"));
    await user.press(screen.getByTestId("deshacer-aula-0"));
    expect(screen.queryByText("Se eliminará al guardar")).toBeNull();

    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockEliminar).not.toHaveBeenCalled();
    expect(mockGuardar.mock.calls[0][0]).toHaveLength(2);
  });

  it("un aula nueva sin guardar desaparece sin llamar a eliminar", async () => {
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("anadir-aula"));
    await user.press(await screen.findByTestId("curso-c26")); // SCRUM-249: primero, su curso
    await user.press(screen.getByTestId("eliminar-aula-2"));
    expect(screen.queryByTestId("aula-2")).toBeNull();

    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));
    await waitFor(() => expect(mockGuardar).toHaveBeenCalled());
    expect(mockEliminar).not.toHaveBeenCalled();
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it("si el aula tiene alumnos avisa, no la borra y sigue en la lista", async () => {
    mockEliminar.mockResolvedValue({
      success: false,
      error: "No se puede eliminar un aula que tiene alumnos. Muévelos antes a otra aula.",
    });
    const user = userEvent.setup();
    await render(<ConfigurarAulas />);
    await screen.findByDisplayValue("Clase Triángulo");

    await user.press(screen.getByTestId("eliminar-aula-0"));
    await user.press(screen.getByLabelText("Guardar configuración de las aulas"));

    expect(await screen.findByText(/Clase Triángulo: No se puede eliminar un aula/)).toBeTruthy();
    expect(mockGuardar).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue("Clase Triángulo")).toBeTruthy();
    expect(screen.queryByText("Se eliminará al guardar")).toBeNull();
  });
});
