import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AgendaSemanal06b } from "../AgendaSemanal06b";
import { agendaDemoSemana } from "../datosDemoSemana";
import { crearRepositorioMemoria } from "../../agenda/repositorioMemoria";
import { ESTUDIANTE_DEMO } from "../../agenda/datosDemo";
import type { EntradaAgenda } from "../../agenda/tipos";

jest.mock("../../../servicios/sonidos", () => ({ reproducirSonido: jest.fn() }));

// Jueves 12 de noviembre de 2026, como en el boceto 06b (semana del 9 al 15).
const HOY = "2026-11-12";

async function abrir(datos: EntradaAgenda[] = agendaDemoSemana(HOY)) {
  const { repo, tutor } = crearRepositorioMemoria(datos);
  const alAbrirDia = jest.fn();
  const alVerHoy = jest.fn();
  await render(
    <AgendaSemanal06b
      repo={repo}
      estudianteId={ESTUDIANTE_DEMO}
      hoy={HOY}
      alAbrirDia={alAbrirDia}
      alVerHoy={alVerHoy}
    />,
  );
  await screen.findByTestId("dias-semana");
  return { alAbrirDia, alVerHoy, tutor };
}

describe("Pantalla 06b: agenda semanal (SCRUM-124: T-17.1)", () => {
  it("enseña la semana entera, de lunes a domingo, con hoy marcado", async () => {
    await abrir();
    expect(screen.getByTestId("titulo-pantalla")).toHaveTextContent("Agenda semanal");
    expect(screen.getByText("Toca un día de la semana para abrir la agenda")).toBeTruthy();
    for (const [i, nombre] of [
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves · Hoy",
      "Viernes",
      "Sábado",
      "Domingo",
    ].entries())
      expect(screen.getByTestId(`nombre-dia-${i}`)).toHaveTextContent(nombre);

    const hoy = screen.getByTestId(`tarjeta-dia-${HOY}`);
    expect(hoy.props.accessibilityState).toMatchObject({ selected: true });
    expect(hoy.props.accessibilityLabel).toBe("Jueves 12 de noviembre, hoy: 6 tareas");
    expect(screen.getByTestId("tarjeta-dia-2026-11-15").props.accessibilityLabel).toBe(
      "Domingo 15 de noviembre: 2 tareas",
    );
  });

  it("tocar un día abre su agenda; «Adelante» abre la de hoy y «Ver hoy» también", async () => {
    const { alAbrirDia, alVerHoy } = await abrir();
    await fireEvent.press(screen.getByTestId("tarjeta-dia-2026-11-14"));
    expect(alAbrirDia).toHaveBeenLastCalledWith("2026-11-14");

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(alAbrirDia).toHaveBeenLastCalledWith(HOY);

    await fireEvent.press(screen.getByRole("button", { name: "Ver hoy" }));
    expect(alVerHoy).toHaveBeenCalledTimes(1);
    // El alumno no sale de su agenda por error.
    expect(screen.getByTestId("btn-barra-atras").props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("el calendario de la cabecera cambia de semana", async () => {
    await abrir();
    expect(screen.getByTestId("btn-selector-semana")).toHaveTextContent(/Del 9 al 15 de noviembre/);

    await fireEvent.press(screen.getByTestId("btn-selector-semana"));
    expect(screen.getByTestId("mes-calendario")).toHaveTextContent("Noviembre 2026");
    // La semana elegida está marcada.
    expect(screen.getByTestId("dia-calendario-2026-11-10").props.accessibilityState).toMatchObject({
      selected: true,
    });

    await fireEvent.press(screen.getByTestId("btn-mes-siguiente"));
    expect(screen.getByTestId("mes-calendario")).toHaveTextContent("Diciembre 2026");
    await fireEvent.press(screen.getByTestId("dia-calendario-2026-12-02"));

    expect(screen.queryByTestId("calendario-semana")).toBeNull();
    expect(screen.getByTestId("btn-selector-semana")).toHaveTextContent(
      /Del 30 de noviembre al 6 de diciembre/,
    );
    await screen.findByTestId("tarjeta-dia-2026-12-06");
    // En otra semana no hay «Hoy» y se elige su lunes.
    expect(screen.queryByText("Jueves · Hoy")).toBeNull();
    expect(screen.getByTestId("tarjeta-dia-2026-11-30").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("«Cerrar» cierra el calendario sin cambiar de semana", async () => {
    await abrir();
    await fireEvent.press(screen.getByTestId("btn-selector-semana"));
    await fireEvent.press(screen.getByTestId("btn-cerrar-calendario"));
    expect(screen.queryByTestId("calendario-semana")).toBeNull();
    expect(screen.getByTestId("btn-selector-semana")).toHaveTextContent(/Del 9 al 15 de noviembre/);
  });

  it("un día sin tareas dice «Sin tareas» y se actualiza si el tutor añade una (RF4.7)", async () => {
    const soloHoy = agendaDemoSemana(HOY).filter((e) => e.fecha !== "2026-11-13");
    const { tutor } = await abrir(soloHoy);
    expect(screen.getByTestId("tarjeta-dia-2026-11-13").props.accessibilityLabel).toMatch(
      /Sin tareas$/,
    );

    await act(async () => {
      tutor.crear({ ...soloHoy[0], id: "nueva", fecha: "2026-11-13" });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(screen.getByTestId("tarjeta-dia-2026-11-13").props.accessibilityLabel).toMatch(
      /1 tarea$/,
    );
  });
});
