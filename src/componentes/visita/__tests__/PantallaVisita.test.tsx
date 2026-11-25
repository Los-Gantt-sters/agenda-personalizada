// HU-15 · SCRUM-113 (T-15.1): pantalla 13b, «Visita · Escanear código QR».
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { act, render, screen, userEvent } from "@testing-library/react-native";

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
      screen.getByText(
        "Al escanear el QR podrás abrir su información en una ventana fuera de la aplicación",
      ),
    ).toBeTruthy();
    expect(screen.getByLabelText("Escanear de nuevo")).toBeTruthy();
    expect(screen.getByText("Terminar visita")).toBeTruthy();
  });

  it("sin cámara, el lector de reserva lo explica", async () => {
    await render(<PantallaVisita alSalir={jest.fn()} />);
    expect(screen.getByTestId("lector-qr-no-disponible")).toBeTruthy();
    expect(screen.getByText("La cámara todavía no está disponible en esta tableta.")).toBeTruthy();
  });

  it("SCRUM-114: al leer un enlace bueno no se abre solo: sale «Abrir información de <sitio>»", async () => {
    const abrirEnlace = jest.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    await render(
      <PantallaVisita Lector={LectorDePrueba} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    expect(abrirEnlace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Abrir información de centro.es")).toBeTruthy();
    // El lector se para hasta «Escanear de nuevo»: no se abren ventanas seguidas
    expect(screen.queryByTestId("leer-codigo")).toBeNull();
    expect(screen.getByTestId("anuncio-visita")).toHaveTextContent(
      "Código leído: centro.es. Toca «Abrir información».",
    );
  });

  it("SCRUM-114: al tocar el botón se abre fuera de la app y la tarjeta lo confirma", async () => {
    const abrirEnlace = jest.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    await render(
      <PantallaVisita Lector={LectorDePrueba} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    await user.press(screen.getByTestId("btn-abrir-informacion"));
    expect(abrirEnlace).toHaveBeenCalledWith("https://centro.es/biblioteca");
    expect(await screen.findByTestId("codigo-abierto")).toHaveTextContent(
      /Se ha abierto la información de centro\.es en otra ventana\./,
    );
  });

  it("SCRUM-114: un código que no es un enlace permitido no deja abrir nada", async () => {
    const abrirEnlace = jest.fn().mockResolvedValue(true);
    const user = userEvent.setup();
    function LectorMalo({ alLeer }: LectorQRProps) {
      return <Pressable testID="leer-malo" onPress={() => alLeer("javascript:alert(1)")} />;
    }
    await render(
      <PantallaVisita Lector={LectorMalo} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-malo"));
    expect(screen.getByText("Este código no es de la visita. Prueba con otro.")).toBeTruthy();
    expect(screen.queryByTestId("btn-abrir-informacion")).toBeNull();
    expect(abrirEnlace).not.toHaveBeenCalled();
  });

  it("SCRUM-114: si el navegador bloquea la ventana, lo dice y deja volver a tocar", async () => {
    const abrirEnlace = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const user = userEvent.setup();
    await render(
      <PantallaVisita Lector={LectorDePrueba} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    await user.press(screen.getByTestId("btn-abrir-informacion"));
    expect(await screen.findByText("No se ha podido abrir. Toca otra vez el botón.")).toBeTruthy();

    await user.press(screen.getByTestId("btn-abrir-informacion"));
    expect(await screen.findByTestId("codigo-abierto")).toHaveTextContent(
      /Se ha abierto la información de centro\.es en otra ventana\./,
    );
  });

  it("SCRUM-114: si abrir lanza un error, se trata como no abierto", async () => {
    const abrirEnlace = jest.fn().mockRejectedValue(new Error("fallo"));
    const user = userEvent.setup();
    await render(
      <PantallaVisita Lector={LectorDePrueba} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    await user.press(screen.getByTestId("btn-abrir-informacion"));
    expect(await screen.findByText("No se ha podido abrir. Toca otra vez el botón.")).toBeTruthy();
  });

  it("SCRUM-114: «Escanear de nuevo» mientras se abre descarta esa respuesta", async () => {
    let resolver: (v: boolean) => void = () => {};
    const abrirEnlace = jest.fn().mockReturnValue(new Promise<boolean>((r) => (resolver = r)));
    const user = userEvent.setup();
    await render(
      <PantallaVisita Lector={LectorDePrueba} abrirEnlace={abrirEnlace} alSalir={jest.fn()} />,
    );

    await user.press(screen.getByTestId("leer-codigo"));
    await user.press(screen.getByTestId("btn-abrir-informacion"));
    await user.press(screen.getByTestId("btn-escanear-de-nuevo"));
    await act(async () => resolver(true));

    // Sigue el lector nuevo, sin el resultado viejo encima
    expect(screen.getByTestId("leer-codigo")).toBeTruthy();
    expect(screen.queryByTestId("codigo-abierto")).toBeNull();
  });

  it("al contestar «No, sigo» vuelve con el lector listo, sin el último código", async () => {
    const user = userEvent.setup();
    await render(<PantallaVisita Lector={LectorDePrueba} alSalir={jest.fn()} />);

    await user.press(screen.getByTestId("leer-codigo"));
    await user.press(screen.getByTestId("btn-barra-adelante"));
    await user.press(screen.getByText("No, sigo"));

    expect(screen.getByTestId("leer-codigo")).toBeTruthy();
    expect(screen.queryByTestId("btn-abrir-informacion")).toBeNull();
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
