// HU-12 · SCRUM-103 (T-12.2): pantalla 54, «Cocina · Parte del día».
import { act, render, screen, userEvent } from "@testing-library/react-native";

import ParteDelDiaCocina from "../cocina/index";
import { obtenerParteCocinaDia, type ParteCocinaDia } from "../../src/servicios/comedorService";

jest.mock("expo-router", () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock("../../src/servicios/comedorService", () => ({ obtenerParteCocinaDia: jest.fn() }));

const mockParte = obtenerParteCocinaDia as jest.Mock;

const PARTE: ParteCocinaDia = {
  fecha: "2026-11-25",
  total: 34,
  ausentes: 2,
  menus: [
    { tipo: "normal", total: 28 },
    { tipo: "turmix", total: 4 },
    { tipo: "sin_gluten", total: 2 },
  ],
  aulasTotal: 3,
  aulasConfirmadas: 3,
  ultima: { aula: "Clase Triángulo", hora: "10:12" },
  avisos: [
    {
      alumnoId: "al-1",
      nombre: "Miriam",
      aula: "Clase Triángulo",
      alergias: ["frutos_secos"],
      observaciones: "Sin trazas",
    },
  ],
};

const ok = (parte: ParteCocinaDia) => ({ success: true, data: parte });

describe("Pantalla 54 · Cocina · Parte del día", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParte.mockResolvedValue(ok(PARTE));
  });

  it("enseña una tarjeta por tipo de menú y el total de comensales", async () => {
    await render(<ParteDelDiaCocina />);

    expect(await screen.findByLabelText("Normal: 28")).toBeTruthy();
    expect(screen.getByLabelText("Triturado líquido (túrmix): 4")).toBeTruthy();
    expect(screen.getByLabelText("Sin gluten: 2")).toBeTruthy();
    expect(screen.getByLabelText("Total comensales: 34")).toBeTruthy();
  });

  it("con todas las aulas contadas: «Aulas confirmadas 3 de 3», la última y «Parte confirmado»", async () => {
    await render(<ParteDelDiaCocina />);

    expect(await screen.findByText("Aulas confirmadas: 3 de 3")).toBeTruthy();
    expect(
      screen.getByText("Última actualización: Clase Triángulo (10:12) · Hoy faltan 2"),
    ).toBeTruthy();
    expect(screen.getByTestId("parte-confirmado")).toBeTruthy();
  });

  it("si faltan clases por contar, lo dice en vez de «Parte confirmado»", async () => {
    mockParte.mockResolvedValue(ok({ ...PARTE, aulasConfirmadas: 1, ultima: null, ausentes: 0 }));
    await render(<ParteDelDiaCocina />);

    expect(await screen.findByText("Faltan 2 aulas")).toBeTruthy();
    // El total cuenta como presentes a los de las clases sin contar: es provisional
    expect(screen.getByLabelText("Total comensales (provisional): 34")).toBeTruthy();
    expect(screen.getByText("Provisional")).toBeTruthy();
    expect(screen.queryByTestId("parte-confirmado")).toBeNull();
    expect(screen.getByText("Todavía no ha llegado el recuento de ninguna clase")).toBeTruthy();
  });

  it("enseña las alergias con su nombre legible y las observaciones", async () => {
    await render(<ParteDelDiaCocina />);

    const aviso = await screen.findByTestId("aviso-al-1");
    expect(aviso).toHaveTextContent("Miriam (Clase Triángulo): Frutos secos · Sin trazas");
  });

  it("si nadie con alergias come hoy, lo dice", async () => {
    mockParte.mockResolvedValue(ok({ ...PARTE, avisos: [] }));
    await render(<ParteDelDiaCocina />);

    expect(await screen.findByText("Hoy no come nadie con alergias ni avisos.")).toBeTruthy();
  });

  it("si no se puede cargar, avisa y «Volver a probar» lo pide otra vez", async () => {
    const user = userEvent.setup();
    mockParte.mockResolvedValueOnce({
      success: false,
      error: "No se ha podido cargar el parte de cocina.",
    });
    await render(<ParteDelDiaCocina />);

    expect(await screen.findByTestId("parte-error")).toBeTruthy();
    await user.press(screen.getByTestId("btn-volver-a-probar-parte"));
    expect(await screen.findByLabelText("Total comensales: 34")).toBeTruthy();
  });

  it("la fecha de la cabecera es la del parte (día del centro), no la del dispositivo", async () => {
    await render(<ParteDelDiaCocina />);
    expect(await screen.findByText("Miércoles, 25 de noviembre")).toBeTruthy();
  });

  it("si una respuesta antigua llega tarde, no pisa la más reciente", async () => {
    const user = userEvent.setup();
    let resolverPrimera: (v: unknown) => void = () => {};
    mockParte
      .mockResolvedValueOnce(ok(PARTE)) // carga inicial
      .mockReturnValueOnce(new Promise((r) => (resolverPrimera = r))) // «Actualizar» lento
      .mockResolvedValueOnce(ok({ ...PARTE, total: 30 })); // «Actualizar» rápido
    await render(<ParteDelDiaCocina />);
    await screen.findByLabelText("Total comensales: 34");

    await user.press(screen.getByTestId("btn-actualizar-parte"));
    await user.press(screen.getByTestId("btn-actualizar-parte"));
    expect(await screen.findByLabelText("Total comensales: 30")).toBeTruthy();

    await act(async () => resolverPrimera(ok({ ...PARTE, total: 99 })));
    expect(screen.getByLabelText("Total comensales: 30")).toBeTruthy();
  });

  it("se actualiza solo cada minuto y, si falla al refrescar, deja el último parte", async () => {
    jest.useFakeTimers();
    try {
      await render(<ParteDelDiaCocina />);
      expect(await screen.findByLabelText("Total comensales: 34")).toBeTruthy();

      mockParte.mockResolvedValueOnce(ok({ ...PARTE, total: 33 }));
      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });
      expect(screen.getByLabelText("Total comensales: 33")).toBeTruthy();

      mockParte.mockResolvedValueOnce({ success: false, error: "sin red" });
      await act(async () => {
        jest.advanceTimersByTime(60_000);
      });
      expect(screen.getByLabelText("Total comensales: 33")).toBeTruthy();
      expect(screen.queryByTestId("parte-error")).toBeNull();
      // …pero avisa de que no está al día y de qué hora son los datos
      expect(screen.getByTestId("parte-sin-actualizar")).toHaveTextContent(
        /No se ha podido actualizar\. Estos datos son de las \d\d:\d\d\./,
      );
      expect(mockParte).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });
});
