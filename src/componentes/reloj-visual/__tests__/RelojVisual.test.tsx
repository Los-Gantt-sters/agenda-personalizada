import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { RelojVisual } from "../RelojVisual";
import { reproducirSonido } from "../../../servicios/sonidos";
import { TEMAS, TemaProvider, type NombreTema } from "../../../temas";

// Se sustituye el servicio de sonidos por una función falsa: así no se reproduce audio
// de verdad y se puede comprobar cuántas veces se ha pedido sonar la campanita
jest.mock("../../../servicios/sonidos", () => ({
  reproducirSonido: jest.fn(),
}));

const MINUTO = 60 * 1000;

describe("RelojVisual - HU-09 (Time Timer)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("muestra el rótulo con el tiempo restante (T-09.2)", async () => {
    await render(<RelojVisual duracionMs={30 * MINUTO} transcurridoMs={15 * MINUTO} />);

    expect(screen.getByText("Quedan 15 minutos")).toBeTruthy();
  });

  it("anuncia el tiempo restante al lector de pantalla", async () => {
    await render(<RelojVisual duracionMs={10 * MINUTO} transcurridoMs={9 * MINUTO} />);

    expect(screen.getByLabelText("Reloj visual: Queda 1 minuto")).toBeTruthy();
  });

  it("oculta el rótulo si el perfil del alumno lo desactiva", async () => {
    await render(
      <RelojVisual duracionMs={30 * MINUTO} transcurridoMs={15 * MINUTO} mostrarRotulo={false} />,
    );

    expect(screen.queryByText("Quedan 15 minutos")).toBeNull();
    // Aunque no se vea, el lector de pantalla sigue diciendo el tiempo
    expect(screen.getByLabelText("Reloj visual: Quedan 15 minutos")).toBeTruthy();
  });

  it("al agotarse el tiempo suena la campanita y avisa una sola vez (T-09.3)", async () => {
    const onTiempoAgotado = jest.fn();
    const reloj = (transcurridoMs: number) => (
      <RelojVisual
        duracionMs={MINUTO}
        transcurridoMs={transcurridoMs}
        parpadeoAlTerminar={false}
        onTiempoAgotado={onTiempoAgotado}
      />
    );

    const { rerender } = await render(reloj(30 * 1000));
    expect(reproducirSonido).not.toHaveBeenCalled();

    // El tiempo llega a cero
    await rerender(reloj(MINUTO));
    expect(screen.getByText("Se ha acabado el tiempo")).toBeTruthy();
    expect(reproducirSonido).toHaveBeenCalledTimes(1);
    expect(reproducirSonido).toHaveBeenCalledWith("finTiempo");
    expect(onTiempoAgotado).toHaveBeenCalledTimes(1);

    // Aunque se vuelva a pintar con el tiempo agotado, no repite el aviso
    await rerender(reloj(MINUTO + 5000));
    expect(reproducirSonido).toHaveBeenCalledTimes(1);
    expect(onTiempoAgotado).toHaveBeenCalledTimes(1);
  });

  it("no suena al abrir una tarea que ya estaba terminada", async () => {
    await render(
      <RelojVisual duracionMs={MINUTO} transcurridoMs={MINUTO} parpadeoAlTerminar={false} />,
    );

    expect(screen.getByText("Se ha acabado el tiempo")).toBeTruthy();
    expect(reproducirSonido).not.toHaveBeenCalled();
  });

  it("no suena si el perfil del alumno desactiva el sonido", async () => {
    const reloj = (transcurridoMs: number) => (
      <RelojVisual
        duracionMs={MINUTO}
        transcurridoMs={transcurridoMs}
        sonidoAlTerminar={false}
        parpadeoAlTerminar={false}
      />
    );

    const { rerender } = await render(reloj(30 * 1000));
    await rerender(reloj(MINUTO));

    expect(reproducirSonido).not.toHaveBeenCalled();
  });
});

describe("RelojVisual - colores del tema activo (NC-004)", () => {
  const colorDelRotulo = () =>
    StyleSheet.flatten(screen.getByText("Quedan 15 minutos").props.style).color;

  it.each<NombreTema>(["oscuro", "altoContrasteOscuro", "claro", "pastel"])(
    "en el tema %s el rótulo usa el color de texto del tema",
    async (nombre) => {
      await render(
        <TemaProvider temaInicial={nombre}>
          <RelojVisual duracionMs={30 * MINUTO} transcurridoMs={15 * MINUTO} />
        </TemaProvider>,
      );

      expect(colorDelRotulo()).toBe(TEMAS[nombre].paleta.texto);
    },
  );

  it("fuera de un tema mantiene los colores de siempre", async () => {
    await render(<RelojVisual duracionMs={30 * MINUTO} transcurridoMs={15 * MINUTO} />);

    expect(colorDelRotulo()).toBe("#14213d");
  });

  it("los colores pasados a mano siguen teniendo prioridad sobre el tema", async () => {
    await render(
      <TemaProvider temaInicial="oscuro">
        <RelojVisual
          duracionMs={30 * MINUTO}
          transcurridoMs={15 * MINUTO}
          colores={{ tinta: "#123456" }}
        />
      </TemaProvider>,
    );

    expect(colorDelRotulo()).toBe("#123456");
  });
});
