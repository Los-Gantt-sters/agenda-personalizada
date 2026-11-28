// HU-23 · SCRUM-141: el tutor elige de qué alumno cambia los permisos (26d), sin scroll.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ElegirAlumno26d, type AlumnoElegible26d } from "../ElegirAlumno26d";

const NOMBRES = ["Ana", "Bea", "Carlos", "Dani", "Elena", "Fran", "Gema", "Hugo", "Inés", "Juan"];
const ALUMNOS: AlumnoElegible26d[] = NOMBRES.map((nombre, i) => ({
  id: `a${i + 1}`,
  nombre,
  apellidos: "Pérez",
}));

describe("ElegirAlumno26d", () => {
  it("enseña 9 alumnos por pantalla y «Adelante» pasa a los siguientes", async () => {
    const alAtras = jest.fn();
    await render(<ElegirAlumno26d alumnos={ALUMNOS} alElegir={jest.fn()} alAtras={alAtras} />);

    expect(screen.getByTestId("elegir-alumno-26d-a9")).toBeTruthy();
    expect(screen.queryByTestId("elegir-alumno-26d-a10")).toBeNull();
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("btn-barra-adelante"));
    expect(screen.getByTestId("elegir-alumno-26d-a10")).toBeTruthy();
    expect(screen.queryByTestId("elegir-alumno-26d-a1")).toBeNull();

    // «Atrás» vuelve a la primera página y, desde ella, al panel.
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(screen.getByTestId("elegir-alumno-26d-a1")).toBeTruthy();
    expect(alAtras).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("btn-barra-atras"));
    expect(alAtras).toHaveBeenCalledTimes(1);
  });

  it("un toque en un alumno lo elige", async () => {
    const alElegir = jest.fn();
    await render(
      <ElegirAlumno26d alumnos={ALUMNOS.slice(0, 3)} alElegir={alElegir} alAtras={jest.fn()} />,
    );
    expect(screen.queryByText(/Página/)).toBeNull();
    await fireEvent.press(screen.getByLabelText("Carlos Pérez: cambiar sus permisos"));
    expect(alElegir).toHaveBeenCalledWith(ALUMNOS[2]);
  });

  it("avisa mientras carga, si falla y si no hay alumnos", async () => {
    const { rerender } = await render(
      <ElegirAlumno26d alumnos={[]} cargando alElegir={jest.fn()} alAtras={jest.fn()} />,
    );
    expect(screen.getByText("Cargando tus alumnos…")).toBeTruthy();

    await rerender(
      <ElegirAlumno26d
        alumnos={[]}
        error="Sin conexión"
        alElegir={jest.fn()}
        alAtras={jest.fn()}
      />,
    );
    expect(screen.getByText("Sin conexión")).toBeTruthy();

    await rerender(<ElegirAlumno26d alumnos={[]} alElegir={jest.fn()} alAtras={jest.fn()} />);
    expect(screen.getByText("Todavía no tienes alumnos vinculados.")).toBeTruthy();
  });
});
