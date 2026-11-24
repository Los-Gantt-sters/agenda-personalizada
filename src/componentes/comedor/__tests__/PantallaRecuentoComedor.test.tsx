// HU-12 · SCRUM-104 (T-12.3): pantalla 11, «Comedor · Recuento por aulas», del alumno encargado.
import { act, render, screen, userEvent } from "@testing-library/react-native";

import { PantallaRecuentoComedor } from "../PantallaRecuentoComedor";
import {
  confirmarRecuentoComedor,
  obtenerRecuentoComedorHoy,
  type ClaseRecuento,
} from "../../../servicios/comedorService";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));
jest.mock("../../../servicios/comedorService", () => ({
  obtenerRecuentoComedorHoy: jest.fn(),
  confirmarRecuentoComedor: jest.fn(),
}));

const mockClases = obtenerRecuentoComedorHoy as jest.Mock;
const mockConfirmar = confirmarRecuentoComedor as jest.Mock;

const CLASES: ClaseRecuento[] = [
  {
    aulaId: "tri",
    nombre: "Clase Triángulo",
    iconoForma: "tri",
    iconoUrl: null,
    alumnos: [
      { id: "mir", nombre: "Miriam", icono: "🦋", color: "#7A3FA6" },
      { id: "ale", nombre: "Alejandro", icono: "🦁", color: "#B8492F" },
    ],
    confirmado: false,
    ausentes: [],
  },
  {
    aulaId: "cir",
    nombre: "Clase Círculo",
    iconoForma: "cir",
    iconoUrl: null,
    alumnos: [{ id: "nor", nombre: "Nora", icono: "🐢", color: null }],
    confirmado: true,
    ausentes: ["nor"], // ya contada hoy: Nora no está
  },
];

async function abrir(alSalir = jest.fn()) {
  await render(<PantallaRecuentoComedor alSalir={alSalir} />);
  await screen.findByTestId("paso-recuento-1");
  return alSalir;
}

describe("Pantalla 11 · Comedor · Recuento por aulas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClases.mockResolvedValue({ success: true, data: CLASES });
    mockConfirmar.mockResolvedValue({ success: true, data: "2026-11-25T09:00:00+01:00" });
  });

  it("enseña la primera clase, el paso, sus compañeros y cuántos comen", async () => {
    await abrir();
    expect(screen.getByText("Paso 1 de 2")).toBeTruthy();
    expect(screen.getByText("Clase Triángulo")).toBeTruthy();
    expect(screen.getByText("Toca a los que no están hoy")).toBeTruthy();
    expect(screen.getByLabelText("Miriam: está")).toBeTruthy();
    expect(screen.getByLabelText("Alejandro: está")).toBeTruthy();
    expect(screen.getByTestId("comen-en-clase")).toHaveTextContent("Clase Triángulo · Comen 2");
  });

  it("tocar a un compañero lo marca como «No está»; tocarlo otra vez lo quita", async () => {
    const user = userEvent.setup();
    await abrir();

    await user.press(screen.getByTestId("companero-mir"));
    expect(screen.getByLabelText("Miriam: no está")).toBeTruthy();
    expect(screen.getByText("No está")).toBeTruthy();
    expect(screen.getByTestId("comen-en-clase")).toHaveTextContent(/Comen 1$/);

    await user.press(screen.getByTestId("companero-mir"));
    expect(screen.getByLabelText("Miriam: está")).toBeTruthy();
    expect(screen.getByTestId("comen-en-clase")).toHaveTextContent(/Comen 2$/);
  });

  it("«Siguiente» guarda la clase con los que faltan y pasa a la siguiente", async () => {
    const user = userEvent.setup();
    await abrir();

    await user.press(screen.getByTestId("companero-mir"));
    await user.press(screen.getByTestId("btn-barra-adelante"));

    expect(mockConfirmar).toHaveBeenCalledWith("tri", ["mir"]);
    expect(await screen.findByText("Paso 2 de 2")).toBeTruthy();
    expect(screen.getByText("Clase Círculo")).toBeTruthy();
  });

  it("una clase ya contada hoy sale como se dejó, para poder corregirla", async () => {
    const user = userEvent.setup();
    await abrir();
    await user.press(screen.getByTestId("btn-barra-adelante"));

    expect(await screen.findByLabelText("Nora: no está")).toBeTruthy();
    expect(screen.getByTestId("comen-en-clase")).toHaveTextContent(/Comen 0$/);
  });

  it("«Atrás» vuelve a la clase anterior sin perder lo marcado, y en la primera sale", async () => {
    const user = userEvent.setup();
    const alSalir = await abrir();

    await user.press(screen.getByTestId("companero-ale"));
    await user.press(screen.getByTestId("btn-barra-adelante"));
    await screen.findByText("Paso 2 de 2");
    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(screen.getByText("Paso 1 de 2")).toBeTruthy();
    expect(screen.getByLabelText("Alejandro: no está")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(alSalir).toHaveBeenCalled();
  });

  it("en la última clase, «Terminar» guarda y enseña la confirmación grande de tarea hecha", async () => {
    const user = userEvent.setup();
    const alSalir = await abrir();

    await user.press(screen.getByTestId("btn-barra-adelante"));
    await screen.findByText("Paso 2 de 2");
    expect(screen.getByText("Terminar")).toBeTruthy();
    await user.press(screen.getByTestId("btn-barra-adelante"));

    expect(mockConfirmar).toHaveBeenLastCalledWith("cir", ["nor"]);
    expect(await screen.findByLabelText("Tarea hecha: Recuento del comedor")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(alSalir).toHaveBeenCalled();
  });

  it("si no se puede guardar, avisa y se queda en la misma clase", async () => {
    const user = userEvent.setup();
    mockConfirmar.mockResolvedValueOnce({ success: false, error: "sin red" });
    await abrir();

    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(await screen.findByTestId("error-guardar-recuento")).toBeTruthy();
    expect(screen.getByText("Paso 1 de 2")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(await screen.findByText("Paso 2 de 2")).toBeTruthy();
  });

  it("si no se pueden cargar las clases, avisa y «Volver a probar» las pide otra vez", async () => {
    const user = userEvent.setup();
    mockClases.mockResolvedValueOnce({ success: false, error: "fallo" });
    await render(<PantallaRecuentoComedor alSalir={jest.fn()} />);

    expect(await screen.findByTestId("recuento-error")).toBeTruthy();
    await user.press(screen.getByTestId("btn-volver-a-probar-recuento"));
    expect(await screen.findByText("Paso 1 de 2")).toBeTruthy();
  });

  it("si hoy no hay clases que contar, lo dice", async () => {
    mockClases.mockResolvedValueOnce({ success: true, data: [] });
    await render(<PantallaRecuentoComedor alSalir={jest.fn()} />);
    expect(await screen.findByText("Hoy no hay clases que contar.")).toBeTruthy();
  });
  it("un ausente guardado que ya no está en la clase no bloquea ni resta (revisión)", async () => {
    const user = userEvent.setup();
    mockClases.mockResolvedValueOnce({
      success: true,
      data: [{ ...CLASES[0], confirmado: true, ausentes: ["se-fue", "mir"] }],
    });
    await abrir();

    expect(screen.getByTestId("comen-en-clase")).toHaveTextContent(/Comen 1$/);
    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(mockConfirmar).toHaveBeenCalledWith("tri", ["mir"]);
  });

  it("un doble toque en «Siguiente» guarda una sola vez", async () => {
    const user = userEvent.setup();
    let resolver: (v: unknown) => void = () => {};
    mockConfirmar.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    await abrir();

    await user.press(screen.getByTestId("btn-barra-adelante"));
    await user.press(screen.getByTestId("btn-barra-adelante"));
    await act(async () => resolver({ success: true, data: "ok" }));

    expect(mockConfirmar).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Paso 2 de 2")).toBeTruthy();
  });

  it("mientras se guarda no se puede volver atrás ni tocar compañeros", async () => {
    const user = userEvent.setup();
    const alSalir = jest.fn();
    let resolver: (v: unknown) => void = () => {};
    mockConfirmar.mockReturnValueOnce(new Promise((r) => (resolver = r)));
    await abrir(alSalir);

    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByTestId("btn-barra-atras")).toBeDisabled();
    expect(screen.getByTestId("companero-mir")).toBeDisabled();
    await user.press(screen.getByTestId("companero-mir"));
    expect(screen.getByLabelText("Miriam: está")).toBeTruthy();

    await act(async () => resolver({ success: true, data: "ok" }));
    expect(screen.getByText("Paso 2 de 2")).toBeTruthy();
    expect(alSalir).not.toHaveBeenCalled();
  });
});
