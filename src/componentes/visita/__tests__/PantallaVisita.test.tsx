// HU-15 · SCRUM-113 (T-15.1): pantalla 13b, «Visita · Escanear código QR».
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";

import { PantallaVisita, type LectorQRProps } from "../PantallaVisita";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

/** Lector de prueba: cuenta cuántas veces se monta y deja «leer» un código con un botón. */
const montajes = { n: 0 };
function LectorDePrueba({ alLeer }: LectorQRProps) {
  useEffect(() => {
    montajes.n += 1;
  }, []);
  return (
    <Pressable testID="leer-codigo" onPress={() => alLeer("https://centro.es/biblioteca")}>
      <Text>lector</Text>
    </Pressable>
  );
}

const INICIO = new Date(Date.now() - 5 * 60_000).toISOString();

describe("Pantalla 13b · Visita · Escanear código QR", () => {
  beforeEach(() => {
    montajes.n = 0;
  });

  it("enseña el reloj de la visita, la tarjeta del código y «Escanear de nuevo»", async () => {
    await render(<PantallaVisita inicio={INICIO} duracionMin={30} alSalir={jest.fn()} />);

    expect(screen.getByText("Visita · Escanear código QR")).toBeTruthy();
    expect(screen.getByTestId("reloj-visita")).toHaveTextContent(/Quedan 25 minutos/);
    expect(screen.getByTestId("reloj-visita")).toHaveTextContent(/Empezaste a las \d\d:\d\d/);
    expect(screen.getByText("Apunta al código QR de la puerta")).toBeTruthy();
    expect(
      screen.getByText("Al escanear el QR se abrirá una ventana externa fuera de la aplicación"),
    ).toBeTruthy();
    expect(screen.getByLabelText("Escanear de nuevo")).toBeTruthy();
    expect(screen.getByText("Terminar visita")).toBeTruthy();
  });

  it("sin cámara, el lector de reserva lo explica", async () => {
    await render(<PantallaVisita alSalir={jest.fn()} />);
    expect(screen.getByTestId("lector-qr-no-disponible")).toBeTruthy();
    expect(screen.getByText("La cámara todavía no está disponible en esta tableta.")).toBeTruthy();
  });

  it("lo que lee el lector llega a quien abre la ventana (SCRUM-114)", async () => {
    const user = userEvent.setup();
    const alLeerCodigo = jest.fn();
    await render(
      <PantallaVisita Lector={LectorDePrueba} alLeerCodigo={alLeerCodigo} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    expect(alLeerCodigo).toHaveBeenCalledWith("https://centro.es/biblioteca");
  });

  it("«Escanear de nuevo» deja el lector listo otra vez", async () => {
    const user = userEvent.setup();
    await render(<PantallaVisita Lector={LectorDePrueba} alSalir={jest.fn()} />);
    expect(montajes.n).toBe(1);

    await user.press(screen.getByTestId("btn-escanear-de-nuevo"));
    expect(montajes.n).toBe(2);
  });

  it("«Terminar visita» pregunta «¿Has terminado?»; «No, sigo» vuelve a la visita", async () => {
    const user = userEvent.setup();
    await render(<PantallaVisita alSalir={jest.fn()} />);

    await user.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getAllByText("¿Has terminado?").length).toBeGreaterThan(0);

    await user.press(screen.getByText("No, sigo"));
    expect(screen.getByTestId("pantalla-visita")).toBeTruthy();
  });

  it("si ha terminado, sale «Tarea hecha» y «Atrás» vuelve a la agenda", async () => {
    const user = userEvent.setup();
    const alSalir = jest.fn();
    await render(<PantallaVisita alSalir={alSalir} />);

    await user.press(screen.getByTestId("btn-barra-adelante"));
    await user.press(screen.getByText("Sí, he terminado"));
    expect(screen.getByLabelText("Tarea hecha: Visita")).toBeTruthy();

    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(alSalir).toHaveBeenCalled();
  });

  it("«Atrás» en la visita vuelve a la agenda", async () => {
    const user = userEvent.setup();
    const alSalir = jest.fn();
    await render(<PantallaVisita alSalir={alSalir} />);
    await user.press(screen.getByTestId("btn-barra-atras"));
    expect(alSalir).toHaveBeenCalled();
  });
});
