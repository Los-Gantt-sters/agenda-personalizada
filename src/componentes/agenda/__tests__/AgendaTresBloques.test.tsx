import { render, screen, userEvent } from "@testing-library/react-native";
import { AgendaTresBloques } from "../AgendaTresBloques";
import { dividirEnBloques } from "../logica";
import type { EntradaAgenda } from "../tipos";

const e = (
  id: string,
  hora: string,
  estado: EntradaAgenda["estado"] = "pendiente",
): EntradaAgenda => ({
  id,
  estudiante_id: "al1",
  tarea_id: `t-${id}`,
  fecha: "2026-11-05",
  hora_inicio: hora,
  duracion_prevista_min: 30,
  orden: 0,
  estado,
  tarea: { id: `t-${id}`, titulo: `Tarea ${id}`, emoji: "⭐" },
});

describe("AgendaTresBloques (SCRUM-69: T-06.1 Componente de 3 bloques HECHO, AHORA y DESPUÉS)", () => {
  const dia = [e("1", "09:00", "hecha"), e("2", "10:00"), e("3", "11:00")];

  it("pinta la tarea en su bloque: Hecho, Ahora y Después", async () => {
    await render(
      <AgendaTresBloques
        bloques={dividirEnBloques(dia)}
        onConfirmarFin={() => {}}
        onAbrir={() => {}}
      />,
    );
    expect(screen.getByTestId("bloque-hecho").props.accessibilityLabel).toBe("Hecho: Tarea 1");
    expect(screen.getByTestId("bloque-ahora").props.accessibilityLabel).toBe("Ahora: Tarea 2");
    expect(screen.getByTestId("bloque-despues").props.accessibilityLabel).toBe("Después: Tarea 3");
  });

  it("cada texto va con su dibujo (RNF4.4)", async () => {
    await render(
      <AgendaTresBloques
        bloques={dividirEnBloques(dia)}
        onConfirmarFin={() => {}}
        onAbrir={() => {}}
      />,
    );
    for (const n of ["1", "2", "3"])
      expect(screen.getAllByLabelText(`Dibujo de Tarea ${n}`).length).toBeGreaterThan(0);
  });

  it("al pulsar una tarjeta pide abrir su detalle (RF4.4)", async () => {
    const onAbrir = jest.fn();
    await render(
      <AgendaTresBloques
        bloques={dividirEnBloques(dia)}
        onConfirmarFin={() => {}}
        onAbrir={onAbrir}
      />,
    );
    const usuario = userEvent.setup();
    await usuario.press(screen.getByTestId("mini-3"));
    expect(onAbrir).toHaveBeenCalledWith(expect.objectContaining({ id: "3" }));
  });

  it("sin tareas pendientes muestra el fin del día", async () => {
    await render(
      <AgendaTresBloques
        bloques={dividirEnBloques([e("1", "09:00", "hecha")])}
        onConfirmarFin={() => {}}
        onAbrir={() => {}}
      />,
    );
    expect(screen.getByText("¡Has terminado todo por hoy!")).toBeTruthy();
  });
});
