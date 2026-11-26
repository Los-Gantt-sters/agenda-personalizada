// SCRUM-247 (T-01.5): en una clase con más de 9 alumnos, al volver de la contraseña con «Atrás»
// la cuadrícula tiene que seguir en la página en la que estaba el alumno (y la marca «Página 2»).
import { render, screen, userEvent } from "@testing-library/react-native";
import LoginEstudiantesScreen from "../login-estudiantes";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// La clase Triángulo con 12 alumnos más, para que haya página 2
jest.mock("../../src/tipos/estudiante", () => {
  const real = jest.requireActual("../../src/tipos/estudiante");
  const extra = Array.from({ length: 12 }, (_, i) => ({
    ...real.ESTUDIANTES_MOCK[0],
    id: `extra-${i + 1}`,
    nombre: `Extra ${i + 1}`,
  }));
  return { ...real, ESTUDIANTES_MOCK: [...real.ESTUDIANTES_MOCK, ...extra] };
});

describe("LoginEstudiantesScreen - páginas de alumnos (SCRUM-247)", () => {
  it("al volver de la contraseña con «Atrás» sigue en la página 2 de la clase", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    await user.press(screen.getByLabelText("Más alumnos: ver la página 2"));
    expect(screen.getByTestId("cuadricula-estudiantes-pagina-2")).toBeTruthy();

    await user.press(screen.getByText("Extra 10"));
    await user.press(screen.getByTestId("btn-barra-atras"));

    expect(screen.getByTestId("cuadricula-estudiantes-pagina-2")).toBeTruthy();
    expect(screen.getByText("Extra 10")).toBeTruthy();
    expect(screen.getByTestId("marca-pagina")).toHaveTextContent("Página 2");
  });

  it("al volver a la clase con «Adelante» desde la 01 sigue en la página 2", async () => {
    const user = userEvent.setup();
    await render(<LoginEstudiantesScreen />);

    await user.press(screen.getByTestId("tarjeta-clase-tri"));
    await user.press(screen.getByLabelText("Más alumnos: ver la página 2"));
    await user.press(screen.getByTestId("btn-barra-atras")); // a la 01
    await user.press(screen.getByTestId("btn-barra-adelante")); // otra vez a Triángulo

    expect(screen.getByTestId("cuadricula-estudiantes-pagina-2")).toBeTruthy();
    expect(screen.getByTestId("marca-pagina")).toHaveTextContent("Página 2");
  });
});
